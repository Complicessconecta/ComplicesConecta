import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

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
  isDemoMode?: boolean;
}

/**
 * Ajustes de privacidad del perfil de pareja (modelo del video).
 * SOLO perfil propio: el padre no la renderiza para visitantes.
 *
 * En producción los ajustes viven en profiles.privacy_settings (Json):
 * se leen al montar y se guardan en la cuenta con cada cambio, mezclados
 * con las demás claves del JSON (p. ej. media_public) para no borrarlas.
 * En demo (o sin cliente Supabase) se usa localStorage por dispositivo
 * (clave `couple_privacy:<userId>`), igual que el PIN. Si la escritura
 * en la BD falla, el cambio se guarda en local como respaldo.
 */
export const CouplePrivacySection: React.FC<CouplePrivacySectionProps> = ({
  userId,
  isDemoMode = false,
}) => {
  const [settings, setSettings] =
    useState<CouplePrivacySettings>(DEFAULT_PRIVACY);
  // Claves del JSON que no gestiona esta sección (p. ej. media_public):
  // se conservan al guardar para no borrarlas.
  const storedExtras = useRef<Record<string, Json>>({});

  const saveToLocalStorage = (next: CouplePrivacySettings) => {
    try {
      window.localStorage.setItem(
        `couple_privacy:${userId}`,
        JSON.stringify(next),
      );
    } catch {
      // Sin almacenamiento: el cambio solo vive en esta sesión.
    }
  };

  useEffect(() => {
    if (!userId) return;
    const loadFromLocalStorage = () => {
      try {
        const raw = window.localStorage.getItem(`couple_privacy:${userId}`);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<CouplePrivacySettings>;
        setSettings({ ...DEFAULT_PRIVACY, ...parsed });
      } catch {
        // localStorage corrupto o no disponible: se queda el default.
      }
    };
    if (isDemoMode || !supabase) {
      loadFromLocalStorage();
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("privacy_settings")
          .eq("id", userId)
          .single();
        if (cancelled) return;
        const stored = data?.privacy_settings;
        if (
          error ||
          typeof stored !== "object" ||
          stored === null ||
          Array.isArray(stored)
        ) {
          loadFromLocalStorage();
          return;
        }
        const record = stored as Record<string, Json>;
        const extras: Record<string, Json> = {};
        const managed: Partial<CouplePrivacySettings> = {};
        Object.keys(record).forEach((key) => {
          if (
            key in DEFAULT_PRIVACY &&
            typeof record[key] === "boolean"
          ) {
            managed[key as keyof CouplePrivacySettings] =
              record[key] as boolean;
          } else {
            extras[key] = record[key];
          }
        });
        storedExtras.current = extras;
        setSettings({ ...DEFAULT_PRIVACY, ...managed });
      } catch (err) {
        logger.error("Error cargando privacy_settings:", {
          error: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) loadFromLocalStorage();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isDemoMode]);

  if (!userId) return null;

  const toggle = (key: keyof CouplePrivacySettings) => {
    const nextValue = !settings[key];
    const label = ROWS.find((row) => row.key === key)?.label ?? key;
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (isDemoMode || !supabase) {
        saveToLocalStorage(next);
        return next;
      }
      const merged: Record<string, Json> = {
        ...storedExtras.current,
        ...next,
      };
      void supabase
        .from("profiles")
        .update({ privacy_settings: merged })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            logger.error("Error guardando privacy_settings:", {
              error: error.message,
            });
            saveToLocalStorage(next);
          } else {
            storedExtras.current = merged;
          }
        });
      return next;
    });
    // Feedback inmediato: antes el cambio persistía pero sin ninguna
    // confirmación visible (full test 2026-11-24).
    toast.success(`${label}: ${nextValue ? "activado" : "desactivado"}`);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Privacidad
        </CardTitle>
        <p className="text-xs text-white/60 mt-1">
          Solo tú ves estos ajustes.{" "}
          {isDemoMode
            ? "En demo se guardan en este dispositivo."
            : "Se guardan en tu cuenta y se aplican en todos tus dispositivos."}
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
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  settings[row.key] ? "text-emerald-300" : "text-white/50"
                }`}
              >
                {settings[row.key] ? "Activado" : "Desactivado"}
              </span>
              <Switch
                id={`couple-privacy-${row.key}`}
                checked={settings[row.key]}
                onCheckedChange={() => toggle(row.key)}
                // Colores explícitos: el Switch compartido usa los tokens
                // primary/input/background, que en Tailwind v4 no resuelven
                // (canales HSL sin hsl()) y la perilla quedaba invisible y
                // sin moverse visualmente. Verde = on, gris = off, perilla
                // siempre blanca.
                className="shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/25 [&>span]:bg-white"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CouplePrivacySection;
