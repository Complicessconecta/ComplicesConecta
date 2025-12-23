/**
 * Índice centralizado de servicios - ComplicesConecta v3.6.3
 * Organización y exportación centralizada de servicios principales
 */

// === SERVICIOS PRINCIPALES ===

// Autenticación y Seguridad
export { securityService } from '@/services/SecurityService';

// Blockchain y Tokens
export { walletService } from '@/services/WalletService';
export { nftService } from '@/services/NFTService';

// === CONFIGURACIONES DE SERVICIOS ===
export const SERVICES_CONFIG = {
  // Configuración de cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  
  // Configuración de rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    BURST_LIMIT: 10
  },
  
  // Configuración de analytics
  ANALYTICS: {
    SAMPLING_RATE: 0.1, // 10%
    BATCH_SIZE: 100,
    FLUSH_INTERVAL: 30000 // 30 segundos
  },
  
  // Configuración de moderación
  MODERATION: {
    AUTO_MODERATE_THRESHOLD: 0.8,
    ESCALATION_THRESHOLD: 0.9,
    REVIEW_TIMEOUT: 24 * 60 * 60 * 1000 // 24 horas
  }
} as const;
