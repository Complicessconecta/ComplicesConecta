import React, { useState } from "react";
import { GlassAppShell } from "@/components/templates/GlassAppShell";
import { LayoutGrid, RefreshCw, Camera, PenTool, Film, Sparkles } from "lucide-react";

const TemplateDemo: React.FC = () => {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  return (
    <GlassAppShell
      title="ComplicesConecta"
      themeMode={themeMode}
      onToggleTheme={() =>
        setThemeMode((p) => (p === "dark" ? "light" : "dark"))
      }
      notificationsCount={3}
      profile={{
        name: "Template Demo",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
      }}
      headerLinks={[
        { label: "Apps", active: true },
        { label: "Tu trabajo", badge: 3 },
        { label: "Descubrir" },
        { label: "Market", badge: 2 },
      ]}
      sidebarSections={[
        {
          title: "Apps",
          items: [
            { label: "Todías", icon: LayoutGrid },
            { label: "Actualizaciones", icon: RefreshCw, badge: 3 },
          ],
        },
        {
          title: "Categorías",
          items: [
            { label: "Fotografía", icon: Camera },
            { label: "Diseño", icon: PenTool },
            { label: "Video", icon: Film },
            { label: "UI/UX", icon: Sparkles },
          ],
        },
      ]}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-linear-to-r from-purple-600 to-blue-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Glass App Shell</h1>
          <p className="mt-2 text-white/90">
            Sandbox aislado para evaluar layout estilo glassmorphism, sin tocar
            AppLayout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm font-semibold text-white/80">Estado</div>
            <div className="mt-2 text-white/60 text-sm">
              Modo:{" "}
              <span className="font-semibold text-white/80">{themeMode}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm font-semibold text-white/80">Contenido</div>
            <p className="mt-2 text-sm text-white/60">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm font-semibold text-white/80">Acciones</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-md bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15"
              >
                Primaria
              </button>
              <button
                type="button"
                className="rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Secundaria
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassAppShell>
  );
};

export default TemplateDemo;

