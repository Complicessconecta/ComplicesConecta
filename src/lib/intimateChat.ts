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
 * CAUSA RAÍZ del "Cargando chat…" >8 s del dock (ronda 8, punto 5).
 *
 * El "Cargando chat…" del dock (y de /chat-intimo) es el fallback del
 * `Suspense` del `import("@/pages/Chat")`: nada dentro del Chat
 * suspende (ni `useFeatures`, ni `useRealtimeChat`, ni los efectos de
 * modo demo/producción — todos corren DESPUÉS de montar). El fallback
 * solo se ve mientras descarga el chunk `pages-chat`: 1.578 kB
 * (428 kB gzip, medido en el build local de esta ronda).
 *
 * El dock es el PRIMER contacto del usuario con ese chunk en casi
 * todas las páginas (píldora "Abrir Chat" / botón "Chat Íntimo" de
 * /requests), así que el dock paga la descarga en frío. La única
 * precarga era la de MainLayout (2 s de temporizador o
 * `requestIdleCallback`): una carrera que pierde siempre que el
 * usuario abre el chat en los primeros segundos o con la página
 * ocupada (móvil), y que además no cubre la descarga en sí, solo su
 * inicio. El `CodeSplittingManager` tiene un preload de /chat, pero
 * el componente no está montado en ningún lado: nunca corre. Y una
 * descarga lenta NUNCA rechaza el `import()`: el reintento de la
 * ronda 7 (800 ms, solo ante rechazo) no se disparaba y el spinner no
 * tenía cota superior ni salida.
 *
 * Por eso la página /chat-intimo "funcionaba" en el test: al navegar
 * a ella, la descarga que el dock había empezado seguía en segundo
 * plano y ya estaba en la caché de módulos, así que resolvía al
 * instante. No es un problema de tema (pasaba en claro y oscuro) ni
 * del evento ni del boundary: es chunk frío + espera sin cota.
 *
 * El arreglo (las tres piezas van juntas):
 * 1. Esta función acota la espera a 6 s: si el chunk no llega, el
 *    error sube al boundary del dock / de /chat-intimo, que ofrece
 *    "Reintentar" (para entonces la descarga en segundo plano suele
 *    haber terminado y resuelve al instante) y "Abrir en página
 *    completa" (/chat-intimo, mismo chunk ya caliente). El spinner ya
 *    no puede pasar de ~6 s.
 * 2. MainLayout precarga el chunk AL MONTAR, no a los 2 s ni en idle:
 *    en cuanto entra a cualquier página, la descarga ya corre y el
 *    dock la encuentra caliente.
 * 3. Sin reintento automático aquí: el de la ronda 7 solo cubría el
 *    rechazo y alargaba el stall; el reintento es el botón del
 *    boundary, que recrea el lazy (ver ChatIntimo / ChatDock).
 */
export const CHAT_LOAD_TIMEOUT_MS = 6000;

type ChatModule = {
  default: ComponentType<{ embedded?: boolean }>;
};

function importChatChunk(): Promise<ChatModule> {
  return import("@/pages/Chat") as Promise<ChatModule>;
}

export async function loadChatModule(): Promise<ChatModule> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `Chat chunk timeout (${CHAT_LOAD_TIMEOUT_MS} ms sin resolver)`,
            ),
          ),
        CHAT_LOAD_TIMEOUT_MS,
      );
    });
    return await Promise.race([importChatChunk(), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
