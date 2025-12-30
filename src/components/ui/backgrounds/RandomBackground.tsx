import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC, ReactNode } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { useLocation } from 'react-router-dom';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useBackgroundPreferences } from '@/hooks/useBackgroundPreferences';
import { useBgMode } from '@/hooks/useBgMode';
import { useAuth } from '@/features/auth/useAuth';

interface UnifiedBackgroundProps {
  children?: ReactNode;
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
  const length = BACKGROUND_IMAGES.length;
  if (length === 0) return '';
  const pathHash = pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = pathHash % length;
  return BACKGROUND_IMAGES[index] ?? '';
};

const UnifiedBackground: FC<UnifiedBackgroundProps> = ({ children, className }) => {
  const location = useLocation();
  const { tier, isLowEnd, allowParticles } = useDeviceCapability();
  const { preferences } = useBackgroundPreferences();
  const { reducedMotion } = useBgMode();
  const { profile } = useAuth();

  const [backgroundImage, setBackgroundImage] = useState<string>(() => getBackgroundImageByPath(location.pathname));
  const [resolvedBackground, setResolvedBackground] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const lastIndexRef = useRef<number | null>(null);

  const isSnowRoute = SNOW_ROUTES.has(location.pathname);
  const isDemoRoute = location.pathname === '/demo';
  const userForcesSolid = !isDemoRoute && preferences.backgroundMode === 'solid';
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
    if (preferences.backgroundMode === 'solid') {
      setBackgroundImage('');
      return;
    }

    // Fondos deterministas por ruta cuando el modo no es "random"
    if (preferences.backgroundMode === 'fixed' || preferences.backgroundMode === 'default') {
      setBackgroundImage(getBackgroundImageByPath(location.pathname));
      return;
    }

    // Modo "random": elegir una imagen distinta a la anterior por ruta
    setBackgroundImage((prev) => {
      if (BACKGROUND_IMAGES.length === 0) return prev;

      let nextIndex = lastIndexRef.current ?? Math.floor(Math.random() * BACKGROUND_IMAGES.length);

      if (BACKGROUND_IMAGES.length > 1) {
        let candidate = nextIndex;
        // evitar repetir la misma imagen consecutivamente
        while (candidate === nextIndex) {
          candidate = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
        }
        nextIndex = candidate;
      }

      lastIndexRef.current = nextIndex;
      return BACKGROUND_IMAGES[nextIndex] ?? prev;
    });
  }, [location.pathname, preferences.backgroundMode]);

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

  // Inicializar tsparticles solo cuando las partículas pesadas están permitidas
  useEffect(() => {
    const shouldInitEngine = !shouldAvoidHeavyParticles && preferences.particlesEnabled;
    if (!shouldInitEngine) {
      setEngineReady(false);
      return;
    }

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
  }, [shouldAvoidHeavyParticles, preferences.particlesEnabled]);

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
          speed: tier === 'high' ? 0.8 : 0.4,
          straight: false,
          random: true,
          drift: 0.35,
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

  const neonOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      particles: {
        number: { value: profile?.is_premium ? 120 : 70 },
        color: { value: ['#00FFFF', '#FF00FF', '#AA00FF'] },
        shape: { type: 'circle' },
        opacity: { value: 0.6, random: true },
        size: { value: { min: 1, max: 4 } },
        links: {
          enable: true,
          distance: 150,
          color: '#00FFFF',
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: 'none' as const,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'repulse' },
          onClick: { enable: true, mode: 'push' },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 100, duration: 0.4 },
          push: { quantity: 4 },
        },
      },
      detectRetina: true,
    }),
    [profile?.is_premium]
  );

  const showSnowParticles = isSnowRoute && variant === 'tsparticles' && engineReady;
  const showCssParticles = variant === 'css';
  const showNeonParticles = !isSnowRoute && engineReady && !shouldAvoidHeavyParticles && preferences.particlesEnabled;

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className || ''}`}>
      {/* Capa base: gradiente sólido (anti-flash) */}
      <div
        className={`fixed inset-0 -z-30 bg-gradient-to-br ${
          preferences.particlesEnabled
            ? 'from-slate-900 via-purple-950 to-slate-900'
            : 'from-[#0a0a0a] via-[#111111] to-[#1a1a1a]'
        }`}
        style={
          variant === 'solid'
            ? { backgroundColor: preferences.solidColor }
            : undefined
        }
      />

      {/* Imagen de fondo con fade-in sólo cuando está cargada */}
      {variant !== 'solid' && resolvedBackground && (
        <div
          className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-opacity duration-[1200ms]"
          style={{
            backgroundImage: `url(${resolvedBackground})`,
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      )}

      {/* Overlay gradiente oscuro para legibilidad */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

      {/* Partículas neón globales (modo Lifestyle Swinger) */}
      {showNeonParticles && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -8,
            pointerEvents: 'none',
          }}
          className="fixed inset-0 pointer-events-none z-[-8]"
        >
          <Particles
            id="unified-neon"
            options={{
              ...neonOptions,
              fullScreen: { enable: false },
            }}
            className="w-full h-full"
          />
        </div>
      )}

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


