/**
 * Fallback de avatar (ronda 10, stream D).
 *
 * Varias superficies renderizaban la inicial del nombre (`charAt(0)`)
 * sin validar qué es ese "nombre": cuando el remitente de una solicitud
 * no se resolvía, `resolveDemoProfileName` devuelve el id crudo (UUID
 * o id numérico legacy) y ese id acababa como texto dentro del círculo
 * del avatar — en el test de verificación de la ronda 9, un glifo
 * "101" en una tarjeta de /requests en vez del icono de persona.
 *
 * Regla: el avatar solo muestra iniciales de un NOMBRE de persona.
 * Cualquier otra cosa (vacío, solo dígitos, UUID, `demo-…`, email)
 * devuelve null y quien renderiza pone el icono de persona.
 */

/** UUID v4 con guiones (lo que devuelve `generateDemoUUID`). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Iniciales (máx. 2 letras, en mayúsculas) de un nombre visible, o
 * null si el texto no es un nombre de persona y no debe ir en un
 * avatar. "Anabella & Julio" → "AJ"; "Sofía" → "S"; "101", un UUID,
 * "demo-3" o "single@outlook.es" → null.
 */
export function getAvatarInitials(
  displayName: string | null | undefined,
): string | null {
  if (!displayName) return null;
  const name = displayName.trim();
  if (!name) return null;
  // Solo dígitos (con espacios): un identificador, no un nombre.
  if (/^[\d\s]+$/.test(name)) return null;
  // UUID crudo de un perfil sin resolver.
  if (UUID_RE.test(name)) return null;
  const lower = name.toLowerCase();
  if (
    lower.startsWith("demo-") ||
    lower.startsWith("demo-social:") ||
    lower.startsWith("demo-profile")
  ) {
    return null;
  }
  // Email crudo como nombre visible.
  if (name.includes("@")) return null;
  // Empieza por dígito: tampoco es un nombre de persona.
  if (/^\d/.test(name)) return null;
  const words = name.split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (words.length === 0) return null;
  const initials = words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return initials || null;
}
