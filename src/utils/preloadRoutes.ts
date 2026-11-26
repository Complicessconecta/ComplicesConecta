/**
 * Ronda 16 (stream C): precarga de la ruta de chat (`/chat/:id`,
 * chunk `pages-chat`, lazy en `App.tsx`).
 *
 * Causa raíz del "primer click en 'Enviar mensaje' no hace nada" en
 * el perfil público: `navigate()` va envuelto en `startTransition`
 * (react-router) y la ruta de chat es lazy, así que en frío la
 * transición mantiene la UI vieja (el perfil) visible hasta que el
 * chunk llega — sin fallback, sin cambio visible — y el usuario cree
 * que el click no funcionó; el reintento ya encuentra el chunk en
 * caché y navega al instante. Calentar el chunk con el hover/foco
 * del botón (intención real, sin el coste de precargarlo en cada
 * perfil que se visita) cubre el escritorio; en táctil el primer
 * toque navega con `flushSync: true` y el `PageLoader` aparece de
 * inmediato (ver el botón en `ProfileDetail`).
 *
 * `import()` es idempotente: el chunk se descarga una sola vez y los
 * imports siguientes resuelven del caché de módulos. Si falla (red),
 * se traga: la navegación real lo reintenta vía `lazyWithDefault`
 * (ronda 15, stream C).
 */
export function preloadChatPage(): void {
  void import("@/pages/Chat").catch(() => {
    // Sin reintento aquí: el click navega igual.
  });
}
