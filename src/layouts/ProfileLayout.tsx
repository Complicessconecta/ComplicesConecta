// src/layouts/ProfileLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Navigation } from "@/components/Navigation";

export const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Chip flotante Demo User (header oculto en rutas de perfil) */}
      <div className="fixed top-4 right-4 z-[60]">
        <Button
          onClick={() => navigate("/demo")}
          className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-full shadow-lg shadow-purple-500/30"
        >
          Demo User
        </Button>
      </div>

      {/* Contenido de perfil sin bloqueo por defecto */}
      <main className="relative z-10 min-h-dvh pb-20 lg:pb-0 safe-area-pt safe-area-inset">
        <Outlet />
      </main>

      {/* Barra de navegación inferior para perfiles */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        <Navigation />
      </div>
    </>
  );
};

export default ProfileLayout;
