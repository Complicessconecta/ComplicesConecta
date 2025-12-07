import React from 'react';
import { GlobalBackground } from '@/components/ui/GlobalBackground';

interface ParticlesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({ children, className }) => {
  return (
    <GlobalBackground className={className}>
      {children}
    </GlobalBackground>
  );
};