/**
 * Ajustes sociales del perfil propio (puntos 3 y 4).
 *
 * - Visibilidad del perfil: Público (cualquiera ve el perfil) o
 *   Privado (solo amigos aceptados; los demás ven el aviso y deben
 *   enviar solicitud). Se guarda en `visibility` (migración
 *   20261124050000) con respaldo local.
 * - Geolocalización para matching: activar o desactivar que tu
 *   distancia aproximada se muestre a otros perfiles. Se guarda en
 *   `location_sharing_enabled` con respaldo local.
 *
 * Solo se muestra en el perfil propio. Las secciones de Privacidad
 * existentes (`SinglePrivacySection` / `CouplePrivacySection`) no se
 * tocan: este es el control social, junto a la sección de amistades.
 *
 * Ronda 11, stream C (iii): el select YA NO es un almacén propio.
 * Lee y escribe el estado UNIFICADO (`readUnifiedInvisible` /
 * `saveUnifiedInvisible` en `@/lib/visibility`), el mismo que el
 * toggle "Modo invisible" y que la píldora del encabezado: mover
 * cualquiera de los dos actualiza al otro en vivo (evento
 * `complices:privacy-changed`) y ambos escriben los dos almacenes
 * locales (`invisible` y `profile_visibility`), así que no pueden
 * discrepar. En real, además, se espeja `invisible` en
 * `privacy_settings` de la BD para que el toggle no discrepe tras
 * recargar.
 */
import { useEffect, useState } from "react";
import { Globe, Lock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  visibilityDescription,
  type ProfileVisibility,
} from "@/lib/profileVisibility";
import {
  PRIVACY_SETTINGS_CHANGED_EVENT,
  readUnifiedInvisible,
  saveInvisibleMirrorToDatabase,
  saveUnifiedInvisible,
} from "@/lib/visibility";
import {
  readLocationSharingLocal,
  writeLocationSharingLocal,
} from "@/lib/geolocation";

interface ProfileSocialSettingsProps {
  userId: string;
  profileType: "single" | "couple";
  isDemo?: boolean;
  /**
   * Ronda 10 (stream A, punto A1): el perfil anónimo nace PRIVADO.
   * Sin visibilidad guardada en este dispositivo, el select arranca
   * en "🔒 Privado" (el default general es público). Una elección
   * explícita guardada manda siempre.
   */
  isAnonymous?: boolean;
}

export function ProfileSocialSettings({
  userId,
  profileType,
  isDemo = false,
  isAnonymous = false,
}: ProfileSocialSettingsProps) {
  // Ronda 11, stream C (iii): el select lee el estado UNIFICADO
  // (invisible ⟺ "private"), no su propio almacén. El default
  // anónimo (privado) vive dentro de `readUnifiedInvisible`: sin nada
  // guardado, el anónimo arranca en "🔒 Privado" y el resto en
  // "🌐 Público"; una elección explícita guardada manda siempre.
  const [visibility, setVisibility] = useState<ProfileVisibility>(() =>
    readUnifiedInvisible(userId, profileType, isAnonymous)
      ? "private"
      : "public",
  );
  const [sharesLocation, setSharesLocation] = useState<boolean>(() =>
    readLocationSharingLocal(userId),
  );
  const [saving, setSaving] = useState(false);

  // Ronda 11, stream C (iii): si el toggle "Modo invisible" cambia
  // en la misma página, el select se actualiza en vivo (y viceversa:
  // el toggle escucha el mismo evento).
  useEffect(() => {
    if (!userId) return;
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) {
        setVisibility(
          readUnifiedInvisible(userId, profileType, isAnonymous)
            ? "private"
            : "public",
        );
      }
    };
    window.addEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, sync);
    return () =>
      window.removeEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, sync);
  }, [userId, profileType, isAnonymous]);

  const saveVisibility = async (next: ProfileVisibility) => {
    setVisibility(next);
    // Ronda 11, stream C (iii): escribe AMBOS almacenes locales y
    // avisa al toggle y a la píldora.
    saveUnifiedInvisible(userId, profileType, next === "private", isAnonymous);
    if (isDemo || !supabase || !userId) return;
    setSaving(true);
    try {
      const table = profileType === "couple" ? "couple_profiles" : "profiles";
      // En pareja, `is_public` ya existe y es el espejo de visibility.
      const patch =
        profileType === "couple"
          ? { visibility: next, is_public: next === "public" }
          : { visibility: next };
      const { error } = await supabase
        .from(table)
        .update(patch as never)
        .eq("user_id", userId);
      if (error) {
        logger.error("Error guardando visibilidad del perfil:", {
          error: error.message,
        });
      }
      // Espejo en BD de `invisible` para el toggle (best-effort).
      await saveInvisibleMirrorToDatabase(
        userId,
        profileType,
        next === "private",
      );
    } catch (err) {
      logger.error("Error guardando visibilidad del perfil:", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSharing = async (next: boolean) => {
    setSharesLocation(next);
    writeLocationSharingLocal(userId, next);
    if (isDemo || !supabase || !userId) return;
    try {
      const table = profileType === "couple" ? "couple_profiles" : "profiles";
      const { error } = await supabase
        .from(table)
        .update({ location_sharing_enabled: next } as never)
        .eq("user_id", userId);
      if (error) {
        logger.error("Error guardando geolocalización:", {
          error: error.message,
        });
      }
    } catch (err) {
      logger.error("Error guardando geolocalización:", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <section
      aria-label="Ajustes sociales del perfil"
      className="rounded-2xl border border-slate-200 bg-white dark:border-white/15 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5"
    >
      <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5" aria-hidden="true" />
        Amistad y privacidad del perfil
      </h3>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
              {visibility === "private" ? (
                <Lock className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Globe className="w-4 h-4" aria-hidden="true" />
              )}
              Visibilidad del perfil
            </p>
            <p className="text-slate-500 dark:text-white/60 text-xs">
              {visibilityDescription(visibility)}
            </p>
          </div>
          <select
            value={visibility}
            onChange={(e) =>
              void saveVisibility(e.target.value as ProfileVisibility)
            }
            disabled={saving}
            aria-label="Visibilidad del perfil"
            className="bg-slate-100 border border-slate-300 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white rounded-full px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="public">🌐 Público</option>
            <option value="private">🔒 Privado</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Geolocalización para matching
            </p>
            <p className="text-slate-500 dark:text-white/60 text-xs">
              {sharesLocation
                ? "Tu distancia aproximada (mín. 1 km, nunca la exacta) se muestra en Discover y en tu perfil."
                : "Desactivada: nadie ve tu distancia."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharesLocation}
            aria-label="Geolocalización para matching"
            onClick={() => void saveSharing(!sharesLocation)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              sharesLocation
                ? "bg-emerald-500"
                : "bg-slate-300 dark:bg-white/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharesLocation ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
