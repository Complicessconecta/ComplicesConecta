import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Info, Scale, Lock, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TokensSubnavProps {
  className?: string;
}

export const TokensSubnav: React.FC<TokensSubnavProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tabs persistentes para las 5 rutas de tokens
  const tokensTabs = [
    { name: "Dashboard", path: "/tokens", icon: LayoutDashboard },
    { name: "Información", path: "/tokens/info", icon: Info },
    { name: "Legal", path: "/tokens/legal", icon: Scale },
    { name: "Privacidad", path: "/tokens/privacy", icon: Lock },
    { name: "Términos", path: "/tokens/terms", icon: FileText },
  ];

  // Determinar el tab activo basado en la ruta actual
  const activeTab = tokensTabs.find((tab) => {
    if (tab.path === "/tokens") {
      return location.pathname === "/tokens";
    }
    return location.pathname === tab.path || location.pathname.startsWith(tab.path);
  })?.path || "/tokens";

  const handleTabChange = (value: string) => {
    navigate(value);
  };

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-purple-900/30 border border-purple-500/30 backdrop-blur-md">
          {tokensTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.path}
                value={tab.path}
                className="data-[state=active]:bg-purple-600/50 data-[state=active]:text-white data-[state=active]:border-purple-400 text-purple-200 hover:text-white hover:bg-purple-500/30 transition-all duration-300"
              >
                <IconComponent className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.slice(0, 3)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TokensSubnav;
