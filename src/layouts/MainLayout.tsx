// src/layouts/MainLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { AnimationSettingsButton } from "@/components/animations/AnimationSettings";
import { useAuth } from "@/features/auth/useAuth";

interface MainLayoutProps {
  isLoading?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ isLoading = false }) => {
  const { isAuthenticated, user } = useAuth();
  const isAuthFn =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;

  return (
    <>
      {!hasSession && !isLoading && <HeaderNav />}

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
