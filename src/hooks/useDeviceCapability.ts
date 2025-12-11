import { useEffect, useState } from 'react';

// Tier-based classification: LOW, MID, HIGH
export type DeviceTier = 'LOW' | 'MID' | 'HIGH';
export type DeviceCapability = 'low' | 'medium' | 'medium-high' | 'high';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  // Tier-based classification (simplified)
  tier: DeviceTier;
  
  // Legacy capability (for backward compatibility)
  capability: DeviceCapability;
  deviceType: DeviceType;
  deviceModel: string;
  cores: number;
  memory: number;
  gpu: string;
  isLowEnd: boolean;
  isMediumEnd: boolean;
  isMediumHigh: boolean;
  isHighEnd: boolean;
  
  // Feature flags based on tier
  enableFullAnimations: boolean;
  enableTransparencies: boolean;
  enableRandomBackgrounds: boolean;
  enableParticles: boolean;
  enableGlassmorphism: boolean;
  enableVideoBackgrounds: boolean;
}

// Modelos de dispositivos de gama alta
const HIGH_END_MODELS = [
  'Redmi Note 13 Pro',
  'Redmi Note 12 Pro',
  'Galaxy Tab',
  'iPad Pro',
  'iPhone 14',
  'iPhone 15',
  'Pixel 7',
  'Pixel 8',
];

// Modelos de dispositivos de gama media-alta
const MEDIUM_HIGH_MODELS = [
  'Redmi Note 11',
  'Redmi Note 11s',
  'Galaxy A',
  'Galaxy S',
  'iPhone 13',
  'Pixel 6',
];

// Tablets Android (misma lógica que móviles de gama alta)
const TABLET_MODELS = [
  'Galaxy Tab',
  'SM-T',
  'Nexus 7',
  'Nexus 10',
  'Pixel Tablet',
];

const detectDeviceModel = (): string => {
  const ua = navigator.userAgent;
  
  // Detectar modelo específico
  for (const model of HIGH_END_MODELS) {
    if (ua.includes(model)) return model;
  }
  
  for (const model of MEDIUM_HIGH_MODELS) {
    if (ua.includes(model)) return model;
  }
  
  return 'Unknown';
};

const detectDeviceType = (): DeviceType => {
  const ua = navigator.userAgent;
  
  if (/iPad|Android(?!.*Mobile)/.test(ua)) {
    return 'tablet';
  } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
};

// Función para detectar y guardar tier en sessionStorage (UNA SOLA VEZ)
const detectAndCacheTier = (): DeviceInfo => {
  // Verificar si ya está en sessionStorage (evita re-detección)
  const cached = typeof window !== 'undefined' ? sessionStorage.getItem('deviceTier') : null;
  if (cached) {
    try {
      return JSON.parse(cached) as DeviceInfo;
    } catch {
      // Si falla el parse, continuar con detección
    }
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = ((navigator as any).deviceMemory || 4) as number;
  
  let gpu = 'unknown';
  try {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as any;
      if (debugInfo) {
        gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
  } catch {
    // Silenciar errores de WebGL
  }

  const deviceType = detectDeviceType();
  const deviceModel = detectDeviceModel();

  let capability: DeviceCapability = 'medium';
  let tier: DeviceTier = 'MID';
  let enableFullAnimations = true;
  let enableTransparencies = true;
  let enableRandomBackgrounds = true;
  let enableParticles = true;
  let enableGlassmorphism = true;
  let enableVideoBackgrounds = false;

  // TIER LOW: Gama baja (móviles antiguos, < 4GB RAM o < 4 núcleos)
  if (deviceType === 'mobile' && (memory <= 2 || cores <= 2)) {
    capability = 'low';
    tier = 'LOW';
    enableFullAnimations = false;
    enableTransparencies = false;
    enableRandomBackgrounds = false;
    enableParticles = false;
    enableGlassmorphism = false;
    enableVideoBackgrounds = false;
  }
  // TIER MID: Gama media (móviles 4-8GB, tablets normales)
  else if (deviceType === 'mobile' && (memory <= 4 || cores <= 4)) {
    capability = 'medium';
    tier = 'MID';
    enableFullAnimations = false;
    enableTransparencies = true;
    enableRandomBackgrounds = false;
    enableParticles = true;
    enableGlassmorphism = true;
    enableVideoBackgrounds = false;
  }
  // TIER MID: Gama media-alta (móviles > 4GB, tablets)
  else if (deviceType === 'tablet' || (deviceType === 'mobile' && memory > 4)) {
    capability = 'medium-high';
    tier = 'MID';
    enableFullAnimations = true;
    enableTransparencies = true;
    enableRandomBackgrounds = true;
    enableParticles = true;
    enableGlassmorphism = true;
    enableVideoBackgrounds = false;
  }
  // TIER HIGH: Gama alta (desktop, tablets premium, móviles flagship)
  else if (deviceType === 'desktop' || HIGH_END_MODELS.some(model => deviceModel.includes(model))) {
    capability = 'high';
    tier = 'HIGH';
    enableFullAnimations = true;
    enableTransparencies = true;
    enableRandomBackgrounds = true;
    enableParticles = true;
    enableGlassmorphism = true;
    enableVideoBackgrounds = deviceType === 'desktop';
  }

  const deviceInfo: DeviceInfo = {
    tier,
    capability,
    deviceType,
    deviceModel,
    cores,
    memory,
    gpu,
    isLowEnd: capability === 'low',
    isMediumEnd: capability === 'medium',
    isMediumHigh: capability === 'medium-high',
    isHighEnd: capability === 'high',
    enableFullAnimations,
    enableTransparencies,
    enableRandomBackgrounds,
    enableParticles,
    enableGlassmorphism,
    enableVideoBackgrounds,
  };

  // Guardar en sessionStorage para evitar re-detección
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('deviceTier', JSON.stringify(deviceInfo));
    } catch {
      // Ignorar errores de sessionStorage
    }
  }

  return deviceInfo;
};

export const useDeviceCapability = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Inicializar con el valor cacheado o detectado
    return detectAndCacheTier();
  });

  useEffect(() => {
    // Solo ejecutar una vez al montar (sin dependencias)
    const info = detectAndCacheTier();
    setDeviceInfo(info);

    if (typeof window !== 'undefined' && (window as any).__DEBUG__) {
      console.log('🖥️ Device Tier Detected (cached):', {
        tier: info.tier,
        capability: info.capability,
        deviceType: info.deviceType,
        cores: info.cores,
        memory: info.memory,
      });
    }
  }, []);

  return deviceInfo;
};
