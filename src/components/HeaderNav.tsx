import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Search, User, MessageSquare, Calendar, Building2, Shield, HelpCircle, Info, DollarSign, Settings, Bell, Menu, ShoppingBag, FileText, Lock, Crown, ChevronDown, MoreHorizontal, Scale, Image, Home, BookOpen, Users } from "lucide-react";
import { BetaBanner } from "@/components/BetaBanner";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";

interface HeaderNavProps {
  className?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const displayUserLabel =
    (user as any)?.nickname ||
    (user as any)?.user_metadata?.nickname ||
    (profile as any)?.nickname ||
    (profile as any)?.display_name ||
    (profile as any)?.first_name ||
    user?.email?.split("@")[0] ||
    "Perfil";

  // Detectar scroll para efecto de transparencia
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasSession =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);

  const isHomeRoute = location.pathname === "/";

  const chatPath = hasSession ? "/chat" : "/chat-info";

  // C) Menú principal (máximo 7 items)
  const mainNavItems = [
    { name: "Inicio", path: "/", icon: Home },
    { name: "Descubrir", path: "/discover", icon: Search },
    { name: "Chat", path: chatPath, icon: MessageSquare },
    { name: "Eventos", path: "/events", icon: Calendar },
    { name: "Clubs", path: "/clubs", icon: Building2 },
    { name: "Tokens", path: "/tokens", icon: DollarSign },
    { name: "Marketplace", path: "/marketplace", icon: ShoppingBag },
  ];

  // D) Dropdown "Más" con categorías exactas (Contenido & Empresa, Legal, Ayuda, Explorar)
  const secondaryNavItems = [
    // Contenido & Empresa
    { name: "Blog", path: "/blog", icon: BookOpen, category: "Contenido & Empresa" },
    { name: "Noticias", path: "/news", icon: FileText, category: "Contenido & Empresa" },
    { name: "Carreras", path: "/careers", icon: Building2, category: "Contenido & Empresa" },
    { name: "Invest", path: "/invest", icon: DollarSign, category: "Contenido & Empresa" },
    { name: "Inversores", path: "/investors", icon: DollarSign, category: "Contenido & Empresa" },
    { name: "Donaciones", path: "/donations", icon: DollarSign, category: "Contenido & Empresa" },
    { name: "Moderadores", path: "/moderators", icon: Users, category: "Contenido & Empresa" },
    { name: "Proyecto", path: "/project-info", icon: FileText, category: "Contenido & Empresa" },

    // Explorar
    { name: "Stories", path: "/stories", icon: Image, category: "Explorar" },
    { name: "Feed", path: "/feed", icon: Heart, category: "Explorar" },
    { name: "Info", path: "/info", icon: Info, category: "Explorar" },
    { name: "About", path: "/about", icon: Building2, category: "Explorar" },
    { name: "NFTs", path: "/nfts", icon: Image, category: "Explorar" },
    { name: "Premium", path: "/premium", icon: Crown, category: "Explorar" },
    { name: "Shop", path: "/shop", icon: ShoppingBag, category: "Explorar" },

    // Ayuda
    { name: "FAQ", path: "/faq", icon: HelpCircle, category: "Ayuda" },
    { name: "Soporte", path: "/support", icon: HelpCircle, category: "Ayuda" },
    { name: "Chat (Info)", path: "/chat-info", icon: MessageSquare, category: "Ayuda" },

    // Legal
    { name: "Legal (Hub)", path: "/legal", icon: Scale, category: "Legal" },
    { name: "Términos", path: "/terms", icon: FileText, category: "Legal" },
    { name: "Privacidad", path: "/privacy", icon: Lock, category: "Legal" },
    { name: "Seguridad", path: "/security", icon: Shield, category: "Legal" },
    { name: "Directrices", path: "/guidelines", icon: FileText, category: "Legal" },
    { name: "Ley Olimpia", path: "/ley-olimpia", icon: Shield, category: "Legal" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    logger.info("Navigation:", { path });

    // Analytics tracking for navigation
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "navigation", {
        event_category: "header_nav",
        event_label: path,
        value: 1,
      });
    }
  };

  const handleLogin = () => {
    navigate("/auth");
    logger.info("Login initiated");

    // Analytics tracking for login click
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "login_click", {
        event_category: "authentication",
        event_label: "header_login",
        value: 1,
      });
    }
  };

  return (
    <>
      {/* Header Principal con gradiente difuminado */}
      <header
        className={`header-nav-main fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-pt ${
          isScrolled
            ? "bg-linear-to-b from-purple-900/90 via-purple-800/85 to-transparent backdrop-blur-md border-b border-purple-500/20"
            : "bg-linear-to-b from-purple-900/95 via-purple-800/90 to-purple-700/80 backdrop-blur-sm border-b border-purple-400/30"
        } ${className}`}
      >
        {/* Contenedor Principal */}
        <div className="w-full">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Logo - Izquierda */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center space-x-3 group transition-all duration-300 hover:scale-110"
              >
                <div className="relative animate-heart-float">
                  <Heart
                    className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-all duration-300 animate-heart-beat"
                    fill="currentColor"
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.6))",
                      animation:
                        "heartBeat 2.5s ease-in-out infinite, heartGlow 2s ease-in-out infinite",
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
                  {/* Partículas flotantes - corazones rosas con animación más lenta */}
                  <div className="absolute inset-0 pointer-events-none">
                    <Heart className="absolute top-0 left-0 w-2 h-2 text-pink-300 animate-heart-particle-1" fill="currentColor" />
                    <Heart className="absolute top-1 right-0 w-2 h-2 text-pink-400 animate-heart-particle-2" fill="currentColor" />
                  </div>
                </div>
                <span className="font-black text-xl lg:text-2xl hidden sm:block bg-linear-to-r from-purple-300 via-purple-200 to-blue-300 bg-clip-text text-transparent animate-gradient-x">
                  ComplicesConecta
                </span>
              </button>
            </div>

            {/* Navegación Central - Desktop */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-1 justify-center mx-4 xl:mx-8 overflow-x-hidden flex-nowrap">
              {mainNavItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-1 xl:space-x-2 px-2 xl:px-4 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-300 shrink-0 ${
                      isActive(item.path)
                        ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 shrink-0 text-white" />
                    <span className="whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                );
              })}

              {/* Menú desplegable "Más" */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 xl:space-x-2 px-2 xl:px-4 py-2 rounded-lg text-xs xl:text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 shrink-0">
                    <MoreHorizontal className="h-4 w-4 shrink-0 text-white" />
                    <span className="whitespace-nowrap">Más</span>
                    <ChevronDown className="h-3 w-3 shrink-0 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 sm:w-64 bg-purple-900/95 border-purple-500/30 backdrop-blur-md max-h-[80vh] overflow-y-auto z-200 custom-scrollbar"
                  align="end"
                  sideOffset={5}
                >
                  <div className="max-h-[calc(80vh-2rem)] overflow-y-auto overscroll-contain custom-scrollbar-inner">
                    {[
                      "Comunidad",
                      "Servicios",
                      "Tokens",
                      "Contenido",
                      "Acerca de",
                      "Ayuda",
                      "Legal",
                    ].map((category) => {
                      const categoryItems = secondaryNavItems.filter(
                        (item) => item.category === category,
                      );
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category}>
                          <DropdownMenuLabel className="text-purple-300 text-xs font-semibold px-2 py-1.5 sticky top-0 bg-purple-900/95 z-10">
                            {category}
                          </DropdownMenuLabel>
                          {categoryItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <DropdownMenuItem
                                key={item.name}
                                onClick={() => handleNavigation(item.path)}
                                className="text-white hover:bg-purple-500/20 hover:text-white cursor-pointer px-2 py-2"
                              >
                                <IconComponent className="h-4 w-4 shrink-0 text-white" />
                                <span className="truncate">{item.name}</span>
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator className="bg-purple-500/20 my-1" />
                        </div>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Acciones de Usuario - Derecha */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Iconos de Acción */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => {
                    handleNavigation("/tokens");
                    logger.info("Tokens icon clicked");
                  }}
                  className="p-2 text-white hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  title="Tokens"
                >
                  <DollarSign className="h-5 w-5 text-white hover:text-purple-400" />
                </button>
                <button
                  onClick={() => {
                    handleNavigation("/faq");
                    logger.info("Help icon clicked");
                  }}
                  className="p-2 text-white hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  title="Ayuda"
                >
                  <HelpCircle className="h-5 w-5 text-white hover:text-purple-400" />
                </button>
                <button
                  onClick={() => {
                    if (isAuthenticated()) {
                      handleNavigation("/settings");
                    } else {
                      handleNavigation("/info");
                    }
                    logger.info("Settings icon clicked");
                  }}
                  className="p-2 text-white hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  title="Configuración"
                >
                  <Settings className="h-5 w-5 text-white hover:text-purple-400" />
                </button>
                <button
                  onClick={() => {
                    if (isAuthenticated()) {
                      // TODO: Abrir NotificationCenter dropdown o navegar a página de notificaciones
                      handleNavigation("/notifications");
                    } else {
                      handleNavigation("/news");
                    }
                    logger.info("Notifications icon clicked");
                  }}
                  className="relative p-2 text-white hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                  title="Notificaciones"
                >
                  <Bell className="h-5 w-5 text-white hover:text-purple-400" />
                  <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-purple-500 text-white text-xs flex items-center justify-center rounded-full shadow-lg border-2 border-purple-600 z-10">
                    3
                  </Badge>
                </button>
              </div>

              {/* Botón de Login/Perfil - Muestra estado de autenticación */}
              {isAuthenticated() ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-3 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105 sm:hover:scale-110 min-w-[100px] sm:min-w-[140px] border-2 border-purple-400 flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2 shrink-0 text-white" />
                      <span className="hidden sm:inline text-sm sm:text-base truncate max-w-[120px]">
                        {displayUserLabel}
                      </span>
                      <span className="sm:hidden text-xs">Perfil</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-purple-900/95 backdrop-blur-xl border-purple-500/30 text-white w-56"
                  >
                    <DropdownMenuLabel className="text-white font-semibold">
                      {displayUserLabel}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-purple-500/30" />
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="text-white hover:bg-purple-700/50 cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2 text-white" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="text-white hover:bg-purple-700/50 cursor-pointer"
                    >
                      <Settings className="h-4 w-4 mr-2 text-white" />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-purple-500/30" />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        navigate("/auth", { replace: true });
                      }}
                      className="text-red-300 hover:bg-red-900/50 cursor-pointer"
                    >
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleLogin}
                  className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-3 sm:px-6 py-2 sm:py-3 rounded-xl shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105 sm:hover:scale-110 min-w-[100px] sm:min-w-[140px] border-2 border-purple-400 flex items-center justify-center"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2 shrink-0 text-white" />
                  <span className="hidden sm:inline text-sm sm:text-base">
                    Ingresar
                  </span>
                  <span className="sm:hidden text-xs">Ingresar</span>
                </Button>
              )}

              {/* Botón Menú Móvil - Trigger para Sheet */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="lg:hidden p-2 text-white hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                    aria-label="Abrir menú"
                    title="Abrir menú"
                  >
                    <Menu className="h-6 w-6 text-white" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="bg-linear-to-b from-purple-900 via-purple-900 to-blue-900 border-r border-purple-500/30 text-white w-80 overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle className="text-white text-left flex items-center space-x-2">
                      <Heart className="h-6 w-6 text-purple-400 fill-current" />
                      <span className="bg-linear-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                        CómplicesConecta
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Main Links */}
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wider text-purple-300 font-semibold pl-4 mb-2">
                        Principal
                      </h3>
                      {mainNavItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                              isActive(item.path)
                                ? "bg-purple-600/30 text-white border-r-2 border-purple-400"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                            <span className="font-medium">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Secondary Links Grouped by Category */}
                    {[
                      "Contenido & Empresa",
                      "Explorar",
                      "Ayuda",
                      "Legal",
                    ].map((category) => {
                      const categoryItems = secondaryNavItems.filter(
                        (item) => item.category === category,
                      );
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <h3 className="text-xs uppercase tracking-wider text-purple-300 font-semibold pl-4 mb-2">
                            {category}
                          </h3>
                          {categoryItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.name}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-all duration-300 ${
                                  isActive(item.path)
                                    ? "bg-purple-600/30 text-white border-r-2 border-purple-400"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <IconComponent className="h-4 w-4 text-white" />
                                <span className="font-medium text-sm">
                                  {item.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Acciones Móviles */}
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <button
                        onClick={() => handleNavigation("/tokens")}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/5 rounded-lg transition-all"
                      >
                        <DollarSign className="h-5 w-5 text-white" />
                        <span>Tokens</span>
                      </button>
                      <button
                        onClick={() => {
                          if (isAuthenticated()) {
                            handleNavigation("/settings");
                          } else {
                            handleNavigation("/info");
                          }
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/5 rounded-lg transition-all"
                      >
                        <Settings className="h-5 w-5 text-white" />
                        <span>Configuración</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {isHomeRoute && (
          <div className="w-full">
            <BetaBanner embedded />
          </div>
        )}
      </header>

      {/* Espaciador para contenido */}
      <div className="h-16"></div>

      {/* Animaciones personalizadas del corazón */}
      <style>{`
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.3); }
          28% { transform: scale(1); }
          42% { transform: scale(1.3); }
          70% { transform: scale(1); }
        }

        @keyframes heartGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.9))
                    drop-shadow(0 0 30px rgba(217, 70, 239, 0.5));
          }
        }

        @keyframes heartFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        .animate-heart-float {
          animation: heartFloat 3s ease-in-out infinite;
        }

        @keyframes heart-particle-1 {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translate(-8px, -12px) scale(1) rotate(15deg); opacity: 0; }
        }

        @keyframes heart-particle-2 {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translate(8px, -16px) scale(1) rotate(-15deg); opacity: 0; }
        }

        .animate-heart-particle-1 {
          animation: heart-particle-1 4s ease-in-out infinite;
        }

        .animate-heart-particle-2 {
          animation: heart-particle-2 5s ease-in-out infinite 1s;
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </>
  );
};
