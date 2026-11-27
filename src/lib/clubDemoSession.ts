/**
 * Sesión demo del club (ronda 14, stream E; corregida ronda 15, stream B).
 *
 * Hasta la ronda 13 la vista admin de /clubs/demo no tenía sesión: era
 * solo `showAdminPanel` con inicial `true` en ClubsDemo, así que
 * cualquier visita — anónima, sin login demo — caía en el Panel Admin,
 * y no había forma de cerrar nada porque no había nada que cerrar.
 * Wacko (2026-11-26): el flujo está al revés — /clubs/demo debe abrir
 * en vista pública y el admin solo entra por acción explícita — y una
 * vez en la vista pública / listado no hay forma de cerrar la sesión
 * demo, que queda abierta.
 *
 * La sesión de creador/admin del club demo se marca con esta clave en
 * localStorage. Clave con prefijo `demo_` a propósito: `clearDemoAuth`
 * (app-config) y `StorageManager.clearDemoSession` barren por prefijo
 * en cada logout de la app, así que el "Cerrar sesión" de la cabecera
 * global de /clubs/demo (MainLayout, `isClubDemoRoute`, que es el
 * logout de la app) también la limpia sin tocar MainLayout.
 * `closeClubDemoSession` borra solo la marca de admin: cerrar el club
 * no es cerrar la cuenta demo del usuario (ronda 15, stream B).
 */
export const CLUB_DEMO_ADMIN_SESSION_KEY = "demo_club_admin";

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento: no hay sesión que persistir.
  }
};

const remove = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
};

/** ¿La visita actual entró al admin del club demo por el flujo? */
export const hasClubDemoAdminSession = (): boolean =>
  read(CLUB_DEMO_ADMIN_SESSION_KEY) === "true";

/** Marcar que se entró al admin del club demo (acción "Panel Admin"). */
export const enterClubDemoAdminSession = (): void =>
  write(CLUB_DEMO_ADMIN_SESSION_KEY, "true");

/** Borrar la marca de admin del club demo (salir del admin / logout). */
export const clearClubDemoAdminSession = (): void =>
  remove(CLUB_DEMO_ADMIN_SESSION_KEY);

/**
 * ¿Hay sesión demo que cerrar en el listado público de clubs? La de
 * la app (`demo_authenticated`) o la de admin del club demo. Solo la
 * usa /clubs-public, donde "Cerrar sesión" SÍ es el logout de la app
 * demo (no hay vista admin ahí). /clubs/demo ya no la usa: su botón
 * en página cierra solo la sesión del club y solo se muestra con
 * sesión de admin del club (ronda 15, stream B).
 */
export const isClubDemoSessionActive = (): boolean =>
  read("demo_authenticated") === "true" || hasClubDemoAdminSession();

/**
 * Cerrar la sesión demo del club: borra SOLO la marca de admin del
 * club demo (`demo_club_admin`). La sesión demo de la app
 * (`demo_authenticated`, p. ej. Sofía) sobrevive por diseño: cerrar
 * el club no es cerrar la cuenta.
 *
 * Ronda 15, stream B: antes llamaba a `clearDemoAuth()` y el
 * "Cerrar sesión" en página de /clubs/demo deslogueaba a la usuaria
 * demo entera (/profile-single redirigía a /auth). El logout de la
 * app sigue viviendo en la cabecera global (MainLayout, `signOut`)
 * y en el botón de /clubs-public, que barren las dos sesiones.
 */
export const closeClubDemoSession = (): void => {
  clearClubDemoAdminSession();
};
