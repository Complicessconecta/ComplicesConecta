import React, { useMemo } from 'react';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useBgMode } from '@/hooks/useBgMode';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/useAuth';
import { useAnimation } from '@/components/animations/AnimationProvider';
import { cn } from '@/shared/lib/cn';

interface AdaptiveBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * AdaptiveBackground - Selecciona el tipo de fondo según la capacidad del dispositivo
 * - LOW END: Gradientes estáticos (sin animaciones)
 * - MEDIUM END: Fondos aleatorios con transparencias
 * - HIGH END: Partículas con 120Hz refresh rate
 */
export const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({ 
  children, 
  className 
}) => {
  const { capability } = useDeviceCapability();
  const { prefs } = useTheme();
  const { profile } = useAuth();
  const { mode } = useBgMode();
  const { config } = useAnimation();

  // Determinar el modo de fondo según capacidad
  const adaptiveMode = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return 'custom';
    }

    switch (capability) {
      case 'low':
        // Gama baja: Gradientes estáticos sin animaciones
        return 'gradient';
      case 'medium':
        // Gama media: Fondos aleatorios con transparencias
        return 'random';
      case 'high':
        // Gama alta: Partículas con 120Hz
        return 'particles';
      default:
        return 'gradient';
    }
  }, [capability, prefs?.isCustom, prefs?.background]);

  // Configuración de partículas para gama alta (120Hz)
  const particlesConfig = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 120, // 120Hz para gama alta
    interactivity: {
      events: {
        onClick: { enable: true, mode: 'push' },
        onHover: { enable: true, mode: 'grab' },
      },
      modes: {
        push: { quantity: 4 },
        grab: { distance: 140, links: { opacity: 0.4 } },
      },
    },
    particles: {
      color: { value: '#a855f7' },
      links: {
        color: '#d8b4fe',
        distance: 150,
        enable: true,
        opacity: 0.25,
        width: 1,
      },
      move: {
        direction: 'none' as const,
        enable: true,
        outModes: { default: 'bounce' as const },
        random: false,
        speed: 1.4,
        straight: false,
      },
      number: {
        density: { enable: true, area: 800 },
        value: profile?.is_premium ? 120 : 70,
      },
      opacity: { value: 0.45 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), [profile?.is_premium]);

  return (
    <div className={cn('fixed inset-0 w-full h-full bg-black', className)}>
      {/* Capa de fondo fija */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        {/* Gradiente base - Siempre presente */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900" />

        {/* Gama baja: Solo gradientes estáticos */}
        {adaptiveMode === 'gradient' && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        )}

        {/* Gama media: Fondos aleatorios con transparencias */}
        {adaptiveMode === 'random' && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-60"
              style={{
                backgroundImage: `url(/backgrounds/bg${Math.floor(Math.random() * 5) + 1}.jpg)`,
              }}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-purple-900/40 to-black/20" />
          </>
        )}

        {/* Gama alta: Partículas con 120Hz */}
        {adaptiveMode === 'particles' && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Aquí iría el componente Particles si está disponible */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>
        )}
      </div>

      {/* Capa de contenido scrolleable */}
      <div className="absolute inset-0 z-10 w-full h-full overflow-auto pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

export default AdaptiveBackground;
