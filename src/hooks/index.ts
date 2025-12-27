/**
 * Índice centralizado de hooks - ComplicesConecta v3.6.3
 * Organización y exportación centralizada de hooks personalizados
 */

// === HOOKS PRINCIPALES ===

// Autenticación y usuarios
export { useAuth } from '@/features/auth/useAuth';

// Estado y persistencia
export { usePersistedState } from '@/hooks/usePersistedState';
export { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

// UI y interacción
export { useToast } from '@/hooks/useToast';
export { useIsMobile } from '@/hooks/use-mobile';
export { useScrollHide } from '@/hooks/useScrollHide';

// Datos y API
export { useTokens } from '@/hooks/useTokens';
export { useFeatures } from '@/hooks/useFeatures';
export { useInterests } from '@/hooks/useInterests';

// Geolocalización y ubicación
export { useGeolocation } from '@/hooks/useGeolocation';

// Notificaciones y comunicación
export { usePushNotifications } from '@/hooks/usePushNotifications';
export { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
export { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Seguridad y protección
export { useScreenshotProtection } from '@/hooks/useScreenshotProtection';
export { useConsentVerification } from '@/hooks/useConsentVerification';

// Performance y optimización
export { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
export { useAdvancedCache } from '@/hooks/useAdvancedCache';

// Moderación y análisis
export { useAdvancedModeration } from '@/hooks/useAdvancedModeration';
export { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
export { useModeratorTimer } from '@/hooks/useModeratorTimer';

// Integración externa
export { useWorldID } from '@/hooks/useWorldID';
export { useSupabaseTheme } from '@/hooks/useSupabaseTheme';

// === CONFIGURACIONES DE HOOKS ===
export const HOOKS_CONFIG = {
  // Configuración de cache para hooks
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  
  // Configuración de debounce
  DEBOUNCE_DELAY: 300, // 300ms
  
  // Configuración de polling
  POLLING_INTERVAL: 30000, // 30 segundos
  
  // Configuración de geolocalización
  GEOLOCATION: {
    TIMEOUT: 10000, // 10 segundos
    MAX_AGE: 60000, // 1 minuto
    HIGH_ACCURACY: true
  },
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 segundo
  }
} as const;

