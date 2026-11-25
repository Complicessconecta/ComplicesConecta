// src/layouts/ProfileLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      {/* Contenido de perfil sin bloqueo por defecto */}
      <main className="relative z-10 min-h-dvh pb-20 lg:pb-0 safe-area-pt safe-area-inset">
        {/* Barra demo en flujo (no fija): la píldora flotante
            "Demo User" (fixed top-4 left-4) tapaba los títulos de las
            pantallas de perfil (p. ej. "Editar perfil de la pareja" y el
            ID). En flujo empuja el contenido hacia abajo sin tapar nada;
            el menú (Ver Mi Perfil / Cerrar Sesión) se conserva. */}
        {isDemoMode() && (
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-purple-900/20 bg-purple-900 dark:bg-purple-950/60 dark:border-white/10 px-3 py-1 backdrop-blur-md">
            {/* RONDA 7 (punto 3): la barra era `bg-purple-950/60`
                (morado translúcido): en tema claro el fondo claro se
                transparentaba y el "Demo User / ID" blanco quedaba
                lavado sobre lavanda. Ahora es morado SÓLIDO en claro
                (texto blanco legible) y translúcido solo en oscuro. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="demo-user-heartbeat h-auto bg-transparent px-2 py-1 text-xs font-semibold text-white hover:bg-white/10">
                  <span className="flex items-center gap-1.5 leading-none">
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-green-400"
                      aria-hidden="true"
                    />
                    Demo User
                    {demoUserId && (
                      <span className="font-normal text-white/70">
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
                  {isDemoMode()
                    ? "DEMO"
                    : isAuthenticated()
                      ? "Sesión Activa"
                      : "Cuenta"}
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
            <span className="text-[10px] text-white/50">Modo demostración</span>
          </div>
        )}
        <Outlet />
      </main>

      {/* La barra inferior la renderiza MainLayout (Navigation o el dock);
          aquí NO se renderiza otra para no duplicarla ni tapar el dock. */}
    </>
  );
};

export default ProfileLayout;
