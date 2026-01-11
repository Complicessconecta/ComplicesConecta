/**
 * Dashboard Interactivo de Tokens CMPX/GTK
 * Visualización amigable para usuarios Beta con gráficos y métricas
 */

import { useId } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { useTokens } from "@/hooks/useTokens";
import {
  Coins,
  TrendingUp,
  Lock,
  Gift,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { TokenAiChat } from "./TokenAiChat";

// Imágenes de NFTs mock para modo demo
const MOCK_NFT_IMAGES = [
  "/assets/nfts/imagen1.jpg",
  "/assets/nfts/imagen2.jpg",
  "/assets/nfts/imagen3.jpg",
  "/assets/nfts/imagen4.gif",
];

// Datos mock para modo demo
const MOCK_DEMO_DATA = {
  balance: {
    cmpxBalance: 5000,
    gtkBalance: 2500,
    cmpxStaked: 2000,
    monthlyEarned: 800,
    monthlyLimit: 1000,
    monthlyRemaining: 200,
    referralCode: "DEMO2024",
    totalReferrals: 5,
  },
  transactions: [
    { id: 1, description: "Minteo NFT #1", amount: -1000, type: "nft_mint", date: new Date().toISOString() },
    { id: 2, description: "Recompensa diaria", amount: 50, type: "reward", date: new Date().toISOString() },
    { id: 3, description: "Staking CMPX", amount: -2000, type: "stake", date: new Date().toISOString() },
    { id: 4, description: "Recompensa referido", amount: 100, type: "referral", date: new Date().toISOString() },
  ],
  nfts: [
    {
      id: "demo-nft-1",
      token_id: 8238,
      name: "Cómplice #8238",
      image: MOCK_NFT_IMAGES[3],
      rarity: "legendary",
      value: 5000,
      collection: "CómplicesConecta Demo",
    },
    {
      id: "demo-nft-2",
      token_id: 167,
      name: "Cómplice #167",
      image: MOCK_NFT_IMAGES[1],
      rarity: "common",
      value: 100,
      collection: "CómplicesConecta Demo",
    },
    {
      id: "demo-nft-3",
      token_id: 3013,
      name: "Cómplice #3013",
      image: MOCK_NFT_IMAGES[2],
      rarity: "epic",
      value: 1500,
      collection: "CómplicesConecta Demo",
    },
    {
      id: "demo-nft-4",
      token_id: 4521,
      name: "Cómplice #4521",
      image: MOCK_NFT_IMAGES[0],
      rarity: "rare",
      value: 500,
      collection: "CómplicesConecta Demo",
    },
  ],
};

export interface TokenDashboardProps {
  initialBalance?: {
    cmpxBalance: number;
    gtkBalance: number;
    cmpxStaked: number;
    monthlyEarned: number;
    monthlyLimit: number;
    monthlyRemaining: number;
    referralCode: string;
    totalReferrals: number;
  };
  initialTransactions?: any[];
  nfts?: any[];
  isDemoMode?: boolean;
}

export function TokenDashboard({
  initialBalance,
  initialTransactions,
  nfts = [],
  isDemoMode = false,
}: TokenDashboardProps = {}) {
  const monthlyGradientId = useId();

  const {
    balance: hookBalance,
    transactions: hookTransactions,
    stakingRecords,
    pendingRewards,
    loading: hookLoading,
    error,
    claimWorldIdReward,
    startStaking,
    completeStaking,
    refreshTokens,
    hasActiveStaking,
    hasPendingRewards,
    isWorldIdEligible,
  } = useTokens();

  // Use props if provided (demo mode), otherwise use hook data
  const balance = isDemoMode ? MOCK_DEMO_DATA.balance : (initialBalance || hookBalance);
  const transactions = isDemoMode ? MOCK_DEMO_DATA.transactions : (initialTransactions || hookTransactions);
  const displayNfts = isDemoMode ? MOCK_DEMO_DATA.nfts : nfts;
  const loading = !isDemoMode && !initialBalance && hookLoading;

  if (loading) {
    return (
      <main role="main" className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/90">🪙 Cargando tu balance...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        role="main"
        className="p-4 bg-red-500/20 backdrop-blur-md border border-red-300/30 rounded-lg"
      >
        <p className="text-white">❌ {error}</p>
        <Button
          onClick={refreshTokens}
          className="mt-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
          size="sm"
        >
          Reintentar
        </Button>
      </main>
    );
  }

  if (!balance) {
    return (
      <main
        role="main"
        className="p-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-300/30 rounded-lg"
      >
        <p className="text-white">⚠️ No se pudo cargar el balance</p>
      </main>
    );
  }

  const totalCMPX = balance.cmpxBalance + balance.cmpxStaked;
  const availablePercentage =
    totalCMPX > 0 ? (balance.cmpxBalance / totalCMPX) * 100 : 0;
  const stakedPercentage =
    totalCMPX > 0 ? (balance.cmpxStaked / totalCMPX) * 100 : 0;
  const monthlyProgress =
    balance.monthlyLimit > 0
      ? Math.min(
          100,
          Math.max(0, (balance.monthlyEarned / balance.monthlyLimit) * 100),
        )
      : 0;

  return (
    <main role="main" className="space-y-6 p-4 md:p-8">
      {/* Header con balance principal */}
      <div className="relative overflow-hidden text-center bg-white/5 backdrop-blur-xl border border-white/15 text-white p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-600/40 to-blue-600/40" />
        <div className="relative z-10">
          {isDemoMode && (
            <div className="absolute top-2 right-2 bg-yellow-400/20 text-yellow-200 text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/30">
              SIMULACIÓN
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2 text-white">
            🪙 Tu Balance de Tokens
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <p className="text-white/80">CMPX Total</p>
              <p className="text-3xl font-bold text-white">{totalCMPX}</p>
            </div>
            <div>
              <p className="text-white/80">GTK</p>
              <p className="text-3xl font-bold text-white">
                {balance.gtkBalance}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de CMPX */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Distribución CMPX
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            {/* Barra de progreso visual */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                {/* Dynamic width based on availablePercentage - legitimate inline style */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 16"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    x="0"
                    y="0"
                    width={availablePercentage}
                    height="16"
                    fill="#22c55e"
                    rx="8"
                  />
                  <rect
                    x={availablePercentage}
                    y="0"
                    width={stakedPercentage}
                    height="16"
                    fill="#3b82f6"
                    rx="8"
                  />
                </svg>
                {/* Dynamic width based on stakedPercentage - legitimate inline style */}
              </div>
            </div>

            {/* Leyenda */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-white/90 truncate">
                  Disponibles: {balance.cmpxBalance} CMPX
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-white/90 truncate">
                  En Staking: {balance.cmpxStaked} CMPX
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Límite mensual */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Límite Mensual Beta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/90 truncate">Ganados este mes:</span>
              <span className="font-semibold text-white truncate">
                {balance.monthlyEarned} CMPX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/90 truncate">Restantes:</span>
              <span className="font-semibold text-green-400 truncate">
                {balance.monthlyRemaining} CMPX
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              {/* Dynamic width based on monthly progress - legitimate inline style */}
              <svg
                className="w-full h-full"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={monthlyGradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={monthlyProgress}
                  height="8"
                  fill={`url(#${monthlyGradientId})`}
                  rx="4"
                />
              </svg>
            </div>
            <p className="text-xs text-white/70 break-words">
              En fase beta cada usuario puede ganar máximo{" "}
              {balance.monthlyLimit} CMPX al mes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recompensas disponibles */}
      {(isWorldIdEligible || hasPendingRewards) && (
        <Card className="bg-white/5 backdrop-blur-xl border border-green-400/40 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Gift className="h-5 w-5" />
              🎁 Recompensas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 md:p-8">
            {isWorldIdEligible && (
              <div className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    🌍 World ID Verificado
                  </p>
                  <p className="text-sm text-white/80 break-words">
                    Reclama 100 CMPX por verificar tu identidad
                  </p>
                </div>
                <Button
                  onClick={claimWorldIdReward}
                  className="bg-green-600 hover:bg-green-700 text-white ml-2 flex-shrink-0"
                >
                  Reclamar 100 CMPX
                </Button>
              </div>
            )}

            {pendingRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {reward.amount} {reward.token_type}
                  </p>
                  <p className="text-sm text-white/80 truncate">
                    Balance: {reward.amount}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/80 text-white ml-2 flex-shrink-0"
                >
                  Pendiente
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Staking */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5" />
            🔒 Staking (Alcancía Especial)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
              <p className="text-sm text-white mb-2">
                💡 <strong>¿Qué es staking?</strong>
              </p>
              <p className="text-sm text-white/90 break-words">
                Guardas tus CMPX por 30 días y recibes +10% de recompensa.
                Ejemplo: 100 CMPX → 110 CMPX después de 30 días.
              </p>
            </div>

            {stakingRecords && stakingRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Tus Stakings:</h4>
                {stakingRecords.map((staking) => (
                  <div
                    key={staking.id}
                    className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {staking.amount} CMPX
                      </p>
                      <p className="text-sm text-white/80 break-words">
                        {staking.status === "active"
                          ? `${Math.ceil((new Date(staking.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días restantes`
                          : `Completado (+${Math.round((staking.amount * staking.apy) / 100)} CMPX)`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <Badge
                        variant={
                          staking.status === "active" ? "default" : "secondary"
                        }
                        className={
                          staking.status === "active"
                            ? "bg-blue-500/80 text-white"
                            : "bg-green-500/80 text-white"
                        }
                      >
                        {staking.status === "active" ? "Activo" : "Completado"}
                      </Badge>
                      {staking.status === "active" &&
                        new Date(staking.end_date) <= new Date() && (
                          <Button
                            size="sm"
                            className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => completeStaking(staking.id)}
                          >
                            Reclamar
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasActiveStaking && balance.cmpxBalance >= 50 && (
              <Button
                onClick={() => startStaking(Math.min(100, balance.cmpxBalance))}
                className="w-full bg-purple-600/80 hover:bg-purple-700/80 text-white border-purple-400/30"
                variant="outline"
              >
                🔒 Iniciar Staking ({Math.min(100, balance.cmpxBalance)} CMPX
                por 30 días)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referidos */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            👥 Sistema de Referidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/90 truncate">
                Tu código de referido:
              </span>
              <Badge
                variant="outline"
                className="font-mono bg-white/20 text-white border-white/30 ml-2 flex-shrink-0"
              >
                {balance.referralCode}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/90 truncate">
                Referidos exitosos:
              </span>
              <span className="font-semibold text-white flex-shrink-0 ml-2">
                {balance.totalReferrals}
              </span>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30">
              <p className="text-sm text-white break-words">
                💰 <strong>Gana 50 CMPX</strong> por cada amigo que invites y se
                registre. Tu amigo también recibe{" "}
                <strong>50 CMPX de bienvenida</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mis NFTs (Wallet) */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Mis NFTs (Wallet)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-sm text-white/70 mb-4">
            {isDemoMode
              ? "Vista de ejemplo de cómo se verán tus galerías NFT verificadas cuando conectes tu wallet real."
              : "Estos son algunos de los NFTs y galerías verificadas asociados a tu wallet en ComplicesConecta."}
          </p>

          {/* Estado de cuenta NFT */}
          <div className="flex items-center justify-between mb-4 text-xs text-white/70">
            <span className="truncate">
              NFTs en esta wallet:{" "}
              <span className="font-semibold text-white">{displayNfts.length}</span>
            </span>
            <span className="truncate text-right">
              Galerías NFT verificadas:{" "}
              <span className="font-semibold text-white">
                {isDemoMode ? "4/4" : "próximamente"}
              </span>
            </span>
          </div>

          {displayNfts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayNfts.slice(0, 4).map((nft, index) => (
                <div
                  key={nft.id || index}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20"
                >
                  <img
                    src={nft.image || nft.image_url || MOCK_NFT_IMAGES[index % MOCK_NFT_IMAGES.length] || MOCK_NFT_IMAGES[0]}
                    alt={nft.name || "NFT"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = MOCK_NFT_IMAGES[0] || '';
                    }}
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md rounded px-2 py-0.5 border border-white/20">
                    <span className="text-[10px] text-white font-semibold">
                      {nft.value ? `${nft.value} CMPX` : ''}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
                    <span className="text-[10px] text-white font-mono">
                      #{nft.token_id || index + 1}
                    </span>
                  </div>
                  {/* Hover info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-white font-bold text-sm truncate">
                      {nft.name || "NFT Item"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] capitalize ${
                        nft.rarity === 'legendary' ? 'text-yellow-400' :
                        nft.rarity === 'epic' ? 'text-purple-400' :
                        nft.rarity === 'rare' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {nft.rarity || 'Common'}
                      </span>
                      <span className="text-[9px] text-white/60">
                        {nft.collection || 'Cómplices'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Sparkles className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-white/60 mb-2">
                {isDemoMode
                  ? "En modo demo no se muestran NFTs reales. Usa una cuenta real para ver tu colección."
                  : "Aún no tienes NFTs en tu wallet conectada."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Explorar Colecciones
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Galerías NFT-Verificadas */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            🎨 Galerías NFT-Verificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
              <p className="text-sm text-white mb-2">
                💡 <strong>¿Qué son los NFTs?</strong>
              </p>
              <p className="text-sm text-white/90 break-words">
                Convierte tus galerías en NFTs verificados usando tokens GTK.
                Verifica la autenticidad de tus fotos en blockchain y aumenta el
                valor de tu perfil.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-xs text-white/70 mb-1">
                  Costo Galería (referencial Beta)
                </div>
                <div className="text-lg font-semibold text-white">
                  1,000 GTK
                </div>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-xs text-white/70 mb-1">
                  Costo Imagen (referencial Beta)
                </div>
                <div className="text-lg font-semibold text-white">100 GTK</div>
              </div>
            </div>

            <div className="text-xs text-white/60 text-center">
              ⚠️ Los NFTs se activarán en blockchain en Q2 2026. Actualmente en
              preparación.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transacciones recientes */}
      {transactions.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5" />
              📋 Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 bg-white/20 backdrop-blur-sm rounded border border-white/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {tx.description}
                    </p>
                    <p className="text-sm text-white/70 truncate">
                      {new Date(tx.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount} {tx.token_type}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      Balance: {tx.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Token Chat */}
      <TokenAiChat />

      {/* Botón de actualizar */}
      <div className="text-center">
        <Button
          onClick={refreshTokens}
          variant="outline"
          className="bg-white/5 backdrop-blur-xl text-white border border-white/25 hover:bg-white/10 shadow"
        >
          🔄 Actualizar Balance
        </Button>
      </div>
    </main>
  );
}
