import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Ronda 18, stream B — `lazy()` con tope de espera para chunks de ruta.
 *
 * El `lazy()` pelado de `App.tsx` no tiene cota: si el `import()` del
 * chunk no resuelve NI rechaza (descarga colgada en red móvil, hilo
 * principal ocupado), el fallback del Suspense se queda para siempre.
 * Eso es lo que vio el test dirigido de la ronda 17 en /profile/:id
 * (PR #77, DO NOT MERGE, 2026-11-26 06:46–07:02 CST, 886 px): el
 * `PageLoader` de MainLayout ("Cargando...") atascado 45–90 s en las 4
 * cargas, 2 con recarga manual. El chunk `pages-profiles` mide solo
 * 52,38 kB (13,47 kB gzip): no es tamaño, es una descarga que se
 * queda colgada sin que nada la corte.
 *
 * Patrón ya usado en el repo para la misma clase de síntoma:
 * - `loadChatModule` (ronda 8): timeout de 6 s en el chunk del chat.
 * - Consulta Supabase del wrapper de ProfileDetail (ronda 17,
 *   stream B): `Promise.race` a 10 s.
 * - `supabase.auth.getUser()` en EditProfileSingle: `Promise.race`
 *   con rechazo a 8 s.
 *
 * La carrera rechaza al vencer el tope y React propaga el rechazo al
 * error boundary más cercano (aquí, el de la ruta, que ofrece
 * Reintentar recreando el lazy — remontar el boundary solo NO
 * reintenta: `React.lazy` cachea el rechazo, mismo patrón que el
 * dock de chat en MainLayout). Si el `import()` original seguía en
 * curso, el navegador reutiliza esa descarga (el fetch del módulo se
 * deduplica), así que el reintento no reinicia la descarga desde cero.
 */
export class ChunkLoadTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(chunkName: string, timeoutMs: number) {
    super(`Chunk "${chunkName}" no cargó en ${timeoutMs} ms`);
    this.name = "ChunkLoadTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/** Mensajes de fallo de descarga del chunk (Vite / navegador / webpack). */
const CHUNK_LOAD_MESSAGE_RES = [
  /dynamically imported module/i,
  /Failed to fetch/i,
  /Importing a module script failed/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
];

/**
 * ¿El error es un fallo de DESCARGA del chunk (timeout o fetch roto) y
 * no un error de render del componente? Solo los primeros los atiende
 * el boundary de la ruta: un error de render se propaga al
 * ErrorBoundary raíz (que en producción redirige a /404), como antes
 * del fix.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (error instanceof ChunkLoadTimeoutError) return true;
  if (error instanceof Error) {
    return CHUNK_LOAD_MESSAGE_RES.some((re) => re.test(error.message));
  }
  return false;
}

/**
 * Carrera del `import()` contra el tope. Se exporta suelta para
 * poder probarla como promesa sin montar React.
 */
export function raceChunkLoad<T>(
  importer: () => Promise<T>,
  timeoutMs: number,
  chunkName: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new ChunkLoadTimeoutError(chunkName, timeoutMs)),
      timeoutMs,
    );
  });
  return Promise.race([importer(), timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

/**
 * Como `React.lazy`, pero el chunk tiene tope: si no carga en
 * `timeoutMs`, la promesa rechaza con `ChunkLoadTimeoutError`.
 */
export function lazyWithTimeout(
  importer: () => Promise<{ default: ComponentType<unknown> }>,
  timeoutMs: number,
  chunkName: string,
): LazyExoticComponent<ComponentType<unknown>> {
  return lazy(() => raceChunkLoad(importer, timeoutMs, chunkName));
}
