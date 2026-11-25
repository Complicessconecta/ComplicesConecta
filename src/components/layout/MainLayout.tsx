import React, { Suspense, useState, useEffect, lazy } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PageBackground } from "@/components/ui/backgrounds/UnifiedBackground";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import { OPEN_ANIMATION_SETTINGS_EVENT } from "@/components/animations/AnimationSettings";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChatFab } from "@/components/chat/ChatFab";
import { HeaderNav } from "@/components/HeaderNav";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
const ChatLazy = lazy(() => import("@/pages/Chat"));

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

  // Precarga del chunk de Chat en idle: al abrir el dock el componente
  // ya está en caché y no aparece el "Cargando…". Sin esto, la primera
  // apertura esperaba la descarga del chunk con el fallback tapando
  // todo (punto 10).
  useEffect(() => {
    const preload = () => {
      void import("@/pages/Chat");
    };
    if ("requestIdleCallback" in window) {
      const idleId = (
        window as Window & {
          requestIdleCallback: (cb: () => void) => number;
        }
      ).requestIdleCallback(preload);
      return () => {
        if ("cancelIdleCallback" in window) {
          (
            window as Window & { cancelIdleCallback: (id: number) => void }
          ).cancelIdleCallback(idleId);
        }
      };
    }
    // globalThis (no `window`): el `in` de arriba estrecha `window` a
    // `never` en esta rama y `window.setTimeout` deja de existir para tsc.
    const timer = globalThis.setTimeout(preload, 800);
    return () => globalThis.clearTimeout(timer);
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

  const isClubDemoRoute = pathname === "/clubs/demo";

  // Rutas a pantalla completa: en /chat la burbuja de chat es redundante
  // (ya estás en el chat), así que el ChatFab no se renderiza ahí.
  // (RONDA 5: el engranaje que tapaba el compositor en /chat y los
  // controles en /video-chat ya no existe como flotante; el host del
  // modal se monta siempre y no tapa nada.)
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");

  const isHomeRoute = pathname === "/";

  const headerOffsetClass = isClubDemoRoute
    ? "pt-[calc(env(safe-area-inset-top)+4rem)]"
    : showHeaderNav
      ? isHomeRoute
        ? "pt-[calc(env(safe-area-inset-top)+6rem)]"
        : "pt-[calc(env(safe-area-inset-top)+4rem)]"
      : "pt-[env(safe-area-inset-top)]";

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

  // Fila superior en flujo (Volver + tema + engranaje) para rutas
  // logueadas sin dock ni header: misma lista de exclusiones que el
  // BackButton (esas rutas ya tienen su propio regreso o navegación).
  // Es EN FLUJO (dentro de <main>), nunca `fixed`: no tapa contenido.
  const isTopRowExcludedRoute =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/clubs/demo" ||
    pathname === "/tokens" ||
    pathname.startsWith("/tokens/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
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
          <div className="header-nav-main fixed top-0 left-0 right-0 z-50 safe-area-pt">
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
          {/* RONDA 5 — Fila superior EN FLUJO (nunca `fixed`): Volver a la
              izquierda y, a la derecha, el engranaje de animaciones y el
              botón de tema. Es la única vía de tema/ajustes en rutas
              logueadas sin dock ni header (Discover, /matches, /requests,
              /faq, /profile/<id>, /edit-profile-*...). En perfil propio
              esos controles viven en el dock; en páginas públicas, en el
              HeaderNav. */}
          {showTopRow && (
            <div className="flex items-center justify-between gap-2 px-4 pt-2">
              <BackButton />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new Event(OPEN_ANIMATION_SETTINGS_EVENT),
                    )
                  }
                  aria-label="Ajustes de animación y fondo"
                  title="Ajustes de animación y fondo"
                  className="p-2.5 rounded-lg bg-white/80 border border-slate-300 text-slate-700 hover:bg-white dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <ThemeToggle tone="auto" />
              </div>
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
            se muestra porque el chat ya vive en el dock). */}
        {showChatFab && (
          <div className="flex justify-end px-4 pt-2">
            <ChatFab onOpen={() => setIsChatOpen(true)} />
          </div>
        )}

        {/* Bottom Navigation (perfil) — el dock de 10 botones, estable en
          rutas de perfil con o sin demo */}
        {showDock && <Navigation />}

        <Toaster dockOffset={showDock} />
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
  children: React.ReactNode;
}

interface ChatDockErrorBoundaryState {
  hasError: boolean;
}

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
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center dark:bg-black/40">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No se pudo cargar el chat
          </p>
          <p className="text-xs text-slate-600 dark:text-white/70">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={this.props.onRetry}
            className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ChatDockProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDock: React.FC<ChatDockProps> = ({ isOpen, onClose }) => {
  // `key` del boundary: al reintentar se remonta y React.lazy vuelve a
  // intentar cargar el chunk (el lazy anterior cachea el fallo).
  const [errorKey, setErrorKey] = useState(0);

  if (!isOpen) return null;

  return (
    // Ancho fijo al viewport con margen de 1rem a cada lado y tope de 42rem:
    // dentro van la lista (20rem) y el hilo del chat, y con max-w-md el
    // hilo no cabía y su texto quedaba recortado en el borde derecho.
    <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-2xl">
      {/* RONDA 5 — Tema claro: el panel era negro siempre. Ahora fondo
          explícito claro/oscuro según tema. Sigue siendo un overlay fijo
          porque es un panel que el usuario abre a demanda (tiene Cerrar),
          no un botón flotante pasivo. */}
      <div className="bg-white dark:bg-black/60 backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Chat Intimo
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
          <Suspense fallback={<ChatDockLoader />}>
            {/* embedded: el Chat a pantalla completa (h-screen) se
                desbordaba dentro del dock de 420px y se solapaba. */}
            <ChatDockErrorBoundary
              key={errorKey}
              onRetry={() => setErrorKey((prev) => prev + 1)}
            >
              <ChatLazy embedded />
            </ChatDockErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
};
