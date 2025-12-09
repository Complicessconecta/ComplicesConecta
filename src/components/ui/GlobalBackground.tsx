import React, { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { useBgMode } from '@/hooks/useBgMode';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/useAuth';
import { useAnimation } from '@/components/animations/AnimationProvider';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

const STATIC_BACKGROUNDS = [
  '/backgrounds/bg1.jpg',
  '/backgrounds/bg2.jpg',
  '/backgrounds/bg3.jpg',
  '/backgrounds/bg4.jpg',
  '/backgrounds/bg5.webp',
];

export const GlobalBackground: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { prefs } = useTheme();
  const { profile } = useAuth();
  const { mode, backgroundMode } = useBgMode();
  const { config } = useAnimation();
  const { pathname } = useLocation();
  const { capability, isLowEnd, isMediumEnd, isHighEnd } = useDeviceCapability();

  const [engineReady, setEngineReady] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const initEngine = async () => {
      try {
        await initParticlesEngine(async (engine: Engine) => {
          await loadSlim(engine);
        });
        setEngineReady(true);
      } catch (error) {
        console.error('Error initializing particles engine:', error);
        // Fallback: mostrar partículas de todas formas
        setEngineReady(true);
      }
    };
    initEngine();
  }, []);

  // Cambiar fondo aleatorio cada cierto tiempo si está en modo aleatorio
  useEffect(() => {
    if (backgroundMode === 'random') {
      const interval = setInterval(() => {
        setBgIndex(Math.floor(Math.random() * STATIC_BACKGROUNDS.length));
      }, 5000); // Cambiar cada 5 segundos
      return () => clearInterval(interval);
    } else {
      // Modo fijo: usar hash del pathname
      const hash = Array.from(pathname).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      setBgIndex(Math.abs(hash) % STATIC_BACKGROUNDS.length);
    }
  }, [backgroundMode, pathname]);

  const backgroundImage = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return prefs.background;
    }
    return STATIC_BACKGROUNDS[bgIndex];
  }, [bgIndex, prefs?.background, prefs?.isCustom]);

  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: isHighEnd ? 120 : (isMediumEnd ? 60 : 30),
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
          speed: config.reducedMotion ? 0.4 : 1.4,
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
    }),
    [config.reducedMotion, profile?.is_premium]
  );

  // Adaptar modo según capacidad del dispositivo
  let adaptiveMode = mode;
  if (isLowEnd) {
    // Gama baja: Solo gradientes
    adaptiveMode = 'static';
  } else if (isMediumEnd && mode === 'particles') {
    // Gama media: Cambiar partículas a fondos aleatorios
    adaptiveMode = 'static';
  }

  const finalMode = adaptiveMode;
  const showVideo = finalMode === 'video' && !isLowEnd;
  const showParticles = (finalMode === 'particles' || finalMode === 'static') && isHighEnd;
  const videoSrc = profile?.profile_type === 'couple'
    ? '/backgrounds/Animate-bg2.mp4'
    : '/backgrounds/animate-bg.mp4';

  return (
    <div className={cn('fixed inset-0 w-full h-full bg-black', className)}>
      {/* Fixed Background Layer */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        {/* Gradient Background Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900" />

        {showVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {!showVideo && finalMode !== 'particles' && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}

        {engineReady && showParticles && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Particles
              id="tsparticles-global"
              options={{
                ...particlesOptions,
                fullScreen: { enable: true, zIndex: 0 },
                particles: {
                  ...particlesOptions.particles,
                  number: { value: profile?.is_premium ? 120 : 70 },
                },
              }}
              className="w-full h-full pointer-events-none"
            />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Scrollable Content Layer */}
      <div className="absolute inset-0 z-10 w-full h-full overflow-auto pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackground;
