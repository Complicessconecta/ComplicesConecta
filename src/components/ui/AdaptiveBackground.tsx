import React from 'react';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
// import { ParticlesBackground } from './ParticlesBackground'; // Descomentar solo si el archivo existe y funciona

export const AdaptiveBackground = () => {
  const { tier } = useDeviceCapability();

  return (
    <div 
      id="adaptive-background-layer"
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      style={{ 
        zIndex: -50,
        position: 'fixed' 
      }}
    >
      {/* Capa Base Sólida para evitar parpadeos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />

      {/* Capa Dinámica según Gama */}
      {tier === 'low' ? (
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.3),_transparent_70%)]" />
      ) : (
        <div className="absolute inset-0 opacity-30 bg-[url('/assets/backgrounds/bg5.webp')] bg-cover bg-center" />
      )}
      
      {/* Overlay Oscuro para mejorar lectura de textos */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
};

export const useAdaptiveBackground = () => {
  const { tier, isLowEnd, allowParticles, allowBlur } = useDeviceCapability();
  
  return {
    tier,
    isLow: tier === 'low',
    isMid: tier === 'mid',
    isHigh: tier === 'high',
    isLowEnd,
    allowParticles,
    allowBlur,
  };
};
