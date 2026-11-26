/**
 * Ronda 14, stream F — intereses del perfil (demo) y aviso de cambio.
 *
 * Dos defectos encadenados (F2/F8):
 *
 * 1. Trampa del array vacío: `demo_user.interests` puede ser `[]`
 *    (p. ej. lo escribió un Guardar con el formulario aún sin cargar, o
 *    la carga real de EditProfileSingle que precargaba `interests: []`).
 *    `[] ?? fallback` NO dispara (un array vacío no es nullish), así que
 *    la vista quedaba vacía aunque existieran títulos demo. Un array
 *    vacío significa "sin selección guardada" y cae al fallback.
 *
 * 2. Vocabularios distintos: los títulos demo pre-cargados
 *    ("Lifestyle Exclusivo", "Eventos VIP", ...) NO están en
 *    SAFE_INTERESTS, y el editor solo renderizaba SAFE_INTERESTS. El
 *    contador decía 3/10 o 6/6 pero ningún distintivo se veía marcado
 *    (y no se podía deseleccionar lo pre-cargado). La lista visible del
 *    editor es la unión de SAFE_INTERESTS + lo guardado.
 *
 * En real (Supabase) un array vacío SÍ es honesto (sin intereses):
 * estas funciones solo se usan para la lectura demo de `demo_user`;
 * la lectura real sigue usando las columnas tal cual.
 */

import { ALL_INTERESTS, DEMO_INTEREST_TITLES } from "@/lib/lifestyle-interests";

/** Evento que avisa a las páginas de perfil de que `demo_user` cambió. */
export const DEMO_USER_CHANGED_EVENT = "demo-user-changed";

export function notifyDemoUserChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEMO_USER_CHANGED_EVENT));
}

/**
 * Un valor guardado solo cuenta como selección si es un array de
 * strings NO vacío. `[]`, no-array o ausente → null ("sin selección").
 */
const asNonEmptyStringArray = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string")
    ? (v as string[])
    : null;

/** Intereses guardados del demo single (`demo_user.interests`). */
export function parseSavedSingleDemoInterests(
  demoUser: unknown,
): string[] | null {
  if (!demoUser || typeof demoUser !== "object") return null;
  return asNonEmptyStringArray((demoUser as { interests?: unknown }).interests);
}

export interface ParsedCoupleDemoInterests {
  couple: string[] | null;
  his: string[] | null;
  her: string[] | null;
}

/** Intereses guardados del demo pareja (`demo_user`). */
export function parseSavedCoupleDemoInterests(
  demoUser: unknown,
): ParsedCoupleDemoInterests {
  if (!demoUser || typeof demoUser !== "object") {
    return { couple: null, his: null, her: null };
  }
  const u = demoUser as {
    interests?: unknown;
    partner1?: { interests?: unknown };
    partner2?: { interests?: unknown };
  };
  return {
    couple: asNonEmptyStringArray(u.interests),
    his: asNonEmptyStringArray(u.partner1?.interests),
    her: asNonEmptyStringArray(u.partner2?.interests),
  };
}

/**
 * Lista de intereses que muestra la vista en demo: la selección
 * guardada cuando existe; si no, los títulos demo (fallback).
 */
export function resolveDemoInterestList(
  saved: string[] | null | undefined,
  fallback: readonly string[],
): string[] {
  return saved && saved.length > 0 ? [...saved] : [...fallback];
}

/* ------------------------------------------------------------------ */
/* Ronda 15, stream D — persistencia de intereses entre sesiones.      */
/* ------------------------------------------------------------------ */

/**
 * BUG (no por diseño), hallazgo del test dirigido del PR #74
 * (2026-11-26 02:27–02:44 CST): los intereses editados se
 * restablecían al reingresar (volvían a los 3 títulos demo),
 * mientras la concesión de fotos y el saldo de la wallet sí
 * persistían.
 *
 * Causa raíz: el editor guarda la selección SOLO dentro de
 * `demo_user` (localStorage). Al cerrar sesión, `clearDemoAuth`
 * (app-config.ts) borra `demo_user`; al volver a entrar, el
 * re-seed demo reconstruye `demo_user` desde cero — `handleDemoAuth`
 * (app-config.ts:148-172) y el `demoProfileData` de
 * `useAuth.signIn` (useAuth.ts:621-662) — sin campo `interests`.
 * No hay nada que "preservar en el re-seed": la sesión anterior ya
 * no existe cuando el login corre. La concesión de fotos sobrevive
 * porque vive en `friend_requests_demo` (clave aparte, no barrida)
 * y el saldo porque vive en `cc_demo_wallet_balances_v1`
 * (demo-wallet.ts): los intereses necesitan su propia clave durable
 * con el mismo patrón.
 *
 * La clave NO usa el prefijo `demo_`: `clearDemoAuth` y
 * `StorageManager.clearDemoSession` barren por prefijo `demo_` /
 * `demo-` / `demo_nfts:` y borrarían la selección en cada logout
 * (mismo precedente que `cc_local_demo_accounts_v1`,
 * `profile_country:<id>` y `single_privacy:<id>`, que sobreviven al
 * logout a propósito). `deleteLocalDemoAccount` sí la borra cuando
 * la cuenta se elimina (no es logout: es baja).
 *
 * Semántica (igual que F2): solo un array NO vacío es una selección
 * guardada. Guardar `[]` (deseleccionar todo) borra la clave y el
 * perfil vuelve a los títulos demo (fallback).
 *
 * Ronda 17, stream C — la clave durable ya NO copia las cadenas que
 * recibe: CodeQL (PR #76, check run 139878905619, regla
 * `js/clear-text-storage-of-sensitive-information`, alta) marcó el
 * `setItem` de `saveCoupleDemoInterests` porque las selecciones
 * llegan desde el `formData` del editor, construido a partir del
 * `demo_user` parseado — y ese objeto trae `gender` (Profile.gender:
 * demo-registration.ts, `demoProfileData` de useAuth). El rastreo de
 * CodeQL es a nivel de objeto: un valor derivado de un objeto que
 * contiene un campo sensible se trata como contaminado, así que
 * `formData.partner1?.interests` contaba como sensible aunque el
 * array de intereses jamás contenga el género. El JSON guardado
 * siempre fueron solo títulos de intereses, pero el código no lo
 * demostraba: ahora `sanitizeInterestsForStorage` (abajo) construye
 * lo guardado filtrando el vocabulario constante — la entrada solo
 * decide pertenencia (booleano), nunca aporta caracteres — así que
 * por construcción la clave solo puede contener títulos de interés
 * conocidos y ningún otro campo del perfil puede llegar a ella.
 */
export const DEMO_INTERESTS_KEY_PREFIX = "profile_interests:";

export function demoInterestsKey(userId: string): string {
  return `${DEMO_INTERESTS_KEY_PREFIX}${userId.trim()}`;
}

/**
 * Vocabulario de títulos de interés que pueden persistir en la clave
 * durable: los del catálogo (`ALL_INTERESTS` = SAFE + EXPLICIT) más
 * los títulos demo pre-cargados. Sin duplicados (`ALL_INTERESTS`
 * repite títulos entre SAFE y EXPLICIT, p. ej. "Experiencias
 * Sensuales"): un título duplicado en el vocabulario se guardaría dos
 * veces.
 */
const KNOWN_INTEREST_TITLES: readonly string[] = [
  ...new Set([...ALL_INTERESTS, ...DEMO_INTEREST_TITLES]),
];

/**
 * Sanitiza una selección ANTES de persistirla (ronda 17, stream C).
 *
 * Solo sobreviven los títulos del vocabulario conocido, y el array
 * resultante se construye filtrando EL VOCABULARIO (constantes del
 * módulo), no copiando las cadenas de entrada: la entrada solo
 * decide pertenencia (`wanted.has`), nunca aporta caracteres al valor
 * guardado. Por eso la clave durable `profile_interests:<id>` no
 * puede arrastrar ningún otro campo del perfil demo (p. ej. `gender`,
 * que CodeQL marcaba por contaminación a nivel de objeto: la
 * selección llega desde un `formData` derivado de `demo_user`) ni
 * texto arbitrario.
 *
 * Dos consecuencias deliberadas:
 * - Orden: lo guardado queda en orden de vocabulario (el mismo de la
 *   lista del editor), no en orden de selección. El perfil y el
 *   editor ya muestran los intereses en ese orden canónico.
 * - Títulos fuera del vocabulario se descartan al guardar. No pueden
 *   surgir de la UI: el editor ofrece SAFE + lo ya guardado, el
 *   registro ofrece SAFE y los fallbacks son los títulos demo. Solo
 *   un valor escrito a mano (o por una versión anterior) puede traer
 *   otro título, y ese título no se vuelve a guardar.
 *
 * La LECTURA no sanitiza a propósito: un valor guardado por una
 * versión anterior (p. ej. "Viajes") se sigue leyendo hasta que el
 * usuario vuelva a guardar; solo la escritura garantiza el dominio.
 */
function sanitizeInterestsForStorage(
  interests: readonly string[] | null | undefined,
): string[] | null {
  const saved = asNonEmptyStringArray(interests ?? null);
  if (!saved) return null;
  const wanted = new Set(saved);
  const clean = KNOWN_INTEREST_TITLES.filter((title) => wanted.has(title));
  return clean.length > 0 ? clean : null;
}

/** Clave durable de intereses demo de una cuenta (o null sin id). */
function readStoredDemoInterestsRaw(userId: string): unknown {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(demoInterestsKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Guarda la selección del single. `[]` (o no-array) borra la clave:
 * "sin selección" y el perfil cae al fallback demo.
 */
export function saveSingleDemoInterests(
  userId: string,
  interests: readonly string[] | null | undefined,
): void {
  if (!userId || typeof window === "undefined") return;
  try {
    const key = demoInterestsKey(userId);
    const saved = sanitizeInterestsForStorage(interests ?? null);
    if (saved) {
      window.localStorage.setItem(key, JSON.stringify(saved));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Sin almacenamiento: la selección solo vive en `demo_user`.
  }
}

/** Selección durable del single, o null si nunca se guardó. */
export function readSingleDemoInterests(userId: string): string[] | null {
  return asNonEmptyStringArray(readStoredDemoInterestsRaw(userId));
}

/**
 * Guarda la selección de la pareja (couple + por miembro). Solo se
 * persisten los campos no vacíos; si los tres están vacíos se borra
 * la clave entera.
 */
export function saveCoupleDemoInterests(
  userId: string,
  interests: {
    couple?: readonly string[] | null;
    his?: readonly string[] | null;
    her?: readonly string[] | null;
  },
): void {
  if (!userId || typeof window === "undefined") return;
  try {
    const key = demoInterestsKey(userId);
    const couple = sanitizeInterestsForStorage(interests.couple ?? null);
    const his = sanitizeInterestsForStorage(interests.his ?? null);
    const her = sanitizeInterestsForStorage(interests.her ?? null);
    if (!couple && !his && !her) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...(couple ? { couple } : {}),
        ...(his ? { his } : {}),
        ...(her ? { her } : {}),
      }),
    );
  } catch {
    // Sin almacenamiento: la selección solo vive en `demo_user`.
  }
}

/** Selección durable de la pareja (por campo), o null si no hay. */
export function readCoupleDemoInterests(
  userId: string,
): ParsedCoupleDemoInterests | null {
  const raw = readStoredDemoInterestsRaw(userId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as {
    couple?: unknown;
    his?: unknown;
    her?: unknown;
  };
  const couple = asNonEmptyStringArray(r.couple ?? null);
  const his = asNonEmptyStringArray(r.his ?? null);
  const her = asNonEmptyStringArray(r.her ?? null);
  if (!couple && !his && !her) return null;
  return { couple, his, her };
}

/** Borra la clave durable (baja de cuenta; NO en logout). */
export function clearDemoInterests(userId: string): void {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(demoInterestsKey(userId));
  } catch {
    // Sin almacenamiento: nada que borrar.
  }
}

/**
 * Selección del single que muestra el perfil: la durable manda
 * sobre `demo_user` (que el re-seed del login reconstruye sin
 * intereses); sin durable, lo que traiga `demo_user`.
 */
export function resolveSavedSingleDemoInterests(
  userId: string | null | undefined,
  demoUser: unknown,
): string[] | null {
  const durable = userId ? readSingleDemoInterests(userId) : null;
  return durable ?? parseSavedSingleDemoInterests(demoUser);
}

/**
 * Selección de la pareja que muestra el perfil: por campo, la
 * durable manda sobre `demo_user`; sin durable en ese campo, lo que
 * traiga `demo_user` en él.
 */
export function resolveSavedCoupleDemoInterests(
  userId: string | null | undefined,
  demoUser: unknown,
): ParsedCoupleDemoInterests {
  const fromDemoUser = parseSavedCoupleDemoInterests(demoUser);
  const durable = userId ? readCoupleDemoInterests(userId) : null;
  if (!durable) return fromDemoUser;
  return {
    couple: durable.couple ?? fromDemoUser.couple,
    his: durable.his ?? fromDemoUser.his,
    her: durable.her ?? fromDemoUser.her,
  };
}

/**
 * Opciones que muestra el editor: SAFE_INTERESTS más cualquier
 * interés ya guardado que no esté en la lista (títulos demo), con los
 * guardados primero para que se vean marcados arriba. Sin duplicados.
 */
export function visibleInterestOptions(
  available: readonly string[],
  saved: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const interest of [...saved, ...available]) {
    if (typeof interest !== "string" || interest.length === 0) continue;
    if (seen.has(interest)) continue;
    seen.add(interest);
    out.push(interest);
  }
  return out;
}
