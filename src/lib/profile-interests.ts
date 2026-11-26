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
