// src/layouts/ProfileLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { useAuth } from "@/features/auth/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOut, isDemoMode } = useAuth();

  // ID real del usuario demo (primeros 8 caracteres del UUID guardado en
  // demo_user). Antes era un placeholder fijo "demo-use • xxxx-xxx-xx"
  // que parecía un dato enmascarado sin serlo; si no hay demo_user, la
  // línea no se muestra.
  const demoUserId = (() => {
    try {
      const raw = window.localStorage.getItem("demo_user");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { id?: unknown };
      return typeof parsed.id === "string" ? parsed.id.slice(0, 8) : "";
    } catch {
      return "";
    }
  })();

  return (
    <>
      {isDemoMode() && (
        <div className="fixed top-4 left-4 z-60">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="demo-user-heartbeat bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-2xl shadow-2xl shadow-purple-500/30 border border-white/20 backdrop-blur-md hover:[animation-play-state:paused]"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-sm font-bold">Demo User</span>
                  {demoUserId && (
                    <span className="text-[10px] text-white/90">
                      ID: {demoUserId}
                    </span>
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[180px] bg-purple-900/95 backdrop-blur-xl border border-purple-500/30 text-white"
            >
              <DropdownMenuLabel className="text-white font-semibold">
                {isDemoMode() ? "DEMO" : isAuthenticated() ? "Sesión Activa" : "Cuenta"}
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="text-white hover:bg-purple-700/50 cursor-pointer focus:bg-purple-700/50 focus:text-white"
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
                className="text-white hover:bg-purple-700/50 cursor-pointer focus:bg-purple-700/50 focus:text-white"
                onClick={async () => {
                  if (isDemoMode()) {
                    await signOut();
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
      )}

      {/* Contenido de perfil sin bloqueo por defecto */}
      <main className="relative z-10 min-h-dvh pb-20 lg:pb-0 safe-area-pt safe-area-inset">
        <Outlet />
      </main>

      {/* La barra inferior la renderiza MainLayout (Navigation o el dock);
          aquí NO se renderiza otra para no duplicarla ni tapar el dock. */}
    </>
  );
};

export default ProfileLayout;
