import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";

export interface CouplePrivacySettings {
  invisible: boolean;
  allowUnverified: boolean;
  showRegion: boolean;
  friendsListVisible: boolean;
  birthdayCake: boolean;
  zodiacVisible: boolean;
  watermark: boolean;
  limitMessages: boolean;
  videoChat: boolean;
}

const DEFAULT_PRIVACY: CouplePrivacySettings = {
  invisible: false,
  allowUnverified: true,
  showRegion: true,
  friendsListVisible: true,
  birthdayCake: true,
  zodiacVisible: true,
  watermark: false,
  limitMessages: false,
  videoChat: true,
};

const ROWS: Array<{
  key: keyof CouplePrivacySettings;
  label: string;
  description: string;
}> = [
  {
    key: "invisible",
    label: "Modo invisible",
    description: "No apareces en las búsquedas ni en las visitas recientes.",
  },
  {
    key: "allowUnverified",
    label: "Acceso a perfiles sin verificar",
    description: "Permitir que perfiles sin verificar vean este perfil.",
  },
  {
    key: "showRegion",
    label: "Mostrar región",
    description: "Mostrar tu región en el perfil público.",
  },
  {
    key: "friendsListVisible",
    label: "Lista de amigos visible",
    description: "Tu lista de amigos es visible para todos.",
  },
  {
    key: "birthdayCake",
    label: "Pastel de cumpleaños",
    description: "Mostrar el pastel de cumpleaños en tu perfil.",
  },
  {
    key: "zodiacVisible",
    label: "Signo zodiacal",
    description: "Mostrar tu signo zodiacal en el perfil.",
  },
  {
    key: "watermark",
    label: "Marca de agua",
    description: "Añadir marca de agua a tus fotos.",
  },
  {
    key: "limitMessages",
    label: "Limitar el envío de mensajes",
    description: "Solo contactos verificados pueden escribirte.",
  },
  {
    key: "videoChat",
    label: "Chat de video",
    description: "Permitir videollamadas con tus matches.",
  },
];

interface CouplePrivacySectionProps {
  userId: string;
}

/**
 * Ajustes de privacidad del perfil de pareja (modelo del video).
 * SOLO perfil propio: el padre no la renderiza para visitantes.
 *
 * PENDIENTE DE BACKEND: no existe un store de ajustes de privacidad; la
 * columna profiles.privacy_settings (Json) existe en la BD pero la vista
 * del perfil no la expone. Por ahora los ajustes se guardan en
 * localStorage por dispositivo (clave `couple_privacy:<userId>`), igual
 * que el PIN. Cuando el backend exponga privacy_settings, este componente
 * debe leer/escribir ahí en vez de localStorage.
 */
export const CouplePrivacySection: React.FC<CouplePrivacySectionProps> = ({
  userId,
}) => {
  const [settings, setSettings] =
    useState<CouplePrivacySettings>(DEFAULT_PRIVACY);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = window.localStorage.getItem(`couple_privacy:${userId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CouplePrivacySettings>;
      setSettings({ ...DEFAULT_PRIVACY, ...parsed });
    } catch {
      // localStorage corrupto o no disponible: se queda el default.
    }
  }, [userId]);

  if (!userId) return null;

  const toggle = (key: keyof CouplePrivacySettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(
          `couple_privacy:${userId}`,
          JSON.stringify(next),
        );
      } catch {
        // Sin almacenamiento: el cambio solo vive en esta sesión.
      }
      return next;
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Privacidad
        </CardTitle>
        <p className="text-xs text-white/60 mt-1">
          Solo tú ves estos ajustes. Se guardan en este dispositivo; la
          sincronización con tu cuenta está pendiente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{row.label}</p>
              <p className="text-xs text-white/60">{row.description}</p>
            </div>
            <Switch
              id={`couple-privacy-${row.key}`}
              checked={settings[row.key]}
              onCheckedChange={() => toggle(row.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CouplePrivacySection;
