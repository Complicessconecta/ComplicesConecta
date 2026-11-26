/**
 * Enforcement real de los ajustes de privacidad (antes solo visuales).
 *
 * Dónde vive cada ajuste:
 * - Demo: localStorage, claves `single_privacy:<userId>` y
 *   `couple_privacy:<userId>` (las mismas que ya usaban las secciones
 *   de Privacidad; este módulo solo las lee, no cambia el formato).
 * - Real pareja: `couple_profiles.privacy_settings` (jsonb, existe por
 *   la migración 20251027210460).
 * - Real single: `profiles.privacy_settings` (jsonb, migración
 *   20261124040000_add_privacy_settings_to_profiles.sql en el repo;
 *   PENDIENTE aplicarla en Supabase producción). Hasta que se aplique,
 *   el ajuste del single en real solo vive en localStorage de ese
 *   dispositivo. `loadPrivacySettings` lo documenta en su retorno.
 *
 * Las claves extra `birthDate`, `birthDate2`, `zodiacSign` y
 * `zodiacSign2` viajan dentro del mismo JSON y las secciones de
 * Privacidad las conservan al guardar (no se borran).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import {
  readVisibilityLocalOrNull,
  writeVisibilityLocal,
} from "@/lib/profileVisibility";
import {
  getZodiacSignById,
  getZodiacSignFromDate,
  type ZodiacSign,
} from "@/lib/zodiac";

export type ProfileType = "single" | "couple";

export interface PrivacySettings {
  /** Modo invisible: no aparece en Discover/búsquedas ni visitas recientes. */
  invisible: boolean;
  /** Permitir que perfiles sin verificar vean este perfil / se muestren. */
  allowUnverified: boolean;
  showRegion: boolean;
  friendsListVisible: boolean;
  birthdayCake: boolean;
  zodiacVisible: boolean;
  watermark: boolean;
  /** Solo contactos verificados pueden escribirte. */
  limitMessages: boolean;
  videoChat: boolean;
  /** Fecha de nacimiento ISO ("YYYY-MM-DD"). Extra, no es toggle. */
  birthDate?: string;
  /** Fecha de nacimiento de la segunda persona (pareja). Extra. */
  birthDate2?: string;
  /** Signo elegido a mano (id, p. ej. "aries"). "" = automático. Extra. */
  zodiacSign?: string;
  /** Signo manual de la segunda persona (pareja). Extra. */
  zodiacSign2?: string;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
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

/**
 * Ronda 10 (stream A, punto A1): ajustes con los que NACE una cuenta
 * anónima. El perfil anónimo es privado por defecto: invisible en
 * Discover/búsquedas/visitas recientes. Causa raíz del fallo del test
 * ronda 9: nada escribía jamás estos ajustes al crear el anónimo y
 * todos los lectores caían al default visible (`invisible: false` en
 * `DEFAULT_PRIVACY_SETTINGS`, `"public"` en `readVisibilityLocal`).
 * La ronda 9 solo resolvió `resolveProfileVisibility(isAnonymous →
 * "private")` en @/lib/profileVisibility, que ni el badge del perfil
 * propio (`getVisibilityBadge` sobre `usePrivacySettings`) ni el
 * select de `ProfileSocialSettings` usan.
 */
export const ANONYMOUS_DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  ...DEFAULT_PRIVACY_SETTINGS,
  invisible: true,
};

const BOOLEAN_KEYS = [
  "invisible",
  "allowUnverified",
  "showRegion",
  "friendsListVisible",
  "birthdayCake",
  "zodiacVisible",
  "watermark",
  "limitMessages",
  "videoChat",
] as const;

type BooleanPrivacyKey = (typeof BOOLEAN_KEYS)[number];

/** Evento que disparan las secciones de Privacidad al guardar un cambio. */
export const PRIVACY_SETTINGS_CHANGED_EVENT = "complices:privacy-changed";

export function notifyPrivacySettingsChanged(userId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PRIVACY_SETTINGS_CHANGED_EVENT, { detail: { userId } }),
  );
}

export function privacyStorageKey(userId: string, type: ProfileType): string {
  return `${type === "couple" ? "couple" : "single"}_privacy:${userId}`;
}

/**
 * Normaliza ajustes de privacidad desde cualquier fuente (objeto Json de
 * Supabase, string de localStorage o null) sobre los valores por defecto.
 * Solo se copian claves conocidas con el tipo esperado.
 */
export function normalizePrivacySettings(raw: unknown): PrivacySettings {
  const next: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS };
  let parsed: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      const p: unknown = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) {
        parsed = p as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    parsed = raw as Record<string, unknown>;
  }
  if (!parsed) return next;
  for (const key of BOOLEAN_KEYS) {
    if (typeof parsed[key] === "boolean") {
      next[key as BooleanPrivacyKey] = parsed[key] as boolean;
    }
  }
  if (typeof parsed.birthDate === "string") next.birthDate = parsed.birthDate;
  if (typeof parsed.birthDate2 === "string")
    next.birthDate2 = parsed.birthDate2;
  if (typeof parsed.zodiacSign === "string")
    next.zodiacSign = parsed.zodiacSign;
  if (typeof parsed.zodiacSign2 === "string")
    next.zodiacSign2 = parsed.zodiacSign2;
  return next;
}

function parseStoredSettings(raw: string | null): PrivacySettings {
  if (!raw) return { ...DEFAULT_PRIVACY_SETTINGS };
  return normalizePrivacySettings(raw);
}

function readLocalSettings(userId: string, type: ProfileType): PrivacySettings {
  if (typeof window === "undefined" || !userId) {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
  try {
    return parseStoredSettings(
      window.localStorage.getItem(privacyStorageKey(userId, type)),
    );
  } catch {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
}

function writeLocalSettings(
  userId: string,
  type: ProfileType,
  settings: PrivacySettings,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      privacyStorageKey(userId, type),
      JSON.stringify(settings),
    );
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

/**
 * Ronda 10 (stream A, punto A1): ¿el dueño fijó alguna vez sus
 * ajustes de privacidad en este dispositivo? Distingue "guardado
 * explícito" de "default": sin esto no se puede aplicar el default
 * anónimo (privado) sin pisar la elección explícita del dueño.
 */
export function hasStoredPrivacySettings(
  userId: string,
  type: ProfileType,
): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return (
      window.localStorage.getItem(privacyStorageKey(userId, type)) !== null
    );
  } catch {
    return false;
  }
}

/**
 * Ronda 10 (stream A, punto A1): guarda los ajustes completos de un
 * perfil (local + aviso a los lectores en vivo). Lo usa la siembra
 * de privacidad del anónimo al crearse/cargarse.
 */
export function savePrivacySettings(
  userId: string,
  type: ProfileType,
  settings: PrivacySettings,
): void {
  if (!userId) return;
  writeLocalSettings(userId, type, { ...settings });
  notifyPrivacySettingsChanged(userId);
}

/**
 * Ronda 11, stream C (iii): FUENTE ÚNICA de la visibilidad del perfil
 * propio.
 *
 * Antes había DOS controles con DOS almacenes que no se hablaban:
 * - "Modo invisible" (toggle en `SinglePrivacySection` /
 *   `CouplePrivacySection`) → `PrivacySettings.invisible` en
 *   `single_privacy:<userId>` / `couple_privacy:<userId>`.
 * - "Visibilidad del perfil" (select en `ProfileSocialSettings`) →
 *   "public" | "private" en `profile_visibility:<userId>`.
 * Y la píldora (`getVisibilityBadge` sobre `usePrivacySettings`) solo
 * leía el primero. Resultado del test de verificación ronda 10
 * (2026-11-25 18:02–18:30 CST): la pareja tenía el toggle ON con el
 * select en "Público" y el anónimo el toggle OFF con el select en
 * "Privado", y en ambos casos la píldora decía "Invisible". El caso
 * anónimo tenía una segunda causa: el toggle no aplicaba el default
 * anónimo (privado/invisible) que sí aplican `usePrivacySettings` y
 * el select.
 *
 * Regla unificada: el perfil está OCULTO si CUALQUIERA de los dos
 * almacenes dice oculto (`invisible === true` O visibilidad
 * "private"). El default anónimo (privado cuando nada está guardado)
 * aplica en ambos. Si los almacenes heredados discrepan, gana lo más
 * privado (no se expone un perfil que el dueño puso oculto por un
 * lado); en cuanto el dueño mueve CUALQUIER control, ambos almacenes
 * se escriben juntos con el mismo valor y ya no pueden discrepar.
 * `saveUnifiedInvisible` es el único escritor local: escribe los dos
 * almacenes y avisa con `PRIVACY_SETTINGS_CHANGED_EVENT`, que es lo
 * que escuchan la píldora, el toggle y el select.
 *
 * Consecuencia semántica (asumida por la ronda): "Privado" implica
 * también invisible en Discover/búsquedas, y "Modo invisible"
 * implica también perfil privado (gate de solo-amigos). Antes eran
 * dos efectos distintos; la ronda los unifica en un solo estado
 * porque la UI los presenta como el mismo ("¿se me ve o no?").
 * La persistencia no cambia: ambos almacenes siguen en localStorage
 * por cuenta y `clearDemoAuth` ya no los barre (ronda 10, C2), así
 * que la visibilidad sigue sobreviviendo al logout.
 */
export function readUnifiedInvisible(
  userId: string,
  type: ProfileType,
  isAnonymous?: boolean,
): boolean {
  if (!userId) return false;
  const privacyInvisible = readEffectiveSettings(
    userId,
    type,
    isAnonymous,
  ).invisible;
  const storedVisibility = readVisibilityLocalOrNull(userId);
  const effectiveVisibility =
    storedVisibility ?? (isAnonymous === true ? "private" : "public");
  return privacyInvisible || effectiveVisibility === "private";
}

/**
 * Escribe el estado unificado en AMBOS almacenes locales y avisa a
 * todos los lectores en vivo. Preserva el resto de claves de los
 * ajustes de privacidad (watermark, signo, etc.). `base` permite
 * partir de los ajustes que el llamador ya tiene en memoria (p. ej.
 * los recién guardados en BD) en vez de releer el local.
 */
export function saveUnifiedInvisible(
  userId: string,
  type: ProfileType,
  invisible: boolean,
  isAnonymous?: boolean,
  base?: PrivacySettings,
): void {
  if (!userId) return;
  const next = {
    ...(base ?? readEffectiveSettings(userId, type, isAnonymous)),
    invisible,
  };
  writeLocalSettings(userId, type, next);
  writeVisibilityLocal(userId, invisible ? "private" : "public");
  notifyPrivacySettingsChanged(userId);
}

/**
 * Lectura síncrona (demo y respaldo local). En demo es la fuente real;
 * en producción es el respaldo cuando la BD no tiene la columna
 * (caso single) o falla la lectura.
 */
export function readPrivacySettingsSync(
  userId: string,
  type: ProfileType,
): PrivacySettings {
  return readLocalSettings(userId, type);
}

/**
 * Carga los ajustes del perfil indicado.
 * - Pareja en real: lee `couple_profiles.privacy_settings` y lo mezcla
 *   con el local (el local gana solo si la BD no trae la clave).
 * - Single en real: `profiles` NO tiene `privacy_settings`; devuelve
 *   el local y `fromDatabase: false` (pendiente migración).
 */
export async function loadPrivacySettings(
  userId: string,
  type: ProfileType,
): Promise<{ settings: PrivacySettings; fromDatabase: boolean }> {
  const local = readLocalSettings(userId, type);
  if (!userId || !supabase) {
    return { settings: local, fromDatabase: false };
  }
  // Pareja: couple_profiles.privacy_settings. Single: profiles
  // .privacy_settings (migración 20261124040000; si aún no está
  // aplicada en producción, la lectura falla y se usa el local).
  const table = type === "couple" ? "couple_profiles" : "profiles";
  try {
    const { data, error } = await supabase
      .from(table)
      .select("privacy_settings")
      .eq("id", userId)
      .single();
    if (error || !data) return { settings: local, fromDatabase: false };
    const stored = data.privacy_settings;
    if (
      typeof stored !== "object" ||
      stored === null ||
      Array.isArray(stored)
    ) {
      return { settings: local, fromDatabase: false };
    }
    const record = stored as Record<string, Json>;
    const merged: PrivacySettings = { ...local };
    for (const key of BOOLEAN_KEYS) {
      if (typeof record[key] === "boolean") {
        merged[key as BooleanPrivacyKey] = record[key] as boolean;
      }
    }
    if (typeof record.birthDate === "string")
      merged.birthDate = record.birthDate;
    if (typeof record.birthDate2 === "string")
      merged.birthDate2 = record.birthDate2;
    if (typeof record.zodiacSign === "string")
      merged.zodiacSign = record.zodiacSign;
    if (typeof record.zodiacSign2 === "string")
      merged.zodiacSign2 = record.zodiacSign2;
    return { settings: merged, fromDatabase: true };
  } catch (err) {
    logger.error("Error cargando privacy_settings:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { settings: local, fromDatabase: false };
  }
}

/**
 * Ronda 11, stream C (iii): espejo en BD de `invisible` dentro de
 * `privacy_settings` (real). Lo usa el select de
 * `ProfileSocialSettings`: su columna es `visibility`, pero el toggle
 * "Modo invisible" lee `privacy_settings.invisible`; sin este espejo
 * ambos controles discreparían tras recargar en real. Best-effort:
 * si la columna/tabla no existe aún (single: migración
 * 20261124040000 pendiente) solo se registra el error y el estado
 * local —que ya se escribió con `saveUnifiedInvisible`— sigue
 * mandando en este dispositivo.
 */
export async function saveInvisibleMirrorToDatabase(
  userId: string,
  type: ProfileType,
  invisible: boolean,
): Promise<void> {
  if (!userId || !supabase) return;
  try {
    const table = type === "couple" ? "couple_profiles" : "profiles";
    const { data } = await supabase
      .from(table)
      .select("privacy_settings")
      .eq("id", userId)
      .single();
    const stored = data?.privacy_settings;
    const record =
      typeof stored === "object" && stored !== null && !Array.isArray(stored)
        ? (stored as Record<string, Json>)
        : {};
    const { error } = await supabase
      .from(table)
      .update({ privacy_settings: { ...record, invisible } })
      .eq("id", userId);
    if (error) {
      logger.error("Error guardando espejo invisible en privacy_settings:", {
        error: error.message,
      });
    }
  } catch (err: unknown) {
    logger.error("Error guardando espejo invisible en privacy_settings:", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Guarda claves extra (fecha de nacimiento / signo manual) sin tocar
 * los toggles. Demo: localStorage. En real: además mezcla las claves
 * en `couple_profiles.privacy_settings` (pareja) o
 * `profiles.privacy_settings` (single; migración 20261124040000, si aún
 * no está aplicada en producción el guardado en BD falla y queda el local).
 */
export function savePrivacySettingsExtra(
  userId: string,
  type: ProfileType,
  extras: Partial<
    Pick<
      PrivacySettings,
      "birthDate" | "birthDate2" | "zodiacSign" | "zodiacSign2"
    >
  >,
): void {
  if (!userId) return;
  const next = { ...readLocalSettings(userId, type), ...extras };
  writeLocalSettings(userId, type, next);
  if (supabase) {
    // PostgrestBuilder es PromiseLike (sin .catch): async/await con
    // try/catch en vez de encadenar .then().catch().
    void (async () => {
      try {
        const table = type === "couple" ? "couple_profiles" : "profiles";
        const { data } = await supabase
          .from(table)
          .select("privacy_settings")
          .eq("id", userId)
          .single();
        const stored = data?.privacy_settings;
        const record =
          typeof stored === "object" &&
          stored !== null &&
          !Array.isArray(stored)
            ? (stored as Record<string, Json>)
            : {};
        const { error } = await supabase
          .from(table)
          .update({ privacy_settings: { ...record, ...extras } })
          .eq("id", userId);
        if (error) {
          logger.error("Error guardando extras de privacy_settings:", {
            error: error.message,
          });
        }
      } catch (err: unknown) {
        logger.error("Error guardando extras de privacy_settings:", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }
  notifyPrivacySettingsChanged(userId);
}

/**
 * Hook para leer los ajustes de un perfil y reaccionar cuando la
 * sección de Privacidad los cambia en la misma página.
 *
 * Ronda 10 (stream A, punto A1): con `isAnonymous === true` y sin
 * ajustes guardados en este dispositivo, el default es el del
 * anónimo (privado/invisible), no el general visible. Si el dueño
 * ya fijó sus ajustes, esos mandan: el default no pisa una elección
 * explícita. Cubre cuentas anónimas creadas antes de esta ronda
 * (p. ej. anonr8test), que nunca se sembraron al crearse.
 */
export function usePrivacySettings(
  userId: string | undefined | null,
  type: ProfileType,
  isAnonymous?: boolean,
): PrivacySettings {
  const [settings, setSettings] = useState<PrivacySettings>(() =>
    readEffectiveSettings(userId ?? "", type, isAnonymous),
  );
  useEffect(() => {
    if (!userId) return;
    setSettings(readEffectiveSettings(userId, type, isAnonymous));
    const reload = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === userId) {
        setSettings(readEffectiveSettings(userId, type, isAnonymous));
      }
    };
    window.addEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, reload);
    return () =>
      window.removeEventListener(PRIVACY_SETTINGS_CHANGED_EVENT, reload);
  }, [userId, type, isAnonymous]);
  return settings;
}

function readEffectiveSettings(
  userId: string,
  type: ProfileType,
  isAnonymous?: boolean,
): PrivacySettings {
  const stored = readLocalSettings(userId, type);
  if (isAnonymous === true && !hasStoredPrivacySettings(userId, type)) {
    return { ...ANONYMOUS_DEFAULT_PRIVACY_SETTINGS };
  }
  return stored;
}

/** El perfil es invisible: no debe aparecer en ningún listado ajeno. */
export function isProfileInvisible(
  settings: PrivacySettings | null | undefined,
): boolean {
  return settings?.invisible === true;
}

/**
 * Puente de identidad demo (ronda 8, puntos 9 y 11) — CAUSA RAÍZ de la
 * regresión de visibilidad de la pareja.
 *
 * Un mismo perfil demo tiene TRES ids distintos según dónde se mire y
 * ninguno es el del otro lado:
 * - La tarjeta de Discover (`generateDemoProfiles`) usa
 *   `generateDemoUUID("demo-profile-N")` (Carmen & Roberto es la
 *   tarjeta 6, `demo-profile-6`).
 * - La ficha demo / Compartir usa `demo-couple-456` (pareja) y
 *   `demo-single-1` (single).
 * - Los ajustes del dueño (Privacidad: `couple_privacy:<userId>`,
 *   `profile_visibility:<userId>`) se guardan con el id del USUARIO
 *   demo, `generateDemoUserUUID("user-pareja@outlook.es")` (lo que
 *   `CouplePrivacySection` recibe como `userId={user?.id}`).
 *
 * Sin este puente, el filtro de Discover y el gate de perfil privado
 * buscaban los ajustes con el id de la TARJETA, que nadie escribe
 * nunca: la pareja puesta en invisible seguía en Discover (tarjeta 6
 * de 20) y su perfil privado nunca se cerraba para la otra cuenta
 * demo. La búsqueda es por nombre canónico (la misma convención que
 * `getSocialDemoData`, que keyea la semilla demo por nombre) o por
 * los ids de ficha conocidos; fuera de demo devuelve null y el
 * llamador usa el id del perfil tal cual.
 */
export interface DemoOwnerIdentity {
  userId: string;
  type: ProfileType;
}

const DEMO_OWNER_BY_NAME: Record<string, DemoOwnerIdentity> = {
  "carmen & roberto": {
    userId: generateDemoUserUUID("pareja@outlook.es"),
    type: "couple",
  },
  sofía: {
    userId: generateDemoUserUUID("single@outlook.es"),
    type: "single",
  },
  sofia: {
    userId: generateDemoUserUUID("single@outlook.es"),
    type: "single",
  },
};

const DEMO_OWNER_BY_PROFILE_ID: Record<string, DemoOwnerIdentity> = {
  "demo-couple-456": {
    userId: generateDemoUserUUID("pareja@outlook.es"),
    type: "couple",
  },
  "demo-single-1": {
    userId: generateDemoUserUUID("single@outlook.es"),
    type: "single",
  },
};

export function resolveDemoOwnerIdentity(
  profileId: string,
  profileName?: string | null,
): DemoOwnerIdentity | null {
  if (!profileId && !profileName) return null;
  const byId = profileId ? DEMO_OWNER_BY_PROFILE_ID[profileId] : undefined;
  if (byId) return byId;
  // El propio id de usuario demo ya es la llave de sus ajustes.
  for (const owner of Object.values(DEMO_OWNER_BY_PROFILE_ID)) {
    if (profileId === owner.userId) return owner;
  }
  const name = (profileName ?? "").trim().toLowerCase();
  if (name) {
    const byName = DEMO_OWNER_BY_NAME[name];
    if (byName) return byName;
  }
  return null;
}

/**
 * Ajustes de privacidad del perfil LISTADO en Discover (demo).
 * Resuelve el id del dueño con el puente de arriba antes de leer:
 * sin él, la tarjeta de la pareja nunca encontraba su `invisible`.
 * Para el resto de tarjetas demo (sin dueño canónico) lee con el id
 * de la tarjeta, que cae a los valores por defecto (visible).
 */
export function readDemoProfilePrivacySettings(
  profileId: string,
  profileType: ProfileType,
  profileName?: string | null,
): PrivacySettings {
  const owner = resolveDemoOwnerIdentity(profileId, profileName);
  if (owner) return readPrivacySettingsSync(owner.userId, owner.type);
  return readPrivacySettingsSync(profileId, profileType);
}

export interface DiscoverProfileLike {
  id?: string | number;
  /** Campo real (`is_verified`) o demo (`isVerified`). */
  isVerified?: boolean;
  is_verified?: boolean;
  /**
   * Ronda 9 (stream A, punto 3): perfil anónimo (campo real
   * `is_anonymous` o demo `isAnonymous`). Solo aparece en Discover
   * para espectadores verificados, con insignia "Anónimo".
   * El `| undefined` es obligatorio: con
   * `exactOptionalPropertyTypes` un `?: boolean` rechaza un
   * `undefined` explícito (lo que pasa Discover al leer la columna).
   */
  is_anonymous?: boolean | undefined;
  isAnonymous?: boolean | undefined;
  /** Ajustes del perfil listado, cuando la fuente los trae. */
  privacySettings?: PrivacySettings | null | undefined;
  /** Atajo plano cuando la fuente trae el flag suelto. */
  invisible?: boolean;
}

/** Insignia que llevan los perfiles anónimos en Discover/búsquedas. */
export const ANONYMOUS_BADGE_LABEL = "Anónimo";

/** ¿Es este perfil listado un perfil anónimo? */
export function isAnonymousDiscoverProfile(
  profile: DiscoverProfileLike,
): boolean {
  return profile.is_anonymous === true || profile.isAnonymous === true;
}

function profileIsVerified(profile: DiscoverProfileLike): boolean {
  return profile.isVerified === true || profile.is_verified === true;
}

function profileIsInvisible(profile: DiscoverProfileLike): boolean {
  if (profile.invisible === true) return true;
  return isProfileInvisible(profile.privacySettings);
}

/**
 * ¿Este perfil puede aparecer en Discover / búsquedas para este
 * espectador? Enforcement real:
 * - Perfil invisible → nunca aparece (ni en Discover ni en visitas
 *   recientes; ver `shouldShowInRecentVisits`).
 * - Espectador con `allowUnverified === false` → solo ve verificados
 *   (el filtro "Mostrar perfiles sin verificar" de Discover arranca
 *   de este ajuste; desactivado = solo verificados).
 * - Ronda 9 (stream A, punto 3): perfil ANÓNIMO → solo para
 *   espectadores VERIFICADOS (`opts.viewerIsVerified`), aunque el
 *   filtro de verificados esté apagado. Sin saber si el espectador
 *   es verificado (`viewerIsVerified` undefined) no se muestra: un
 *   anónimo nunca es visible por defecto.
 * - Ronda 9 (stream A, punto 2): el anónimo es privado por defecto:
 *   en Discover solo se ve su tarjeta mínima (la tarjeta en sí es la
 *   tarjeta mínima: sin bio extendida ni galería) y el perfil
 *   completo exige solicitud + aceptación (ver profileVisibility.ts).
 */
export function shouldShowInDiscover(
  profile: DiscoverProfileLike,
  viewerPrivacy?: PrivacySettings | null,
  opts?: { viewerIsVerified?: boolean },
): boolean {
  if (profileIsInvisible(profile)) return false;
  if (isAnonymousDiscoverProfile(profile)) {
    return opts?.viewerIsVerified === true;
  }
  if (viewerPrivacy && viewerPrivacy.allowUnverified === false) {
    return profileIsVerified(profile);
  }
  return true;
}

/**
 * ¿Este perfil puede aparecer en la lista de visitas recientes de
 * otro usuario? Misma regla que Discover: invisible = no aparece.
 * Ronda 9 (stream A, punto 2): el anónimo es privado por defecto y
 * TAMPOCO aparece en visitas recientes (no deja rastro de visita).
 * NOTA: hoy no existe en la app ninguna lista de "visitas recientes"
 * (solo el contador de Visitas en ProfileStats); esta función es el
 * punto de filtrado para cuando esa lista exista.
 */
export function shouldShowInRecentVisits(
  profile: DiscoverProfileLike,
): boolean {
  if (isAnonymousDiscoverProfile(profile)) return false;
  return !profileIsInvisible(profile);
}

/** Insignia de verificado de un perfil (real o demo). */
export function isVerifiedProfile(profile: DiscoverProfileLike): boolean {
  return profileIsVerified(profile);
}

/** Signo zodiacal a mostrar para un perfil, según sus ajustes. */
export function getProfileZodiacSign(
  settings: PrivacySettings | null | undefined,
  partnerIndex: 0 | 1 = 0,
): ZodiacSign | null {
  if (!settings) return null;
  const birthDate =
    partnerIndex === 0 ? settings.birthDate : settings.birthDate2;
  const manual =
    partnerIndex === 0 ? settings.zodiacSign : settings.zodiacSign2;
  return (
    getZodiacSignById(manual ?? null) ??
    getZodiacSignFromDate(birthDate ?? null)
  );
}

/**
 * ¿El dueño de este perfil tiene la marca de agua activa? Las galerías
 * compartidas no siempre saben si el perfil es single o pareja, así que
 * se consultan ambas claves locales (en real, la de pareja además se
 * lee de `couple_profiles.privacy_settings` vía `loadPrivacySettings`).
 */
export function readWatermarkForProfile(userId: string): boolean {
  if (!userId) return false;
  return (
    readLocalSettings(userId, "single").watermark ||
    readLocalSettings(userId, "couple").watermark
  );
}

/** Etiqueta de visibilidad para el encabezado del perfil propio. */
export function getVisibilityBadge(
  settings: PrivacySettings | null | undefined,
  isOnline: boolean,
): { label: string; title: string } {
  if (isProfileInvisible(settings)) {
    return {
      label: "👻 Invisible",
      title:
        "Modo invisible: no apareces en Discover, búsquedas ni visitas recientes.",
    };
  }
  if (isOnline) {
    return { label: "🟢 En línea", title: "Visible y en línea." };
  }
  return { label: "👁️ Visible", title: "Visible en Discover y búsquedas." };
}
