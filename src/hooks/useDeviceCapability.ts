import { useEffect, useState } from 'react';

export type DeviceCapability = 'low' | 'medium' | 'high';

interface DeviceInfo {
  capability: DeviceCapability;
  cores: number;
  memory: number;
  gpu: string;
  isLowEnd: boolean;
  isMediumEnd: boolean;
  isHighEnd: boolean;
}

export const useDeviceCapability = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    capability: 'medium',
    cores: 4,
    memory: 4,
    gpu: 'unknown',
    isLowEnd: false,
    isMediumEnd: true,
    isHighEnd: false,
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

        // Detectar si es dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

        // Lógica de detección de capacidad
        let capability: DeviceCapability = 'medium';

        if (isMobile) {
          // Dispositivos móviles
          if (memory <= 2 || cores <= 2) {
            capability = 'low';
          } else if (memory <= 4 || cores <= 4) {
            capability = 'medium';
          } else {
            capability = 'high';
          }
        } else {
          // Dispositivos de escritorio
          if (memory <= 4 || cores <= 2) {
            capability = 'low';
          } else if (memory <= 8 || cores <= 4) {
            capability = 'medium';
          } else {
            capability = 'high';
          }
        }

        setDeviceInfo({
          capability,
          cores,
          memory,
          gpu,
          isLowEnd: capability === 'low',
          isMediumEnd: capability === 'medium',
          isHighEnd: capability === 'high',
        });

        // Log para debugging
        if (typeof window !== 'undefined' && (window as any).__DEBUG__) {
          console.log('🖥️ Device Capability Detected:', {
            capability,
            cores,
            memory,
            gpu,
            isMobile,
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
