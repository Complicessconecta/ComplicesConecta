import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Scale, Lock, ScrollText } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

export const TokensSubnav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const hasSession =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);

  const tabs = [
    ...(hasSession ? [{ name: "Dashboard", path: "/tokens", icon: LayoutDashboard }] : []),
    { name: "Info", path: "/tokens-info", icon: FileText },
    { name: "Legal", path: "/tokens-legal", icon: Scale },
    { name: "Privacidad", path: "/tokens-privacy", icon: Lock },
    { name: "Términos", path: "/tokens-terms", icon: ScrollText },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;
    setIsVisible(true);

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;

        if (currentY < 16) {
          setIsVisible(true);
        } else if (delta > 8) {
          setIsVisible(false);
        } else if (delta < -8) {
          setIsVisible(true);
        }

        lastScrollYRef.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive(tab.path)
                    ? "bg-purple-600/30 text-white border border-purple-500/50"
                    : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <IconComponent className="h-4 w-4 shrink-0" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
