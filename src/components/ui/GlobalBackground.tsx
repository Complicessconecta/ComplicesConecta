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
  const { mode } = useBgMode();
  const { config } = useAnimation();
  const { pathname } = useLocation();

  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    void initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const backgroundImage = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return prefs.background;
    }
    const hash = Array.from(pathname).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const index = Math.abs(hash) % STATIC_BACKGROUNDS.length;
    return STATIC_BACKGROUNDS[index];
  }, [pathname, prefs?.background, prefs?.isCustom]);

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

  const finalMode = mode;
  const showVideo = finalMode === 'video';
  const showParticles = config.enableParticles && finalMode !== 'static';
  const videoSrc = profile?.profile_type === 'couple'
    ? '/backgrounds/Animate-bg2.mp4'
    : '/backgrounds/animate-bg.mp4';

  return (
    <div className={cn('fixed inset-0 -z-50 w-full h-full overflow-hidden bg-black', className)}>
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {!showVideo && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {engineReady && showParticles && (
        <div className="absolute inset-0 z-0">
          <Particles
            id="tsparticles-global"
            options={{
              ...particlesOptions,
              fullScreen: { enable: true, zIndex: -1 },
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

      <div className="relative z-10 min-h-screen w-full">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackground;
