import { useEffect, useState, useRef, useMemo } from "react";
import "@/styles/UnifiedBackground.css";
import type { FC, ReactNode } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";
import { useLocation } from "react-router-dom";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useBackgroundPreferences } from "@/hooks/useBackgroundPreferences";
import { useBgMode } from "@/hooks/useBgMode";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";

interface UnifiedBackgroundProps {
  children?: ReactNode;
  className?: string;
}

// Imágenes de fondo por ruta
const BACKGROUND_IMAGES = [
  "/backgrounds/bg1.jpg",
  "/backgrounds/bg2.jpg",
  "/backgrounds/bg3.jpg",
  "/backgrounds/bg4.jpg",
  "/backgrounds/bg5.webp",
];

const SNOW_ROUTES = new Set<string>([
  "/",
  "/info",
  "/about",
  "/faq",
  "/project-info",
  "/auth",
  "/login",
  "/register",
  "/terms",
  "/privacy",
]);

const getBackgroundImageByPath = (pathname: string): string => {
  const length = BACKGROUND_IMAGES.length;
  if (length === 0) return "";
  const pathHash = pathname
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = pathHash % length;
  return BACKGROUND_IMAGES[index] ?? "";
};

const UnifiedBackground: FC<UnifiedBackgroundProps> = ({
  children,
  className,
}) => {
  const location = useLocation();
  const { tier, isLowEnd, allowParticles } = useDeviceCapability();
  const { preferences } = useBackgroundPreferences();
  const { reducedMotion } = useBgMode();
  const { profile } = useAuth();

  const [backgroundImage, setBackgroundImage] = useState<string>(() =>
    getBackgroundImageByPath(location.pathname),
  );
  const [resolvedBackground, setResolvedBackground] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const lastIndexRef = useRef<number | null>(null);

  const isSnowRoute = SNOW_ROUTES.has(location.pathname);
  const forceImageAndNeon =
    location.pathname === "/" || location.pathname === "/demo";
  const isDemoRoute = location.pathname === "/demo";
  const userForcesSolid =
    !isDemoRoute &&
    preferences.backgroundMode === "solid" &&
    !forceImageAndNeon;
  // RELAJADO: Permitir partículas en más situaciones
  const shouldAvoidHeavyParticles =
    reducedMotion || (isLowEnd && !allowParticles);
  
  // FORZAR: Siempre usar tsparticles en homepage y demo
  const forceNeon = location.pathname === "/" || location.pathname === "/demo";
  
  let variant: "solid" | "css" | "tsparticles" = userForcesSolid
    ? "solid"
    : forceNeon
      ? "tsparticles"
      : shouldAvoidHeavyParticles
        ? "css"
        : "tsparticles";

  // Rutas permitidas para partículas pesadas (neón) - EXPANDIDO para todas las páginas públicas principales
  const ALLOW_HEAVY_ROUTES = new Set<string>([
    "/",
    "/demo",
    "/discover",
    "/feed",
    "/profile-single",
    "/profile-couple",
    "/tokens",
    "/matches",
    "/chat",
    "/stories",
    "/settings",
    "/about",
    "/faq",
    "/info",
    "/support",
    "/premium",
    "/clubs",
    "/events",
    "/shop",
  ]);
  // Fuera de rutas públicas, degradar tsparticles a CSS, excepto en rutas permitidas
  // RELAJADO: Permitir partículas en más rutas
  if (
    !isSnowRoute &&
    variant === "tsparticles" &&
    !ALLOW_HEAVY_ROUTES.has(location.pathname)
  ) {
    // Solo degradar si el dispositivo es de gama baja y no es ruta permitida
    if (isLowEnd) {
      variant = "css";
    }
  }
  // Forzar imagen + neón en homepage
  if (forceImageAndNeon) {
    variant = "tsparticles";
  }
  
  // FORZAR: Siempre usar tsparticles en homepage
  if (forceNeon) {
    variant = "tsparticles";
  }

  useEffect(() => {
    if (preferences.backgroundMode === "solid") {
      if (!forceImageAndNeon) {
        setBackgroundImage("");
        return;
      }
    }

    // En homepage forzar fondo aleatorio
    if (forceImageAndNeon) {
      setBackgroundImage((prev) => {
        if (BACKGROUND_IMAGES.length === 0) return prev;
        const idx = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
        return BACKGROUND_IMAGES[idx] ?? prev;
      });
      return;
    }

    // Fondos deterministas por ruta cuando el modo no es "random"
    if (
      preferences.backgroundMode === "fixed" ||
      preferences.backgroundMode === "default"
    ) {
      setBackgroundImage(getBackgroundImageByPath(location.pathname));
      return;
    }

    // Modo "random": elegir una imagen distinta a la anterior por ruta
    setBackgroundImage((prev) => {
      if (BACKGROUND_IMAGES.length === 0) return prev;

      let nextIndex =
        lastIndexRef.current ??
        Math.floor(Math.random() * BACKGROUND_IMAGES.length);

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--cc-solid-bg",
      preferences.solidColor,
    );
  }, [preferences.solidColor]);

  // Preload de imagen con fade-in controlado
  useEffect(() => {
    if (!backgroundImage || variant === "solid") {
      setResolvedBackground("");
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
      setResolvedBackground("");
      setImageLoaded(false);
    };

    img.src = backgroundImage;

    return () => {
      cancelled = true;
    };
  }, [backgroundImage, variant]);

  // Inicializar tsparticles siempre en homepage/demo, independientemente de las condiciones
  useEffect(() => {
    const shouldInitEngine = forceNeon || preferences.particlesEnabled;
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
        logger.info("✅ Particles engine initialized");
      })
      .catch((err) => {
        if (!mounted) return;
        setEngineReady(false);
        logger.error("❌ Particles engine initialization failed:", { error: err });
      });

    return () => {
      mounted = false;
    };
  }, [forceNeon, preferences.particlesEnabled]);

  // ======================================================================
// PARTÍCULAS BLANCAS (NIEVE) - CAMBIADAS A ROSA (#FF69B4)
// ======================================================================
// Estas partículas blancas originales se cambiaron a rosa para
// mantener la consistencia con el tema de la app.
// NO MODIFICAR: neonOptions y otras partículas de neón se mantienen tal cual.
// ======================================================================
const snowOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: tier === "high" ? 60 : 30,
      particles: {
        number: { value: tier === "high" ? 160 : 90 },
        color: { value: "#FF69B4" }, // CAMBIADO: De #ffffff a #FF69B4 (rosa)
        shape: { type: "circle" },
        opacity: { value: 0.8 },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: true,
          direction: "bottom" as const,
          speed: tier === "high" ? 0.4 : 0.2,
          straight: false,
          random: true,
          drift: 0.2,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 80, duration: 0.4 },
        },
      },
      detectRetina: true,
    }),
    [tier],
  );

// ======================================================================
// PARTÍCULAS DE NEÓN - MANTENIDAS TAL CUAL (NO MODIFICAR)
// ======================================================================
// Estas partículas neón se mantienen con sus colores originales
// (cyan, magenta, morado) para el efecto de neón lifestyle.
// ======================================================================
const neonOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        number: { value: profile?.is_premium ? 120 : 70 },
        color: { value: ["#00FFFF", "#FF00FF", "#AA00FF"] },
        shape: { type: "circle" },
        opacity: { value: 0.8, random: true },
        size: { value: { min: 1, max: 4 } },
        links: {
          enable: true,
          distance: 150,
          color: "#00FFFF",
          opacity: 0.6,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: "none" as const,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 100, duration: 0.4 },
          push: { quantity: 4 },
        },
      },
      detectRetina: true,
    }),
    [profile?.is_premium],
  );

  const showSnowParticles =
    isSnowRoute && variant === "tsparticles" && engineReady;
  const showCssParticles = variant === "css";
  const showNeonParticles =
    engineReady &&
    (forceNeon || preferences.particlesEnabled || forceImageAndNeon);
  
  // Fallback CSS: Mostrar partículas CSS si el motor no está listo pero se forzaron partículas
  const showFallbackParticles =
    !engineReady && forceNeon && preferences.particlesEnabled;

  // LOGGING: Diagnosticar por qué no se muestran las partículas
  if (import.meta.env.DEV) {
    console.log("🔍 ParticlesNeon Debug:", {
      pathname: location.pathname,
      engineReady,
      shouldAvoidHeavyParticles,
      forceImageAndNeon,
      forceNeon,
      preferences: {
        particlesEnabled: preferences.particlesEnabled,
        backgroundMode: preferences.backgroundMode,
      },
      isLowEnd,
      reducedMotion,
      allowParticles,
      variant,
      showNeonParticles,
      showFallbackParticles,
      isSnowRoute,
      inAllowedRoutes: ALLOW_HEAVY_ROUTES.has(location.pathname),
      isPremium: profile?.is_premium,
    });
  }

  // Predefined utility class sets for CSS particles (avoid inline styles)
  const particleSizes = [
    "w-[1px] h-[1px]",
    "w-[2px] h-[2px]",
    "w-[3px] h-[3px]",
    "w-[4px] h-[4px]",
  ];
  const particlePositions = [
    "left-[5%] top-[10%]",
    "left-[12%] top-[25%]",
    "left-[20%] top-[40%]",
    "left-[28%] top-[65%]",
    "left-[35%] top-[15%]",
    "left-[42%] top-[55%]",
    "left-[50%] top-[30%]",
    "left-[58%] top-[75%]",
    "left-[65%] top-[20%]",
    "left-[72%] top-[45%]",
    "left-[80%] top-[60%]",
    "left-[88%] top-[35%]",
  ];

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${className || ""}`}
    >
      {/* Capa base: gradiente sólido (anti-flash) */}
      <div
        className={`fixed inset-0 -z-30 bg-gradient-to-br ${
          preferences.particlesEnabled
            ? "from-slate-900 via-purple-950 to-slate-900"
            : "from-[#0a0a0a] via-[#111111] to-[#1a1a1a]"
        } ${variant === "solid" ? "bg-[var(--cc-solid-bg)]" : ""}`}
      />

      {/* Imagen de fondo con fade-in sólo cuando está cargada */}
      {variant !== "solid" && resolvedBackground && (
        <img
          src={resolvedBackground}
          alt=""
          aria-hidden="true"
          className={`fixed inset-0 -z-20 w-full h-full object-cover transition-opacity duration-[1200ms] ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Overlay gradiente oscuro para legibilidad */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

      {/* Partículas neón globales (modo Lifestyle Swinger) */}
      {showNeonParticles && (
        <div className="fixed inset-0 w-full h-full z-[-3] pointer-events-none">
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

      {/* Partículas CSS ligeras para dispositivos low-end o fallback */}
      {(showCssParticles || showFallbackParticles) && (
        <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
          {Array.from({ length: showFallbackParticles ? 80 : 60 }).map((_, i) => {
            const sizeCls = particleSizes[i % particleSizes.length];
            const posCls = particlePositions[i % particlePositions.length];
            const colors = ["bg-cyan-400", "bg-purple-400", "bg-pink-400"];
            const colorCls = colors[i % colors.length];
            return (
              <div
                key={i}
                className={`absolute rounded-full animate-float ${colorCls} opacity-40 blur-[0.5px] ${sizeCls} ${posCls} particle`}
                style={{
                  '--animation-delay': `${i * 0.1}s`,
                  '--animation-duration': `${6 + Math.random() * 4}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Nieve de alta calidad con tsparticles (modo Navidad) */}
      {showSnowParticles && (
        <div className="fixed inset-0 w-full h-full z-[-5] pointer-events-none">
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
      <div className="relative z-10 pointer-events-auto">{children}</div>
    </div>
  );
};

export const PageBackground = UnifiedBackground;
export const RandomBackground = UnifiedBackground;
export const MasterBackground = UnifiedBackground;
