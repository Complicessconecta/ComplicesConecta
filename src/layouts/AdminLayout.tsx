// src/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  return (
    <main className="relative z-10 min-h-screen pb-10">
      <Outlet />
    </main>
  );
};

export default AdminLayout;
