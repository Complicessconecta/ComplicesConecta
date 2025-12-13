// src/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
