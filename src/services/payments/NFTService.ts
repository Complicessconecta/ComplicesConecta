// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------
// ComplicesConecta v3.7.0 - NFTService
// Fecha: 13 Nov 2025 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Servicio para gestión de NFTs, IPFS y lógica de parejas
// Funcionalidades: Mint NFT, upload IPFS, consentimiento doble, metadata

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { safeGetItem } from "@/utils/safeLocalStorage";
import { WalletService } from "@/services/payments/WalletService";
import type {CoupleNFTRequest,BlockchainSupabaseClient} from "@/types/blockchain";
import { safeBlockchainCast } from "@/types/blockchain";

const getDemoNFTStorageKey = (uid: string) => `demo_nfts:${uid}`;

const readDemoNFTs = (uid: string): NFTInfo[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(getDemoNFTStorageKey(uid));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Record<string, unknown>>)
      .slice(0, 4)
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
  created_at: string;
}

// CoupleNFTRequest ya está importado desde @/types/blockchain

/**
 * Servicio de NFTs para ComplicesConecta
 *
 * Características principales:
 * - Mint de NFTs individuales y de pareja
 * - Upload a IPFS con Pinata
 * - Sistema de consentimiento doble
 * - Gestión de metadata y rareza
 * - Integración con contratos inteligentes
 */
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
    metadata?: Record<string, any>,
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

      const pinataProxyUrl = import.meta.env.VITE_PINATA_PROXY_URL || '/functions/v1/pinata-proxy';

      const response = await fetch(pinataProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'pinning/pinFileToIPFS',
          path: '/pinning/pinFileToIPFS',
          body: formData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en Pinata: ${response.statusText}`);
      }

      const data = await response.json();
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
    attributes: Record<string, any>,
  ): Promise<string> {
    try {
      const metadata: NFTMetadata = {
        name,
        description,
        image: `${NFTService.PINATA_GATEWAY}${imageHash}`,
        attributes: Object.entries(attributes).map(([key, value]) => ({
          trait_type: key,
          value: value as string | number,
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
  public async getUserNFTs(userId: string): Promise<NFTInfo[]> {
    try {
      const isDemoEnv =
        import.meta.env.VITE_APP_MODE === "demo" ||
        import.meta.env.MODE === "development";
      const isDemoAuthActive =
        isDemoEnv &&
        typeof window !== "undefined" &&
        safeGetItem("demo_authenticated") === "true";
      if (WalletService.isDemoMode() || isDemoAuthActive) {
        return readDemoNFTs(userId);
      }

      const wallet = await this.walletService
        .getOrCreateWallet(userId)
        .catch(() => null);
      const ownerAddress = (wallet as any)?.address;
      if (typeof ownerAddress !== "string" || !ownerAddress) {
        return [];
      }

      const { data, error } = await this.blockchainClient
        .from("user_nfts")
        .select("*")
        .eq("owner_address", ownerAddress);

      if (error) throw error;
      return (data || []).map((nft: any) => {
        const base: NFTInfo = {
          id: String(nft.id || ""),
          token_id: typeof nft.token_id === "number" ? nft.token_id : 0,
          owner_address:
            typeof nft.contract_address === "string" ? nft.contract_address : "",
          metadata_uri: typeof nft.metadata_uri === "string" ? nft.metadata_uri : "",
          rarity: "common",
          is_couple: Boolean(nft.is_couple),
          created_at:
            typeof nft.minted_at === "string" ? nft.minted_at : new Date().toISOString(),
        };

        if (typeof nft.name === "string" && nft.name) base.name = nft.name;
        if (typeof nft.description === "string" && nft.description)
          base.description = nft.description;
        if (typeof nft.image_url === "string" && nft.image_url) base.image = nft.image_url;

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
  ): Promise<CoupleNFTRequest[]> {
    try {
      const { data, error } = await this.blockchainClient
        .from("couple_nft_requests")
        .select("*")
        .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
        .eq("status", "pending");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching couple NFT requests", { error });
      return [];
    }
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
      // Asegurar wallet del usuario
      const wallet = await this.walletService
        .getOrCreateWallet(userId)
        .catch(() => null);
      const ownerAddress = (wallet as any)?.address || "";

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
        .from("couple_nft_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
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

      const imageHash = await this.uploadImageToIPFS(imageFile);
      const metadata = {
        name,
        description,
        imageHash,
        created_at: new Date().toISOString(),
      };

      const { error } = await this.blockchainClient
        .from("couple_nft_requests")
        .insert({
          requester_id: requesterId,
          partner_id: partnerId,
          status: "pending",
          metadata: metadata,
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
