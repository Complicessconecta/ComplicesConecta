// src/components/ui/ParticlesNeonBackground.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/shared/lib/cn';

interface Props {
  children: React.ReactNode;
  className?: string;
  showParticles?: boolean;
}

export const ParticlesNeonBackground: React.FC<Props> = ({ 
  children, 
  className,
  showParticles = true 
}) => {
  const { profile } = useAuth();

  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    void initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    })
      .then(() => setEngineReady(true))
      .catch(() => setEngineReady(true));
  }, []);

  const particlesOptions = useMemo(() => ({
    fullScreen: { enable: true, zIndex: -1 },
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
  }), [profile?.is_premium]);

  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      {children}
      {engineReady && showParticles && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            pointerEvents: 'none'
          }}
          className="fixed inset-0 pointer-events-none z-[-1]"
        >
          <Particles
            id="neon-particles"
            options={{
              ...particlesOptions,
              fullScreen: { enable: false }
            }}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};
