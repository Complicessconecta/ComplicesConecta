import type { ComponentType } from "react";

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

/**
 * Carga del chunk del Chat con un reintento (ronda 7, punto 6).
 *
 * El dock de Chat Íntimo y /chat-intimo cargan `@/pages/Chat` con
 * `React.lazy`: si la primera descarga del chunk falla (preview con
 * despliegue a medias, red móvil), el `import()` rechaza y sin
 * reintento el dock se quedaba en "Cargando chat…" hasta que el
 * usuario cerrara y volviera a abrir. Un reintento a los 800 ms
 * cubre el fallo transitorio; si el segundo también falla, el error
 * llega al boundary del dock / de /chat-intimo, que ya ofrece
 * "Reintentar" en vez de un loader eterno.
 */
export async function loadChatModule(): Promise<{
  default: ComponentType<{ embedded?: boolean }>;
}> {
  try {
    return (await import("@/pages/Chat")) as {
      default: ComponentType<{ embedded?: boolean }>;
    };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return (await import("@/pages/Chat")) as {
      default: ComponentType<{ embedded?: boolean }>;
    };
  }
}
