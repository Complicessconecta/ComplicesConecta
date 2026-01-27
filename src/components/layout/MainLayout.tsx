import React, { Suspense, useState, lazy } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { PageBackground } from "@/components/ui/backgrounds/UnifiedBackground";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import { PageTransitionWrapper } from "@/components/animations/PageTransitions";
import { ChatFab } from "@/components/chat/ChatFab";
import { HeaderNav } from "@/components/HeaderNav";
import { Navigation } from "@/components/Navigation";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
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

  const hasDemoSession = (() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.localStorage.getItem("demo_authenticated") === "true" ||
        window.localStorage.getItem("demo_user") !== null
      );
    } catch {
      return false;
    }
  })();

  const pathname = location.pathname;

  // Lista explícita de rutas donde NO debe aparecer HeaderNav
  // HeaderNav es consistente en TOdías las páginas públicas (incluso logueado)
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

  const isClubDemoRoute = pathname === "/clubs/demo";

  const isHomeRoute = pathname === "/";

  const headerOffsetClass = isClubDemoRoute
    ? "pt-[calc(env(safe-area-inset-top)+4rem)]"
    : showHeaderNav
      ? isHomeRoute
        ? "pt-[calc(env(safe-area-inset-top)+6rem)]"
        : "pt-[calc(env(safe-area-inset-top)+4rem)]"
      : "pt-[env(safe-area-inset-top)]";

  // Bottom Navigation solo para usuarios logueados (incluye sesiones demo)
  const showBottomNavigation = hasSession || hasDemoSession;

  // Chat FAB no se muestra en rutas de perfil
  const isProfileRoute =
    pathname === "/profile" ||
    pathname === "/profile-single" ||
    pathname === "/profile-couple" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/edit-profile-");

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
                    <div className="text-white font-bold truncate">Club Demo</div>
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
            <PageTransitionWrapper>
              <PageBackground>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </PageBackground>
            </PageTransitionWrapper>
          </div>
        </main>

        {/* Bottom Navigation (perfil/app) */}
        {showBottomNavigation && <Navigation />}
        
        {/* Bottom Navigation for Demo Profiles */}
        <BottomNavigation />

        <Toaster />
      </div>
    </div>
  );
};

interface ChatDockProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDock: React.FC<ChatDockProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-full max-w-md px-4 sm:px-0">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
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
            <ChatLazy />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

