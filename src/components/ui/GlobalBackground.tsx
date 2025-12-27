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
import { useBackgroundPreferences } from '@/hooks/useBackgroundPreferences';
import { useBackgroundContext } from '@/context/BackgroundContext';

export const GlobalBackground: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { prefs } = useTheme();
  const { profile } = useAuth();
  const { mode, setMode } = useBgMode();
  const { config } = useAnimation();
  const _pathname = useLocation().pathname;
  const { tier, isLowEnd, allowParticles, allowBlur: _allowBlur } = useDeviceCapability();
  
  // Derivar propiedades de compatibilidad desde el hook simplificado
  const isHighEnd = tier === 'high';
  const isMediumEnd = tier === 'mid';
  const isMediumHigh = tier === 'mid' || tier === 'high';
  const enableFullAnimations = allowParticles;
  const deviceType = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile';
  const { preferences: bgPrefs } = useBackgroundPreferences();
  
  // Usar BackgroundContext para ├¡ndice persistente
  const { backgroundImage: contextBgImage } = useBackgroundContext();

  const [engineReady, setEngineReady] = useState(false);
  const [resolvedBackgroundImage, setResolvedBackgroundImage] = useState<string>('/backgrounds/bg1.jpg');

  // Escuchar cambios en preferencias de background
  useEffect(() => {
    const handlePreferencesChange = () => {
      // Forzar re-render cuando cambien las preferencias
      setResolvedBackgroundImage(prev => prev);
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
        // Fallback: mostrar part├¡culas de todas formas
        setEngineReady(true);
      }
    };
    initEngine();
  }, []);

  useEffect(() => {
    if (isLowEnd) return;
    if (!allowParticles) return;
    if (!bgPrefs.particlesEnabled) return;
    if (mode !== 'static') return;
    setMode('particles');
  }, [allowParticles, bgPrefs.particlesEnabled, isLowEnd, mode, setMode]);

  // backgroundImage ahora viene del contexto (persistente entre navegaciones)
  const backgroundImage = useMemo(() => {
    if (prefs?.isCustom && prefs.background) {
      return prefs.background;
    }
    return contextBgImage;
  }, [contextBgImage, prefs?.background, prefs?.isCustom]);

  useEffect(() => {
    if (!backgroundImage) {
      setResolvedBackgroundImage('/backgrounds/bg1.jpg');
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      setResolvedBackgroundImage(backgroundImage);
    };

    img.onerror = () => {
      // Fallback a la primera imagen si falla
      if (cancelled) return;
      setResolvedBackgroundImage('/backgrounds/bg1.jpg');
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
        color: { value: ['#00FFFF', '#FF00FF', '#AA00FF'] },
        links: {
          color: '#00FFFF',
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

  // Adaptar modo seg├║n capacidad del dispositivo
  let adaptiveMode = mode;
  
  if (isLowEnd) {
    // Gama baja: Solo gradientes sin animaciones
    adaptiveMode = 'static';
  } else if (isMediumEnd) {
    // Gama media: Desktop puede manejar part├¡culas, mobile se queda en static
    adaptiveMode = deviceType === 'desktop' && enableFullAnimations ? 'particles' : 'static';
  } else if (isMediumHigh) {
    // Gama media-alta: Fondos aleatorios con opci├│n de animaciones
    if (enableFullAnimations) {
      adaptiveMode = 'particles';
    } else {
      adaptiveMode = 'static';
    }
  } else if (isHighEnd) {
    // Gama alta: DESKTOP - Todo habilitado - part├¡culas + backgrounds aleatorios
    // MOBILE/TABLET - Part├¡culas con 120Hz
    if (deviceType === 'desktop') {
      // Desktop: Forzar part├¡culas + backgrounds aleatorios
      adaptiveMode = 'particles';
    } else {
      // Mobile/Tablet: Usar modo configurado
      adaptiveMode = mode;
    }
  }
  
  const finalMode = adaptiveMode;
  // Respetar preferencia del usuario para part├¡culas
  const showVideo =
    finalMode === 'video' &&
    enableFullAnimations &&
    !isLowEnd &&
    deviceType === 'desktop' &&
    bgPrefs.particlesEnabled &&
    config.enableBackgroundAnimations &&
    config.enableParticles &&
    !config.reducedMotion;
  // Mostrar part├¡culas si: engine est├í listo Y enableParticles es true Y no hay reducedMotion
  // (Simplificado: no depender de finalMode para permitir part├¡culas en modo static)
  const showParticles =
    engineReady &&
    config.enableParticles &&
    !config.reducedMotion;

  const videoSrc = profile?.profile_type === 'couple'
    ? '/backgrounds/Animate-bg2.mp4'
    : '/backgrounds/animate-bg.mp4';

  return (
    <>
      {/* Contenedor de part├¡culas FIJO con z-index negativo (NO bloquea contenido) */}
      {engineReady && showParticles && (
        <div 
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -50
          }}
        >
          <Particles
            id="tsparticles-global"
            options={{
              ...particlesOptions,
              fullScreen: { enable: false },
              particles: {
                ...particlesOptions.particles,
                number: { value: profile?.is_premium ? 120 : 70 },
              },
            }}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Contenedor principal del fondo - z-index negativo */}
      <div 
        className={cn('pointer-events-none', className)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -100,
          backgroundColor: 'transparent'
        }}
      >
        {/* Imagen de Fondo (capa m├ís baja) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900"
          style={{ 
            backgroundImage: bgPrefs.backgroundMode === 'solid' ? 'none' : `url(${resolvedBackgroundImage})`,
            backgroundColor: bgPrefs.backgroundMode === 'solid' ? bgPrefs.solidColor : undefined
          }}
        />

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

        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Contenido scrollable - position relative, z-index positivo */}
      <div className="relative w-full h-full overflow-auto pointer-events-auto" style={{ zIndex: 1 }}>
        {children}
      </div>
    </>
  );
};

export default GlobalBackground;

