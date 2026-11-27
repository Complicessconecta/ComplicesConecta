/**
 * Ronda 21 (stream B, FAIL 6): historial de matches en sesión demo.
 *
 * Causa raíz verificada en código: los matches demo NO viven en
 * ningún almacén (ni localStorage ni MatchService — este último solo
 * habla con Supabase): `src/pages/Matches.tsx` los tiene como semilla
 * hardcodeada (`demoMatches`, 6 entradas) en estado del componente.
 * Por eso `handleDeleteMatches` de `PrivacySettings` no tenía nada
 * local que borrar y siempre caía al servicio Supabase, que falla
 * para un UUID demo (~8 s → toast de error, historial intacto).
 *
 * La "eliminación" demo es una marca por usuario
 * (`cc_demo_matches_cleared:<userId>`): `Matches.tsx` la respeta al
 * cargar y muestra la lista vacía (estado vacío "No hay matches").
 * Los usuarios reales siguen yendo a `dataPrivacyService`.
 */
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

/** Nº de matches de la semilla demo visible en /matches. */
export const DEMO_MATCH_SEED_COUNT = 6;

const clearedKey = (userId: string): string =>
  `cc_demo_matches_cleared:${userId}`;

/** ¿Este usuario demo ya eliminó su historial de matches? */
export function isDemoMatchHistoryCleared(userId: string): boolean {
  if (!userId) return false;
  return (
    safeGetItem<string>(clearedKey(userId), {
      validate: true,
      defaultValue: "false",
    }) === "true"
  );
}

/**
 * Marca el historial demo como eliminado. Devuelve cuántos matches
 * visibles se eliminaron (la semilla completa si era la primera vez,
 * 0 si ya estaba vacío).
 */
export function clearDemoMatchHistory(userId: string): {
  deletedCount: number;
} {
  if (!userId) return { deletedCount: 0 };
  if (isDemoMatchHistoryCleared(userId)) return { deletedCount: 0 };
  safeSetItem(clearedKey(userId), "true");
  return { deletedCount: DEMO_MATCH_SEED_COUNT };
}
