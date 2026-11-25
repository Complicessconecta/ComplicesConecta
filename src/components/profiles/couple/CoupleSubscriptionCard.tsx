import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Crown, Coins, Wallet } from "lucide-react";

interface CoupleSubscriptionCardProps {
  isPremium: boolean;
  isDemoMode?: boolean;
  validUntil?: string | null;
  cmpx?: string | null;
  gtk?: string | null;
  nftCount?: number;
  isOwnProfile: boolean;
  onManage?: () => void;
}

/**
 * Suscripción y saldo de la pareja (modelo del video: "Premium hasta…" y
 * "Tu saldo"). El plan sale del perfil (is_premium); la vigencia no tiene
 * fuente de datos en la página, así que fuera de demo no se inventa fecha.
 * El saldo en demo usa los valores de DemoWallet (CMPX 1,250 / GTK 500);
 * fuera de demo usa los saldos reales que ya carga la página. El saldo
 * solo se muestra al perfil propio.
 */
export const CoupleSubscriptionCard: React.FC<
  CoupleSubscriptionCardProps
> = ({
  isPremium,
  isDemoMode = false,
  validUntil,
  cmpx,
  gtk,
  nftCount,
  isOwnProfile,
  onManage,
}) => {
  const planLabel = isPremium || isDemoMode ? "Premium" : "Gratuito";
  const validityLabel =
    validUntil ?? (isDemoMode ? "Demo" : "Sin fecha registrada");

  return (
    <Card className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Suscripción
          {isDemoMode && (
            <Badge className="bg-yellow-500/20 text-yellow-800 border-yellow-500/40 dark:text-yellow-300 dark:border-yellow-400/30 text-xs">
              DEMO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              planLabel === "Premium"
                ? "bg-yellow-500/20 text-yellow-800 border-yellow-500/40 dark:text-yellow-200 dark:border-yellow-400/40"
                : "bg-slate-900/5 text-slate-600 border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/20"
            }
          >
            {planLabel}
          </Badge>
          <span className="text-sm text-slate-500 dark:text-white/70">
            Válido hasta:{" "}
            <span className="text-slate-900 dark:text-white font-medium">{validityLabel}</span>
          </span>
        </div>

        {isOwnProfile && (cmpx !== undefined || gtk !== undefined) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cmpx !== undefined && (
              <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">CMPX</span>
                </div>
                <div className="text-lg font-bold">
                  {Number(cmpx).toLocaleString("es-MX")}
                </div>
                <div className="text-xs text-slate-500 dark:text-white/70">Saldo</div>
              </div>
            )}

            {gtk !== undefined && (
              <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-sm font-medium">GTK</span>
                </div>
                <div className="text-lg font-bold">
                  {Number(gtk).toLocaleString("es-MX")}
                </div>
                <div className="text-xs text-slate-500 dark:text-white/70">Saldo</div>
              </div>
            )}

            {typeof nftCount === "number" && (
              <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">NFTs</span>
                </div>
                <div className="text-lg font-bold">{nftCount}</div>
                <div className="text-xs text-slate-500 dark:text-white/70">Colección</div>
              </div>
            )}
          </div>
        )}

        {isOwnProfile && onManage && (
          <Button
            onClick={onManage}
            className="bg-linear-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-700 hover:to-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg shadow-fuchsia-500/40 flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Gestionar suscripción
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CoupleSubscriptionCard;
