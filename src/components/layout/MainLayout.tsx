import React, { Suspense, useState, lazy } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { PageBackground } from "@/components/ui/backgrounds/UnifiedBackground";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
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
  const showDock = isProfileRoute;

  const showChatFab = !isProfileRoute;

  return (
    <div className="min-h-dvh w-full text-white pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
      <div className="min-h-full relative pb-24 flex flex-col">
        {/* AnimatedBackground centralizado en PageBackground (UnifiedBackground) */}
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

        {/* Chat FAB */}
        {showChatFab && <ChatFab onOpen={() => setIsChatOpen(true)} />}

        {/* Chat Dock in-app */}
        {hasSession && showChatFab && (
          <ChatDock isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}

        {/* Main Content */}
        <main className={headerOffsetClass}>
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

        {/* Botón de regreso en páginas sin dock ni header: sin él no había
          forma de volver atrás (Wacko, full test 24 Nov 2026). */}
        {hasSession && !isProfileRoute && <BackButton />}

        {/* Bottom Navigation (perfil) — el dock de 10 botones, estable en
          rutas de perfil con o sin demo */}
        {showDock && <Navigation />}

        <Toaster />
      </div>
    </div>
  );
};

// Botón flotante "Volver" para rutas autenticadas sin dock (feed, chat,
// tokens, clubs, ajustes...): vuelve a la página anterior o al perfil.
const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemo, getProfileType } = useAuth();
  const pathname = location.pathname;

  // Rutas que ya tienen su propio regreso o navegación: landing, auth,
  // club demo (botón Volver propio), tokens (TokensSubnav) y chat (su
  // propio "Volver": en el hilo vuelve a la lista y en la lista al feed).
  // La píldora fija de aquí flotaba sobre el hilo y la galería del chat.
  if (
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/clubs/demo" ||
    pathname === "/tokens" ||
    pathname.startsWith("/tokens/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/")
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
      className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-black/80"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  );
};

interface ChatDockProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDock: React.FC<ChatDockProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    // Ancho fijo al viewport con margen de 1rem a cada lado y tope de 42rem:
    // dentro van la lista (20rem) y el hilo del chat, y con max-w-md el
    // hilo no cabía y su texto quedaba recortado en el borde derecho.
    <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-2xl">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-sm font-semibold text-white">Chat Intimo</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-sm px-2 py-1 rounded-md hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        <div className="h-[420px] bg-black/40">
          <Suspense fallback={<PageLoader />}>
            {/* embedded: el Chat a pantalla completa (h-screen) se
                desbordaba dentro del dock de 420px y se solapaba. */}
            <ChatLazy embedded />
          </Suspense>
        </div>
      </div>
    </div>
  );
};
