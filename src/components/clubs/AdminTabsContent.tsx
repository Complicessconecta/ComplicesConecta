import { useMemo, useState } from "react";
import { QrCode, Calculator, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { QRScanner } from "@/components/reservations/QRScanner";
import { reservationService } from "@/services/reservations/ReservationService";
import { useToast } from "@/hooks/useToast";

export type ClubMembershipTier = "free" | "premium";
export type AdminTabKey = "economy" | "access_qr" | "demo";

export interface AdminClubData {
  membership_tier: ClubMembershipTier;
  live_status: string;
  cmpx_balance: string;
}

export interface AdminTabsContentProps {
  tab: AdminTabKey;
  clubData: AdminClubData;
  setClubData: React.Dispatch<React.SetStateAction<AdminClubData>>;
}

export const AdminTabsContent = <T extends AdminClubData>({
  tab,
  clubData,
  setClubData,
}: {
  tab: AdminTabKey;
  clubData: T;
  setClubData: React.Dispatch<React.SetStateAction<T>>;
}) => {
  const { toast } = useToast();

  const [priceInput, setPriceInput] = useState<number>(50);
  const [qrHashInput, setQrHashInput] = useState<string>("");
  const [qrValidating, setQrValidating] = useState(false);

  const cmpxBalance = useMemo(
    () => Number(clubData.cmpx_balance) || 0,
    [clubData.cmpx_balance],
  );

  const commissionRate = clubData.membership_tier === "free" ? 0.2 : 0;
  const platformTake = priceInput * commissionRate;
  const clubTake = priceInput - platformTake;

  const validateQrHash = async () => {
    const value = qrHashInput.trim();
    if (!value) {
      toast({
        title: "QR inválido",
        description: "Ingresa un hash QR para validar.",
        variant: "destructive",
      });
      return;
    }

    setQrValidating(true);
    try {
      const validation = await reservationService.validateQRForCheckIn(value);

      if (!validation.valid || !validation.reservation) {
        toast({
          title: "QR inválido ❌",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }

      await reservationService.markReservationAsUsed(validation.reservation.id);
      toast({
        title: "Acceso Concedido ✅",
        description:
          "Reserva marcada como usada. Safe Arrival y analytics se disparan en el flujo completo.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al validar QR",
        variant: "destructive",
      });
    } finally {
      setQrValidating(false);
    }
  };

  if (tab === "economy") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-purple-400" /> Simulador de Ganancias
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-white/50">PRECIO DE ENTRADA (USD)</Label>
                <Input
                  type="number"
                  value={String(priceInput)}
                  onChange={(e) => setPriceInput(Number(e.target.value))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="flex justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <span className="text-white/70">Tu Ganancia ({clubData.membership_tier}):</span>
                <span className="text-green-400 font-bold">${clubTake.toFixed(2)}</span>
              </div>

              {clubData.membership_tier === "free" && (
                <p className="text-[10px] text-orange-400/80 italic">
                  * Estás en Plan Free. La plataforma retiene un 20% ($ {platformTake.toFixed(2)}).
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-400" /> Ajustes Económicos
            </h3>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={clubData.membership_tier === "free" ? "default" : "outline"}
                  onClick={() =>
                    setClubData((prev) => ({ ...prev, membership_tier: "free" }))
                  }
                  className={
                    clubData.membership_tier === "free"
                      ? "bg-yellow-500 text-black"
                      : "border-white/20 text-white"
                  }
                >
                  Free (20%)
                </Button>
                <Button
                  type="button"
                  variant={clubData.membership_tier === "premium" ? "default" : "outline"}
                  onClick={() =>
                    setClubData((prev) => ({ ...prev, membership_tier: "premium" }))
                  }
                  className={
                    clubData.membership_tier === "premium"
                      ? "bg-yellow-500 text-black"
                      : "border-white/20 text-white"
                  }
                >
                  Premium (0%)
                </Button>
              </div>

              <div>
                <Label className="text-xs text-white/50">CMPX BALANCE</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={clubData.cmpx_balance}
                    onChange={(e) =>
                      setClubData((prev) => ({
                        ...prev,
                        cmpx_balance: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    {cmpxBalance.toFixed(0)}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-white/60">
                Multiplicador dinámico:
                <span className="ml-1 font-semibold text-white">
                  {clubData.membership_tier === "free" ? "0.8" : "1.0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "access_qr") {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="h-6 w-6 text-purple-400" />
            <div>
              <h3 className="text-white font-bold">Validación de Acceso</h3>
              <p className="text-white/60 text-sm">
                Escanea el código del cliente para check-in y Safe Arrival.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-white">QR Hash</Label>
              <Input
                value={qrHashInput}
                onChange={(e) => setQrHashInput(e.target.value)}
                placeholder="QR-..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button
              type="button"
              onClick={validateQrHash}
              disabled={qrValidating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {qrValidating ? "Validando..." : "Validar"}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-green-400/60">
            <ShieldCheck className="h-3 w-3" /> Protocolo Safe Arrival Activo
          </div>
        </div>

        <QRScanner
          onScanSuccess={() => {
            toast({
              title: "Acceso Concedido ✅",
              description:
                "Reserva marcada como usada. Safe Arrival y analytics se disparan en el flujo completo.",
            });
          }}
          onScanError={(message) => {
            toast({
              title: "QR inválido ❌",
              description: message,
              variant: "destructive",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <h3 className="text-white font-bold flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-400" /> Simulador Demo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/70 text-sm font-semibold mb-1">Estado actual</p>
            <p className="text-white">{clubData.live_status}</p>
            <p className="text-white/50 text-xs mt-2">tier: {clubData.membership_tier}</p>
            <p className="text-white/50 text-xs">cmpx_balance: {cmpxBalance.toFixed(2)}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/70 text-sm font-semibold mb-1">Simulación rápida (USD)</p>
            <Input
              type="number"
              value={String(priceInput)}
              onChange={(e) => setPriceInput(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white"
            />
            <div className="mt-3 text-xs text-white/70">
              App fee:
              <span className="ml-1 text-red-300 font-semibold">-${platformTake.toFixed(2)}</span>
              <span className="mx-2 text-white/40">·</span>
              Club net:
              <span className="ml-1 text-green-300 font-semibold">${clubTake.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
