import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { notifyPrivacySettingsChanged } from "@/lib/visibility";
import {
  ZODIAC_SIGNS,
  formatZodiacSign,
  resolveZodiacSign,
} from "@/lib/zodiac";

/** Claves extra (no toggles) que viajan en el mismo privacy_settings. */
interface PrivacyExtras {
  birthDate: string;
  zodiacSign: string;
}

const EMPTY_EXTRAS: PrivacyExtras = { birthDate: "", zodiacSign: "" };

const WATERMARK_OFF_WARNING =
  "⚠️ Vas a quitar la marca de agua de tus fotos. Sin ella, tus imágenes no llevan protección y cualquiera puede reutilizarlas más fácil. Es bajo tu responsabilidad.";

export interface SinglePrivacySettings {
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

const DEFAULT_PRIVACY: SinglePrivacySettings = {
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
  key: keyof SinglePrivacySettings;
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

interface SinglePrivacySectionProps {
  userId: string;
  isDemoMode?: boolean;
}

/**
 * Ajustes de privacidad del perfil single (espejo de
 * CouplePrivacySection, modelo del video). SOLO perfil propio: el padre
 * no la renderiza para visitantes.
 *
 * En producción los ajustes viven en profiles.privacy_settings (Json):
 * se leen al montar y se guardan en la cuenta con cada cambio, mezclados
 * con las demás claves del JSON (p. ej. media_public) para no borrarlas.
 * En demo (o sin cliente Supabase) se usa localStorage por dispositivo
 * (clave `single_privacy:<userId>`), igual que el PIN. Si la escritura
 * en la BD falla, el cambio se guarda en local como respaldo.
 */
export const SinglePrivacySection: React.FC<SinglePrivacySectionProps> = ({
  userId,
  isDemoMode = false,
}) => {
  const [settings, setSettings] =
    useState<SinglePrivacySettings>(DEFAULT_PRIVACY);
  // Fecha de nacimiento y signo manual (claves extra del mismo JSON).
  const [extras, setExtras] = useState<PrivacyExtras>(EMPTY_EXTRAS);
  const derivedZodiac = resolveZodiacSign({
    birthDate: extras.birthDate || null,
    manualSign: extras.zodiacSign || null,
  });
  // Claves del JSON que no gestiona esta sección (p. ej. media_public):
  // se conservan al guardar para no borrarlas.
  const storedExtras = useRef<Record<string, Json>>({});

  const saveToLocalStorage = (
    next: SinglePrivacySettings,
    nextExtras: PrivacyExtras = extras,
  ) => {
    try {
      window.localStorage.setItem(
        `single_privacy:${userId}`,
        JSON.stringify({ ...next, ...nextExtras }),
      );
    } catch {
      // Sin almacenamiento: el cambio solo vive en esta sesión.
    }
  };

  /** Guarda toggles + extras juntos (local y, en real, Supabase). */
  const saveAll = (next: SinglePrivacySettings, nextExtras: PrivacyExtras) => {
    if (isDemoMode || !supabase) {
      saveToLocalStorage(next, nextExtras);
      return;
    }
    const merged: Record<string, Json> = {
      ...storedExtras.current,
      ...next,
      ...nextExtras,
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
          saveToLocalStorage(next, nextExtras);
        } else {
          storedExtras.current = merged;
        }
      });
  };

  const saveExtras = (nextExtras: PrivacyExtras) => {
    setExtras(nextExtras);
    saveAll(settings, nextExtras);
    notifyPrivacySettingsChanged(userId);
    toast.success("Signo zodiacal actualizado");
  };

  useEffect(() => {
    if (!userId) return;
    const loadFromLocalStorage = () => {
      try {
        const raw = window.localStorage.getItem(`single_privacy:${userId}`);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<SinglePrivacySettings> &
          Partial<PrivacyExtras>;
        setSettings({ ...DEFAULT_PRIVACY, ...parsed });
        setExtras({
          birthDate:
            typeof parsed.birthDate === "string" ? parsed.birthDate : "",
          zodiacSign:
            typeof parsed.zodiacSign === "string" ? parsed.zodiacSign : "",
        });
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
        const managed: Partial<SinglePrivacySettings> = {};
        Object.keys(record).forEach((key) => {
          if (key in DEFAULT_PRIVACY && typeof record[key] === "boolean") {
            managed[key as keyof SinglePrivacySettings] = record[
              key
            ] as boolean;
          } else {
            extras[key] = record[key] ?? null;
          }
        });
        storedExtras.current = extras;
        setSettings({ ...DEFAULT_PRIVACY, ...managed });
        setExtras({
          birthDate:
            typeof record.birthDate === "string" ? record.birthDate : "",
          zodiacSign:
            typeof record.zodiacSign === "string" ? record.zodiacSign : "",
        });
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

  const toggle = (key: keyof SinglePrivacySettings) => {
    const nextValue = !settings[key];
    const label = ROWS.find((row) => row.key === key)?.label ?? key;
    // Quitar la marca de agua es bajo responsabilidad del usuario: la
    // marca protege su privacidad en las fotos. Confirmar antes.
    if (key === "watermark" && settings.watermark && nextValue === false) {
      if (
        typeof window !== "undefined" &&
        !window.confirm(
          `${WATERMARK_OFF_WARNING}\n\n¿Quitar la marca de agua de todos modos?`,
        )
      ) {
        return;
      }
    }
    const next = { ...settings, [key]: nextValue };
    setSettings(next);
    saveAll(next, extras);
    notifyPrivacySettingsChanged(userId);
    // Feedback inmediato: antes el cambio persistía pero sin ninguna
    // confirmación visible (full test 2026-11-24).
    toast.success(`${label}: ${nextValue ? "activado" : "desactivado"}`);
    if (key === "watermark" && nextValue === false) {
      toast.warning(WATERMARK_OFF_WARNING);
    }
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
                id={`single-privacy-${row.key}`}
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
        {/* Aviso persistente mientras la marca de agua está apagada. */}
        {!settings.watermark && (
          <p className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            ⚠️ Marca de agua desactivada: tus fotos no llevan protección.
            Activarla ayuda a que nadie las reutilice como propias; si la dejas
            apagada es bajo tu responsabilidad.
          </p>
        )}
        {/* Signo zodiacal: se deriva de la fecha de nacimiento; el
            usuario puede elegirlo a mano sin compartir su fecha exacta.
            El interruptor "Signo zodiacal" de arriba controla si se
            muestra en el perfil público. */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-sm font-medium text-white">
            Signo zodiacal (tu fecha)
          </p>
          <p className="text-xs text-white/60">
            El registro solo pedía tu edad, por eso tu fecha de nacimiento no
            estaba guardada. Agrégala aquí para que tu signo se calcule solo, o
            elige el signo a mano.
          </p>
          <div>
            <label
              htmlFor="single-privacy-birthDate"
              className="mb-1 block text-xs text-white/70"
            >
              Fecha de nacimiento
            </label>
            <input
              id="single-privacy-birthDate"
              type="date"
              value={extras.birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                saveExtras({ ...extras, birthDate: e.target.value })
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
            />
          </div>
          <div>
            <label
              htmlFor="single-privacy-zodiacSign"
              className="mb-1 block text-xs text-white/70"
            >
              Signo (manual, opcional)
            </label>
            <select
              id="single-privacy-zodiacSign"
              value={extras.zodiacSign}
              onChange={(e) =>
                saveExtras({ ...extras, zodiacSign: e.target.value })
              }
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
            >
              <option value="">Automático (según fecha de nacimiento)</option>
              {ZODIAC_SIGNS.map((sign) => (
                <option key={sign.id} value={sign.id}>
                  {sign.symbol} {sign.name}
                </option>
              ))}
            </select>
          </div>
          {derivedZodiac.sign ? (
            <p className="text-xs text-emerald-300">
              Tu signo: {formatZodiacSign(derivedZodiac.sign)}{" "}
              {derivedZodiac.source === "birthdate"
                ? "(calculado de tu fecha de nacimiento)"
                : "(elegido a mano)"}
              {settings.zodiacVisible
                ? " — se muestra en tu perfil."
                : " — oculto en tu perfil (interruptor apagado)."}
            </p>
          ) : (
            <p className="text-xs text-white/50">
              Sin fecha ni signo manual no se puede mostrar tu signo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SinglePrivacySection;
