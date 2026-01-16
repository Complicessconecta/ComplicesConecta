import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Scale, Lock, ScrollText } from "lucide-react";

export const TokensSubnav = () => {
  const location = useLocation();

  const tabs = [
    { name: "Dashboard", path: "/tokens", icon: LayoutDashboard },
    { name: "Info", path: "/tokens/info", icon: FileText },
    { name: "Legal", path: "/tokens/legal", icon: Scale },
    { name: "Privacidad", path: "/tokens/privacy", icon: Lock },
    { name: "Términos", path: "/tokens/terms", icon: ScrollText },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
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
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
