import { lazy } from "react";

/**
 * Helper to wrap React.lazy so that it always resolves a module with a `default` export.
 * If the imported module does not provide a `default`, the provided `named` export
 * will be used; if that is also missing, the first export in the module is used.
 *
 * Usage:
 * const ChatInfo = lazyWithDefault(() => import('@/pages/ChatInfo'), 'ChatInfo');
 */
export function lazyWithDefault<T>(importer: () => Promise<T>, named?: string) {
  return lazy(() =>
    importer().then((m: any) => {
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
