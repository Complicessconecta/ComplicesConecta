import React, { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBgMode } from '@/hooks/useBgMode';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/useAuth';
import { useAnimation } from '@/components/animations/AnimationProvider';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useBackgroundPreferences } from '@/hooks/useBackgroundPreferences';

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
  const { tier, isLowEnd, allowParticles, allowBlur: _allowBlur } = useDeviceCapability();
  
  // Derivar propiedades de compatibilidad desde el hook simplificado
  const isHighEnd = tier === 'high';
  const isMediumEnd = tier === 'mid';
  const isMediumHigh = tier === 'mid' || tier === 'high';
  const enableFullAnimations = allowParticles;
  const deviceType = isHighEnd ? 'desktop' : 'mobile';
  const { preferences: bgPrefs } = useBackgroundPreferences();

  const [engineReady, setEngineReady] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [resolvedBackgroundImage, setResolvedBackgroundImage] = useState<string>(() => {
    if (prefs?.isCustom && prefs.background) return prefs.background;
    return STATIC_BACKGROUNDS[0];
  });

  // Escuchar cambios en preferencias de background
  useEffect(() => {
    const handlePreferencesChange = () => {
      // Forzar re-render cuando cambien las preferencias
      setBgIndex(prev => prev);
    };
    window.addEventListener('backgroundPreferencesChanged', handlePreferencesChange);
    return () => window.removeEventListener('backgroundPreferencesChanged', handlePreferencesChange);
  }, []);

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

  // Cambiar fondo según preferencias del usuario
  useEffect(() => {
    // Usar preferencias del usuario si están disponibles
    const effectiveMode = bgPrefs.backgroundMode === 'random' ? 'random' : 
                         bgPrefs.backgroundMode === 'fixed' ? 'fixed' : 
                         backgroundMode;

    if (effectiveMode === 'random') {
      // Modo aleatorio: cambiar cada 5 segundos
      const interval = setInterval(() => {
        setBgIndex(Math.floor(Math.random() * STATIC_BACKGROUNDS.length));
      }, 5000);
      return () => clearInterval(interval);
    } else if (effectiveMode === 'fixed') {
      // Modo fijo: usar hash del pathname
      const hash = Array.from(pathname).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      setBgIndex(Math.abs(hash) % STATIC_BACKGROUNDS.length);
    } else {
      // Modo default: usar primer fondo
      setBgIndex(0);
    }
  }, [backgroundMode, pathname, bgPrefs.backgroundMode]);

  const backgroundImage = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return prefs.background;
    }
    return STATIC_BACKGROUNDS[bgIndex];
  }, [bgIndex, prefs?.background, prefs?.isCustom]);

  useEffect(() => {
    if (!backgroundImage) return;

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      setResolvedBackgroundImage(backgroundImage);
    };

    img.onerror = () => {
      // Mantener el último background válido si el siguiente falla.
      // No hacemos setState aquí para evitar flicker.
    };

    img.src = backgroundImage;

    return () => {
      cancelled = true;
    };
  }, [backgroundImage]);

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
    // Gama baja: Solo gradientes sin animaciones
    adaptiveMode = 'static';
  } else if (isMediumEnd) {
    // Gama media: Fondos aleatorios sin partículas
    adaptiveMode = 'static';
  } else if (isMediumHigh) {
    // Gama media-alta: Fondos aleatorios con opción de animaciones
    if (enableFullAnimations) {
      adaptiveMode = 'particles';
    } else {
      adaptiveMode = 'static';
    }
  } else if (isHighEnd) {
    // Gama alta: DESKTOP - Todo habilitado - partículas + backgrounds aleatorios
    // MOBILE/TABLET - Partículas con 120Hz
    if (deviceType === 'desktop') {
      // Desktop: Forzar partículas + backgrounds aleatorios
      adaptiveMode = 'particles';
    } else {
      // Mobile/Tablet: Usar modo configurado
      adaptiveMode = mode;
    }
  }
  
  const finalMode = adaptiveMode;
  // Respetar preferencia del usuario para partículas
  const showVideo = finalMode === 'video' && enableFullAnimations && !isLowEnd && deviceType === 'desktop' && bgPrefs.particlesEnabled;
  const showParticles = (finalMode === 'particles') && enableFullAnimations && bgPrefs.particlesEnabled;

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

        {/* Mostrar fondo siempre (con o sin partículas) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${resolvedBackgroundImage})` }}
        />

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

