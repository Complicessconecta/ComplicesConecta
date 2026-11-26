import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PageBackground } from "@/components/ui/backgrounds/UnifiedBackground";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import {
  CHAT_LOAD_TIMEOUT_MS,
  OPEN_INTIMATE_CHAT_EVENT,
  loadChatModule,
} from "@/lib/intimateChat";
import { ChatFab } from "@/components/chat/ChatFab";
import { HeaderNav } from "@/components/HeaderNav";
import { Navigation } from "@/components/Navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Toaster } from "@/components/ui/toaster";
// El lazy del Chat NO vive a nivel de módulo (ver ChatDock abajo):
// React.lazy cachea el rechazo del `import()` y remontar el boundary
// no reintenta el chunk; el reintento recrea el lazy desde el estado.
import { NotificationContainer } from "@/components/animations/NotificationSystem";
import { clearClubDemoAdminSession } from "@/lib/clubDemoSession";

// Loading component
const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white text-lg">Cargando...</p>
    </div>
  </div>
);

export const MainLayout = () => {
  const { profile: _profile, isAuthenticated, user, signOut } = useAuth();
  const location = useLocation();

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Precarga del chunk de Chat AL MONTAR: al abrir el dock el
  // componente ya está en caché y no aparece el "Cargando…".
  // RONDA 8 (punto 5): la precarga anterior esperaba
  // `requestIdleCallback` o un temporizador de 2 s — una carrera que
  // pierde siempre que el usuario abre el chat en los primeros
  // segundos o con la página ocupada (móvil), justo cuando el dock
  // paga la descarga en frío del chunk `pages-chat` (1.578 kB).
  // Arrancar la descarga con el layout es lo que la deja caliente a
  // tiempo; el `.catch` es porque `loadChatModule` ahora acota la
  // espera a 6 s y la precarga en segundo plano no debe dejar un
  // rechazo sin manejar (la descarga real sigue en curso y el dock
  // la reutiliza al abrirse).
  useEffect(() => {
    void loadChatModule().catch(() => {
      // Precarga en segundo plano: el dock reintentará al abrirse.
    });
  }, []);

  // Determine session state
  const isAuthFn =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;

  const pathname = location.pathname;

  // Lista explícita de rutas donde NO debe aparecer HeaderNav
  // HeaderNav es consistente en TOdas las páginas públicas (incluso logueado)
  const HIDE_HEADER_EXACT = new Set<string>(["/auth"]);
  const HIDE_HEADER_PREFIXES: string[] = [
    "/profile",
    "/profile-single",
    "/profile-couple",
    "/edit-profile-",
    "/profile/",
    "/tokens",
    "/tokens-",
    "/clubs/demo",
  ];

  const shouldHideHeader =
    HIDE_HEADER_EXACT.has(pathname) ||
    HIDE_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const showHeaderNav = !hasSession && !shouldHideHeader;

  // Corregir scroll al inicio al cargar página
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Cerrar el dock de chat al navegar: MainLayout se mantiene montado
  // entre navegaciones SPA y el estado isChatOpen persistía, dejando el
  // panel abierto sobre cualquier página hasta un reload completo. Esto
  // también hace que el botón de regreso de la página de Chat (que navega
  // a /feed) cierre el dock, sin tocar la página de Chat.
  React.useEffect(() => {
    setIsChatOpen(false);
  }, [pathname]);

  // Abrir el dock de Chat Íntimo por evento (botón en /requests y ruta
  // /chat-intimo): el estado vive aquí y navegar lo cerraría, así que la
  // apertura es por evento y no por navegación.
  React.useEffect(() => {
    const open = () => setIsChatOpen(true);
    window.addEventListener(OPEN_INTIMATE_CHAT_EVENT, open);
    return () => window.removeEventListener(OPEN_INTIMATE_CHAT_EVENT, open);
  }, []);

  const isClubDemoRoute = pathname === "/clubs/demo";

  // Rutas a pantalla completa: en /chat la burbuja de chat es redundante
  // (ya estás en el chat), así que el ChatFab no se renderiza ahí.
  // (RONDA 5: el engranaje que tapaba el compositor en /chat y los
  // controles en /video-chat ya no existe como flotante; el host del
  // modal se monta siempre y no tapa nada.)
  // RONDA 7 (punto 6): /chat-intimo ES una ruta de chat (el Chat a
  // pantalla completa): sin esto MainLayout le ponía encima su fila
  // superior (← Volver + ajustes + tema) y la píldora ChatFab al final,
  // y el dock podía abrirse sobre la página.
  const isChatRoute =
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/chat-intimo";

  // RONDA 6 (punto 2): HeaderNav y la cabecera de /clubs/demo ya son EN
  // FLUJO (relative) y ocupan su propio sitio: el <main> ya no necesita
  // el pt de 4-6rem que compensaba el header `fixed` (ese hueco duplicaba
  // el espacio superior). Solo queda el safe-area superior.
  const headerOffsetClass = "pt-[env(safe-area-inset-top)]";

  // Chat FAB no se muestra en rutas de perfil
  const isProfileRoute =
    pathname === "/profile" ||
    pathname === "/profile-single" ||
    pathname === "/profile-couple" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/edit-profile-");

  // La barra de 10 botones (Navigation) es el dock DEL PERFIL: solo se
  // muestra en rutas de perfil (demo o producción). Antes dependía de
  // isDemo() y se alternaba con el dock de 5 botones (BottomNavigation)
  // en el mismo perfil (10 iconos a las 13:07, 5 a las 13:19): el dock
  // debe ser ESTABLE. Ahora Navigation es el único dock de perfil, con
  // o sin demo; BottomNavigation ya no se renderiza.
  // RONDA 5 — Regla de Wacko "dock solo en el perfil": el dock es SOLO
  // para el perfil PROPIO (/profile, /profile-single, /profile-couple).
  // Antes showDock usaba isProfileRoute, que incluye /profile/<id>
  // (perfil de OTRO usuario) y /edit-profile-*, y el dock aparecía ahí.
  // Esas rutas ahora llevan la fila superior en flujo con Volver.
  const isOwnProfileRoute =
    pathname === "/profile" ||
    pathname === "/profile-single" ||
    pathname === "/profile-couple";
  const showDock = isOwnProfileRoute;

  // Fila superior en flujo (solo Volver) para rutas logueadas sin dock
  // ni header: misma lista de exclusiones que el BackButton (esas rutas
  // ya tienen su propio regreso o navegación).
  // Es EN FLUJO (dentro de <main>), nunca `fixed`: no tapa contenido.
  // RONDA 7 (punto 2): el engranaje de animaciones y el botón de tema
  // YA NO viven en esta fila: aparecían arriba a la derecha en TODAS
  // las páginas logueadas sin dock (/matches, /requests, /faq, /terms,
  // /tokens-legal, /edit-profile-*, 404...) y se leían como botones
  // flotantes fijos. Tema y animaciones ya tienen su sitio: el dock
  // (perfil propio: luna 11.ª + botón "Config") y el HeaderNav
  // (páginas públicas). Esta fila queda solo con Volver.
  const isTopRowExcludedRoute =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/clubs/demo" ||
    pathname === "/tokens" ||
    pathname.startsWith("/tokens/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    // RONDA 7 (punto 6): /chat-intimo ya tiene su propio encabezado
    // ("Chat Íntimo" / "Cerrar"); la fila superior de MainLayout
    // duplicaba el regreso encima de él.
    pathname === "/chat-intimo" ||
    pathname === "/settings" ||
    pathname === "/video-chat" ||
    pathname === "/clubs-public" ||
    pathname.startsWith("/clubs-public/");
  const showTopRow = hasSession && !isOwnProfileRoute && !isTopRowExcludedRoute;

  const showChatFab = !isProfileRoute && !isChatRoute;

  return (
    // RONDA 5 — Tema claro: el texto raíz era `text-white` incondicional,
    // así que en tema claro todo texto heredado quedaba blanco sobre fondo
    // claro (invisible). Ahora sigue al tema; el fondo claro lo ponen
    // body (token bg-background) y UnifiedBackground.
    <div className="min-h-dvh w-full text-slate-900 dark:text-white pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
      <div className="min-h-full relative pb-24 flex flex-col">
        {/* AnimatedBackground centralizado en PageBackground (UnifiedBackground) */}
        {/* RONDA 5: AnimationSettingsButton ya no pinta ningún botón
            flotante (el engranaje `fixed bottom-4 left-4` se eliminó);
            aquí solo se monta el host del modal, que abren el botón
            "Config" del dock, el engranaje del header y la fila superior
            en flujo. Se monta siempre, también en /chat y /video-chat,
            porque el host es invisible y no tapa nada. */}
        <AnimationSettingsButton />

        {showHeaderNav && <HeaderNav />}

        {isClubDemoRoute && (
          // RONDA 6 (punto 2): cabecera EN FLUJO (antes `fixed top-0`):
          // fija seguía al scroll en /clubs/demo y tapaba contenido.
          <div className="header-nav-main relative z-50 safe-area-pt">
            <div className="bg-linear-to-b from-purple-900/90 via-purple-800/85 to-transparent backdrop-blur-md border-b border-purple-500/20">
              <div className="w-full max-w-[1920px] mx-auto">
                <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">
                      Club Demo
                    </div>
                    <div className="text-white/70 text-xs truncate">
                      Perfil demo verificado
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.replaceState({}, "", "/clubs/demo");
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all duration-300"
                    >
                      Club Demo
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        // Ronda 14, stream E: este logout también cierra
                        // la sesión de admin del club demo. `signOut`
                        // solo barre la sesión demo de la app cuando
                        // `demo_authenticated` está puesto; un visitante
                        // anónimo que entró al admin por "Panel Admin"
                        // no la tiene, y sin esta línea la marca
                        // `demo_club_admin` sobrevivía y /clubs/demo
                        // reabría en admin tras el logout.
                        clearClubDemoAdminSession();
                        await signOut();
                        window.location.assign("/");
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 backdrop-blur-sm transition-all duration-300"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat FAB: RONDA 5 — ya no se renderiza flotante aquí. Vive en
            flujo al final del contenido (ver debajo de </main>). */}

        {/* Chat Dock in-app */}
        {hasSession && showChatFab && (
          <ChatDock isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}

        {/* Main Content */}
        <main className={headerOffsetClass}>
          {/* RONDA 7 (punto 10): zona de avisos EN FLUJO al inicio de
              <main>: los toasts Radix (Toaster) y las notificaciones
              (NotificationContainer) ya NO son overlays `fixed` — un
              overlay tapa siempre algo (el toast de tema tapaba el
              nombre/foto del perfil, "Perfiles actualizados" la barra
              superior, "Like enviado!" la foto de Ana...). Aquí empujan
              el contenido hacia abajo mientras están visibles y no
              ocupan nada cuando están vacíos (viewport/contenedor con
              `empty:hidden`). Fondo sólido según tema (ver ui/toast.tsx
              y NotificationSystem). */}
          <Toaster />
          <NotificationContainer />
          {/* RONDA 5 — Fila superior EN FLUJO (nunca `fixed`): solo
              Volver. (RONDA 7, punto 2: el engranaje y el botón de tema
              se quitaron de aquí: vivían arriba a la derecha en todas
              las páginas logueadas sin dock. Ahora solo están en el
              dock del perfil propio y en el HeaderNav público.) */}
          {showTopRow && (
            <div className="flex items-center justify-between gap-2 px-4 pt-2">
              <BackButton />
              {/* RONDA 14 (stream C, punto C3): la campana NO estaba
                  montada en ningún sitio (ni header, ni nav, ni dock):
                  el componente NotificationBell existía y funcionaba,
                  pero no había campana/centro alcanzable en la UI (el
                  test de la ronda 13 solo veía los toasts). La fila
                  superior EN FLUJO es su sitio: páginas logueadas sin
                  dock ni header (Discover, Matches, Feed, /profile/id,
                  ...); el desplegable ES el centro (lista, no leídas,
                  marcar leídas, eliminar). Sin flotantes: vive en flujo
                  a la derecha, junto a Volver. */}
              <NotificationBell />
            </div>
          )}
          <div className={showHeaderNav ? "-mt-px" : ""}>
            {/* Sin PageTransitionWrapper: el AnimatePresence que envolvía
              el Outlet dejaba atorada la navegación al salir de un chat
              (la URL cambiaba a /matches o /discover pero la pantalla se
              quedaba en el chat, en los dos modos: "wait" y por defecto).
              La transición entre páginas es cosmética; la navegación no
              debe depender de ella. El Outlet se renderiza directo.
              key={pathname} fuerza el remontaje de la página en cada
              navegación SPA: sin él, Ley Olimpia y Moderadores cambiaban
              la URL pero conservaban el contenido anterior hasta recargar. */}
            <PageBackground>
              <Suspense fallback={<PageLoader />}>
                <Outlet key={pathname} />
              </Suspense>
            </PageBackground>
          </div>
        </main>

        {/* Chat: botón en flujo al final del contenido de la página
            (RONDA 5: ya no es un FAB `fixed bottom-24 right-4` que
            seguía al scroll y tapaba contenido; en rutas de perfil no
            se muestra porque el chat ya vive en el dock).
            RONDA 6 (punto 2): centrado y en píldora con texto (ver
            ChatFab): abajo a la derecha y redondo se seguía leyendo
            como burbuja flotante en páginas cortas (404, /matches). */}
        {showChatFab && (
          <div className="flex justify-center px-4 py-3">
            <ChatFab onOpen={() => setIsChatOpen(true)} />
          </div>
        )}

        {/* Bottom Navigation (perfil) — el dock de 10 botones, estable en
          rutas de perfil con o sin demo */}
        {showDock && <Navigation />}

        {/* RONDA 7 (punto 10): el <Toaster /> ya no va aquí abajo: el
            viewport vive EN FLUJO al inicio de <main>, ver arriba. */}
      </div>
    </div>
  );
};

// Botón "Volver" para rutas autenticadas sin dock (feed, chat,
// tokens, clubs, ajustes...): vuelve a la página anterior o al perfil.
// RONDA 5: ya NO es una píldora `fixed` (tapaba títulos y se solapaba
// con el "Volver" propio de varias páginas); vive EN FLUJO en la fila
// superior de MainLayout.
const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemo, getProfileType } = useAuth();
  const pathname = location.pathname;

  // Rutas que ya tienen su propio regreso o navegación: landing, auth,
  // club demo (botón Volver propio), tokens (TokensSubnav) y chat (su
  // propio "Volver": en el hilo vuelve a la lista y en la lista al feed).
  // La píldora fija de aquí flotaba sobre el hilo y la galería del chat.
  // También /settings, /video-chat y /clubs-public: tienen su propio
  // Volver en el flujo de la página; la píldora fija se solapaba con él
  // (misma esquina superior izquierda) y dejaba dos "Volver" por pantalla.
  if (
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/clubs/demo" ||
    pathname === "/tokens" ||
    pathname.startsWith("/tokens/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    // RONDA 7 (punto 6): /chat-intimo tiene su propio "Cerrar".
    pathname === "/chat-intimo" ||
    pathname === "/settings" ||
    pathname === "/video-chat" ||
    pathname === "/clubs-public" ||
    pathname.startsWith("/clubs-public/")
  ) {
    return null;
  }

  const handleBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    // Sin historial previo: al perfil en demo, al inicio en real.
    if (typeof isDemo === "function" ? isDemo() : Boolean(isDemo)) {
      navigate(
        getProfileType() === "couple" ? "/profile-couple" : "/profile-single",
      );
      return;
    }
    navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Volver a la página anterior"
      className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:bg-white dark:bg-black/60 dark:border-white/20 dark:text-white dark:hover:bg-black/80"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  );
};

// Loader CONFINADO al cuerpo del dock (420 px): antes el fallback era
// PageLoader (`fixed inset-0 z-50`), que cubría TODA la pantalla incluido
// el botón "Cerrar" del encabezado del dock: mientras el chunk del chat
// cargaba (o se atascaba), "Cerrar" era intocable 20 s+ (punto 10).
const ChatDockLoader = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-black/40">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
    <p className="text-sm text-slate-600 dark:text-white/70">Cargando chat…</p>
  </div>
);

interface ChatDockErrorBoundaryProps {
  onRetry: () => void;
  onOpenFullPage: () => void;
  children: React.ReactNode;
}

interface ChatDockErrorBoundaryState {
  hasError: boolean;
}

// Panel de error de carga del dock: lo usan el boundary (rechazo del
// lazy) y el vigilante de carga de ChatDock (el lazy nunca se resuelve
// ni rechaza). Mismo texto y mismos botones en ambos caminos.
const ChatDockLoadError: React.FC<{
  onRetry: () => void;
  onOpenFullPage: () => void;
}> = ({ onRetry, onOpenFullPage }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center dark:bg-black/40">
    <p className="text-sm font-semibold text-slate-900 dark:text-white">
      No se pudo cargar el chat
    </p>
    <p className="text-xs text-slate-600 dark:text-white/70">
      Revisa tu conexión e inténtalo de nuevo.
    </p>
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
      >
        Reintentar
      </button>
      {/* Ronda 8 (punto 5): salida al mismo chat a pantalla
          completa (/chat-intimo, mismo chunk): si la descarga se
          atascó en el dock, la página la reutiliza ya caliente
          en vez de dejar al usuario sin chat. */}
      <button
        type="button"
        onClick={onOpenFullPage}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/20 dark:text-white dark:hover:bg-white/20"
      >
        Abrir en página completa
      </button>
    </div>
  </div>
);

// Si el chunk del chat falla al cargar, el dock mostraba "Cargando…"
// para siempre. El boundary muestra el error con "Reintentar" y
// "Cerrar" sigue funcionando (está fuera del boundary).
class ChatDockErrorBoundary extends React.Component<
  ChatDockErrorBoundaryProps,
  ChatDockErrorBoundaryState
> {
  state: ChatDockErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChatDockErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Sin logger aquí: MainLayout no lo importa y el error queda en consola.
    console.error("[ChatDock] no se pudo cargar el chat:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChatDockLoadError
          onRetry={this.props.onRetry}
          onOpenFullPage={this.props.onOpenFullPage}
        />
      );
    }
    return this.props.children;
  }
}

// El notificador solo se monta cuando el lazy resolvió (Suspense
// retiene todo el subárbol mientras el chunk está pendiente): su
// efecto de montaje es la señal "el chat cargó" que el vigilante de
// ChatDock usa para no mostrar el error cuando el chat ya está en
// pantalla. Sin tocar Chat.tsx.
const ChatReadyNotifier: React.FC<{
  onReady: () => void;
  children: React.ReactNode;
}> = ({ onReady, children }) => {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return <>{children}</>;
};

interface ChatDockProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDock: React.FC<ChatDockProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  // `key` del boundary: al reintentar se remonta y limpia `hasError`.
  const [errorKey, setErrorKey] = useState(0);
  // El lazy vive en ESTADO: React.lazy guarda el rechazo del `import()`
  // en el payload del componente y remontar el boundary con otra `key`
  // NO reintenta el chunk (vuelve a lanzar el mismo error y
  // "Reintentar" era un botón muerto). Recrearlo sí vuelve a descargar.
  const [ChatLazy, setChatLazy] = useState(() => lazy(loadChatModule));
  // RONDA 9 (stream C, punto 5) — VIGILANTE DE CARGA DEL DOCK.
  //
  // El camino ronda 8 (timeout 6 s en loadChatModule → boundary) cubre
  // el chunk que tarda o rechaza, y el test r9-stream-c lo prueba con
  // el ChatDock real. Pero el test de verificación de la ronda 8 vio el
  // modal quedarse en "Cargando chat…" >10 s / 15 s SIN que el boundary
  // apareciera nunca: si el lazy no se resuelve NI rechaza (o el
  // reintento de React no llega al boundary en ese entorno), el spinner
  // no tiene cota. Este vigilante es la segunda red: si el chat no
  // montó en CHAT_LOAD_TIMEOUT_MS + 2 s, el dock muestra el mismo
  // panel de error (Reintentar / Abrir en página completa) aunque el
  // boundary no se haya disparado. `loadedRef` lo desarma en cuanto el
  // chat monta (ChatReadyNotifier); al reintentar (errorKey) se rearma.
  const loadedRef = useRef(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const handleChatReady = useCallback(() => {
    loadedRef.current = true;
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    loadedRef.current = false;
    setLoadTimedOut(false);
    const timer = setTimeout(() => {
      if (!loadedRef.current) {
        console.error(
          "[ChatDock] el chat no montó en",
          `${CHAT_LOAD_TIMEOUT_MS + 2000} ms; mostrando salida de error`,
        );
        setLoadTimedOut(true);
      }
    }, CHAT_LOAD_TIMEOUT_MS + 2000);
    return () => clearTimeout(timer);
  }, [isOpen, errorKey]);
  const handleRetry = () => {
    setChatLazy(() => lazy(loadChatModule));
    setErrorKey((prev) => prev + 1);
  };
  // Ronda 8 (punto 5): la página /chat-intimo monta el MISMO chat a
  // pantalla completa; al navegar, el efecto de MainLayout cierra el
  // dock, así que no queda abierto sobre la página.
  const handleOpenFullPage = () => {
    onClose();
    navigate("/chat-intimo");
  };

  if (!isOpen) return null;

  return (
    // RONDA 8 (stream A): el panel YA NO es `fixed bottom-24 right-4`:
    // era la única superficie de chat fija abajo a la derecha y es lo
    // que el test de la ronda 7 seguía viendo como "burbuja fija" tras
    // tocar "Abrir Chat" (la píldora en sí es en flujo y centrada, ver
    // ChatFab/MainLayout abajo). Ahora es un diálogo centrado: misma
    // función (se abre a demanda, tiene Cerrar, mismo cuerpo de 420px),
    // pero ya no puede leerse como un FAB flotante. El contenedor es
    // `pointer-events-none` y solo el panel recibe toques, como antes
    // los toques fuera del panel llegan a la página.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl">
        {/* RONDA 5 — Tema claro: el panel era negro siempre. Ahora fondo
            explícito claro/oscuro según tema. Sigue siendo un overlay
            porque es un panel que el usuario abre a demanda (tiene
            Cerrar), no un botón flotante pasivo. */}
        <div className="bg-white dark:bg-black/60 backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-white/10">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Chat Íntimo
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 text-sm px-2 py-1 rounded-md hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
          <div className="h-[420px] bg-slate-100 dark:bg-black/40">
            {loadTimedOut ? (
              <ChatDockLoadError
                onRetry={handleRetry}
                onOpenFullPage={handleOpenFullPage}
              />
            ) : (
              <Suspense fallback={<ChatDockLoader />}>
                {/* embedded: el Chat a pantalla completa (h-screen) se
                desbordaba dentro del dock de 420px y se solapaba. */}
                <ChatDockErrorBoundary
                  key={errorKey}
                  onRetry={handleRetry}
                  onOpenFullPage={handleOpenFullPage}
                >
                  <ChatReadyNotifier onReady={handleChatReady}>
                    <ChatLazy embedded />
                  </ChatReadyNotifier>
                </ChatDockErrorBoundary>
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// RONDA 9 (stream C): exportado para el test de carga del dock
// (r9-stream-c): el boundary y el dock se prueban con el chunk
// atascado; sin export no hay forma de montarlos sin MainLayout.
export { ChatDockErrorBoundary, ChatDock };
