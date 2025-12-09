import { useEffect, useState } from 'react';

export type DeviceCapability = 'low' | 'medium' | 'medium-high' | 'high';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
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
  // Configuración de usuario
  enableFullAnimations: boolean;
  enableTransparencies: boolean;
  enableRandomBackgrounds: boolean;
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

        // Lógica de detección de capacidad
        let capability: DeviceCapability = 'medium';
        let enableFullAnimations = true;
        let enableTransparencies = true;
        let enableRandomBackgrounds = true;

        // DESKTOP: Full todo
        if (deviceType === 'desktop') {
          capability = 'high';
          enableFullAnimations = true;
          enableTransparencies = true;
          enableRandomBackgrounds = true;
        }
        // TABLETS: Misma lógica que móviles de gama alta (Android)
        else if (deviceType === 'tablet') {
          // Tablets Android: Gama alta por defecto
          capability = 'high';
          enableFullAnimations = true;
          enableTransparencies = true;
          enableRandomBackgrounds = true;
        }
        // MÓVILES: Lógica granular por modelo
        else if (deviceType === 'mobile') {
          // Verificar si es modelo de gama alta
          if (HIGH_END_MODELS.some(model => deviceModel.includes(model))) {
            capability = 'high';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
          }
          // Verificar si es modelo de gama media-alta
          else if (MEDIUM_HIGH_MODELS.some(model => deviceModel.includes(model))) {
            capability = 'medium-high';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
          }
          // Lógica basada en specs para otros modelos
          else if (memory <= 2 || cores <= 2) {
            capability = 'low';
            enableFullAnimations = false;
            enableTransparencies = false;
            enableRandomBackgrounds = false;
          } else if (memory <= 4 || cores <= 4) {
            capability = 'medium';
            enableFullAnimations = false;
            enableTransparencies = true;
            enableRandomBackgrounds = false;
          } else {
            capability = 'medium-high';
            enableFullAnimations = true;
            enableTransparencies = true;
            enableRandomBackgrounds = true;
          }
        }

        setDeviceInfo({
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
