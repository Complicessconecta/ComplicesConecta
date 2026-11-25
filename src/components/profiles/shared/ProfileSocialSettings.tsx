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
 */
import { useState } from "react";
import { Globe, Lock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  readVisibilityLocal,
  visibilityDescription,
  writeVisibilityLocal,
  type ProfileVisibility,
} from "@/lib/profileVisibility";
import {
  readLocationSharingLocal,
  writeLocationSharingLocal,
} from "@/lib/geolocation";

interface ProfileSocialSettingsProps {
  userId: string;
  profileType: "single" | "couple";
  isDemo?: boolean;
}

export function ProfileSocialSettings({
  userId,
  profileType,
  isDemo = false,
}: ProfileSocialSettingsProps) {
  const [visibility, setVisibility] = useState<ProfileVisibility>(() =>
    readVisibilityLocal(userId),
  );
  const [sharesLocation, setSharesLocation] = useState<boolean>(() =>
    readLocationSharingLocal(userId),
  );
  const [saving, setSaving] = useState(false);

  const saveVisibility = async (next: ProfileVisibility) => {
    setVisibility(next);
    writeVisibilityLocal(userId, next);
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
      className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-4 sm:p-5"
    >
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5" aria-hidden="true" />
        Amistad y privacidad del perfil
      </h3>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white font-medium flex items-center gap-2">
              {visibility === "private" ? (
                <Lock className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Globe className="w-4 h-4" aria-hidden="true" />
              )}
              Visibilidad del perfil
            </p>
            <p className="text-white/60 text-xs">
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
            className="bg-white/10 border border-white/20 text-white rounded-full px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="public">🌐 Público</option>
            <option value="private">🔒 Privado</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Geolocalización para matching
            </p>
            <p className="text-white/60 text-xs">
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
              sharesLocation ? "bg-emerald-500" : "bg-white/20"
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
