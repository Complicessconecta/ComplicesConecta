/**
 * ConfiguraciÃ³n de Rate Limiting
 * Define lÃ­mites por tipo de operaciÃ³n
 * Fecha: 7 Diciembre 2025
 */

export interface RateLimiterConfig {
  windowMs: number; // Ventana de tiempo en ms
  max: number; // MÃ¡ximo de requests en la ventana
  message: string; // Mensaje de error
}

/**
 * ConfiguraciÃ³n global de rate limiting
 */
export const rateLimiterConfig = {
  // API General
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests
    message: 'âŒ Demasiadas solicitudes, intenta mÃ¡s tarde'
  } as RateLimiterConfig,

  // AutenticaciÃ³n
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'âŒ Demasiados intentos de login, intenta mÃ¡s tarde'
  } as RateLimiterConfig,

  // Chat
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 mensajes
    message: 'âŒ EstÃ¡s enviando mensajes muy rÃ¡pido'
  } as RateLimiterConfig,

  // BÃºsqueda
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 bÃºsquedas
    message: 'âŒ Demasiadas bÃºsquedas, intenta mÃ¡s tarde'
  } as RateLimiterConfig,

  // Perfil
  profile: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // 20 actualizaciones
    message: 'âŒ Demasiadas actualizaciones de perfil, intenta mÃ¡s tarde'
  } as RateLimiterConfig,

  // Matches
  matches: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 50, // 50 likes
    message: 'âŒ EstÃ¡s dando likes muy rÃ¡pido'
  } as RateLimiterConfig,

  // Comentarios
  comments: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // 20 comentarios
    message: 'âŒ EstÃ¡s comentando muy rÃ¡pido'
  } as RateLimiterConfig,

  // Reportes
  reports: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 reportes
    message: 'âŒ Demasiados reportes, intenta mÃ¡s tarde'
  } as RateLimiterConfig
};

/**
 * Obtener configuraciÃ³n por tipo
 */
export const getRateLimiterConfig = (
  type: keyof typeof rateLimiterConfig
): RateLimiterConfig => {
  return rateLimiterConfig[type];
};

/**
 * Verificar si un tipo de operaciÃ³n estÃ¡ limitado
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

