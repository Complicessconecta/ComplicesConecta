// SPDX-License-Identifier: MIT
// ComplicesConecta v3.8.0 - DemoWallet
// Fecha: 10 Ene 2026 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Componente de wallet para perfiles demo

import { useEffect, useMemo, useState } from "react";
import { safeOpenUrl } from "@/utils/safeOpenUrl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import {
  Wallet,
  Coins,
  Image as ImageIcon,
  Crown,
  Sparkles,
  TrendingUp,
  Lock,
  ExternalLink,
  X,
} from "lucide-react";
import {
  DEFAULT_DEMO_NFTS,
  nftService,
  DEMO_NFTS_CHANGED_EVENT,
  DEMO_MINT_LIMIT,
  countMintedDemoNFTs,
} from "@/services/payments/NFTService";
import { useToast } from "@/hooks/useToast";
import { ANONYMOUS_WALLET_BLOCKED_REASON } from "@/lib/anonymous";
import { findLocalDemoAccountById } from "@/lib/demo-registration";
import {
  DEMO_WALLET_BALANCES,
  getDemoWalletBalance,
  DEMO_WALLET_CHANGED_EVENT,
} from "@/lib/demo-wallet";

/**
 * Interfaz para NFT mock
 */
interface DemoNFT {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  image: string;
  value: number;
  isCouple: boolean;
  /** Minteado por el usuario (vs semilla): alimenta el contador X/4. */
  mintedByUser: boolean;
}

interface DemoWalletProps {
  userId: string;
  /** Tipo de cuenta demo: define los balances canónicos (useTokens).
   * Antes los valores eran fijos de single (CMPX 1250 / GTK 500) y la
   * pareja mostraba esos mismos números. */
  accountType?: "single" | "couple";
}

/**
 * Balances demo canónicos (ÚNICA fuente: @/lib/demo-wallet — la misma
 * que useTokens, TokenDashboard y los perfiles). Antes vivían duplicados
 * aquí y cada superficie podía decir otro número.
 */
const DEMO_BALANCES = DEMO_WALLET_BALANCES;

/**
 * Interfaz para Token mock
 */
interface DemoToken {
  symbol: string;
  balance: number;
  value: number;
  type: "cmpx" | "gtk";
  isPremium: boolean;
}

/**
 * Componente de Wallet para perfiles demo
 */
export function DemoWallet({
  userId,
  accountType = "single",
}: DemoWalletProps) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0x1234...5678");
  const [balance, setBalance] = useState("0.00");
  const [showPolygonModal, setShowPolygonModal] = useState(false);
  const [selectedNft, setSelectedNft] = useState<DemoNFT | null>(null);
  const { toast } = useToast();

  // Ronda 10 (stream A, punto A3): una cuenta anónima no tiene
  // billetera: este componente nunca muestra los saldos canónicos
  // (de Sofía o de la pareja) para su userId. Los llamadores ya lo
  // filtran (ProfileSingle), pero la guarda vive también aquí: una
  // sesión no hereda la cartera de otra por ningún camino.
  const isAnonymousWallet =
    findLocalDemoAccountById(userId)?.isAnonymous === true;

  const getImageForRarity = (rarity: DemoNFT["rarity"]): string => {
    switch (rarity) {
      case "legendary":
        return "/assets/nfts/imagen4.gif";
      case "epic":
        return "/assets/nfts/imagen3.jpg";
      case "rare":
        return "/assets/nfts/imagen1.jpg";
      case "common":
      default:
        return "/assets/nfts/imagen2.jpg";
    }
  };

  // Única fuente de verdad en NFTService (DEFAULT_DEMO_NFTS); aquí solo se
  // adapta is_couple -> isCouple para el estado local del componente.
  // En pareja solo se muestran sus 2 NFTs (is_couple); en single los 4.
  const defaultDemoNFTs: DemoNFT[] = useMemo(
    () =>
      // Ronda 10 (stream A, punto A3): el anónimo no tiene NFTs.
      isAnonymousWallet
        ? []
        : DEFAULT_DEMO_NFTS.filter((nft) =>
            accountType === "couple" ? nft.is_couple : true,
          )
            .slice(0, DEMO_BALANCES[accountType].nfts)
            .map((nft) => ({
              id: nft.id,
              name: nft.name,
              rarity: nft.rarity,
              image: nft.image,
              value: nft.value,
              isCouple: nft.is_couple,
              mintedByUser: false,
            })),
    [accountType, isAnonymousWallet],
  );

  const [demoNFTs, setDemoNFTs] = useState<DemoNFT[]>(defaultDemoNFTs);

  // Colección demo: ÚNICA fuente `nftService.getUserNFTs` (punto 12) —
  // la misma que leen el perfil y /tokens. Antes este componente leía
  // localStorage por su cuenta y partía de los 4 defaults, así que su
  // contador podía decir 1 mientras la estadística del perfil decía 0.
  // También se recarga cuando otro sitio mintea en la misma página
  // (evento `demo-nfts-changed`): sin esto el badge quedaba obsoleto
  // tras mintear en el modal del perfil.
  useEffect(() => {
    if (!userId) return;
    // Ronda 10 (stream A, punto A3): el anónimo no tiene NFTs.
    if (isAnonymousWallet) {
      setDemoNFTs([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        // demoFallback: DemoWallet solo se renderiza en perfiles demo;
        // sin él, en el preview (VITE_APP_MODE != "demo") la lectura
        // caía a la rama de Supabase y devolvía [] aunque la colección
        // minteada estuviera guardada (punto 9).
        const owned = await nftService.getUserNFTs(userId, {
          demoFallback: true,
        });
        if (cancelled) return;
        const normalized = owned
          .filter((nft) => (accountType === "couple" ? nft.is_couple : true))
          .map((nft, idx): DemoNFT => {
            const rarityRaw = nft.rarity;
            const rarity: DemoNFT["rarity"] =
              rarityRaw === "legendary" ||
              rarityRaw === "epic" ||
              rarityRaw === "rare" ||
              rarityRaw === "common"
                ? rarityRaw
                : "common";
            return {
              id: nft.id || `demo-nft-${userId}-${idx}`,
              name: nft.name || "Cómplice Demo",
              rarity,
              image: nft.image || getImageForRarity(rarity),
              value: typeof nft.value === "number" ? nft.value : 100,
              isCouple: nft.is_couple,
              mintedByUser: nft.minted_by_user === true,
            };
          });
        if (normalized.length > 0) setDemoNFTs(normalized);
      } catch {
        // no-op: se quedan los defaults
      }
    };
    void load();
    const onChanged = () => void load();
    window.addEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
    };
  }, [userId, accountType, isAnonymousWallet]);

  // Ronda 14 (stream F, F7): el botón "Mintear NFT Demo" no mostraba
  // el límite: en el tope (4/4) seguía pareciendo activo y el clic solo
  // devolvía un toast, así que el minteo "parecía desactivado". El
  // contador es la misma cuenta canónica que usa el modal del perfil
  // (solo minteados por el usuario; la semilla nunca cuenta). En pareja
  // la lista ya viene filtrada a is_couple, así que la cuenta es la de
  // la pareja (2 de semilla + hasta 4 minteados = 6 visibles).
  const mintedNftCount = countMintedDemoNFTs(
    demoNFTs.map((nft) => ({
      id: nft.id,
      minted_by_user: nft.mintedByUser,
    })),
  );
  const mintLimitReached = mintedNftCount >= DEMO_MINT_LIMIT;

  // Minteo demo por la vía compartida (nftService.mintDemoNFT, ronda 8,
  // punto 4): el NFT nuevo es del tipo de la cuenta (isCouple en pareja)
  // y se guarda junto a la semilla, sin recortarla. Antes se minteaba
  // siempre `isCouple: false` y se persistía la vista recortada a 2, así
  // que en pareja el NFT minteado se filtraba en todas las vistas, el
  // re-corte expulsaba un NFT de pareja guardado y la pareja quedaba en
  // 1 NFT. El contador se actualiza solo por el evento
  // `demo-nfts-changed` (el `load` de arriba).
  const handleMintDemoNft = async () => {
    if (!userId) return;
    const created = await nftService.mintDemoNFT(userId, {
      isCouple: accountType === "couple",
      name: "NFT Demo Minteado",
      description: "NFT demo minteado desde la wallet",
    });
    if (!created) {
      toast({
        title: "Límite demo alcanzado",
        description: `Ya minteaste ${DEMO_MINT_LIMIT} NFTs en modo demo.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "¡NFT minteado (DEMO)!",
      description: `${created.name} se agregó a tu colección.`,
    });
  };

  // Tokens demo canónicos según el tipo de cuenta (useTokens()).
  // Se leen del saldo PERSISTIDO (@/lib/demo-wallet) y se re-leen
  // cuando cambia (reclamo en /tokens): antes eran las constantes
  // 1250/850 y el reclamo de 100 CMPX nunca se reflejaba aquí ni en
  // el perfil (ronda 7, punto 8).
  const [canonical, setCanonical] = useState(() =>
    // Ronda 10 (stream A, punto A3): el anónimo no tiene saldos.
    isAnonymousWallet
      ? { cmpx: 0, gtk: 0, nfts: 0 }
      : getDemoWalletBalance(accountType),
  );
  useEffect(() => {
    setCanonical(
      isAnonymousWallet
        ? { cmpx: 0, gtk: 0, nfts: 0 }
        : getDemoWalletBalance(accountType),
    );
    const onChanged = () =>
      setCanonical(
        isAnonymousWallet
          ? { cmpx: 0, gtk: 0, nfts: 0 }
          : getDemoWalletBalance(accountType),
      );
    window.addEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
    return () =>
      window.removeEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
  }, [accountType, isAnonymousWallet]);
  const demoTokens: DemoToken[] = [
    {
      symbol: "CMPX",
      balance: canonical.cmpx,
      value: 250,
      type: "cmpx",
      isPremium: false,
    },
    {
      symbol: "GTK",
      balance: canonical.gtk,
      value: 5000,
      type: "gtk",
      isPremium: true,
    },
  ];
  // Staking derivado del GTK canónico (20% bloqueado, como en useTokens;
  // rewards al 35% APY sobre lo bloqueado). Antes eran fijos 500/175 GTK
  // aunque el balance fuera otro.
  const gtkStaked = Math.round(canonical.gtk * 0.2);
  const gtkRewards = Math.round(gtkStaked * 0.35);

  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600",
    epic: "from-purple-500 to-purple-600",
    legendary: "from-yellow-500 to-orange-500",
  };

  const rarityBadges = {
    common: "bg-gray-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-yellow-500",
  };

  const handleConnectWallet = () => {
    setWalletConnected(true);
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    setBalance("1.25");
  };

  // Ronda 10 (stream A, punto A3): estado bloqueado en vez de la
  // cartera de otra cuenta (saldos, staking, NFTs). Va tras todos
  // los hooks para no romper su orden.
  if (isAnonymousWallet) {
    return (
      <div className="space-y-6">
        <Card className="bg-amber-500/10 backdrop-blur-xl border-amber-400/40 shadow-2xl">
          <CardHeader>
            {/* Ronda 15 (stream C): `text-white` sobre ámbar claro era
                ilegible en tema claro; ámbar oscuro en claro, blanco
                en oscuro. */}
            <CardTitle className="flex items-center gap-3 text-amber-900 dark:text-white">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              Billetera desactivada en cuentas anónimas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800 dark:text-white/80">
              {ANONYMOUS_WALLET_BLOCKED_REASON}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Wallet */}
      {/* Ronda 15 (stream C): el gradiente era translúcido
          (`from-purple-900/40 to-blue-900/40`): en tema claro el fondo
          de la página se transparentaba y el texto blanco quedaba
          blanco sobre claro (aviso de la wallet demo, test PR #74).
          Gradiente opaco en ambos temas: el blanco sigue legible y en
          oscuro el aspecto no cambia. Igual en Tokens, NFTs y Staking. */}
      <Card className="bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-linear-to-r from-purple-500 to-blue-600 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            Wallet Demo
            <Badge className="ml-2 bg-yellow-500/20 text-yellow-200 border-yellow-400/40">
              DEMO MODE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletConnected ? (
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Conectar Wallet Demo
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/80">Conectado</span>
                </div>
                <Badge
                  className="bg-green-500/20 text-green-200 border-green-400/40 max-w-[150px] truncate"
                  title={walletAddress}
                >
                  {walletAddress.length > 14
                    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
                    : walletAddress}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white/80">Balance MATIC</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {balance} MATIC
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tokens */}
      <Card className="bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-linear-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Coins className="h-6 w-6 text-white" />
            </div>
            Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-linear-to-r from-purple-500 to-blue-600 rounded-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {token.symbol}
                    </span>
                    {token.isPremium && (
                      <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/40 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        PREMIUM
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    {token.type === "cmpx"
                      ? "Token de consumo"
                      : "Token de inversión"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">
                  {token.balance.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">
                  ${token.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* NFTs */}
      <Card className="bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-linear-to-r from-pink-500 to-purple-600 rounded-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            NFTs
            <Badge className="ml-2 bg-purple-500/20 text-purple-200 border-purple-400/40">
              {demoNFTs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMintDemoNft}
            disabled={mintLimitReached || !userId}
            title={
              !userId
                ? "Inicia sesión demo para mintear"
                : mintLimitReached
                  ? `Límite demo alcanzado: ya minteaste ${DEMO_MINT_LIMIT} NFTs`
                  : `Mintear un NFT demo (${mintedNftCount}/${DEMO_MINT_LIMIT} minteados)`
            }
            className="w-full mb-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold disabled:opacity-50"
            type="button"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {mintLimitReached
              ? `Límite demo alcanzado (${mintedNftCount}/${DEMO_MINT_LIMIT})`
              : `Mintear NFT Demo (${mintedNftCount}/${DEMO_MINT_LIMIT})`}
          </Button>
          {/* La rejilla no puede desbordar el viewport (ronda 8, punto
              3): cada tarjeta es `min-w-0` para que el contenido (fila de
              badges sin salto) no fuerce la columna más ancha que su
              parte — eso cortaba la 2ª tarjeta en el borde derecho y
              arrastraba el desborde horizontal de la página. */}
          <div className="grid grid-cols-2 gap-4 min-w-0">
            {demoNFTs.map((nft) => (
              <div
                key={nft.id}
                className="relative overflow-hidden rounded-xl bg-linear-to-br from-purple-900/30 to-blue-900/30 border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer min-w-0"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedNft(nft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedNft(nft);
                  }
                }}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${rarityColors[nft.rarity]} opacity-20`}
                />
                <div className="relative p-4 space-y-3 min-w-0">
                  <div className="aspect-square rounded-lg bg-white/10 overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    {/* RONDA 10 (stream B, B5): la fila era `flex
                        items-center justify-between` con AMBOS badges
                        `shrink-0` (rareza en mayúsculas + "PAREJA" con
                        icono): en tarjetas angostas la suma superaba el
                        ancho, flex no podía encogerlos y el
                        `overflow-hidden` de la tarjeta recortaba la
                        pastilla "PAREJA" ("✦ PAR"). Ahora las pastillas
                        saltan de línea en vez de recortarse, más compactas,
                        y el título lleva el nombre completo en `title`. */}
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <Badge
                        className={`${rarityBadges[nft.rarity]} text-white text-[10px] sm:text-xs px-2 shrink-0`}
                      >
                        {nft.rarity.toUpperCase()}
                      </Badge>
                      {nft.isCouple && (
                        <Badge className="bg-pink-500/20 text-pink-200 border-pink-400/40 text-[10px] sm:text-xs px-2 shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          PAREJA
                        </Badge>
                      )}
                    </div>
                    {/* Ronda 21 (stream C): el título iba con `truncate`:
                        "NFT Demo Minteado" se veía "NFT Demo Min…". El
                        nombre completo cabe en dos líneas. */}
                    <h4
                      className="font-semibold text-white text-sm whitespace-normal break-words"
                      title={nft.name}
                    >
                      {nft.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-white/80">
                          {nft.value} CMPX
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span>+{Math.floor(Math.random() * 20) + 5}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staking Info */}
      <Card className="bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-linear-to-r from-green-500 to-teal-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            Staking Activo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white/80">GTK Staking</span>
              </div>
              <Badge className="bg-green-500/20 text-green-200 border-green-400/40">
                35% APY
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Tokens bloqueados</span>
                <span className="font-semibold text-white">
                  {gtkStaked} GTK
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Duración</span>
                <span className="font-semibold text-white">365 días</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Rewards acumulados</span>
                <span className="font-semibold text-green-400">
                  {gtkRewards} GTK
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Fecha de liberación</span>
                <span className="font-semibold text-white">Ene 2027</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowPolygonModal(true)}
            className="w-full bg-linear-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver en PolygonScan
          </Button>
        </CardContent>
      </Card>

      {/* Modal PolygonScan Demo */}
      {showPolygonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-green-400" />
                PolygonScan Demo
              </h3>
              <button
                onClick={() => setShowPolygonModal(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                <p className="text-yellow-200 text-sm font-medium">
                  ⚠️ Modo Demo Activado
                </p>
                <p className="text-yellow-100/80 text-xs mt-2">
                  Esta es una wallet demo con datos simulados. Para ver
                  transacciones reales en PolygonScan, necesitas:
                </p>
                <ul className="text-yellow-100/80 text-xs mt-2 space-y-1 list-disc list-inside">
                  <li>Conectar tu wallet real de MetaMask</li>
                  <li>Estar en modo producción (no demo)</li>
                  <li>Haber realizado transacciones reales en Polygon</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPolygonModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Entendido
                </Button>
                <Button
                  onClick={() => {
                    safeOpenUrl("https://polygonscan.com");
                    setShowPolygonModal(false);
                  }}
                  className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Visitar PolygonScan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle NFT Demo */}
      {selectedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-300" />
                Detalle de NFT (Demo)
              </h3>
              <button
                onClick={() => setSelectedNft(null)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar detalle"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-white/10 border border-white/15">
                <img
                  src={selectedNft.image}
                  alt={selectedNft.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-bold text-white truncate">
                    {selectedNft.name}
                  </h4>
                  <Badge
                    className={`${rarityBadges[selectedNft.rarity]} text-white text-xs shrink-0`}
                  >
                    {selectedNft.rarity.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Tipo</span>
                  <span className="text-white font-semibold">
                    {selectedNft.isCouple ? "Pareja" : "Single"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Valor estimado</span>
                  <span className="text-yellow-200 font-semibold">
                    {selectedNft.value} CMPX
                  </span>
                </div>
              </div>

              <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-100/90 text-xs leading-relaxed">
                  ⚠️ Este detalle es información simulada para modo demo. En
                  producción, los NFTs se cargan desde la tabla{" "}
                  <strong>user_nfts</strong>.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedNft(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                  type="button"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      {/* Ronda 16 (stream A, bloqueador 1 del test dirigido ronda 15):
          el aviso era `text-white/80` y `text-white/70` SIN fondo propio:
          vive fuera de las 4 tarjetas, en la raíz `space-y-6`, así que en
          tema claro quedaba blanco sobre el fondo pálido de la página
          (casi ilegible). La ronda 15 (stream C) opacó las tarjetas pero
          este aviso quedó fuera del arreglo. Texto explícito claro/oscuro,
          mismo patrón que el aviso anónimo de este componente; en oscuro
          no cambia nada. */}
      <div className="text-center space-y-2">
        <p className="text-xs text-slate-700 dark:text-white/80 font-medium">
          Esta es una wallet demo con datos mock para familiarizarte con el
          ecosistema.
        </p>
        <p className="text-xs text-slate-600 dark:text-white/70">
          En producción, podrás conectar tu wallet real de MetaMask para
          interactuar con contratos inteligentes en Polygon.
        </p>
      </div>
    </div>
  );
}
