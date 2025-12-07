import React from 'react';
import { useAnimation } from '@/components/animations/AnimationProvider';
import { useBgMode } from '@/hooks/useBgMode';
import { cn } from '@/shared/lib/cn';

export const ParticlesBackground: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { config } = useAnimation();
  const { mode } = useBgMode();

  const showParticles =
    config.enableParticles &&
    !config.reducedMotion &&
    mode !== 'static';

  const showVideo = mode === 'video';

  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/bg-loop.mp4" type="video/mp4" />
        </video>
      )}

      {showParticles && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238b5cf6' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '60px 60px',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {children}
    </div>
  );
};