import React, { useMemo } from 'react';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { cn } from '@/lib/utils';

/**
 * AdaptiveBackground Component
 * 
 * Renderiza fondos adaptativos basados en la capacidad del dispositivo (Tier-based).
 * 
 * - LOW Tier: Solo gradientes CSS estáticos (sin partículas)
 * - MID Tier: Gradientes + partículas simples + glassmorphism condicional
 * - HIGH Tier: Full experience (gradientes, partículas interactivas, video backgrounds)
 */

interface AdaptiveBackgroundProps {
  className?: string;
  showParticles?: boolean;
  showGlass?: boolean;
  variant?: 'gradient' | 'particles' | 'video' | 'mixed';
}

export const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({
  className,
  showParticles = true,
  showGlass = true,
  variant = 'mixed',
}) => {
  const deviceInfo = useDeviceCapability();

  // Determinar qué renderizar basado en el Tier
  const shouldRenderParticles = useMemo(() => {
    if (!showParticles) return false;
    return deviceInfo.enableParticles && deviceInfo.tier !== 'LOW';
  }, [deviceInfo.enableParticles, deviceInfo.tier, showParticles]);

  const shouldRenderGlass = useMemo(() => {
    if (!showGlass) return false;
    return deviceInfo.enableGlassmorphism && deviceInfo.tier !== 'LOW';
  }, [deviceInfo.enableGlassmorphism, deviceInfo.tier, showGlass]);

  const shouldRenderVideo = useMemo(() => {
    return deviceInfo.enableVideoBackgrounds && deviceInfo.tier === 'HIGH';
  }, [deviceInfo.enableVideoBackgrounds, deviceInfo.tier]);

  // Mostrar Toast de advertencia para MID Tier
  React.useEffect(() => {
    if (deviceInfo.tier === 'MID' && !deviceInfo.enableFullAnimations) {
      // Aquí se podría mostrar un toast de "Modo Rendimiento: Efectos reducidos"
      // Por ahora solo lo loguea en debug
      if (typeof window !== 'undefined' && (window as any).__DEBUG__) {
        console.log('⚠️ Modo Rendimiento: Efectos reducidos en MID Tier');
      }
    }
  }, [deviceInfo.tier, deviceInfo.enableFullAnimations]);

  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden',
        className
      )}
      data-tier={deviceInfo.tier}
      data-device-type={deviceInfo.deviceType}
    >
      {/* BASE GRADIENT - Siempre presente */}
      <div
        className={cn(
          'absolute inset-0 transition-colors duration-1000',
          deviceInfo.tier === 'LOW'
            ? 'bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900'
            : 'bg-gradient-to-br from-purple-900 via-black to-blue-900'
        )}
      />

      {/* PARTICLES - Renderizado condicional por Tier */}
      {shouldRenderParticles && (
        <div
          className={cn(
            'absolute inset-0 opacity-60',
            deviceInfo.tier === 'HIGH' ? 'opacity-80' : 'opacity-40'
          )}
        >
          {/* Partículas simples usando CSS puro */}
          {Array.from({ length: deviceInfo.tier === 'HIGH' ? 20 : 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20',
                'animate-pulse'
              )}
              style={{
                width: Math.random() * 100 + 50 + 'px',
                height: Math.random() * 100 + 50 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDuration: Math.random() * 3 + 2 + 's',
                animationDelay: Math.random() * 2 + 's',
              }}
            />
          ))}
        </div>
      )}

      {/* GLASSMORPHISM OVERLAY - Solo para MID/HIGH Tier */}
      {shouldRenderGlass && (
        <div
          className={cn(
            'absolute inset-0 backdrop-blur-sm',
            deviceInfo.tier === 'HIGH' ? 'backdrop-blur-md' : 'backdrop-blur-sm'
          )}
          style={{
            background: deviceInfo.tier === 'HIGH'
              ? 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
          }}
        />
      )}

      {/* VIDEO BACKGROUND - Solo para HIGH Tier */}
      {shouldRenderVideo && (
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{
            mixBlendMode: 'screen',
          }}
        >
          <source src="/backgrounds/animated-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* NOISE TEXTURE - Siempre presente para HIGH Tier */}
      {deviceInfo.tier === 'HIGH' && (
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      )}
    </div>
  );
};

/**
 * Hook para acceder al Tier del dispositivo
 * Útil para componentes que necesitan adaptar su UI basado en capacidad
 */
export const useAdaptiveBackground = () => {
  const deviceInfo = useDeviceCapability();
  
  return {
    tier: deviceInfo.tier,
    isLow: deviceInfo.tier === 'LOW',
    isMid: deviceInfo.tier === 'MID',
    isHigh: deviceInfo.tier === 'HIGH',
    enableParticles: deviceInfo.enableParticles,
    enableGlassmorphism: deviceInfo.enableGlassmorphism,
    enableVideoBackgrounds: deviceInfo.enableVideoBackgrounds,
  };
};
