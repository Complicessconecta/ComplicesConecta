/**
 * Perfiles públicos vs privados (punto 4).
 *
 * - Público: cualquiera ve el perfil completo.
 * - Privado: solo el dueño y sus amigos aceptados ven el perfil
 *   completo. Quien no es amigo ve solo la portada mínima (nombre,
 *   foto de portada si la hay) + el botón "Enviar solicitud" y un
 *   aviso de que el perfil es privado.
 *
 * Fuente: columna `visibility` ('public' | 'private', migración
 * 20261124050000, aún sin aplicar en producción) con respaldo en
 * localStorage `profile_visibility:<userId>` (por defecto: público).
 * En pareja, `couple_profiles.is_public` ya existe: `visibility`
 * es su espejo explícito (public <=> is_public true).
 *
 * La comprobación de amistad vive en `src/lib/friends.ts` para no
 * crear un ciclo de imports: este módulo recibe `isFriend` como
 * parámetro, no lo calcula.
 *
 * Perfil privado para no-amigos (ronda 5, punto 16): el gate
 * (`canViewFullProfile` / `isProfileGated`) ya existe y lo usa
 * `ProfileDetail.tsx` con la visibilidad de la semilla demo + lo
 * guardado en local. Para perfiles REALES falta que el detalle lea
 * la visibilidad de la BD: `fetchProfileVisibility` (columna
 * `visibility`, migración 20261124050000) y
 * `resolveProfileVisibility` (prioridad BD > local explícito >
 * semilla) son el cableado que `ProfileDetail.tsx` debe usar — ese
 * archivo está fuera del alcance de este stream, ver reporte.
 */

import { supabase } from "@/integrations/supabase/client";

export type ProfileVisibility = "public" | "private";

export const DEFAULT_VISIBILITY: ProfileVisibility = "public";

export function normalizeVisibility(value: unknown): ProfileVisibility {
  return value === "private" ? "private" : "public";
}

export function visibilityStorageKey(userId: string): string {
  return `profile_visibility:${userId}`;
}

export function readVisibilityLocal(userId: string): ProfileVisibility {
  return readVisibilityLocalOrNull(userId) ?? DEFAULT_VISIBILITY;
}

/**
 * Visibilidad guardada en local, o null si el dueño nunca la fijó
 * en este dispositivo. Distinto de `readVisibilityLocal`: aquí el
 * "public" por defecto NO debe tapar el valor de la BD ni el de la
 * semilla (ver `resolveProfileVisibility`).
 */
export function readVisibilityLocalOrNull(
  userId: string,
): ProfileVisibility | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(visibilityStorageKey(userId));
    if (raw === null) return null;
    return normalizeVisibility(raw);
  } catch {
    return null;
  }
}

/**
 * Visibilidad efectiva de un perfil. Prioridad:
 *  1. BD (`profiles.visibility` / `couple_profiles.visibility`,
 *     migración 20261124050000): manda cuando existe, porque es lo
 *     que el dueño guardó en su cuenta y lo que ve cualquier
 *     dispositivo.
 *  2. Local explícito (el dueño la fijó en este dispositivo y aún
 *     no está en BD, p. ej. migración sin aplicar).
 *  3. Semilla demo (perfiles demo sin valor guardado en ningún lado).
 * Sin ninguna fuente, público (comportamiento histórico).
 */
export function resolveProfileVisibility(input: {
  dbVisibility?: unknown;
  storedVisibility?: ProfileVisibility | null;
  seedVisibility?: ProfileVisibility;
  /**
   * Ronda 9 (stream A, punto 2): el perfil ANÓNIMO es privado por
   * defecto — siempre "private", por encima de BD/local/semilla.
   * Solo la tarjeta pública mínima es visible; el resto exige
   * solicitud + aceptación (el gate lo aplica `canViewFullProfile`:
   * dueño y amigos aceptados ven el perfil completo).
   */
  isAnonymous?: boolean;
}): ProfileVisibility {
  if (input.isAnonymous === true) return "private";
  if (input.dbVisibility === "private" || input.dbVisibility === "public") {
    return input.dbVisibility;
  }
  if (
    input.storedVisibility === "private" ||
    input.storedVisibility === "public"
  ) {
    return input.storedVisibility;
  }
  return input.seedVisibility ?? DEFAULT_VISIBILITY;
}

/**
 * Lee la visibilidad de un perfil REAL desde la BD (columna
 * `visibility`, migración 20261124050000). Busca primero en
 * `profiles` (single) y luego en `couple_profiles` (pareja).
 * Devuelve null si no hay fila, si Supabase falla o si la columna
 * aún no existe en producción (migración sin aplicar): el llamador
 * cae entonces a local/semilla con `resolveProfileVisibility`.
 */
export async function fetchProfileVisibility(
  profileId: string,
): Promise<ProfileVisibility | null> {
  if (!profileId || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("visibility")
      .eq("id", profileId)
      .maybeSingle();
    if (!error && data) {
      const v = (data as { visibility?: unknown }).visibility;
      if (v === "private" || v === "public") return v;
    }
    const { data: couple, error: coupleError } = await supabase
      .from("couple_profiles")
      .select("visibility")
      .eq("id", profileId)
      .maybeSingle();
    if (!coupleError && couple) {
      const v = (couple as { visibility?: unknown }).visibility;
      if (v === "private" || v === "public") return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeVisibilityLocal(
  userId: string,
  visibility: ProfileVisibility,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      visibilityStorageKey(userId),
      normalizeVisibility(visibility),
    );
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

export interface ProfileGateInput {
  /** Visibilidad del perfil que se quiere ver. */
  visibility: ProfileVisibility;
  /** ¿El espectador es el dueño del perfil? */
  isOwner: boolean;
  /** ¿El espectador es amigo aceptado del dueño? */
  isFriend: boolean;
}

/**
 * ¿Puede este espectador ver el perfil COMPLETO?
 * - Dueño: siempre.
 * - Público: siempre.
 * - Privado: solo amigos aceptados.
 */
export function canViewFullProfile(input: ProfileGateInput): boolean {
  if (input.isOwner) return true;
  if (input.visibility === "public") return true;
  return input.isFriend;
}

/** ¿Debe mostrarse la pantalla de "perfil privado, envía solicitud"? */
export function isProfileGated(input: ProfileGateInput): boolean {
  return !canViewFullProfile(input);
}

/** Etiqueta para el encabezado / ajustes del perfil propio. */
export function visibilityLabel(visibility: ProfileVisibility): string {
  return visibility === "private" ? "🔒 Privado" : "🌐 Público";
}

export function visibilityDescription(visibility: ProfileVisibility): string {
  return visibility === "private"
    ? "Solo tus amigos pueden ver tu perfil completo. Los demás deben enviarte una solicitud."
    : "Cualquiera puede ver tu perfil completo.";
}
