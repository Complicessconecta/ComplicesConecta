// Componente generador de códigos QR para reservas
// Fase 5: Sistema de Reservas con QR

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/cards/Card';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  qrHash: string;
  size?: number;
  title?: string;
}

export function QRCodeGenerator({ qrHash, size = 200, title }: QRCodeGeneratorProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(qrHash, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: size,
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [qrHash, size]);

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardContent className="p-6">
        {title && <p className="text-white font-bold mb-4">{title}</p>}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-2xl">
            {dataUrl ? (
              <img
                src={dataUrl}
                width={size}
                height={size}
                alt="QR de reservación"
                className="block"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-black/5 rounded-lg" />
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/80 text-sm">Presenta este código en la entrada</p>
            <p className="text-white/60 text-xs">Válido por 24 horas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
