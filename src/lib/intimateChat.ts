/**
 * Apertura del dock de Chat Íntimo (MainLayout).
 *
 * El estado del dock vive en MainLayout y se cierra al cambiar de ruta,
 * así que la apertura desde otra página (/requests, /chat-intimo) es por
 * evento de ventana, no por navegación: navegar cerraría el dock antes
 * de que se viera. MainLayout escucha este evento y pone isChatOpen.
 */
export const OPEN_INTIMATE_CHAT_EVENT = "complices:open-chat-intimo";

export function openIntimateChat(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_INTIMATE_CHAT_EVENT));
}
