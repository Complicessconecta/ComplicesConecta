import React, { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { PageBackground } from '@/components/ui/backgrounds/RandomBackground';
import { AnimationSettingsButton } from '@/components/animations/AnimationSettings';
import { PageTransitionWrapper } from '@/components/animations/PageTransitions';
import { ChatFab } from '@/components/chat/ChatFab';
import { HeaderNav } from '@/components/HeaderNav';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import Chat from '@/pages/Chat';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
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
  const isAuthFn = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;
  
  const isAuthPage = location.pathname === '/auth';
  const isProfileRoute =
    location.pathname === '/profile' ||
    location.pathname === '/profile-single' ||
    location.pathname === '/profile-couple' ||
    location.pathname.startsWith('/profile/') ||
    location.pathname.startsWith('/edit-profile-');

  const showHeaderNav = !isAuthPage && !isProfileRoute;
  const showBottomNavigation = hasSession && !isProfileRoute;
  const showChatFab = !isProfileRoute;

  // Hide header on Auth page if we want, or keep it. App.tsx had logic:
  // {!hasSession && <HeaderNav />} -> This implies HeaderNav is ONLY for non-session users?
  // But HeaderNav has logic for "Logged in" user (showing profile button).
  // Let's look at App.tsx again:
  // {!hasSession && <HeaderNav />}
  // This means HeaderNav was HIDDEN when user has session? 
  // But Navigation (bottom) is SHOWN when user has session.
  // The user prompt says: "Persistent Layout: ... Header y BottomNav deben ser fijos."
  // So Header should probably be visible ALWAYS, but maybe different content?
  // HeaderNav has logic for `isAuthenticated()` to show profile menu.
  // So it seems it SHOULD be shown. The previous code in App.tsx might have been hiding it intentionally for logged in users in favor of something else?
  // Or maybe it was a mistake in App.tsx. 
  // "Lógica de Login: Si hay sesión en Supabase, cambia el botón 'Login' por el nombre del usuario o su avatar."
  // This implies the Header IS used when logged in.
  // So I will render HeaderNav always (except maybe specific pages like Auth if needed, but usually Header is good).
  
  // Checking App.tsx again:
  // {!hasSession && <HeaderNav />}
  // This definitely hid the header when logged in.
  // But HeaderNav.tsx has: `const handleLogin = ...` and `{isAuthenticated() ? (...) : (...)}`
  // So HeaderNav IS designed to handle logged in state.
  // I will enable it for everyone.

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
              <Suspense fallback={<PageLoader />}>
                <PageBackground>
                  <Outlet />
                </PageBackground>
              </Suspense>
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
          <Chat />
        </div>
      </div>
    </div>
  );
};

