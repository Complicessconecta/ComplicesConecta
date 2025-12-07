// src/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';

export const AdminLayout: React.FC = () => {
  return (
    <ParticlesBackground>
      <main className="relative z-10 min-h-screen pb-10">
        <Outlet />
      </main>
    </ParticlesBackground>
  );
};

export default AdminLayout;
