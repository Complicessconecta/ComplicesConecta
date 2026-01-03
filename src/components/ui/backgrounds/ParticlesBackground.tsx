import React, { useEffect, useMemo, useState } from "react";
import Particles, { type IParticlesProps } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, Container } from "@tsparticles/engine";
import { useAnimation } from "@/components/animations/AnimationProvider";
import { useBgMode } from "@/hooks/useBgMode";

interface ParticlesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}


export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  children,
  className,
}) => {
  const { config } = useAnimation();
  const { mode } = useBgMode(); // 'video' | 'particles' | 'gradient'
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    const initEngine = async () => {
      // tsParticles may expose the engine differently depending on version
            const engine = (window as any)?.tsParticles?.engine as Engine | undefined;
      if (engine) {
        await loadSlim(engine);
        setEngineReady(true);
      }
    };
    initEngine();
  }, []);

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      setEngineReady(true);
    }
  };

  const particleOptions = useMemo<NonNullable<IParticlesProps["options"]>>( () => ({
      background: { color: { value: "transparent" } },
      fullScreen: { enable: true, zIndex: -1 },
      fpsLimit: 120,
      particles: {
        color: { value: ["#8b5cf6", "#3b82f6"] },
        links: {
          color: "#8b5cf6",
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          outModes: "out",
        },
        number: { value: 80 },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 4 } },
      },
      detectRetina: true,
    }),
    [],
  );

  // Si partículas deshabilitadas y no es video, renderizar simple
  if (!config.enableParticles && mode !== "video") {
    return (
      <div className={`relative min-h-screen ${className || ""}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className || ""}`}>
      {/* Fondo de video (solo si está activo y mode === 'video') */}
      {mode === "video" && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
                  >
          <source src="/backgrounds/animate-bg.mp4" type="video/mp4" />
          <source src="/backgrounds/animate-bg.webm" type="video/webm" />
        </video>
      )}

      {/* Partículas (solo si está habilitado y no es modo reducido) */}
      {config.enableParticles &&
        !config.reducedMotion &&
        mode !== "video" &&
        engineReady && (
          <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={particleOptions}
          />
        )}

      {/* Overlay suave para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Contenido encima */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
