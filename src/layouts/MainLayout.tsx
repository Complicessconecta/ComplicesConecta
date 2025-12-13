// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeaderNav from '@/components/HeaderNav';
import { AnimationSettingsButton } from '@/components/animations/AnimationSettings';
import { useAuth } from '@/features/auth/useAuth';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isAuthFn = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  const hasSession = Boolean(user) || isAuthFn;

  return (
    <>
      {!hasSession && <HeaderNav />}
      
      <main className="relative z-10 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {hasSession && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <Navigation />
        </div>
      )}

      <AnimationSettingsButton />
    </>
  );
};

export default MainLayout;
