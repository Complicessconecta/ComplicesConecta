import { useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';
import { MapPin, Camera as CameraIcon, Bell, ArrowRight } from 'lucide-react';

export type PermissionType = 'camera' | 'location' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';

interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}

export const usePermissionScanner = () => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'prompt',
    location: 'prompt',
    notifications: 'prompt'
  });
  const [loading, setLoading] = useState(true);

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      setLoading(false);
      setPermissions({ camera: 'granted', location: 'granted', notifications: 'granted' }); // Mock for web
      return;
    }

    try {
      const cam = await Camera.checkPermissions();
      const loc = await Geolocation.checkPermissions();
      
      // Push notifications are tricky to "check" without requesting on some platforms, 
      // but we'll assume prompt if not known.
      let notif: PermissionStatus = 'prompt';
      try {
         const notifStatus = await PushNotifications.checkPermissions();
         notif = notifStatus.receive as PermissionStatus;
      } catch {
         // Ignore if plugin not active
      }

      setPermissions({
        camera: cam.camera as PermissionStatus,
        location: loc.location as PermissionStatus,
        notifications: notif
      });
    } catch (error) {
      logger.error('Error checking permissions', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermission = async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      if (type === 'camera') {
        const result = await Camera.requestPermissions();
        setPermissions(prev => ({ ...prev, camera: result.camera as PermissionStatus }));
        return result.camera;
      }
      if (type === 'location') {
        const result = await Geolocation.requestPermissions();
        setPermissions(prev => ({ ...prev, location: result.location as PermissionStatus }));
        return result.location;
      }
      if (type === 'notifications') {
        const result = await PushNotifications.requestPermissions();
        setPermissions(prev => ({ ...prev, notifications: result.receive as PermissionStatus }));
        return result.receive;
      }
      return 'denied';
    } catch (error) {
      logger.error(`Error requesting permission: ${type}`, { error });
      return 'denied';
    }
  };

  return { permissions, loading, checkPermissions, requestPermission };
};

interface PermissionManagerProps {
  children: ReactNode;
  requiredPermissions?: PermissionType[];
}

export const PermissionManager: FC<PermissionManagerProps> = ({
  children,
  requiredPermissions = ['camera', 'location', 'notifications']
}) => {
  const { permissions, loading, requestPermission } = usePermissionScanner();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWizard, setShowWizard] = useState(true);

  const pendingPermissions = requiredPermissions.filter(p => permissions[p] !== 'granted');

  useEffect(() => {
    if (!loading && pendingPermissions.length === 0) {
      setShowWizard(false);
    }
  }, [loading, permissions, pendingPermissions.length]);

  if (loading) return null; // Or spinner
  if (!showWizard || pendingPermissions.length === 0) return <>{children}</>;

  const currentPermission = pendingPermissions[currentStep] || pendingPermissions[0];

  const handleRequest = async () => {
    if (!currentPermission) return;
    await requestPermission(currentPermission);
    // Move to next if granted or denied (we handle denied by showing rationale or moving on)
    if (currentStep < pendingPermissions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // End of wizard
      // Check again if all granted, if not, maybe show "Required" screen
      setShowWizard(false); 
    }
  };

  const getIcon = (type: PermissionType) => {
    switch(type) {
      case 'camera': return <CameraIcon className="h-12 w-12 text-blue-500" />;
      case 'location': return <MapPin className="h-12 w-12 text-green-500" />;
      case 'notifications': return <Bell className="h-12 w-12 text-yellow-500" />;
      default: return null;
    }
  };

  const getTitle = (type: PermissionType) => {
    switch(type) {
      case 'camera': return 'Acceso a Cámara';
      case 'location': return 'Ubicación';
      case 'notifications': return 'Notificaciones';
      default: return '';
    }
  };

  const getDescription = (type: PermissionType) => {
    switch(type) {
      case 'camera': return 'Necesaria para verificar tu perfil y subir fotos.';
      case 'location': return 'Para encontrar parejas cerca de ti.';
      case 'notifications': return 'Para saber cuándo tienes un nuevo match o mensaje.';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-gray-100 p-6 rounded-full animate-bounce">
            {getIcon(currentPermission!)}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Permitir {getTitle(currentPermission!)}
          </h2>
          <p className="text-gray-600">
            {getDescription(currentPermission!)}
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <button
            onClick={handleRequest}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            Continuar
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowWizard(false)}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            Saltar por ahora
          </button>
        </div>

        <div className="flex justify-center space-x-2 mt-8">
          {pendingPermissions.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 w-2 rounded-full ${idx === currentStep ? 'bg-purple-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

