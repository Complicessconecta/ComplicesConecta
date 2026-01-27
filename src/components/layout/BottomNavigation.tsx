import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/useAuth";

interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDemo } = useAuth();

  // Solo mostrar en modo demo y en rutas de perfil
  const shouldShow = isDemo() && (
    location.pathname === "/profile" ||
    location.pathname === "/profile-single" ||
    location.pathname === "/profile-couple" ||
    location.pathname.startsWith("/profile-")
  );

  if (!shouldShow) return null;

  const navItems = [
    { icon: Home, label: "Inicio", path: "/" },
    { icon: Search, label: "Descubrir", path: "/discover" },
    { icon: Heart, label: "Matches", path: "/matches" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/20 safe-area-inset-bottom",
      className
    )}>
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                active
                  ? "text-purple-400"
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
