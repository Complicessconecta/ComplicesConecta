import { useState } from 'react';

export type DeviceTier = 'low' | 'mid' | 'high';

interface DeviceCapability {
  tier: DeviceTier;
  isLowEnd: boolean;
  allowParticles: boolean;
  allowBlur: boolean;
  fpsLimit: number;
}

// Lógica segura que se ejecuta fuera del ciclo de render de React
const detectCapability = (): DeviceCapability => {
  // 1. Intentar leer de caché de sesión para evitar recálculos
  try {
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('device-capability') : null;
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  // 2. Detección de hardware
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
    allowParticles: tier === 'high',
    allowBlur: tier !== 'low',
    fpsLimit: tier === 'high' ? 60 : 30
  };

  // 3. Guardar en caché
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('device-capability', JSON.stringify(config));
    }
  } catch (e) {}

  return config;
};

export const useDeviceCapability = () => {
  // El useState con función SOLO se ejecuta al montar el componente (1 vez)
  const [capability] = useState<DeviceCapability>(detectCapability);
  return capability;
};
