import React, { Suspense, useState, lazy } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { PageBackground } from "@/components/ui/backgrounds/UnifiedBackground";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import { PageTransitionWrapper } from "@/components/animations/PageTransitions";
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
  const { profile: _profile, isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Determine session state
  const isAuthFn =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;

  const isAuthPage = location.pathname === "/auth";
  const isProfileRoute =
    location.pathname === "/profile" ||
    location.pathname === "/profile-single" ||
    location.pathname === "/profile-couple" ||
    location.pathname.startsWith("/profile/") ||
    location.pathname.startsWith("/edit-profile-");

  const showHeaderNav = !isAuthPage && !isProfileRoute;
  const showBottomNavigation = hasSession; // visible también en perfiles
  const showChatFab = !isProfileRoute;

  // Ocultar el encabezado en la página de autenticación si lo deseamos o conservarlo. App.tsx tenía lógica:
  // {!hasSession && <HeaderNav />} -> ¿Esto implica que HeaderNav es SÓLO para usuarios que no son de sesión?
  // Pero HeaderNav tiene lógica para el usuario "Iniciado sesión" (mostrando el botón de perfil).
  // Veamos App.tsx nuevamente:
  // {!hasSession && <HeaderNav />}
  // ¿Esto significa que HeaderNav estaba OCULTO cuando el usuario tenía sesión?
  // Pero la navegación (abajo) se MUESTRA cuando el usuario tiene sesión.
  // El mensaje del usuario dice: "Diseño persistente: ... Encabezado y BottomNav deben ser fijos."
  // Entonces, el encabezado probablemente debería estar visible SIEMPRE, pero ¿quizás contenido diferente?
  // HeaderNav tiene lógica para que `isAuthenticated()` muestre el menú de perfil.
  // Entonces parece que DEBERÍA mostrarse. ¿El código anterior en App.tsx podría haberlo ocultado intencionalmente para los usuarios que iniciaron sesión en favor de otra cosa?
  // O tal vez fue un error en App.tsx.
  // "Lógica de Iniciar sesión: Si hay sesión en Supabase, cambia el botón 'Iniciar sesión' por el nombre del usuario o su avatar."
  // Esto implica que el encabezado SE utiliza cuando se inicia sesión.
  // Así que siempre renderizaré HeaderNav (excepto quizás páginas específicas como Auth si es necesario, pero normalmente Header es bueno).

  // Comprobando App.tsx nuevamente:
  // {!hasSession && <HeaderNav />}
  // Esto definitivamente ocultó el encabezado al iniciar sesión.
  // Pero HeaderNav.tsx tiene: `const handleLogin = ...` y `{isAuthenticated() ? (...) : (...)}`
  // Entonces HeaderNav ESTÁ diseñado para manejar el estado de inicio de sesión.
  //Lo habilitaré para todos.

  return (
    <div className="min-h-[100dvh] w-full text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="min-h-full relative overflow-x-hidden pb-24 flex flex-col">
        {/* AnimatedBackground centralizado en PageBackground (UnifiedBackground) */}
        <AnimationSettingsButton />

        {showHeaderNav && <HeaderNav />}

        {/* Chat FAB */}
        {showChatFab && <ChatFab onOpen={() => setIsChatOpen(true)} />}

        {/* Chat Dock in-app */}
        {hasSession && showChatFab && (
          <ChatDock isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}

        {/* Main Content */}
        <main className={!isAuthPage && showHeaderNav ? "" : ""}>
          <div className={showHeaderNav ? "-mt-[1px]" : ""}>
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
        {showBottomNavigation && (
          <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
            <Navigation />
          </div>
        )}

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
