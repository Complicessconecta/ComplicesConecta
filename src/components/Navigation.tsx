import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Heart, User, Settings, Coins, Search, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useFeatures } from '@/hooks/useFeatures';
import { cn } from '@/shared/lib/cn';
import { getNavbarStyles } from '@/features/profile/useProfileTheme';
import { useAuth } from '@/features/auth/useAuth';
import { usePersistedState } from '@/hooks/usePersistedState';

interface NavigationProps {
  className?: string;
}

const Navigation = ({ className }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { features } = useFeatures();
  const { signOut, getProfileType } = useAuth();

  // Determinar el estilo del navbar desde localStorage para mantener la personalización del tema.
  const [navbarStyle] = usePersistedState<'transparent' | 'solid'>('demo_navbar_style', 'solid');
  const _navbarStyles = getNavbarStyles(navbarStyle || 'solid');
  
  const profileType = getProfileType();

  const getSettingsPath = () => {
    return profileType === 'couple' ? '/edit-profile-couple' : '/edit-profile-single';
  };

  const navItems = features.requests 
    ? [
        { id: 'feed', icon: Home, label: 'Inicio', path: '/feed' },
        { id: 'discover', icon: Search, label: 'Descubrir', path: '/discover' },
        { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/chat' },
        { id: 'requests', icon: UserPlus, label: 'Solicitudes', path: '/requests' },
        { id: 'matches', icon: Heart, label: 'Matches', path: '/matches' },
        { id: 'tokens', icon: Coins, label: 'Tokens', path: '/tokens' },
        { id: 'profile', icon: User, label: 'Perfil', path: '/profile' },
        { id: 'settings', icon: Settings, label: 'Config', path: getSettingsPath() },
      ]
    : [
        { id: 'feed', icon: Home, label: 'Inicio', path: '/feed' },
        { id: 'discover', icon: Search, label: 'Descubrir', path: '/discover' },
        { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/chat' },
        { id: 'matches', icon: Heart, label: 'Matches', path: '/matches' },
        { id: 'tokens', icon: Coins, label: 'Tokens', path: '/tokens' },
        { id: 'profile', icon: User, label: 'Perfil', path: '/profile' },
        { id: 'settings', icon: Settings, label: 'Config', path: getSettingsPath() },
      ];

  // Logout movido al header/profile, no en bottom nav

  const handleNavigation = async (path: string) => {
    if (path === '/logout') {
      await signOut();
      navigate('/auth', { replace: true });
      return;
    }

    if (path === '/profile') {
      navigate(profileType === 'couple' ? '/profile-couple' : '/profile-single');
      return;
    }
    
    navigate(path);
  };

  // No renderizar la barra de navegación en la página de autenticación
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <>
      {/* Botón flotante de cambio de tema */}
      <div className="fixed top-20 right-4 z-40">
        <ThemeToggle />
      </div>

      {/* Navegación inferior */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-blue-900/80",
        "backdrop-blur-xl border-t border-purple-500/40",
        "px-2 sm:px-4 py-2 sm:py-3 safe-area-pb",
        "translate-y-0 opacity-100 shadow-lg shadow-purple-900/50",
        className
      )}>
        <div className="flex items-center justify-around w-full max-w-full mx-auto overflow-x-auto scrollbar-hide safe-area-inset gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path === '/profile' && (location.pathname === '/profile-single' || location.pathname === '/profile-couple')) ||
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-300 min-w-[3.5rem] sm:min-w-[4rem]",
                  isActive 
                    ? "bg-white/10 text-white scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-white/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-transform duration-300",
                  isActive ? "scale-110 text-purple-300" : ""
                )} />
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium tracking-wide",
                  isActive ? "text-white" : "text-gray-400"
                )}>
                  {item.label}
                </span>
                
                {/* Indicador activo */}
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
