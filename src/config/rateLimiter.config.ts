/**
 * Configuración de Rate Limiting
 * Define límites por tipo de operación
 * Fecha: 7 Diciembre 2025
 */

export interface RateLimiterConfig {
  windowMs: number; // Ventana de tiempo en ms
  max: number; // Máximo de requests en la ventana
  message: string; // Mensaje de error
}

/**
 * Configuración global de rate limiting
 */
export const rateLimiterConfig = {
  // API General
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests
    message: '❌ Demasiadas solicitudes, intenta más tarde'
  } as RateLimiterConfig,

  // Autenticación
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: '❌ Demasiados intentos de login, intenta más tarde'
  } as RateLimiterConfig,

  // Chat
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 mensajes
    message: '❌ Estás enviando mensajes muy rápido'
  } as RateLimiterConfig,

  // Búsqueda
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 búsquedas
    message: '❌ Demasiadas búsquedas, intenta más tarde'
  } as RateLimiterConfig,

  // Perfil
  profile: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // 20 actualizaciones
    message: '❌ Demasiadas actualizaciones de perfil, intenta más tarde'
  } as RateLimiterConfig,

  // Matches
  matches: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 50, // 50 likes
    message: '❌ Estás dando likes muy rápido'
  } as RateLimiterConfig,

  // Comentarios
  comments: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // 20 comentarios
    message: '❌ Estás comentando muy rápido'
  } as RateLimiterConfig,

  // Reportes
  reports: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 reportes
    message: '❌ Demasiados reportes, intenta más tarde'
  } as RateLimiterConfig
};

/**
 * Obtener configuración por tipo
 */
export const getRateLimiterConfig = (
  type: keyof typeof rateLimiterConfig
): RateLimiterConfig => {
  return rateLimiterConfig[type];
};

/**
 * Verificar si un tipo de operación está limitado
 */
export const isRateLimited = (
  type: keyof typeof rateLimiterConfig,
  requestCount: number
): boolean => {
  const config = rateLimiterConfig[type];
  return requestCount > config.max;
};

/**
 * Obtener tiempo de espera en segundos
 */
export const getWaitTimeSeconds = (
  type: keyof typeof rateLimiterConfig
): number => {
  const config = rateLimiterConfig[type];
  return Math.ceil(config.windowMs / 1000);
};

/**
 * Obtener tiempo de espera en formato legible
 */
export const getWaitTimeFormatted = (
  type: keyof typeof rateLimiterConfig
): string => {
  const seconds = getWaitTimeSeconds(type);
  const minutes = Math.ceil(seconds / 60);

  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }
  return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
};
