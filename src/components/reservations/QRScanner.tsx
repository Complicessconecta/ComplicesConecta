// Componente de escáner QR para validación en puerta
// Fase 5: Sistema de Reservas con QR

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { CheckCircle, XCircle, Loader2, User, Crown, Star, Smartphone } from 'lucide-react';
import { reservationService } from '@/services/reservations/ReservationService';

interface QRScannerProps {
  onScanSuccess?: (reservation: any) => void;
  onScanError?: (message: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
    membershipLevel?: string;
  } | null>(null);

  const handleScan = async () => {
    try {
      setScanning(true);
      setScanResult(null);

      // Simular escaneo (en producción, usar cámara real)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simular QR hash (en producción, usar valor real del QR escaneado)
      const mockQRHash = `QR-DEMO-${Date.now()}`;

      // Validar QR
      const validation = await reservationService.validateQRForCheckIn(mockQRHash);

      if (validation.valid && validation.reservation) {
        // Marcar reserva como usada
        await reservationService.markReservationAsUsed(validation.reservation.id);

        setScanResult({
          success: true,
          message: '✅ Acceso Concedido',
          userName: 'Usuario Demo',
          membershipLevel: 'VIP',
        });

        if (onScanSuccess) {
          onScanSuccess(validation.reservation);
        }
      } else {
        setScanResult({
          success: false,
          message: validation.message,
        });

        if (onScanError) {
          onScanError(validation.message);
        }
      }

      setQrScanned(true);

      // Resetear después de 3 segundos
      setTimeout(() => {
        setQrScanned(false);
        setScanResult(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al escanear QR';
      setScanResult({
        success: false,
        message: errorMessage,
      });

      if (onScanError) {
        onScanError(errorMessage);
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">📷 Escáner QR (Validación en Puerta)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock de Cámara */}
        <div className="relative bg-black/30 rounded-lg border-2 border-dashed border-white/20 p-8">
          {scanning ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-16 w-16 text-white animate-spin" />
              <p className="text-white/60">Escaneando QR...</p>
              <div className="w-48 h-48 border-4 border-white/30 rounded-lg animate-pulse" />
            </div>
          ) : qrScanned && scanResult ? (
            <div className="space-y-4">
              {scanResult.success ? (
                <>
                  {/* Ficha del Cliente */}
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                      <div>
                        <p className="text-green-400 font-bold text-xl">✅ Acceso Concedido</p>
                        <p className="text-white/60 text-sm">Usuario Verificado</p>
                      </div>
                    </div>

                    {/* Información del Cliente */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white font-medium">{scanResult.userName}</span>
                      </div>
                      {scanResult.membershipLevel && (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-300 font-medium">{scanResult.membershipLevel}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white/60">Nivel 5 - Visitas Frecuentes</span>
                      </div>
                    </div>
                  </div>

                  {/* Notificación Safe Arrival */}
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-400" />
                      <p className="text-blue-300 text-xs">
                        📱 Notificación enviada a los contactos de seguridad: "Ha ingresado al club"
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-12 w-12 text-red-400" />
                    <div>
                      <p className="text-red-400 font-bold text-xl">❌ Acceso Denegado</p>
                      <p className="text-white/60 text-sm">{scanResult.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/60">Esperando QR para escanear...</p>
            </div>
          )}
        </div>

        {/* Botón de Simulación */}
        <Button onClick={handleScan} className="w-full" disabled={scanning}>
          {scanning ? 'Escaneando...' : '📷 Simular Escaneo'}
        </Button>
      </CardContent>
    </Card>
  );
}
