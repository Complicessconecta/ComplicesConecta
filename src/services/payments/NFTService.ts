/** ------------------------------------------------------------------
* COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
* Sistema operando bajo reglas de determinismo y robustez v4.0
 ------------------------------------------------------------------
 * ComplicesConecta v3.7.0 - NFTService
 * Fecha: 13 Nov 2025 | Autor: Ing. Juan Carlos Méndez Nataren
 * Descripción: Servicio para gestión de NFTs, IPFS y lógica de parejas
 * Funcionalidades: Mint NFT, upload IPFS, consentimiento doble, metadata
 * CoupleNFTRequest ya está importado desde @/types/blockchain
 * Servicio de NFTs para ComplicesConecta
 * Características principales:
 * - Mint de NFTs individuales y de pareja
 * - Upload a IPFS con Pinata
 * - Sistema de consentimiento doble
 * - Gestión de metadata y rareza
 * - Integración con contratos inteligentes
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { safeGetItem } from "@/utils/safeLocalStorage";
import { WalletService } from "@/services/payments/WalletService";
import type { BlockchainSupabaseClient } from "@/types/blockchain";
import { safeBlockchainCast } from "@/types/blockchain";
import type { Database } from "@/types/supabase-generated";

 type CoupleNFTRequestRow =
   Database["public"]["Tables"]["couple_nft_requests"]["Row"];

const getDemoNFTStorageKey = (uid: string) => `demo_nfts:${uid}`;

/**
 * Evento que se dispara cuando la colección demo cambia (mint en
 * cualquier sitio de la página). Los contadores (DemoWallet, perfil)
 * lo escuchan para recargarse de la misma fuente en vez de quedarse
 * con el valor del montaje (punto 12).
 */
export const DEMO_NFTS_CHANGED_EVENT = "demo-nfts-changed";

export function notifyDemoNFTsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_NFTS_CHANGED_EVENT));
}

/**
 * Los 4 NFTs demo por defecto (misma fuente que los defaults de
 * <DemoWallet>: Legendario y Raro son de single; Épico y Común son de
 * pareja, is_couple: true). Única fuente de verdad: DemoWallet los importa
 * de aquí para no duplicar la lista.
 */
export const DEFAULT_DEMO_NFTS = [
  {
    id: "nft-1",
    name: "Cómplice Legendario",
    rarity: "legendary",
    image: "/assets/nfts/imagen4.gif",
    value: 5000,
    is_couple: false,
  },
  {
    id: "nft-2",
    name: "Cómplice Épico",
    rarity: "epic",
    image: "/assets/nfts/imagen3.jpg",
    value: 2000,
    is_couple: true,
  },
  {
    id: "nft-3",
    name: "Cómplice Raro",
    rarity: "rare",
    image: "/assets/nfts/imagen1.jpg",
    value: 750,
    is_couple: false,
  },
  {
    id: "nft-4",
    name: "Cómplice Común",
    rarity: "common",
    image: "/assets/nfts/imagen2.jpg",
    value: 100,
    is_couple: true,
  },
] as const;

/**
 * Límite demo de NFTs MINTEADOS POR EL USUARIO (ronda 8, puntos 4 y 7).
 *
 * Causa raíz del "4/4 sin Confirmar Mint": el tope se aplicaba sobre la
 * COLECCIÓN TOTAL, y la colección nace sembrada con los 4 NFTs de ejemplo
 * (single) / 2 de pareja, así que el usuario ya estaba en el límite antes
 * de mintear nada. El tope cuenta solo lo minteado por el usuario, encima
 * de la semilla: fresco single 4 (0 minteados), tras 1 mint 5 (1/4).
 */
export const DEMO_MINT_LIMIT = 4;

/** Capacidad guardada por colección: semilla (4) + minteados (4). */
export const DEMO_NFT_STORAGE_CAP = DEFAULT_DEMO_NFTS.length + DEMO_MINT_LIMIT;

/** Ids de la semilla: todo lo demás guardado es un NFT minteado. */
export function isSeedDemoNFTId(id: unknown): boolean {
  return (
    typeof id === "string" &&
    (DEFAULT_DEMO_NFTS as ReadonlyArray<{ id: string }>).some(
      (nft) => nft.id === id,
    )
  );
}

/**
 * Cuenta los NFTs minteados por el usuario dentro de una colección
 * guardada. Un ítem es minteado si trae `minted_by_user: true` o si su
 * id no es de la semilla (cubre ítems minteados antes de que existiera
 * el flag). La semilla (nft-1..nft-4) NUNCA cuenta como minteada.
 */
export function countMintedDemoNFTs(
  items: ReadonlyArray<{ id?: unknown; minted_by_user?: unknown }>,
): number {
  return items.filter(
    (item) =>
      item?.minted_by_user === true ||
      (typeof item?.id === "string" && !isSeedDemoNFTId(item.id)),
  ).length;
}

/**
 * La semilla en forma guardada (`demo_nfts:<uid>`): la base sobre la que
 * se mintea cuando aún no hay colección guardada. Sin esto, el primer
 * mint escribía SOLO el NFT nuevo y la colección pasaba de 4 (ejemplo en
 * memoria) a 1 (guardado) — la "desaparición" de la ronda 7.
 */
export function getDemoNFTSeedItems(): Array<Record<string, unknown>> {
  return DEFAULT_DEMO_NFTS.map((nft, index) => ({
    id: nft.id,
    name: nft.name,
    rarity: nft.rarity,
    image: nft.image,
    value: nft.value,
    is_couple: nft.is_couple,
    created_at: new Date().toISOString(),
    token_id: index + 1,
    metadata_uri: "ipfs://demo-metadata-hash",
    minted_by_user: false,
  }));
}

/**
 * Siembra los 4 NFTs demo en localStorage para el usuario dado, SOLO si su
 * llave `demo_nfts:<userId>` aún no existe. No sobrescribe una colección ya
 * minteada/guardada. Espejo de Single: ProfileCouple no renderiza
 * <DemoWallet>, así que sin esta siembra `getUserNFTs(uid)` devuelve [] y la
 * sección "Blockchain & NFTs de Pareja" nunca aparece (hasAnyNFTs false).
 */
export function seedDemoNFTs(userId: string): void {
  if (!userId) return;
  if (typeof window === "undefined") return;
  const key = getDemoNFTStorageKey(userId);
  try {
    if (window.localStorage.getItem(key) !== null) return;
    const payload = DEFAULT_DEMO_NFTS.map((nft, index) => ({
      id: nft.id,
      name: nft.name,
      rarity: nft.rarity,
      image: nft.image,
      value: nft.value,
      is_couple: nft.is_couple,
      created_at: new Date().toISOString(),
      token_id: index + 1,
      metadata_uri: "ipfs://demo-metadata-hash",
      minted_by_user: false,
    }));
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // no-op: sin localStorage no hay demo que sembrar
  }
}

const getDemoNftImageForIndex = (index: number): string => {
  const images = [
    "/assets/nfts/imagen1.jpg",
    "/assets/nfts/imagen2.jpg",
    "/assets/nfts/imagen3.jpg",
    "/assets/nfts/imagen4.gif",
  ];
  return images[index % images.length] || images[0] || "";
};

const readDemoNFTs = (uid: string): NFTInfo[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(getDemoNFTStorageKey(uid));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Record<string, unknown>>)
      .slice(0, DEMO_NFT_STORAGE_CAP)
      .map((item, index) => {
        const id = typeof item.id === "string" ? item.id : `demo-nft-${uid}-${index}`;
        const tokenIdRaw = item.token_id;
        const token_id = typeof tokenIdRaw === "number" ? tokenIdRaw : index + 1;
        const metadata_uri =
          typeof item.metadata_uri === "string" ? item.metadata_uri : "ipfs://demo-metadata-hash";
        const rarity = typeof item.rarity === "string" ? item.rarity : "common";
        const isCoupleRaw = item.is_couple;
        const is_couple = typeof isCoupleRaw === "boolean" ? isCoupleRaw : false;
        const partner_address = typeof item.partner_address === "string" ? item.partner_address : "";
        const name = typeof item.name === "string" ? item.name : "";
        const description = typeof item.description === "string" ? item.description : "";
        const image = typeof item.image === "string" ? item.image : "";
        const created_at =
          typeof item.created_at === "string" ? item.created_at : new Date().toISOString();

        const base: NFTInfo = {
          id,
          token_id,
          owner_address: "DEMO",
          metadata_uri,
          rarity,
          is_couple,
          created_at,
        };

        if (partner_address) base.partner_address = partner_address;
        if (name) base.name = name;
        if (description) base.description = description;
        if (image) base.image = image;
        const valueRaw = item.value;
        if (typeof valueRaw === "number") base.value = valueRaw;
        // El flag sobrevive a la lectura: sin él, un NFT minteado se
        // releía como semilla y el contador de minteados volvía a 0.
        if (typeof item.minted_by_user === "boolean") {
          base.minted_by_user = item.minted_by_user;
        }

        return base;
      });
  } catch {
    return [];
  }
};

/**
 * Interfaz para metadata de NFT
 */
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Interfaz para información de NFT
 */
interface NFTInfo {
  id: string;
  token_id: number;
  owner_address: string;
  metadata_uri: string;
  rarity: string;
  is_couple: boolean;
  partner_address?: string;
  name?: string;
  description?: string;
  image?: string;
  /** Valor estimado en CMPX (solo demo). */
  value?: number;
  /** true si el NFT lo minteó el usuario en demo (no es de la semilla). */
  minted_by_user?: boolean;
  created_at: string;
}


export class NFTService {
  private static instance: NFTService;
  private walletService: WalletService;

  // Helper para acceso seguro a tablas blockchain
  private get blockchainClient(): BlockchainSupabaseClient {
    if (!supabase) {
      throw new Error("Supabase client no inicializado");
    }
    return safeBlockchainCast(supabase);
  }

  // Configuración de Pinata IPFS
  private static readonly PINATA_API_URL = "https://api.pinata.cloud";
  private static readonly PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

  // Tipos de rareza y sus multiplicadores
  private static readonly RARITY_TYPES = {
    common: { name: "Común", multiplier: 100, probability: 70 },
    rare: { name: "Raro", multiplier: 125, probability: 20 },
    epic: { name: "Épico", multiplier: 150, probability: 8 },
    legendary: { name: "Legendario", multiplier: 200, probability: 2 },
  };

  private constructor() {
    this.walletService = WalletService.getInstance();
  }

  // Selecciona una rareza con base en probabilidades
  private pickRarity(): keyof typeof NFTService.RARITY_TYPES {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const key of Object.keys(NFTService.RARITY_TYPES) as Array<
      keyof typeof NFTService.RARITY_TYPES
    >) {
      cumulative += NFTService.RARITY_TYPES[key].probability;
      if (roll <= cumulative) return key;
    }
    return "common";
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  /**
   * Sube una imagen a IPFS usando Pinata
   * @param file Archivo de imagen
   * @param metadata Metadata adicional
   * @returns Hash IPFS de la imagen
   */
  public async uploadImageToIPFS(
    file: File,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    try {
      logger.info("Subiendo imagen a IPFS...");

      const formData = new FormData();
      formData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: `Asset-${Date.now()}`,
        keyvalues: metadata,
      });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append("pinataOptions", pinataOptions);

      // JWT complement (2026-11-19): real multipart upload. The FormData
      // itself is the top-level body of functions.invoke — verified against
      // the vendored @supabase/functions-js 2.4.1 source, `invoke` passes
      // a top-level FormData through untouched and lets fetch set the
      // multipart boundary. (Nesting it inside a JSON object, as before,
      // JSON.stringifies it to `{}` and the file bytes never reached
      // Pinata.) The routing fields travel as string fields inside the
      // same FormData; pinata-proxy reads them and re-forwards ONLY
      // file/pinataMetadata/pinataOptions to Pinata.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          "No hay sesión activa: inicia sesión para subir a IPFS",
        );
      }

      formData.append("method", "pinning/pinFileToIPFS");
      formData.append("path", "/pinning/pinFileToIPFS");
      formData.append("apiBase", NFTService.PINATA_API_URL);

      const { data, error } = await supabase.functions.invoke(
        "pinata-proxy",
        {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        throw new Error(`Error en Pinata: ${error.message}`);
      }

      if (!data || typeof data.IpfsHash !== "string") {
        throw new Error("Error en Pinata: respuesta sin IpfsHash");
      }
      logger.info("Imagen subida exitosamente a IPFS", {
        ipfsHash: data.IpfsHash,
      });
      return data.IpfsHash;
    } catch (error) {
      logger.error("Error subiendo a IPFS", { error });
      throw error;
    }
  }

  /**
   * Genera metadata para un NFT
   */
  public async generateMetadata(
    name: string,
    description: string,
    imageHash: string,
    attributes: Record<string, unknown>,
  ): Promise<string> {
    try {
      const metadata: NFTMetadata = {
        name,
        description,
        image: `${NFTService.PINATA_GATEWAY}${imageHash}`,
        attributes: Object.entries(attributes).map(([key, value]) => ({
          trait_type: key,
          value:
            typeof value === "string" || typeof value === "number"
              ? value
              : String(value),
        })),
      };

      // Subir JSON de metadata a IPFS
      const blob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const file = new File([blob], "metadata.json", {
        type: "application/json",
      });

      return await this.uploadImageToIPFS(file, { type: "metadata" });
    } catch (error) {
      logger.error("Error generando metadata", { error });
      throw error;
    }
  }

  /**
   * Obtiene los NFTs de un usuario
   */
  public async getUserNFTs(
    userId: string,
    opts?: { demoFallback?: boolean },
  ): Promise<NFTInfo[]> {
    try {
      const isDemoEnv =
        import.meta.env.VITE_APP_MODE === "demo" ||
        import.meta.env.MODE === "development";
      const isDemoAuthActive =
        isDemoEnv &&
        typeof window !== "undefined" &&
        safeGetItem("demo_authenticated") === "true";

      const hasDemoNftsForUser =
        typeof window !== "undefined" &&
        window.localStorage.getItem(getDemoNFTStorageKey(userId)) !== null;

      // demoFallback: el llamador está mostrando un PERFIL demo (p. ej.
      // /profile-single de Sofía). Su colección canónica es la demo
      // aunque los flags de modo demo no estén activos en este
      // navegador: sin esto, tras un mint la colección guardada se
      // leía bien, pero antes de mintear (o con otro uid) el perfil
      // decía "NFTs 0" mientras /tokens mostraba los 4 de ejemplo
      // (ronda 7, puntos 8 y 9). La colección guardada sigue mandando
      // cuando existe (el mint no se sobrescribe).
      if (
        WalletService.isDemoMode() ||
        isDemoAuthActive ||
        hasDemoNftsForUser ||
        opts?.demoFallback
      ) {
        const stored = readDemoNFTs(userId);
        if (stored.length > 0) return stored;
        // Sin colección guardada: la canónica demo (DEFAULT_DEMO_NFTS),
        // SIN escribir en localStorage. El mint parte de vacío y su tope
        // de 4 no se rompe; el llamador filtra is_couple para la pareja
        // (2 NFTs). Punto 12: antes devolvía [] y el perfil decía
        // "NFTs 0" mientras DemoWallet partía de los 4 defaults (y "NFTs 1"
        // tras mintear 1). Ahora todos leen esta misma fuente.
        return DEFAULT_DEMO_NFTS.map((nft, index) => ({
          id: nft.id,
          token_id: index + 1,
          owner_address: "DEMO",
          metadata_uri: "ipfs://demo-metadata-hash",
          rarity: nft.rarity,
          is_couple: nft.is_couple,
          created_at: new Date().toISOString(),
          name: nft.name,
          image: nft.image,
          value: nft.value,
        }));
      }

      const wallet = await this.walletService
        .getOrCreateWallet(userId)
        .catch(() => null);
      if (!wallet) return [];

      const ownerAddress =
        wallet && typeof wallet === "object" && "address" in wallet && typeof wallet.address === "string"
          ? wallet.address
          : undefined;
      if (!ownerAddress) {
        return [];
      }

      const { data, error } = await this.blockchainClient
        .from("user_nfts" as const)
        .select("*")
        .eq("owner_address", ownerAddress);

      if (error) throw error;
      return (data || []).map((nft: unknown) => {
        if (!nft || typeof nft !== "object") {
          return {
            id: "",
            token_id: 0,
            owner_address: "",
            metadata_uri: "",
            rarity: "common",
            is_couple: false,
            created_at: new Date().toISOString(),
          };
        }
        const nftObj = nft as Record<string, unknown>;
        const base: NFTInfo = {
          id: String(nftObj.id || ""),
          token_id: typeof nftObj.token_id === "number" ? nftObj.token_id : 0,
          owner_address:
            typeof nftObj.contract_address === "string" ? nftObj.contract_address : "",
          metadata_uri: typeof nftObj.metadata_uri === "string" ? nftObj.metadata_uri : "",
          rarity: "common",
          is_couple: Boolean(nftObj.is_couple),
          created_at:
            typeof nftObj.minted_at === "string" ? nftObj.minted_at : new Date().toISOString(),
        };

        if (typeof nftObj.name === "string" && nftObj.name) base.name = nftObj.name;
        if (typeof nftObj.description === "string" && nftObj.description)
          base.description = nftObj.description;
        if (typeof nftObj.image_url === "string" && nftObj.image_url) base.image = nftObj.image_url;

        return base;
      });
    } catch (error) {
      logger.error("Error fetching user NFTs", { error });
      return [];
    }
  }

  /**
   * Obtiene solicitudes de NFT de pareja pendientes
   */
  public async getCoupleNFTRequests(
    userId: string,
  ): Promise<CoupleNFTRequestRow[]> {
    try {
      const wallet = await this.walletService
        .getOrCreateWallet(userId)
        .catch(() => null);
      const ownerAddress =
        wallet && typeof wallet === "object" && "address" in wallet && typeof wallet.address === "string"
          ? wallet.address
          : undefined;
      if (!ownerAddress) return [];

      const { data, error } = await this.blockchainClient
        .from("couple_nft_requests" as const)
        .select("*")
        .or(`partner1_address.eq.${ownerAddress},partner2_address.eq.${ownerAddress}`)
        .eq("status", "pending");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching couple NFT requests", { error });
      return [];
    }
  }

  /**
   * Minteo demo COMPARTIDO (ronda 8, punto 4): única vía por la que un
   * mint demo escribe en `demo_nfts:<uid>`. La usan el botón single, el
   * flujo de pareja y "Mintear NFT Demo" de DemoWallet.
   *
   * Reglas: la base es la colección guardada, o la semilla si aún no hay
   * ninguna (así el primer mint NO borra los 4 de ejemplo: fresco 4 →
   * tras 1 mint 5, no 1); el tope DEMO_MINT_LIMIT cuenta solo minteados;
   * el NFT nuevo es del tipo que pide el llamador (`isCouple`) — antes
   * DemoWallet minteaba siempre `isCouple: false` y en pareja el NFT
   * se filtraba en todas las vistas y el re-corte a 2 dejaba la pareja
   * en 1. Devuelve el NFT creado o null si se alcanzó el tope.
   */
  public async mintDemoNFT(
    userId: string,
    opts: { isCouple: boolean; name?: string; description?: string },
  ): Promise<NFTInfo | null> {
    if (!userId || typeof window === "undefined") return null;
    let base = readDemoNFTs(userId);
    if (base.length === 0) {
      // Sin colección guardada la base es la semilla (se escribe, para
      // que el mint no sea el único ítem guardado): sin esto la
      // colección pasaba de 4 (ejemplo en memoria) a 1 tras el mint.
      seedDemoNFTs(userId);
      base = readDemoNFTs(userId);
    }
    if (countMintedDemoNFTs(base) >= DEMO_MINT_LIMIT) return null;

    const now = new Date().toISOString();
    const nextIndex = base.length;
    const created: NFTInfo = {
      id: `demo-nft-${userId}-${nextIndex}-${Date.now()}`,
      token_id: nextIndex + 1,
      owner_address: "DEMO",
      metadata_uri: "ipfs://demo-metadata-hash",
      rarity: "common",
      is_couple: opts.isCouple,
      created_at: now,
      name: opts.name ?? (opts.isCouple ? "NFT de Pareja" : "NFT Demo"),
      description: opts.description ?? "",
      image: getDemoNftImageForIndex(nextIndex),
      minted_by_user: true,
    };

    const next = [created, ...base].slice(0, DEMO_NFT_STORAGE_CAP);
    window.localStorage.setItem(
      getDemoNFTStorageKey(userId),
      JSON.stringify(next),
    );
    notifyDemoNFTsChanged();
    logger.info("Mint demo NFT", {
      userId,
      isCouple: opts.isCouple,
      count: next.length,
    });
    return created;
  }

  /**
   * Mintea un NFT individual
   */
  public async mintSingleNFT(
    userId: string,
    name: string,
    description: string,
    imageFile: File,
  ): Promise<boolean> {
    try {
      const isDemoEnv =
        import.meta.env.VITE_APP_MODE === "demo" ||
        import.meta.env.MODE === "development";
      const isDemoAuthActive =
        isDemoEnv &&
        typeof window !== "undefined" &&
        safeGetItem("demo_authenticated") === "true";

      const isDemoUserActive =
        typeof window !== "undefined" &&
        (() => {
          try {
            return window.localStorage.getItem("demo_user") !== null;
          } catch {
            return false;
          }
        })();

      if (WalletService.isDemoMode() || isDemoAuthActive || isDemoUserActive) {
        // Vía compartida (mintDemoNFT): tope sobre minteados, base con
        // semilla, aviso a los contadores. Antes el tope era sobre la
        // colección total (4 sembrados = límite alcanzado) y el mint
        // devolvía false siempre en demo.
        const created = await this.mintDemoNFT(userId, {
          isCouple: false,
          name,
          description,
        });
        return created !== null;
      }

      // Asegurar wallet del usuario
      const wallet = await this.walletService
        .getOrCreateWallet(userId)
        .catch(() => null);
      const ownerAddress =
        wallet && typeof wallet === "object" && "address" in wallet && typeof wallet.address === "string"
          ? wallet.address
          : "";

      const imageHash = await this.uploadImageToIPFS(imageFile);
      const rarity = this.pickRarity();
      const metadataHash = await this.generateMetadata(
        name,
        description,
        imageHash,
        { rarity, owner_address: ownerAddress },
      );

      // Aquí iría la llamada al contrato inteligente
      logger.info("Minting single NFT", {
        userId,
        ownerAddress,
        rarity,
        metadataHash,
      });
      return true;
    } catch (error) {
      logger.error("Error minting single NFT", { error });
      return false;
    }
  }

  /**
   * Aprueba una solicitud de NFT de pareja
   */
  public async approveCoupleNFT(requestId: string): Promise<boolean> {
    try {
      const { error } = await this.blockchainClient
        .from("couple_nft_requests" as const)
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error approving couple NFT", { error });
      return false;
    }
  }

  /**
   * Inicia solicitud de NFT de pareja (requiere aprobación mutua)
   */
  public async requestCoupleNFT(
    requesterId: string,
    partnerId: string,
    name: string,
    description: string,
    imageFile: File,
  ): Promise<boolean> {
    try {
      logger.info("Iniciando solicitud de NFT de pareja", {
        requesterId,
        partnerId,
      });

      // JWT complement (2026-11-19): mismo short-circuit demo que
      // mintSingleNFT. Sin sesión real no hay JWT que enviar a
      // pinata-proxy, así que en demo no se intenta la subida: el NFT de
      // pareja se crea en local con mintDemoNFT (ronda 8, punto 4).
      const isDemoEnv =
        import.meta.env.VITE_APP_MODE === "demo" ||
        import.meta.env.MODE === "development";
      const isDemoAuthActive =
        isDemoEnv &&
        typeof window !== "undefined" &&
        safeGetItem("demo_authenticated") === "true";

      const isDemoUserActive =
        typeof window !== "undefined" &&
        (() => {
          try {
            return window.localStorage.getItem("demo_user") !== null;
          } catch {
            return false;
          }
        })();

      if (WalletService.isDemoMode() || isDemoAuthActive || isDemoUserActive) {
        // Ronda 8, punto 4: en demo SÍ se mintea el NFT de pareja en
        // local (vía compartida mintDemoNFT, is_couple: true). Antes se
        // devolvía false sin crear nada ("sin subida") y el botón
        // "Crear NFT de Pareja" no cambiaba ningún contador. El
        // consentimiento doble se simula en el llamador (ProfileCouple
        // crea la solicitud y la aprueba a los 5 s); aquí queda el NFT.
        const created = await this.mintDemoNFT(requesterId, {
          isCouple: true,
          name,
          description,
        });
        logger.info("Solicitud de NFT de pareja en modo demo: NFT minteado", {
          requesterId,
          partnerId,
          minted: created !== null,
        });
        return created !== null;
      }

      const requesterWallet = await this.walletService
        .getOrCreateWallet(requesterId)
        .catch(() => null);
      const partnerWallet = await this.walletService
        .getWalletByUserId(partnerId)
        .catch(() => null);

      const requesterAddress =
        requesterWallet && typeof requesterWallet === "object" && "address" in requesterWallet && typeof requesterWallet.address === "string"
          ? requesterWallet.address
          : undefined;
      const partnerAddress =
        partnerWallet && typeof partnerWallet === "object" && "address" in partnerWallet && typeof partnerWallet.address === "string"
          ? partnerWallet.address
          : undefined;

      if (!requesterAddress || !partnerAddress) {
        return false;
      }

      const imageHash = await this.uploadImageToIPFS(imageFile);
      const metadata = {
        name,
        description,
        imageHash,
        created_at: new Date().toISOString(),
      };

      const metadataUri = `ipfs://${imageHash}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await this.blockchainClient
        .from("couple_nft_requests" as const)
        .insert({
          expires_at: expiresAt,
          initiator_address: requesterAddress,
          metadata: metadata,
          metadata_uri: metadataUri,
          partner1_address: requesterAddress,
          partner2_address: partnerAddress,
          status: "pending",
          token_id: 0,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // TODO: Notificar al partner
      return true;
    } catch (error) {
      logger.error("Error solicitando NFT de pareja", { error });
      return false;
    }
  }
}

export const nftService = NFTService.getInstance();
