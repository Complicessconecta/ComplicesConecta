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

export const useDeviceCapability = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    tier: 'MID',
    capability: 'medium',
    deviceType: 'desktop',
    deviceModel: 'Unknown',
    cores: 4,
    memory: 4,
    gpu: 'unknown',
    isLowEnd: false,
    isMediumEnd: true,
    isMediumHigh: false,
    isHighEnd: false,
    enableFullAnimations: true,
    enableTransparencies: true,
    enableRandomBackgrounds: true,
    enableParticles: true,
    enableGlassmorphism: true,
    enableVideoBackgrounds: false,
  });

  useEffect(() => {
    const detectCapability = async () => {
      try {
        // Detectar número de cores
        const cores = navigator.hardwareConcurrency || 4;

        // Detectar memoria del dispositivo (en GB)
        const memory = ((navigator as any).deviceMemory || 4) as number;

        // Detectar GPU a través de WebGL
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
        } catch (e) {
          // Silenciar errores de WebGL
        }

        const deviceType = detectDeviceType();
        const deviceModel = detectDeviceModel();

        // Lógica de detección de capacidad y Tier
        let capability: DeviceCapability = 'medium';
        let tier: DeviceTier = 'MID';
        let enableFullAnimations = true;
        let enableTransparencies = true;
        let enableRandomBackgrounds = true;
        let enableParticles = true;
        let enableGlassmorphism = true;
        let enableVideoBackgrounds = false;

        // DESKTOP: Full Experience (HIGH Tier)
        if (deviceType === 'desktop') {
          capability = 'high';
          tier = 'HIGH';
          enableFullAnimations = true;
          enableTransparencies = true;
          enableRandomBackgrounds = true;
          enableParticles = true;
          enableGlassmorphism = true;
          enableVideoBackgrounds = true;
        }
        // TABLETS: HIGH Tier (gama alta por defecto)
        else if (deviceType === 'tablet') {
          capability = 'high';
          tier = 'HIGH';
          enableFullAnimations = true;
          enableTransparencies = true;
          enableRandomBackgrounds = true;
          enableParticles = true;
          enableGlassmorphism = true;
          enableVideoBackgrounds = false;
        }
        // MÓVILES: Lógica granular por modelo y specs
        else if (deviceType === 'mobile') {
          // Gama alta: HIGH Tier
          if (HIGH_END_MODELS.some(model => deviceModel.includes(model))) {
            capability = 'high';
            tier = 'HIGH';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
            enableParticles = true;
            enableGlassmorphism = true;
            enableVideoBackgrounds = false;
          }
          // Gama media-alta: MID Tier
          else if (MEDIUM_HIGH_MODELS.some(model => deviceModel.includes(model))) {
            capability = 'medium-high';
            tier = 'MID';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
            enableParticles = true;
            enableGlassmorphism = true;
            enableVideoBackgrounds = false;
          }
          // Gama baja: LOW Tier (< 4GB RAM o < 4 núcleos)
          else if (memory <= 2 || cores <= 2) {
            capability = 'low';
            tier = 'LOW';
            enableFullAnimations = false;
            enableTransparencies = false;
            enableRandomBackgrounds = false;
            enableParticles = false;
            enableGlassmorphism = false;
            enableVideoBackgrounds = false;
          }
          // Gama media: MID Tier (4GB RAM, 4 núcleos)
          else if (memory <= 4 || cores <= 4) {
            capability = 'medium';
            tier = 'MID';
            enableFullAnimations = false;
            enableTransparencies = true;
            enableRandomBackgrounds = false;
            enableParticles = true;
            enableGlassmorphism = true;
            enableVideoBackgrounds = false;
          }
          // Gama media-alta: MID Tier (> 4GB RAM)
          else {
            capability = 'medium-high';
            tier = 'MID';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
            enableParticles = true;
            enableGlassmorphism = true;
            enableVideoBackgrounds = false;
          }
        }

        setDeviceInfo({
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
        });

        // Log para debugging
        if (typeof window !== 'undefined' && (window as any).__DEBUG__) {
          console.log('🖥️ Device Capability Detected:', {
            capability,
            deviceType,
            deviceModel,
            cores,
            memory,
            gpu,
            enableFullAnimations,
            enableTransparencies,
            enableRandomBackgrounds,
          });
        }
      } catch (error) {
        console.error('Error detecting device capability:', error);
      }
    };

    detectCapability();
  }, []);

  return deviceInfo;
};
