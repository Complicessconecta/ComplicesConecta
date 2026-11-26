/**
 * Dashboard Interactivo de Tokens CMPX/GTK
 * Visualización amigable para usuarios Beta con gráficos y métricas
 */

import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { useTokens } from "@/hooks/useTokens";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { resolveCurrentDemoAccountType } from "@/lib/app-config";
import { getDemoWalletBalance, deriveDemoWalletView } from "@/lib/demo-wallet";
import { ANONYMOUS_WALLET_BLOCKED_REASON, isViewerAnonymous } from "@/lib/anonymous";
import { isAnonymousDemoProfile } from "@/lib/demo-registration";
import { DEFAULT_DEMO_NFTS } from "@/services/payments/NFTService";
import {
  Coins,
  TrendingUp,
  Lock,
  Gift,
  Users,
  Calendar,
  Sparkles,
  Check,
  Copy,
} from "lucide-react";
import { TokenAiChat } from "@/components/tokens/TokenAiChat";

// Imágenes de NFTs mock para modo demo
const MOCK_NFT_IMAGES = [
  "/assets/nfts/imagen1.jpg",
  "/assets/nfts/imagen2.jpg",
  "/assets/nfts/imagen3.jpg",
  "/assets/nfts/imagen4.gif",
];

// Datos mock para modo demo: SOLO transacciones (historial de ejemplo).
// El BALANCE ya no vive aquí: el MOCK 5000/2500 con 2000 en staking era
// el que mostraba el hero "7000 CMPX" cuando el hook aún no cargaba.
// Ahora el balance sale del hook (useTokens, fuente @/lib/demo-wallet)
// y el fallback es el canónico por tipo de cuenta (ver demoBalance).
// Los NFTs demo tampoco viven aquí: son DEFAULT_DEMO_NFTS (la misma
// fuente que NFTService.getUserNFTs y DemoWallet, punto 12).
const MOCK_DEMO_TRANSACTIONS = [
  {
    id: 1,
    description: "Minteo NFT #1",
    amount: -1000,
    type: "nft_mint",
    token_type: "cmpx",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    description: "Recompensa diaria",
    amount: 50,
    type: "reward",
    token_type: "cmpx",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    description: "Staking CMPX",
    amount: -2000,
    type: "stake",
    token_type: "cmpx",
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    description: "Recompensa referido",
    amount: 100,
    type: "referral",
    token_type: "cmpx",
    created_at: new Date().toISOString(),
  },
];

/** NFTs demo canónicos (DEFAULT_DEMO_NFTS) en la forma de esta vista. */
const DEMO_NFTS = DEFAULT_DEMO_NFTS.map((nft, index) => ({
  id: nft.id,
  token_id: index + 1,
  name: nft.name,
  image: nft.image,
  rarity: nft.rarity,
  value: nft.value,
  is_couple: nft.is_couple,
  collection: "CómplicesConecta Demo",
}));

/** Fecha de una transacción: usa created_at (forma real) o date (mock viejo). Nunca muestra "Invalid Date". */
function formatTxDate(tx: { created_at?: string; date?: string }): string {
  const raw = tx.created_at ?? tx.date;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-ES");
}

export interface TokenDashboardProps {
  initialBalance?: {
    cmpxBalance: number;
    gtkBalance: number;
    cmpxStaked: number;
    /** Disponibles = total − staking (si no viene, se deriva). */
    cmpxAvailable?: number;
    gtkStaked?: number;
    gtkAvailable?: number;
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
    isAnonymousWalletBlocked,
  } = useTokens();

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [referralCopied, setReferralCopied] = useState(false);

  // RONDA 10 (stream B, B3): el código de referido no tenía botón de
  // copiar en esta vista y el badge rebosaba la pastilla en ancho
  // estrecho. Copia al portapapeles con confirmación visual (✓).
  const copyReferralCode = async () => {
    if (!balance?.referralCode) return;
    try {
      await navigator.clipboard.writeText(balance.referralCode);
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 2000);
      toast({
        title: "Código copiado",
        description: "Código de referido copiado al portapapeles",
      });
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copia el código manualmente",
        variant: "destructive",
      });
    }
  };

  // Reclamar 100 CMPX: el hook ya acredita el saldo; aquí se confirma
  // con toast (antes el botón no daba ninguna señal).

  // En demo el balance debe ser el canónico por tipo de cuenta (useTokens:
  // single 1250/850, pareja 2000/1500), no el MOCK estático 5000/2500, para
  // que Tokens muestre lo mismo que el perfil. Si el hook aún no cargó
  // (balance 0), el fallback es el canónico derivado de la cuenta demo
  // (@/lib/demo-wallet) — nunca el MOCK, que era el hero "7000 CMPX".
  //
  // Ronda 9, stream D: el tipo se resuelve desde el PERFIL cargado,
  // luego el `user` y luego `demo_user`/`userType` de localStorage
  // (`resolveCurrentDemoAccountType`). Antes solo se miraba `user`,
  // que en la ruta de inicialización de `useAuth` es un mock sin
  // `accountType` ni `profile_type`: una pareja (canónica o creada
  // por registro `@demo.local`) resolvía como single y /tokens
  // mostraba la wallet de Sofía (test ronda 8: CMPX 1350 / GTK 850 /
  // 4 NFTs en sesión de pareja, en vez de 2000 / 1500 / 2).
  const demoAccountType =
    resolveCurrentDemoAccountType(profile, user) ?? "single";
  const canonicalFallback = (() => {
    const canonical = getDemoWalletBalance(demoAccountType);
    const view = deriveDemoWalletView(canonical.cmpx, canonical.gtk);
    return {
      ...view,
      referralCode: "DEMO2026",
      totalReferrals: 5,
    };
  })();
  const demoBalance =
    hookBalance && hookBalance.cmpxBalance > 0
      ? {
          ...canonicalFallback,
          cmpxBalance: hookBalance.cmpxBalance,
          gtkBalance: hookBalance.gtkBalance,
          cmpxStaked: hookBalance.cmpxStaked,
          gtkStaked: hookBalance.gtkStaked,
          cmpxAvailable: hookBalance.cmpxAvailable,
          gtkAvailable: hookBalance.gtkAvailable,
          monthlyEarned: hookBalance.monthlyEarned,
          monthlyRemaining: hookBalance.monthlyRemaining,
          monthlyLimit: hookBalance.monthlyLimit,
          referralCode: hookBalance.referralCode,
          totalReferrals: hookBalance.totalReferrals,
        }
      : canonicalFallback;
  // Use props if provided (demo mode), otherwise use hook data
  const balance = isDemoMode ? demoBalance : initialBalance || hookBalance;
  const transactions = isDemoMode
    ? MOCK_DEMO_TRANSACTIONS
    : initialTransactions || hookTransactions;
  // En demo la pareja muestra solo sus NFTs de pareja (2, igual que su
  // perfil: is_couple), el single muestra los 4 (igual que su perfil).
  // Si la página ya cargó la colección real del usuario (prop `nfts`,
  // misma fuente getUserNFTs que el perfil), esa manda: tras mintear,
  // /tokens muestra la colección minteada, no los 4 de ejemplo.
  const demoNftsFromProp = nfts.length > 0 ? nfts : DEMO_NFTS;
  const displayNfts = isDemoMode
    ? demoAccountType === "couple"
      ? demoNftsFromProp.filter((n) => n.is_couple)
      : demoNftsFromProp
    : nfts;
  const loading = !isDemoMode && !initialBalance && hookLoading;

  if (loading) {
    return (
      <main role="main" className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-white/90">🪙 Cargando tu balance...</p>
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
        <p className="text-slate-900 dark:text-white">{error}</p>
        <Button
          onClick={refreshTokens}
          className="mt-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/30"
          size="sm"
        >
          Reintentar
        </Button>
      </main>
    );
  }

  // Ronda 10 (stream A, punto A3): la cuenta ANÓNIMA no tiene
  // billetera. Sin este retorno, /tokens mostraba la cartera
  // COMPLETA de Sofía (CMPX 1450, GTK 850, 4 NFTs, "Reclamar 100
  // CMPX", staking, referidos): el hook devolvía el saldo canónico
  // single, el `canonicalFallback` de abajo lo reponía cuando el
  // hook era 0, y `demoNftsFromProp` caía a los 4 NFTs demo. El
  // estado bloqueado no muestra saldos, ni reclamar, ni staking, ni
  // referidos, ni NFTs.
  const isAnonymousWallet =
    isAnonymousWalletBlocked === true ||
    isAnonymousDemoProfile(profile) ||
    // La heurística no se aplica al `user` pelado (sin tipo ni
    // datos, p. ej. una pareja @demo.local): sin tipo no se
    // distingue de un anónimo legado. `isViewerAnonymous` lee el
    // registro local y `demo_user`, señales fiables.
    (user?.id ? isViewerAnonymous(user.id) : false);
  if (isAnonymousWallet) {
    return (
      <main role="main" className="space-y-6 p-4 md:p-8">
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-6 md:p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <Lock className="h-6 w-6 text-amber-300" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Billetera desactivada en cuentas anónimas
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-white/80">
            {ANONYMOUS_WALLET_BLOCKED_REASON}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-white/70">
            Sin saldos, sin recompensas, sin staking y sin referidos
            hasta verificarte.
          </p>
          <Button
            onClick={() => navigate("/edit-profile-single")}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Completar mi perfil para verificarme
          </Button>
        </div>
      </main>
    );
  }

  if (!balance) {
    return (
      <main
        role="main"
        className="p-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-300/30 rounded-lg"
      >
        <p className="text-slate-900 dark:text-white">No se pudo cargar el balance</p>
      </main>
    );
  }

  // El total poseído ES cmpxBalance; el staking es una parte de él, no
  // un sumando (antes: total = disponible + staking → 1250 + 375 = 1625,
  // y tras reclamar 100 CMPX: 1350 + 405 = 1755). "Disponibles" es
  // total − staking.
  const totalCMPX = balance.cmpxBalance;
  const availableCMPX =
    balance.cmpxAvailable ?? balance.cmpxBalance - balance.cmpxStaked;
  const availablePercentage =
    totalCMPX > 0 ? (availableCMPX / totalCMPX) * 100 : 0;
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
      <div className="relative overflow-hidden text-center bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-purple-600/40 to-blue-600/40" />
        <div className="relative z-10">
          {/* RONDA 11 (stream B, B1): la pastilla era `absolute top-2
              right-2` y en ancho estrecho tapaba el título ("e de" de
              "Balance"). Ahora va en flujo, arriba a la derecha, y el
              título queda siempre libre. */}
          {isDemoMode && (
            <div className="flex justify-end mb-1">
              <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-200 text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/30">
                SIMULACIÓN
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
            🪙 Tu Balance de Tokens
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <p className="text-slate-600 dark:text-white/80">CMPX Total</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalCMPX}</p>
              <p className="text-xs text-slate-500 dark:text-white/60">
                {availableCMPX} disponibles + {balance.cmpxStaked} en staking
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-white/80">GTK</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {balance.gtkBalance}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de CMPX */}
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
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
                <span className="text-slate-700 dark:text-white/90 truncate">
                  Disponibles: {availableCMPX} CMPX
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-700 dark:text-white/90 truncate">
                  En Staking: {balance.cmpxStaked} CMPX
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Límite mensual */}
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Calendar className="h-5 w-5" />
            Límite Mensual Beta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-white/90 truncate">Ganados este mes:</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {balance.monthlyEarned} CMPX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-white/90 truncate">Restantes:</span>
              <span className="font-semibold text-green-400 truncate">
                {balance.monthlyRemaining} CMPX
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/20 rounded-full h-2">
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
            <p className="text-xs text-slate-500 dark:text-white/70 wrap-break-word">
              En fase beta cada usuario puede ganar máximo{" "}
              {balance.monthlyLimit} CMPX al mes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recompensas disponibles */}
      {(isWorldIdEligible || hasPendingRewards) && (
        <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-green-400/40 shadow-xl rounded-2xl">
          <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Gift className="h-5 w-5" />
            🎁 Recompensas Disponibles
          </CardTitle>
        </CardHeader>
          <CardContent className="space-y-3 p-6 md:p-8">
            {isWorldIdEligible && (
              // Punto 14c (ronda 7): la fila era `flex ... justify-between`
              // sin wrap, con el botón `shrink-0` ("Reclamar 100 CMPX"):
              // en cuanto la tarjeta se estrecha, el botón se queda con
              // su ancho y el texto se comprime hasta una palabra por
              // línea. Ahora apila en móvil (texto a ancho completo y
              // botón abajo) y solo es fila a partir de sm.
              <div className="flex flex-col gap-3 p-3 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    🌍 World ID Verificado
                  </p>
                  <p className="text-sm text-slate-600 dark:text-white/80 wrap-break-word">
                    Reclama 100 CMPX por verificar tu identidad
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    const ok = await claimWorldIdReward();
                    toast({
                      title: ok
                        ? "¡100 CMPX reclamados!"
                        : "No se pudo reclamar",
                      description: ok
                        ? "La recompensa de World ID se acreditó a tu balance"
                        : "Inténtalo de nuevo más tarde",
                      variant: ok ? "default" : "destructive",
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white w-full shrink-0 sm:ml-2 sm:w-auto"
                >
                  Reclamar 100 CMPX
                </Button>
              </div>
            )}

            {pendingRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {reward.amount} {reward.token_type}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-white/80 truncate">
                    Balance: {reward.amount}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/80 text-white ml-2 shrink-0"
                >
                  Pendiente
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Staking */}
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Lock className="h-5 w-5" />
            🔒 Staking (Alcancía Especial)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
              <p className="text-sm text-slate-900 dark:text-white mb-2">
                💡 <strong>¿Qué es staking?</strong>
              </p>
              <p className="text-sm text-slate-600 dark:text-white/90 wrap-break-word">
                Guardas tus CMPX por 30 días y recibes +10% de recompensa.
                Ejemplo: 100 CMPX → 110 CMPX después de 30 días.
              </p>
            </div>

            {stakingRecords && stakingRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white">Tus Stakings:</h4>
                {stakingRecords.map((staking) => (
                  <div
                    key={staking.id}
                    className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {staking.amount} CMPX
                      </p>
                      <p className="text-sm text-slate-600 dark:text-white/80 wrap-break-word">
                        {staking.status === "active"
                          ? `${Math.ceil((new Date(staking.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días restantes`
                          : `Completado (+${Math.round((staking.amount * staking.apy) / 100)} CMPX)`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
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
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="h-5 w-5" />
            👥 Sistema de Referidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-3">
            {/* RONDA 11 (stream B, B1): la ronda 10 dejó la pastilla
                con `max-w-[180px] truncate` y la etiqueta con `truncate`:
                el código UUID (`REF` + uuid) se cortaba ("REF609dcb3b-…")
                y la etiqueta también ("Tu c…"). Ahora la fila envuelve,
                la etiqueta nunca se trunca y la pastilla muestra el
                código COMPLETO (envuelve a 2 líneas solo si el ancho no
                da); el botón copiar sigue intacto. */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <span className="text-slate-700 dark:text-white/90 shrink-0">
                Tu código de referido:
              </span>
              <span className="flex items-center gap-1 min-w-0 flex-1">
                <Badge
                  variant="outline"
                  title={balance.referralCode}
                  className="font-mono bg-slate-100 text-slate-900 border-slate-300 dark:bg-white/20 dark:text-white dark:border-white/30 min-w-0 max-w-full wrap-break-word whitespace-normal text-left"
                >
                  {balance.referralCode}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyReferralCode}
                  aria-label="Copiar código de referido"
                  title="Copiar código de referido"
                  className="shrink-0 h-7 w-7 p-0 text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10"
                >
                  {referralCopied ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-white/90 truncate">
                Referidos exitosos:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white shrink-0 ml-2">
                {balance.totalReferrals}
              </span>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30">
              <p className="text-sm text-slate-700 dark:text-white wrap-break-word">
                💰 <strong>Gana 50 CMPX</strong> por cada amigo que invites y se
                registre. Tu amigo también recibe{" "}
                <strong>50 CMPX de bienvenida</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mis NFTs (Wallet) */}
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Mis NFTs (Wallet)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-sm text-slate-500 dark:text-white/70 mb-4">
            {isDemoMode
              ? "Vista de ejemplo de cómo se verán tus galerías NFT verificadas cuando conectes tu wallet real."
              : "Estos son algunos de los NFTs y galerías verificadas asociados a tu wallet en ComplicesConecta."}
          </p>

          {/* Estado de cuenta NFT */}
          <div className="flex items-center justify-between gap-2 mb-4 text-xs text-slate-500 dark:text-white/70 min-w-0">
            <span className="truncate">
              NFTs en esta wallet:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{displayNfts.length}</span>
            </span>
            <span className="truncate text-right shrink-0">
              {/* Ronda 8, punto 7: "Galerías NFT verificadas: 4/4" junto a
                "NFTs en esta wallet: 1" se contradecía porque el 4/4 no
                contaba NFTs de la wallet: son las 4 galerías de EJEMPLO
                verificadas (DEFAULT_DEMO_NFTS), no la colección del
                usuario. La etiqueta ahora dice lo que cuenta. */}
              Galerías NFT de ejemplo:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {isDemoMode ? DEMO_NFTS.length : "próximamente"}
              </span>
            </span>
          </div>

          {displayNfts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
              {displayNfts.slice(0, 4).map((nft, index) => (
                <div
                  key={nft.id || index}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20 min-w-0"
                >
                  <img
                    src={
                      nft.image ||
                      nft.image_url ||
                      MOCK_NFT_IMAGES[index % MOCK_NFT_IMAGES.length] ||
                      MOCK_NFT_IMAGES[0]
                    }
                    alt={nft.name || "NFT"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = MOCK_NFT_IMAGES[0] || "";
                    }}
                  />
                  {/* Badges */}
                  {/*
                    Ronda 11 (stream D, punto v): la píldora CMPX estaba
                    arriba a la izquierda y tapaba el texto
                    "Cómplices Conecta" del arte del NFT. Baja a la
                    esquina inferior con un degradado para que siga
                    legible sin tapar el arte.
                  */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md rounded px-2 py-0.5 border border-white/20">
                    <span className="text-[10px] text-white font-semibold">
                      {nft.value ? `${nft.value} CMPX` : ""}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
                    <span className="text-[10px] text-white font-mono">
                      #{nft.token_id || index + 1}
                    </span>
                  </div>
                  {/* Hover info */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-white font-bold text-sm truncate">
                      {nft.name || "NFT Item"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-[10px] capitalize ${
                          nft.rarity === "legendary"
                            ? "text-yellow-400"
                            : nft.rarity === "epic"
                              ? "text-purple-400"
                              : nft.rarity === "rare"
                                ? "text-blue-400"
                                : "text-gray-400"
                        }`}
                      >
                        {nft.rarity || "Common"}
                      </span>
                      <span className="text-[9px] text-white/60">
                        {nft.collection || "Cómplices"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                <Sparkles className="h-8 w-8 text-slate-300 dark:text-white/20" />
              </div>
              <p className="text-slate-500 dark:text-white/60 mb-2">
                {isDemoMode
                  ? "En modo demo no se muestran NFTs reales. Usa una cuenta real para ver tu colección."
                  : "Aún no tienes NFTs en tu wallet conectada."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Explorar Colecciones
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Galerías NFT-Verificadas */}
      <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="h-5 w-5" />
            🎨 Galerías NFT-Verificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-4">
            <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
              <p className="text-sm text-slate-900 dark:text-white mb-2">
                💡 <strong>¿Qué son los NFTs?</strong>
              </p>
              <p className="text-sm text-slate-600 dark:text-white/90 wrap-break-word">
                Convierte tus galerías en NFTs verificados usando tokens GTK.
                Verifica la autenticidad de tus fotos en blockchain y aumenta el
                valor de tu perfil.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/30">
                <div className="text-xs text-slate-500 dark:text-white/70 mb-1">
                  Costo Galería (referencial Beta)
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  1,000 GTK
                </div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/30">
                <div className="text-xs text-slate-500 dark:text-white/70 mb-1">
                  Costo Imagen (referencial Beta)
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">100 GTK</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-white/60 text-center">
              ⚠️ Los NFTs se activarán en blockchain en Q2 2026. Actualmente en
              preparación.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transacciones recientes */}
      {transactions.length > 0 && (
        <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Coins className="h-5 w-5" />
              📋 Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 bg-slate-100 dark:bg-white/20 backdrop-blur-sm rounded border border-slate-300 dark:border-white/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-white/70 truncate">
                      {formatTxDate(tx)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p
                      className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount} {tx.token_type}
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
          className="bg-white dark:bg-white/5 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-300 dark:border-white/25 hover:bg-slate-50 dark:hover:bg-white/10 shadow"
        >
          🔄 Actualizar Balance
        </Button>
      </div>
    </main>
  );
}
