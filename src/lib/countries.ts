/**
 * Países para el registro y la nacionalidad del perfil (punto 1).
 *
 * El registro pedía solo ciudad/ubicación libre; la nacionalidad no se
 * guardaba en ningún lado. Ahora el registro recoge el país de origen
 * (código ISO) y el perfil muestra nombre del país + bandera.
 *
 * La bandera se deriva del código ISO con indicadores regionales
 * unicode (sin assets externos). Solo se incluyen países con nombre
 * en español; la lista prioriza Latinoamérica + España + los destinos
 * más comunes de la comunidad.
 */

export interface Country {
  /** Código ISO 3166-1 alfa-2, p. ej. "MX". */
  code: string;
  /** Nombre en español, p. ej. "México". */
  name: string;
  /** Bandera emoji derivada del código. */
  flag: string;
}

function flagFromCode(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65))
    .join("");
}

const NAMES: Array<[string, string]> = [
  ["MX", "México"],
  ["CO", "Colombia"],
  ["AR", "Argentina"],
  ["CL", "Chile"],
  ["PE", "Perú"],
  ["VE", "Venezuela"],
  ["EC", "Ecuador"],
  ["BO", "Bolivia"],
  ["PY", "Paraguay"],
  ["UY", "Uruguay"],
  ["BR", "Brasil"],
  ["ES", "España"],
  ["US", "Estados Unidos"],
  ["CA", "Canadá"],
  ["CU", "Cuba"],
  ["DO", "República Dominicana"],
  ["PR", "Puerto Rico"],
  ["PA", "Panamá"],
  ["CR", "Costa Rica"],
  ["GT", "Guatemala"],
  ["HN", "Honduras"],
  ["SV", "El Salvador"],
  ["NI", "Nicaragua"],
  ["BZ", "Belice"],
  ["JM", "Jamaica"],
  ["HT", "Haití"],
  ["GB", "Reino Unido"],
  ["FR", "Francia"],
  ["DE", "Alemania"],
  ["IT", "Italia"],
  ["PT", "Portugal"],
  ["NL", "Países Bajos"],
  ["BE", "Bélgica"],
  ["CH", "Suiza"],
  ["SE", "Suecia"],
  ["NO", "Noruega"],
  ["DK", "Dinamarca"],
  ["PL", "Polonia"],
  ["RU", "Rusia"],
  ["UA", "Ucrania"],
  ["TR", "Turquía"],
  ["IL", "Israel"],
  ["AE", "Emiratos Árabes Unidos"],
  ["SA", "Arabia Saudita"],
  ["IN", "India"],
  ["CN", "China"],
  ["JP", "Japón"],
  ["KR", "Corea del Sur"],
  ["AU", "Australia"],
  ["NZ", "Nueva Zelanda"],
  ["ZA", "Sudáfrica"],
  ["MA", "Marruecos"],
  ["EG", "Egipto"],
  ["NG", "Nigeria"],
];

export const COUNTRIES: Country[] = NAMES.map(([code, name]) => ({
  code,
  name,
  flag: flagFromCode(code),
}));

/** País por defecto del registro (la mayoría de la comunidad). */
export const DEFAULT_COUNTRY_CODE = "MX";

export function getCountryByCode(
  code: string | null | undefined,
): Country | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return COUNTRIES.find((c) => c.code === normalized) ?? null;
}

/**
 * País por nombre en español (p. ej. "México" → MX). Para perfiles
 * de pareja, que ya guardan `country` como texto en la BD.
 */
export function getCountryByName(
  name: string | null | undefined,
): Country | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === normalized) ?? null;
}

/** "🇲🇽 México". "" si no hay país válido. */
export function formatNationality(code: string | null | undefined): string {
  const country = getCountryByCode(code);
  if (!country) return "";
  return `${country.flag} ${country.name}`;
}

/**
 * País guardado del usuario en este dispositivo.
 *
 * La columna `country_code` (migración 20261124050000) aún no está
 * aplicada en producción, así que el registro guarda aquí el país
 * (mismo patrón que `birthDate` en visibility.ts: local + intento en
 * BD). Cuando la migración esté aplicada, el perfil lee la columna
 * y este local es solo respaldo.
 */
export function countryStorageKey(userId: string): string {
  return `profile_country:${userId}`;
}

export function readCountryCodeLocal(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(countryStorageKey(userId));
    return getCountryByCode(raw)?.code ?? null;
  } catch {
    return null;
  }
}

export function writeCountryCodeLocal(userId: string, code: string): void {
  if (typeof window === "undefined" || !userId) return;
  const country = getCountryByCode(code);
  if (!country) return;
  try {
    window.localStorage.setItem(countryStorageKey(userId), country.code);
  } catch {
    // Sin almacenamiento: el país solo vive en esta sesión.
  }
}
