import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { useTheme } from '@/hooks/useTheme';
import { GlobalBackground } from '@/components/ui/GlobalBackground';

interface RandomBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const MasterBackground = ({ children }: { children: React.ReactNode }) => {
  return <GlobalBackground>{children}</GlobalBackground>;
};

const fallbackBackground = '/backgrounds/bg1.jpg';
const backgrounds = [
  '/backgrounds/bg1.jpg',
  '/backgrounds/bg2.jpg',
  '/backgrounds/bg3.jpg',
  '/backgrounds/bg4.jpg',
  '/backgrounds/bg5.webp',
];

export const RandomBackground: React.FC<RandomBackgroundProps> = ({ children, className }) => {
  const { pathname } = useLocation();
  const { prefs } = useTheme();

  const resolvedBackground = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return prefs.background;
    }

    const index = Math.abs(Array.from(pathname).reduce((acc, char) => acc + char.charCodeAt(0), 0)) % backgrounds.length;
    const randomBg = backgrounds[index];
    return randomBg || fallbackBackground;
  }, [prefs.background, prefs.isCustom, pathname]);

  // Si el usuario desactivó "Fondo Animado" o "Partículas" desde el engrane,
  // podemos mostrar un color sólido o el fondo estático sin efectos extra.
  // Aquí usamos las preferencias para decidir la opacidad o efectos.

  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden bg-black', className)}>
      {/* Capa de imagen de fondo */}
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center bg-no-repeat'
        )}
        style={{ backgroundImage: `url(${resolvedBackground || fallbackBackground})` }}
      />

      {/* Overlay Neón (Controlado por el engrane: glowLevel) */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-purple-900/30 to-pink-900/30',
          prefs?.glowLevel === 'high' ? 'animate-pulse' : ''
        )}
      />

      {/* Contenido (si lo hay) */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
