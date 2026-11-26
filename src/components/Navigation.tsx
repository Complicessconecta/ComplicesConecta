import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageCircle, Heart, User, Settings, Coins, Search, UserPlus, Sparkles, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { OPEN_ANIMATION_SETTINGS_EVENT } from "@/components/animations/AnimationSettings";
import { useFeatures } from "@/hooks/useFeatures";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/useAuth";

interface NavigationProps {
  className?: string;
}

export const Navigation = ({ className }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { features } = useFeatures();
  const { signOut, getProfileType, isDemoMode } = useAuth();

  const profileType = getProfileType();

  const demoActive = typeof isDemoMode === "function" ? isDemoMode() : false;

  const getSettingsPath = () => {
    return profileType === "couple"
      ? "/edit-profile-couple"
      : "/edit-profile-single";
  };

  const navItems = features.requests
    ? [
        { id: "feed", icon: Home, label: "Inicio", path: "/" },
        { id: "discover", icon: Search, label: "Descubrir", path: "/discover" },
        ...(demoActive
          ? [{ id: "clubs-demo", icon: Building2, label: "Clubs", path: "/clubs/demo" }]
          : []),
        { id: "chat", icon: MessageCircle, label: "Chat", path: "/chat" },
        {
          id: "requests",
          icon: UserPlus,
          label: "Solicitudes",
          path: "/requests",
        },
        { id: "matches", icon: Heart, label: "Matches", path: "/matches" },
        { id: "tokens", icon: Coins, label: "Tokens", path: "/tokens" },
        { id: "ai-help", icon: Sparkles, label: "IA Ayuda", path: "/ai-help" },
        { id: "profile", icon: User, label: "Perfil", path: "/profile" },
        {
          id: "settings",
          icon: Settings,
          label: "Config",
          path: getSettingsPath(),
        },
      ]
    : [
        { id: "feed", icon: Home, label: "Inicio", path: "/" },
        { id: "discover", icon: Search, label: "Descubrir", path: "/discover" },
        ...(demoActive
          ? [{ id: "clubs-demo", icon: Building2, label: "Clubs", path: "/clubs/demo" }]
          : []),
        { id: "chat", icon: MessageCircle, label: "Chat", path: "/chat" },
        { id: "matches", icon: Heart, label: "Matches", path: "/matches" },
        { id: "tokens", icon: Coins, label: "Tokens", path: "/tokens" },
        { id: "profile", icon: User, label: "Perfil", path: "/profile" },
        {
          id: "settings",
          icon: Settings,
          label: "Config",
          path: getSettingsPath(),
        },
      ];

  // Logout movido al header/profile, no en bottom nav

  const handleNavigation = async (path: string) => {
    if (path === "/logout") {
      await signOut();
      navigate("/auth", { replace: true });
      return;
    }

    // El botón "Config" apunta a la ruta del editor. Estando ya en esa
    // ruta, navegar al mismo path no hace nada (la URL no cambia y no hay
    // re-render): en ese caso abrir el modal de configuración de
    // animaciones, el mismo que abre el engranaje flotante.
    if (path === getSettingsPath() && location.pathname === path) {
      window.dispatchEvent(new Event(OPEN_ANIMATION_SETTINGS_EVENT));
      return;
    }

    if (path === "/profile") {
      navigate(
        profileType === "couple" ? "/profile-couple" : "/profile-single",
      );
      return;
    }

    if (path === "/tokens") {
      navigate(
        profileType === "couple"
          ? "/profile-couple#wallet"
          : "/profile-single#wallet",
      );
      return;
    }

    navigate(path);
  };

  // No renderizar la barra de navegación en la página de autenticación
  if (location.pathname === "/auth") {
    return null;
  }

  // Evitar doble navegación en páginas de Tokens (ya existe TokensSubnav)
  if (location.pathname === "/tokens" || location.pathname.startsWith("/tokens")) {
    return null;
  }

  return (
    <>
      {/* Navegación inferior (dock SOLO del perfil propio).
          RONDA 6 (puntos 3 y 4):
          - Tema claro: el dock era un gradiente morado oscuro FIJO con
            texto blanco en ambos temas (en claro quedaba el dock oscuro
            y el texto blanco sobre claro era ilegible). Ahora la base es
            clara (fondo blanco, texto oscuro, acento morado) y el
            gradiente morado solo vive en `dark:`.
          - Desborde a 886 px: 11 botones de 55 px + etiquetas
            `whitespace-nowrap` que rebasaban el botón dejaban la luna
            cortada en el borde derecho. Ahora 48 px, etiquetas solo
            desde `lg` (a 886 px el dock es solo iconos) y `justify-center`
            sin scroll lateral: todo cabe sin cortar nada.
          RONDA 7 (punto 4): medida REAL a 886 px con 11 huecos
          (demo + requests: 10 botones + luna): 11×48 + 10×4 (gap)
          + 32 (px-4) = 600 px < 886 px, así que el código de la ronda 6
          ya cabía en teoría — el corte del test solo se explica con un
          preview anterior a la ronda 6 (55 px + etiquetas). Para que el
          desborde sea imposible por construcción y no por aritmética,
          los huecos ya no son de ancho fijo (`sm:w-[48px] flex-none`):
          ahora son `flex-1 min-w-0` con tope `max-w-[56px]`: reparten
          el ancho disponible y se encogen antes que desbordar; a 886 px
          la fila mide 11×56 + 10×4 + 32 = 688 px (99 px de margen por
          lado) y a 360 px cada hueco baja a ~30 px sin cortar nada.
          Las etiquetas siguen ocultas por debajo de `lg`. */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 overflow-x-clip",
          "bg-white/95 dark:bg-linear-to-r dark:from-purple-900/80 dark:via-purple-800/80 dark:to-blue-900/80",
          "backdrop-blur-xl border-t border-slate-200 dark:border-purple-500/40",
          "px-2 sm:px-4 py-1.5 sm:py-2 safe-area-pb",
          "translate-y-0 opacity-100 shadow-lg shadow-slate-900/10 dark:shadow-purple-900/50",
          className,
        )}
      >
        {/* RONDA 8 (punto 3): la fila es `overflow-hidden` por
            construcción: aunque un hueco quisiera medir más que su parte
            (p. ej. el botón luna de 44 px en un hueco de ~29 px a 360 px
            de ancho), nada puede salirse del dock ni cortar la luna en
            el borde derecho. Los huecos siguen siendo `flex-1 min-w-0`
            con tope 56 px: a 886 px miden 11×56 + 10×4 + 32 = 688 px. */}
        <div className="flex items-center justify-center w-full max-w-full mx-auto safe-area-inset gap-0.5 sm:gap-1 min-w-0 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/profile" &&
                (location.pathname === "/profile-single" ||
                  location.pathname === "/profile-couple")) ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-1 sm:p-1 rounded-xl sm:rounded-2xl",
                  "flex-1 min-w-0 max-w-[56px] min-h-[44px] sm:min-h-[52px] group",
                  "transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95",
                  "relative overflow-visible backdrop-blur-sm cursor-pointer",
                  isActive
                    ? "bg-purple-100 text-purple-700 shadow-lg border border-purple-300 dark:bg-linear-to-r dark:from-purple-600/30 dark:to-blue-600/30 dark:text-white dark:shadow-lg dark:border-purple-400/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/85 dark:hover:text-white dark:hover:bg-white/10 hover:backdrop-blur-md",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-purple-500/10 dark:bg-linear-to-r dark:from-purple-500/20 dark:to-blue-500/20 rounded-xl sm:rounded-2xl animate-pulse" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 sm:w-5 sm:h-5 mb-0 lg:mb-1 transition-all duration-300 relative z-10 shrink-0 block opacity-100",
                    isActive
                      ? "scale-110 drop-shadow-lg"
                      : "group-hover:scale-110 group-hover:drop-shadow-md",
                  )}
                />
                <span
                  className={cn(
                    "hidden lg:block text-[10px] font-medium transition-all duration-300 relative z-10 leading-tight text-center whitespace-nowrap",
                    isActive
                      ? "text-purple-700 font-semibold dark:text-white"
                      : "text-slate-600 group-hover:text-slate-900 dark:text-white/85 dark:group-hover:text-white",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* Tema claro/oscuro en flujo dentro del dock (RONDA 5: antes era
              un botón `fixed top-20 right-4` que tapaba contenido en todas
              las páginas). El menú se abre hacia arriba por colisión.
              RONDA 6: `tone="auto"` para que el botón sea legible sobre el
              dock claro (el tono "onDark" era blanco sobre blanco).
              RONDA 8 (punto 3): el botón luna mide 44 px fijos
              (`size="icon"`) y el hueco baja a ~29 px a 360 px de ancho:
              sin tope, la luna se salía del último hueco y se cortaba en
              el borde derecho. `[&_button]:max-w-full` la ciñe al hueco. */}
          <div
            className="flex flex-col items-center justify-center p-1 sm:p-1 rounded-xl sm:rounded-2xl flex-1 min-w-0 max-w-[56px] min-h-[44px] sm:min-h-[52px] text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/85 dark:hover:text-white dark:hover:bg-white/10 overflow-hidden [&_button]:max-w-full"
            title="Cambiar tema"
          >
            <ThemeToggle tone="auto" />
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-400/40 dark:via-purple-400/50 to-transparent" />
      </nav>
    </>
  );
};
