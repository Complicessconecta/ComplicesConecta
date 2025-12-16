import React, { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { cn } from '@/shared/lib/cn';
import { useBgMode } from '@/hooks/useBgMode';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/useAuth';
import { useAnimation } from '@/components/animations/AnimationProvider';

interface ParticlesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({ children, className }) => {
  const { prefs } = useTheme();
  const { mode, reducedMotion } = useBgMode();
  const { profile } = useAuth();
  const { config } = useAnimation();

  const [engineReady, setEngineReady] = useState(false);

  // Si enableParticles está activado, mostrar partículas incluso en modo 'static'
  const finalMode = reducedMotion ? 'static' : mode;
  const showVideo = finalMode === 'video';
  const forceParticles =
    typeof window !== 'undefined' &&
    (window as unknown as { __FORCE_PARTICLES__?: boolean }).__FORCE_PARTICLES__ === true;
  // Mostrar partículas si: engine está listo Y (enableParticles está true O forceParticles es true) Y no hay reducedMotion
  const showParticles =
    engineReady && (config.enableParticles || forceParticles) && !reducedMotion;

  // Debug logging
  React.useEffect(() => {
    console.log('🎨 ParticlesBackground state:', {
      engineReady,
      enableParticles: config.enableParticles,
      reducedMotion,
      finalMode,
      showParticles,
      forceParticles
    });
  }, [engineReady, config.enableParticles, reducedMotion, finalMode, showParticles, forceParticles]);
  const videoSrc = profile?.profile_type === 'couple' 
    ? '/backgrounds/Animate-bg2.mp4' 
    : '/backgrounds/animate-bg.mp4';

  useEffect(() => {
    console.log('✨ Partículas: Componente montado');
    void initParticlesEngine(async (engine: Engine) => {
      console.log('🌟 Partículas: Motor inicializándose...');
      await loadSlim(engine);
      console.log('🌟 Partículas: Motor inicializado');
    })
      .then(() => {
        setEngineReady(true);
        console.log('✅ Particles engine initialized successfully');
        console.log('🎨 ParticlesBackground: Engine ready, showParticles should be true');
      })
      .catch((err) => {
        console.warn('⚠️ Particles engine init failed, continuing anyway:', err);
        setEngineReady(true);
      });
  }, []);

  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        color: { value: '#ffffff' },
        move: {
          direction: 'none' as const,
          enable: true,
          outModes: { default: 'bounce' as const },
          speed: 1.2,
        },
        number: {
          value: 50,
        },
        opacity: { value: 0.7 },
        shape: { type: 'circle' },
        size: { value: 3 },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div className={cn('min-h-screen w-full relative overflow-x-hidden', className)} style={{ position: 'relative', zIndex: 0 }}>
      {/* VIDEO DE FONDO ANIMADO - z-index: -2 */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: -2, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* FONDO ESTÁTICO (solo si no hay video) - z-index: -2 */}
      {!showVideo && (
        <div
          className="fixed inset-0 bg-cover bg-center pointer-events-none"
          style={{ 
            backgroundImage: `url(${prefs.background || '/backgrounds/bg1.jpg'})`,
            zIndex: -2,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      )}

      {/* PARTÍCULAS TSPARTICLES - z-index: 1 (VISIBLE SOBRE FONDO) */}
      {engineReady && showParticles && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ 
            zIndex: 20,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <Particles
            id="tsparticles-main"
            options={{
              ...particlesOptions,
              fullScreen: { enable: false },
              particles: {
                ...particlesOptions.particles,
                number: { value: profile?.is_premium ? 120 : 70 },
                opacity: { value: 0.65 },
                color: { value: '#ffffff' },
              },
            }}
            className="w-full h-full"
          />
        </div>
      )}

      {/* GLOW + LOGO VIP - z-index: 0 (bajo contenido) */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-blue-600/20 animate-pulse"
        style={{ 
          zIndex: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      {profile?.is_premium && showVideo && (
        <div 
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
        >
          <video autoPlay loop muted playsInline className="w-64 opacity-30">
            <source src="/backgrounds/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* CONTENIDO - z-index: 10 (ENCIMA DE TODO) */}
      <div className="relative min-h-screen bg-transparent" style={{ position: 'relative', zIndex: 30 }}>
        {children}
      </div>
    </div>
  );
};

