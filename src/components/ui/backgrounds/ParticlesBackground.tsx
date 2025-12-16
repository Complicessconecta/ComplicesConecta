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
  const finalMode = reducedMotion ? 'static' : (config.enableParticles && mode === 'static' ? 'particles' : mode);
  const showVideo = finalMode === 'video';
  const forceParticles =
    typeof window !== 'undefined' &&
    (window as unknown as { __FORCE_PARTICLES__?: boolean }).__FORCE_PARTICLES__ === true;
  const showParticles =
    forceParticles ||
    ((finalMode === 'particles' || (finalMode === 'static' && config.enableParticles)) && config.enableParticles);
  const videoSrc = profile?.profile_type === 'couple' 
    ? '/backgrounds/Animate-bg2.mp4' 
    : '/backgrounds/animate-bg.mp4';

  useEffect(() => {
    void initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    })
      .then(() => setEngineReady(true))
      .catch(() => setEngineReady(true));
  }, []);

  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
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
        color: { value: '#ffffff' },
        links: {
          color: '#a855f7',
          distance: 150,
          enable: true,
          opacity: 0.35,
          width: 1,
        },
        move: {
          direction: 'none' as const,
          enable: true,
          outModes: { default: 'bounce' as const },
          random: false,
          // Ajustar velocidad según reducedMotion global
          speed: config.reducedMotion ? 0.4 : 1.4,
          straight: false,
        },
        number: {
          density: { enable: true, area: 800 },
          value: profile?.is_premium ? 120 : 70,
        },
        opacity: { value: 0.65 },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    }),
    [config.reducedMotion, profile?.is_premium]
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

