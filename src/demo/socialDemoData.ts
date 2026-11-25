/**
 * Datos sociales demo (punto 2, 3 y 4) — NO tocar `src/demo/demoData.ts`.
 *
 * Este archivo es la fuente demo de país, amistades, en línea /
 * última conexión, visibilidad y geolocalización de los perfiles
 * demo. Se keyea por NOMBRE del perfil (los ids demo son UUID
 * generados en cada carga de `generateDemoProfiles`, así que el
 * nombre es el identificador estable). `getSocialDemoData` acepta
 * id o nombre: si no hay entrada semilla, deriva valores
 * deterministas del propio texto (mismo perfil → mismos datos en
 * cada carga, sin aleatoriedad).
 *
 * Los nombres y ciudades coinciden con los perfiles generados en
 * `src/demo/demoData.ts` (Ana, Carlos, Carmen & Roberto, etc.) y con
 * el perfil single demo (Sofía, 28, CDMX). Las amistades son
 * coherentes entre sí: si Ana tiene a Carlos de amigo, Carlos tiene
 * a Ana.
 *
 * La última conexión se guarda como ISO; el texto ("hace 5 min /
 * 2 h / 3 días") lo forma `formatLastSeen` en `src/lib/friends.ts`.
 * La distancia NO vive aquí: Discover ya trae `distance` por perfil
 * y `DistanceBadge` la aproxima al mostrarla.
 */

export type SocialVisibility = "public" | "private";

export interface SocialDemoEntry {
  /** Id pseudo-estable para listas (`demo-social:<slug>`). */
  id: string;
  displayName: string;
  /** Código ISO de país (ver `src/lib/countries.ts`). */
  countryCode: string;
  /** Ciudad de origen (coherente con demoData). */
  city: string;
  isOnline: boolean;
  /** Última conexión ISO; null si está en línea. */
  lastSeenAt: string | null;
  /** Nombres de sus amigos aceptados. */
  friendNames: string[];
  visibility: SocialVisibility;
  /** ¿Comparte su ubicación para matching? */
  sharesLocation: boolean;
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function entry(
  displayName: string,
  countryCode: string,
  city: string,
  isOnline: boolean,
  lastSeenMinutes: number | null,
  friendNames: string[],
  visibility: SocialVisibility = "public",
  sharesLocation = true,
): SocialDemoEntry {
  return {
    id: `demo-social:${slug(displayName)}`,
    displayName,
    countryCode,
    city,
    isOnline,
    lastSeenAt:
      isOnline || lastSeenMinutes === null
        ? null
        : minutesAgoIso(lastSeenMinutes),
    friendNames,
    visibility,
    sharesLocation,
  };
}

const SEED: Record<string, SocialDemoEntry> = {
  sofía: entry("Sofía", "MX", "Ciudad de México", true, null, [
    "Ana",
    "Carlos",
    "Carmen & Roberto",
    "Lucía",
  ]),
  // RONDA 7 (punto 18): Ana es el perfil privado de la demo. Antes
  // TODOS los perfiles semilla eran públicos y el gate de perfil
  // privado (PrivateProfileGate + solicitud de amistad) no se podía
  // alcanzar nunca en demo: ni siquiera una cuenta nueva veía la
  // pantalla de "perfil privado". Sofía está en sus amigos semilla,
  // así que la demo canónica sigue viendo el perfil completo y una
  // cuenta nueva (p. ej. PruebaR6) ve el gate con el botón de
  // solicitud. La visibilidad semilla solo aplica en demo; en real
  // manda la BD (columna `visibility`, migración 20261124050000).
  ana: entry(
    "Ana",
    "MX",
    "Guadalajara",
    true,
    null,
    ["Sofía", "Carlos", "Laura"],
    "private",
  ),
  francisco: entry("Francisco", "MX", "Ciudad de México", false, 45, [
    "Miguel",
    "David",
  ]),
  "maría & juan": entry("María & Juan", "CO", "Guadalajara", true, null, [
    "Carmen & Roberto",
    "Javier & Elena",
  ]),
  carlos: entry("Carlos", "MX", "Monterrey", true, null, [
    "Sofía",
    "Ana",
    "Miguel",
  ]),
  laura: entry("Laura", "MX", "Puebla", false, 130, [
    "Ana",
    "Cristina",
    "Isabel",
  ]),
  "carmen & roberto": entry(
    "Carmen & Roberto",
    "MX",
    "Ciudad de México",
    false,
    25,
    ["Sofía", "María & Juan", "Rosa & Daniel"],
  ),
  miguel: entry("Miguel", "MX", "Tijuana", true, null, ["Carlos", "Francisco"]),
  lucía: entry("Lucía", "MX", "Mérida", false, 320, [
    "Sofía",
    "Isabel",
    "Pilar",
  ]),
  "javier & elena": entry("Javier & Elena", "ES", "Querétaro", true, null, [
    "María & Juan",
    "Sergio & Teresa",
  ]),
  david: entry("David", "MX", "León", false, 60 * 26, [
    "Francisco",
    "Alejandro",
  ]),
  cristina: entry("Cristina", "CO", "Monterrey", true, null, [
    "Laura",
    "Isabel",
  ]),
  alejandro: entry("Alejandro", "MX", "Guadalajara", false, 90, [
    "David",
    "Rafael",
  ]),
  "rosa & daniel": entry("Rosa & Daniel", "MX", "Puebla", false, 60 * 5, [
    "Carmen & Roberto",
    "Pablo & Raquel",
  ]),
  isabel: entry("Isabel", "MX", "Ciudad de México", true, null, [
    "Laura",
    "Lucía",
    "Cristina",
  ]),
  rafael: entry("Rafael", "MX", "Torreón", false, 60 * 49, [
    "Alejandro",
    "Manuel",
  ]),
  pilar: entry("Pilar", "MX", "San Luis Potosí", false, 15, [
    "Lucía",
    "Dolores",
  ]),
  "sergio & teresa": entry("Sergio & Teresa", "AR", "Cuernavaca", true, null, [
    "Javier & Elena",
    "Pablo & Raquel",
  ]),
  manuel: entry("Manuel", "MX", "Mexicali", false, 60 * 24 * 3, [
    "Rafael",
    "Pablo & Raquel",
  ]),
  dolores: entry("Dolores", "MX", "Aguascalientes", false, 60 * 24 * 12, [
    "Pilar",
  ]),
  "pablo & raquel": entry("Pablo & Raquel", "CL", "Mérida", true, null, [
    "Rosa & Daniel",
    "Sergio & Teresa",
    "Manuel",
  ]),
};

/** Países del fallback determinista (mismo texto → mismo país). */
const FALLBACK_COUNTRIES = ["MX", "MX", "MX", "CO", "AR", "CL", "ES", "PE"];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Datos sociales demo de un perfil, por id o por nombre.
 * Sin entrada semilla: valores deterministas derivados del texto
 * (país, en línea / última conexión); sin amigos y público.
 */
export function getSocialDemoData(idOrName: string): SocialDemoEntry {
  const key = (idOrName ?? "").trim().toLowerCase();
  const hit = SEED[key];
  if (hit) return hit;
  // La clave puede venir como "demo-social:<slug>".
  const byId = Object.values(SEED).find((e) => e.id === key);
  if (byId) return byId;
  const h = hashString(key || "perfil-demo");
  const isOnline = h % 3 !== 0;
  const countryCode = FALLBACK_COUNTRIES[h % FALLBACK_COUNTRIES.length] ?? "MX";
  return {
    id: `demo-social:${slug(key || "perfil-demo")}`,
    displayName:
      idOrName && !idOrName.startsWith("demo-") ? idOrName : "Perfil demo",
    countryCode,
    city: "Ciudad de México",
    isOnline,
    lastSeenAt: isOnline ? null : minutesAgoIso(5 + (h % 3000)),
    friendNames: [],
    visibility: "public",
    sharesLocation: true,
  };
}

/** Todos los perfiles demo con datos sociales semilla. */
export function listSocialDemoEntries(): SocialDemoEntry[] {
  return Object.values(SEED);
}
