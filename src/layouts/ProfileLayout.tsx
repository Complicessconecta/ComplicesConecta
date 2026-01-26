// src/layouts/ProfileLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut, isDemoMode } = useAuth();
  const { toast } = useToast();

  return (
    <>
      {/* Chip flotante Demo User (header oculto en rutas de perfil) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="demo-user-heartbeat bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-2xl shadow-2xl shadow-purple-500/30 border border-white/20 backdrop-blur-md hover:[animation-play-state:paused]"
            >
              <span className="flex flex-col items-center leading-tight">
                <span className="text-sm font-bold">Demo User</span>
                <span className="text-[10px] text-white/90">
                  ID: demo-use • xxxx-xxx-xx
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuLabel>
              {isDemoMode() ? "DEMO" : isAuthenticated() ? "Sesión Activa" : "Cuenta"}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                if (isDemoMode()) {
                  navigate("/profile");
                  return;
                }
                if (isAuthenticated()) {
                  navigate("/profile");
                  return;
                }
                navigate("/auth");
              }}
            >
              Ver Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                if (isDemoMode()) {
                  toast({
                    title: "DEMO",
                    description:
                      "Cerrar sesión está deshabilitado en demo (solo visual).",
                  });
                  return;
                }
                if (!isAuthenticated()) {
                  navigate("/auth");
                  return;
                }
                if (window.confirm("¿Cerrar sesión?")) {
                  try {
                    await signOut();
                  } catch {
                    // no-op
                  }
                  navigate("/");
                }
              }}
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contenido de perfil sin bloqueo por defecto */}
      <main className="relative z-10 min-h-dvh pb-20 lg:pb-0 safe-area-pt safe-area-inset">
        <Outlet />
      </main>

      {/* Barra de navegación inferior para perfiles */}
      <Navigation />
    </>
  );
};

export default ProfileLayout;
