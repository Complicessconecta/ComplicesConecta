// src/layouts/MainLayout.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import { useAuth } from "@/features/auth/useAuth";
import { useLoading } from "@/contexts/LoadingContext";

export const MainLayout: React.FC = () => {
  const { isLoading } = useLoading();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isAuthFn =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;

  // Detectar si estamos en una página de perfil
  const isProfilePage = location.pathname.match(/^\/profiles\/(single|couple)/);

  return (
    <>
      {/* HeaderNav solo en páginas públicas sin sesión y sin estar en perfil */}
      {!hasSession && !isLoading && !isProfilePage && <HeaderNav />}

      <main className="relative z-10 min-h-dvh pb-20 lg:pb-0 safe-area-pt safe-area-inset">
        <Outlet />
      </main>

      {hasSession && (
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
          <Navigation />
        </div>
      )}

      <AnimationSettingsButton />
    </>
  );
};

export default MainLayout;
