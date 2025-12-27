import React, { useState } from "react";
import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import { Button } from "@/components/ui/buttons/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  User,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  premium?: boolean;
}

interface ResponsiveNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

// Este componente unificado reemplaza la lÃ³gica anterior de JS para renderizado condicional.
// Utiliza un enfoque "mobile-first" con clases de Tailwind para una responsividad nativa.
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  currentPath,
  onNavigate,
  className,
}) => {
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      onNavigate("/auth");
    } catch (error) {
      logger.error("Error al cerrar sesiÃ³n:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      id: "home",
      label: "Inicio",
      icon: <Home className="h-5 w-5" />,
      href: "/",
    },
    {
      id: "discover",
      label: "Descubrir",
      icon: <Search className="h-5 w-5" />,
      href: "/discover",
    },
    {
      id: "matches",
      label: "Matches",
      icon: <Heart className="h-5 w-5" />,
      href: "/matches",
      badge: 3,
    },
    {
      id: "chat",
      label: "Chat",
      icon: <MessageCircle className="h-5 w-5" />,
      href: "/chat",
      badge: 5,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: <User className="h-5 w-5" />,
      href: "/profile",
    },
  ];

  const sidebarVariants: Variants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const sidebarTransition: Transition = { type: "spring", stiffness: 300, damping: 30 };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  return (
    <>
      {/* Mobile & Tablet Navigation (Visible por defecto, oculto en `md` y superior) */}
      <div className={cn("md:hidden", className)}>
        {/* Top Bar */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-pt safe-area-inset"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent stable-element">
              ComplicesConecta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={profile?.avatar_url}
                alt={profile?.display_name || profile?.first_name}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Bottom Navigation */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-2 py-1.5 safe-area-pb safe-area-inset"
        >
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.id}
                item={item}
                currentPath={currentPath}
                onNavigate={onNavigate}
                isMobileBottomBar={true}
              />
            ))}
          </div>
        </motion.div>

        {/* Mobile Sidebar (Drawer) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={sidebarTransition}
                className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-white shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={profile?.avatar_url}
                          alt={profile?.display_name || profile?.first_name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                          {profile?.display_name?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {profile?.display_name || "Usuario"}
                        </h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="space-y-2">
                    {navigationItems.map((item) => (
                      <NavigationButton
                        key={item.id}
                        item={item}
                        isMobileDrawer={true}
                        currentPath={currentPath}
                        onNavigate={onNavigate}
                        onMobileClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                    <div className="border-t border-gray-200 pt-4 mt-6 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 p-4"
                      >
                        <Settings className="h-5 w-5" />
                        ConfiguraciÃ³n
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 p-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar SesiÃ³n
                      </Button>
                    </div>
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Navigation (Oculto por defecto, visible en `md` y superior) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:z-40",
          "md:w-20 hover:w-64 transition-all duration-300",
          "bg-white/90 backdrop-blur-sm border-r border-gray-200",
          "group overflow-hidden",
          className,
        )}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 min-h-[48px]">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <h2 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent stable-element">
                ComplicesConecta
              </h2>
            </div>
          </div>
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.id}
                item={item}
                currentPath={currentPath}
                onNavigate={onNavigate}
                isDesktop={true}
              />
            ))}
          </nav>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage
                  src={profile?.avatar_url}
                  alt={profile?.display_name || profile?.first_name}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.display_name || "Usuario"}
                </p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 p-3 hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                ConfiguraciÃ³n
              </span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Cerrar SesiÃ³n
              </span>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// El botÃ³n de navegaciÃ³n ahora es mÃ¡s inteligente y se adapta a su contexto (barra inferior, drawer, escritorio)
interface NavigationButtonProps {
  item: NavigationItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  onMobileClick?: () => void;
  isMobileBottomBar?: boolean;
  isMobileDrawer?: boolean;
  isDesktop?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  item,
  currentPath,
  onNavigate,
  onMobileClick,
  isMobileBottomBar,
  isMobileDrawer,
  isDesktop,
}) => {
  const isActive = currentPath === item.href;

  const handleClick = () => {
    onNavigate(item.href);
    if (onMobileClick) onMobileClick();
  };

  return (
    <motion.div
      whileHover={{ scale: isDesktop ? 1.05 : 1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(isMobileBottomBar && "flex-1 flex justify-center")}
    >
      <Button
        variant={isActive ? "default" : "ghost"}
        className={cn(
          "relative transition-all duration-200 group/button",
          // Estilos para el drawer del menÃº mÃ³vil
          isMobileDrawer && "w-full justify-start gap-3 p-4",
          // Estilos para la barra de navegaciÃ³n inferior mÃ³vil
          isMobileBottomBar && "flex-col h-auto p-1 android-sm:p-0.5",
          // Estilos para la barra lateral de escritorio
          isDesktop && "w-full justify-start gap-3 p-3",

          isActive &&
            "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg",
          !isActive && "hover:bg-purple-50 hover:text-purple-600",
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            "relative flex-shrink-0",
            isMobileBottomBar && "mb-0.5",
          )}
        >
          {item.icon}
          {item.badge && item.badge > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white">
              {item.badge > 99 ? "99+" : item.badge}
            </Badge>
          )}
        </div>

        {/* Etiqueta para Drawer y Desktop */}
        {(isMobileDrawer || (isDesktop && !item.premium)) && (
          <span
            className={cn(
              "font-medium",
              isDesktop &&
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap",
            )}
          >
            {item.label}
          </span>
        )}

        {/* Etiqueta especÃ­fica para la barra inferior, con ajuste para pantallas pequeÃ±as */}
        {isMobileBottomBar && (
          <span className="text-xs android-sm:text-[10px] android-sm:hidden android-md:inline-block">
            {item.label}
          </span>
        )}

        {isDesktop && item.premium && (
          <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap flex items-center">
            {item.label} <Crown className="h-3 w-3 text-yellow-500 ml-1.5" />
          </span>
        )}
      </Button>
    </motion.div>
  );
};


