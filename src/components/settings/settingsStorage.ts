import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/app-config";
import { logger } from "@/lib/logger";

/**
 * Persistencia de los ajustes de /settings (Privacidad, Ubicación...).
 * Mismo patrón que Single/CouplePrivacySection: en demo (o sin cliente
 * Supabase) localStorage por dispositivo; en real, profiles.privacy_settings.
 * Antes handleSave solo mostraba el toast "Configuración guardada" con un
 * TODO y nunca persistía nada: al recargar, todo volvía a los defaults
 * ("Mostrar distancia" no persistía).
 */

const KEY = (userId: string) => `app_settings:${userId}`;

export function loadSettingsState<T extends Record<string, unknown>>(
  userId: string | undefined,
  defaults: T,
): T {
  if (!userId) return defaults;
  try {
    const raw = window.localStorage.getItem(KEY(userId));
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return defaults;
  }
}

export async function loadSettingsStateRemote<
  T extends Record<string, unknown>,
>(userId: string | undefined, defaults: T): Promise<T> {
  const local = loadSettingsState(userId, defaults);
  if (!userId || !supabase || isDemoMode()) return local;
  try {
    const { data } = await (supabase as any)
      .from("profiles")
      .select("privacy_settings")
      .eq("user_id", userId)
      .maybeSingle();
    const stored = (data?.privacy_settings ?? {}) as Record<string, unknown>;
    const merged = { ...local, ...stored } as T;
    // Sincronizar el espejo local con lo de BD.
    window.localStorage.setItem(KEY(userId), JSON.stringify(merged));
    return merged;
  } catch (error) {
    logger.warn("No se pudieron cargar los ajustes desde BD", {
      error: error instanceof Error ? error.message : String(error),
    });
    return local;
  }
}

export async function saveSettingsState(
  userId: string | undefined,
  patch: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  const current = loadSettingsState(userId, {});
  const merged = { ...current, ...patch };
  try {
    window.localStorage.setItem(KEY(userId), JSON.stringify(merged));
  } catch {
    // localStorage no disponible: se sigue intentando en BD.
  }
  if (!supabase || isDemoMode()) return;
  try {
    const { data } = await (supabase as any)
      .from("profiles")
      .select("privacy_settings")
      .eq("user_id", userId)
      .maybeSingle();
    const stored = (data?.privacy_settings ?? {}) as Record<string, unknown>;
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ privacy_settings: { ...stored, ...patch } })
      .eq("user_id", userId);
    if (error) {
      logger.warn("No se pudieron guardar los ajustes en BD", {
        error: error.message,
      });
    }
  } catch (error) {
    logger.warn("No se pudieron guardar los ajustes en BD", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
