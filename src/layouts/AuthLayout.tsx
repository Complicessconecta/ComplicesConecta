// src/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';

export const AuthLayout: React.FC = () => {
  return (
    <ParticlesBackground>
      <div className="flex items-center justify-center min-h-screen">
        <Outlet />
      </div>
    </ParticlesBackground>
  );
};

export default AuthLayout;
