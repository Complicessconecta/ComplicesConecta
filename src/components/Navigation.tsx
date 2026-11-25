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
      {/* Navegación inferior */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-linear-to-r from-purple-900/80 via-purple-800/80 to-blue-900/80",
          "backdrop-blur-xl border-t border-purple-500/40",
          "px-2 sm:px-4 py-1.5 sm:py-3 safe-area-pb",
          "translate-y-0 opacity-100 shadow-lg shadow-purple-900/50",
          className,
        )}
      >
        <div className="flex items-center justify-around w-full max-w-full mx-auto overflow-x-auto scrollbar-hide safe-area-inset gap-0.5 sm:gap-1">
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
                  "flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl",
                  "flex-1 min-w-0 sm:flex-none sm:min-w-[55px] sm:w-[55px] min-h-[44px] sm:min-h-[60px] group",
                  "transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95",
                  "relative overflow-visible backdrop-blur-sm cursor-pointer",
                  isActive
                    ? "bg-linear-to-r from-purple-600/30 to-blue-600/30 text-white shadow-lg border border-purple-400/50"
                    : "text-white/85 hover:text-white hover:bg-white/10 hover:backdrop-blur-md",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-linear-to-r from-purple-500/20 to-blue-500/20 rounded-xl sm:rounded-2xl animate-pulse" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 sm:w-5 sm:h-5 mb-0 sm:mb-1 transition-all duration-300 relative z-10 shrink-0 block opacity-100 text-white stroke-white",
                    isActive
                      ? "scale-110 drop-shadow-lg"
                      : "group-hover:scale-110 group-hover:drop-shadow-md",
                  )}
                />
                <span
                  className={cn(
                    "hidden sm:block text-[10px] font-medium transition-all duration-300 relative z-10 leading-tight text-center whitespace-nowrap",
                    isActive
                      ? "text-white font-semibold"
                      : "text-white/85 group-hover:text-white",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* Tema claro/oscuro en flujo dentro del dock (RONDA 5: antes era
              un botón `fixed top-20 right-4` que tapaba contenido en todas
              las páginas). El menú se abre hacia arriba por colisión. */}
          <div
            className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex-1 min-w-0 sm:flex-none sm:min-w-[55px] sm:w-[55px] min-h-[44px] sm:min-h-[60px] text-white/85 hover:text-white hover:bg-white/10"
            title="Cambiar tema"
          >
            <ThemeToggle />
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-400/50 to-transparent" />
      </nav>
    </>
  );
};
