import React, { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { useLocation } from 'react-router-dom';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useBackgroundPreferences } from '@/hooks/useBackgroundPreferences';
import { useBgMode } from '@/hooks/useBgMode';

interface UnifiedBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

// Imágenes de fondo por ruta
const BACKGROUND_IMAGES = [
  '/backgrounds/bg1.jpg',
  '/backgrounds/bg2.jpg',
  '/backgrounds/bg3.jpg',
  '/backgrounds/bg4.jpg',
  '/backgrounds/bg5.webp',
];

const SNOW_ROUTES = new Set<string>([
  '/',
  '/info',
  '/about',
  '/faq',
  '/project-info',
  '/auth',
  '/login',
  '/register',
  '/terms',
  '/privacy',
]);

const getBackgroundImageByPath = (pathname: string): string => {
  const pathHash = pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = pathHash % BACKGROUND_IMAGES.length;
  return BACKGROUND_IMAGES[index];
};

const UnifiedBackground: React.FC<UnifiedBackgroundProps> = ({ children, className }) => {
  const location = useLocation();
  const { tier, isLowEnd, allowParticles } = useDeviceCapability();
  const { preferences } = useBackgroundPreferences();
  const { reducedMotion } = useBgMode();

  const [backgroundImage, setBackgroundImage] = useState(getBackgroundImageByPath(location.pathname));
  const [resolvedBackground, setResolvedBackground] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const isSnowRoute = SNOW_ROUTES.has(location.pathname);
  const userForcesSolid = preferences.backgroundMode === 'solid';
  const shouldAvoidHeavyParticles = reducedMotion || isLowEnd || !allowParticles;
  let variant: 'solid' | 'css' | 'tsparticles' = userForcesSolid
    ? 'solid'
    : shouldAvoidHeavyParticles
      ? 'css'
      : 'tsparticles';

  // Fuera de rutas públicas, degradar tsparticles (nieve) a partículas CSS ligeras
  if (!isSnowRoute && variant === 'tsparticles') {
    variant = 'css';
  }

  useEffect(() => {
    setBackgroundImage(getBackgroundImageByPath(location.pathname));
  }, [location.pathname]);

  // Preload de imagen con fade-in controlado
  useEffect(() => {
    if (!backgroundImage || variant === 'solid') {
      setResolvedBackground('');
      setImageLoaded(false);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      setResolvedBackground(backgroundImage);
      setImageLoaded(true);
    };

    img.onerror = () => {
      if (cancelled) return;
      setResolvedBackground('');
      setImageLoaded(false);
    };

    img.src = backgroundImage;

    return () => {
      cancelled = true;
    };
  }, [backgroundImage, variant]);

  // Inicializar tsparticles solo cuando puede usarse
  useEffect(() => {
    if (variant !== 'tsparticles') return;

    let mounted = true;

    void initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    })
      .then(() => {
        if (!mounted) return;
        setEngineReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setEngineReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [variant]);

  const snowOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: tier === 'high' ? 60 : 30,
      particles: {
        number: { value: tier === 'high' ? 160 : 90 },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.8 },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: true,
          direction: 'bottom' as const,
          speed: tier === 'high' ? 1.4 : 0.9,
          straight: false,
          random: true,
          drift: 0.8,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'repulse' },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 80, duration: 0.4 },
        },
      },
      detectRetina: true,
    }),
    [tier]
  );

  const showSnowParticles = variant === 'tsparticles' && engineReady;
  const showCssParticles = variant === 'css';

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className || ''}`}>
      {/* Capa base: gradiente sólido (anti-flash) */}
      <div
        className="fixed inset-0 -z-30 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        style={
          variant === 'solid'
            ? { backgroundColor: preferences.solidColor }
            : undefined
        }
      />

      {/* Imagen de fondo con fade-in sólo cuando está cargada */}
      {variant !== 'solid' && resolvedBackground && (
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(${resolvedBackground})`,
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      )}

      {/* Overlay gradiente oscuro para legibilidad */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

      {/* Partículas CSS ligeras para dispositivos low-end */}
      {showCssParticles && (
        <div className="fixed inset-0 -z-5 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                backgroundColor: '#e5e7eb',
                opacity: 0.6,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 3 + 's',
                filter: 'blur(0.5px)',
              }}
            />
          ))}
        </div>
      )}

      {/* Nieve de alta calidad con tsparticles (modo Navidad) */}
      {showSnowParticles && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -5,
            pointerEvents: 'none',
          }}
          className="fixed inset-0 pointer-events-none z-[-5]"
        >
          <Particles
            id="unified-snow"
            options={{
              ...snowOptions,
              fullScreen: { enable: false },
            }}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

export const PageBackground = UnifiedBackground;
export const RandomBackground = UnifiedBackground;
export const MasterBackground = UnifiedBackground;

