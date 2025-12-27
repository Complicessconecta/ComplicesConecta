/**
 * Ãndice centralizado de hooks - ComplicesConecta v3.6.3
 * OrganizaciÃ³n y exportaciÃ³n centralizada de hooks personalizados
 */

// === HOOKS PRINCIPALES ===

// AutenticaciÃ³n y usuarios
export { useAuth } from '@/features/auth/useAuth';

// Estado y persistencia
export { usePersistedState } from './usePersistedState';
export { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

// UI y interacciÃ³n
export { useToast } from './useToast';
export { useIsMobile } from './use-mobile';
export { useScrollHide } from './useScrollHide';

// Datos y API
export { useTokens } from './useTokens';
export { useFeatures } from './useFeatures';
export { useInterests } from './useInterests';

// GeolocalizaciÃ³n y ubicaciÃ³n
export { useGeolocation } from './useGeolocation';

// Notificaciones y comunicaciÃ³n
export { usePushNotifications } from './usePushNotifications';
export { useRealtimeNotifications } from './useRealtimeNotifications';
export { useOnlineStatus } from './useOnlineStatus';

// Seguridad y protecciÃ³n
export { useScreenshotProtection } from './useScreenshotProtection';
export { useConsentVerification } from './useConsentVerification';

// Performance y optimizaciÃ³n
export { usePerformanceOptimization } from './usePerformanceOptimization';
export { useAdvancedCache } from './useAdvancedCache';

// ModeraciÃ³n y anÃ¡lisis
export { useAdvancedModeration } from './useAdvancedModeration';
export { useAdvancedAnalytics } from './useAdvancedAnalytics';
export { useModeratorTimer } from './useModeratorTimer';

// IntegraciÃ³n externa
export { useWorldID } from './useWorldID';
export { useSupabaseTheme } from './useSupabaseTheme';

// === CONFIGURACIONES DE HOOKS ===
export const HOOKS_CONFIG = {
  // ConfiguraciÃ³n de cache para hooks
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  
  // ConfiguraciÃ³n de debounce
  DEBOUNCE_DELAY: 300, // 300ms
  
  // ConfiguraciÃ³n de polling
  POLLING_INTERVAL: 30000, // 30 segundos
  
  // ConfiguraciÃ³n de geolocalizaciÃ³n
  GEOLOCATION: {
    TIMEOUT: 10000, // 10 segundos
    MAX_AGE: 60000, // 1 minuto
    HIGH_ACCURACY: true
  },
  
  // ConfiguraciÃ³n de notificaciones
  NOTIFICATIONS: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 segundo
  }
} as const;

