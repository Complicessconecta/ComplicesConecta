// src/hooks/useAppPermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { logger } from '@/lib/logger';

// Definimos los tipos de permisos que nuestra app gestionará
type PermissionType = 'geolocation' | 'camera' | 'notifications';

// Un mapa para la configuración de cada permiso
const permissionConfig = {
  geolocation: {
    query: async () => await Geolocation.checkPermissions(),
    request: async () => await Geolocation.requestPermissions(),
  },
  camera: {
    query: async () => await Camera.checkPermissions(),
    request: async () => await Camera.requestPermissions(),
  },
  notifications: {
    query: async () => await PushNotifications.checkPermissions(),
    request: async () => await PushNotifications.requestPermissions(),
  },
};

export const useAppPermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<Record<PermissionType, PermissionState>>({
    geolocation: 'prompt',
    camera: 'prompt',
    notifications: 'prompt',
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAllPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      logger.info('Permissions: Not a native platform, skipping checks.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const newStatus: Partial<Record<PermissionType, PermissionState>> = {};

    for (const key in permissionConfig) {
      const type = key as PermissionType;
      try {
        const status = await permissionConfig[type].query();
        // Normalizamos el estado. 'prompt-with-rationale' se trata como 'prompt'.
        newStatus[type] = status.display || status.location || status.camera || status.photos || status.receive || 'prompt';
        logger.info(`Permission status for ${type}:`, { status: newStatus[type] });
      } catch (error) {
        logger.error(`Error checking permission for ${type}:`, { error: String(error) });
        newStatus[type] = 'denied';
      }
    }

    setPermissionStatus(prev => ({ ...prev, ...newStatus }));
    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async (type: PermissionType): Promise<PermissionState> => {
    if (!Capacitor.isNativePlatform()) {
      logger.warn(`Permissions: Cannot request ${type} on web.`);
      return 'denied';
    }

    try {
      const result = await permissionConfig[type].request();
      const newStatusValue = result.display || result.location || result.camera || result.photos || result.receive || 'prompt';
      setPermissionStatus(prev => ({ ...prev, [type]: newStatusValue }));
      logger.info(`Permission result for ${type}:`, { status: newStatusValue });
      return newStatusValue;
    } catch (error) {
      logger.error(`Error requesting permission for ${type}:`, { error: String(error) });
      setPermissionStatus(prev => ({ ...prev, [type]: 'denied' }));
      return 'denied';
    }
  }, []);

  const checkAndRequestOnStartup = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    logger.info('Permissions: Running initial check and request on startup...');
    setIsLoading(true);
    const statuses: Partial<Record<PermissionType, PermissionState>> = {};

    for (const key in permissionConfig) {
        const type = key as PermissionType;
        try {
            let status = await permissionConfig[type].query();
            let statusValue = status.display || status.location || status.camera || status.photos || status.receive || 'prompt';

            // Si el permiso no ha sido solicitado aún, lo pedimos.
            if (statusValue === 'prompt') {
                logger.info(`Permissions: Permission for ${type} is 'prompt', requesting...`);
                const requestResult = await permissionConfig[type].request();
                statusValue = requestResult.display || requestResult.location || requestResult.camera || requestResult.photos || requestResult.receive || 'prompt';
            }
            statuses[type] = statusValue;
        } catch (error) {
            logger.error(`Error in startup check/request for ${type}:`, { error: String(error) });
            statuses[type] = 'denied';
        }
    }

    setPermissionStatus(prev => ({ ...prev, ...statuses }));
    setIsLoading(false);
    logger.info('Permissions: Initial check and request complete.', { finalStatus: statuses });
  }, []);

  // Efecto para correr la verificación inicial en el montaje del hook
  useEffect(() => {
    checkAndRequestOnStartup();
  }, [checkAndRequestOnStartup]);

  return {
    permissionStatus,
    isLoading,
    checkAllPermissions,
    requestPermission,
  };
};

// Tipo helper para los estados de permisos de Capacitor
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
