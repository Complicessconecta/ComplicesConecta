import { useState } from 'react';

export type DeviceTier = 'low' | 'mid' | 'high';

interface DeviceCapability {
  tier: DeviceTier;
  isLowEnd: boolean;
  allowParticles: boolean;
  allowBlur: boolean;
  fpsLimit: number;
}

// LÃ³gica segura que se ejecuta fuera del ciclo de render de React
const detectCapability = (): DeviceCapability => {
  // 1. Intentar leer de cachÃ© de sesiÃ³n para evitar recÃ¡lculos
  try {
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('device-capability') : null;
    if (cached) return JSON.parse(cached);
  } catch (e) {
    void e;
  }

  // 2. DetecciÃ³n de hardware
  const concurrency = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  // @ts-ignore
  const memory = (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) || 4;

  let tier: DeviceTier = 'high';
  
  if (concurrency <= 4 || memory < 4) {
    tier = 'low';
  } else if (memory <= 8) {
    tier = 'mid';
  }

  const config: DeviceCapability = {
    tier,
    isLowEnd: tier === 'low',
    allowParticles: tier !== 'low',
    allowBlur: tier !== 'low',
    fpsLimit: tier === 'high' ? 60 : 30
  };

  // 3. Guardar en cachÃ©
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('device-capability', JSON.stringify(config));
    }
  } catch (e) {
    void e;
  }

  return config;
};

export const useDeviceCapability = () => {
  // El useState con funciÃ³n SOLO se ejecuta al montar el componente (1 vez)
  const [capability] = useState<DeviceCapability>(detectCapability);
  return capability;
};

