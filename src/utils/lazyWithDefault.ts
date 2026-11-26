import { lazy } from "react";

/**
 * Helper to wrap React.lazy so that it always resolves a module with a `default` export.
 * If the imported module does not provide a `default`, the provided `named` export
 * will be used; if that is also missing, the first export in the module is used.
 *
 * Usage:
 * const ChatInfo = lazyWithDefault(() => import('@/pages/ChatInfo'), 'ChatInfo');
 *
 * RONDA 15 (stream C, dock lento — test PR #74): React.lazy cachea el
 * import rechazado, así que un fallo transitorio de chunk (red móvil,
 * despliegue nuevo entre la carga del HTML y la del chunk) envenenaba
 * la ruta hasta recargar la página completa — el primer intento de
 * Config solo se vio tras recargar. Un único reintento antes de
 * resolver/rechazar cubre el fallo transitorio; si el segundo intento
 * también falla, el error se propaga igual que antes.
 */
export function lazyWithDefault<T>(importer: () => Promise<T>, named?: string) {
  return lazy(() =>
    importer()
      .catch(() => importer())
      .then((m: any) => {
        if (m.default) return { default: m.default };
        if (named) {
          const picked = (m as Record<string, any>)[named];
          if (picked) {
            return { default: picked };
          }
        }
        // Fallback: pick first export
        const firstKey = Object.keys(m)[0] as keyof typeof m;
        return { default: (m as any)[firstKey] };
      }),
  );
}
