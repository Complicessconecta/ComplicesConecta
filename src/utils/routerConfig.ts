/**
 * Configuración del router de la app (RONDA 17, stream A — fix
 * GLOBAL de la vista rancia).
 *
 * `APP_ROUTER_USE_TRANSITIONS = false` es el fix: `BrowserRouter`
 * (react-router-dom 7) envuelve CADA navegación en
 * `React.startTransition` salvo que se le pase `useTransitions={false}`
 * (el listener de `history` en `BrowserRouter` decide ahí, no en el
 * `navigate()` del click). Mientras la ruta destino es lazy y su
 * chunk está en frío, la transición RETIENE la UI ya visible: la URL
 * cambia al instante pero la vista vieja se queda — sin loader, sin
 * vista nueva — hasta que el chunk llega (o hasta recargar). Eso es
 * lo que vio el test dirigido de la ronda 16 en los 5 caminos
 * (/demo→/profile-single, /demo→/profile-couple, /clubs→/clubs/demo,
 * /discover→/profile/<id>, perfil→/chat/<id>).
 *
 * Por qué NO bastó el fix de la ronda 16 (`key={pathname}` en el
 * Suspense de MainLayout): la `key` solo hace que el boundary sea
 * nuevo cuando React por fin commitea el render de la transición; no
 * hace que el commit sea síncrono. En el navegador real (hilo
 * principal ocupado: countdowns, animaciones) ese commit puede
 * tardar todo lo que tarda el chunk. Y el `flushSync: true` del
 * botón "Enviar mensaje" (ProfileDetail) es un no-op aquí: la app
 * usa `BrowserRouter` plano (no data router), así que `useNavigate`
 * va por `history.push` y la única decisión transición/síncrono vive
 * en el listener del router, no en la opción del `navigate()`.
 *
 * Con `false`, la navegación es una actualización URGENTE: si la
 * ruta destino suspende (chunk en frío), React commitea el fallback
 * del Suspense de MainLayout (`<PageLoader />`) de inmediato y la
 * vista vieja nunca se retiene. Es el comportamiento de react-router
 * < 6.4 y cubre TODAS las navegaciones (Link, navigate, atrás/
 * adelante) sin tocar cada call site ni precargar cada chunk. La
 * `key={pathname}` se conserva como segunda red (boundary nuevo por
 * navegación). Ver `src/tests/unit/r17-stream-a.test.tsx`.
 */
export const APP_ROUTER_USE_TRANSITIONS = false;
