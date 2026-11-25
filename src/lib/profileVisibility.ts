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
 */

export type ProfileVisibility = "public" | "private";

export const DEFAULT_VISIBILITY: ProfileVisibility = "public";

export function normalizeVisibility(value: unknown): ProfileVisibility {
  return value === "private" ? "private" : "public";
}

export function visibilityStorageKey(userId: string): string {
  return `profile_visibility:${userId}`;
}

export function readVisibilityLocal(userId: string): ProfileVisibility {
  if (typeof window === "undefined" || !userId) return DEFAULT_VISIBILITY;
  try {
    return normalizeVisibility(
      window.localStorage.getItem(visibilityStorageKey(userId)),
    );
  } catch {
    return DEFAULT_VISIBILITY;
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
