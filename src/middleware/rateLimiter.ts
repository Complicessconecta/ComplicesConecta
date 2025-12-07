/**
 * Rate Limiter Middleware
 * Protege la API contra abuso y ataques DDoS
 * Fecha: 7 Diciembre 2025
 */

import { logger } from '@/lib/logger';

/**
 * Configuración de Rate Limiting
 * Define límites por tipo de operación
 */
export const rateLimiterConfig = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests
    message: 'Demasiadas solicitudes, intenta más tarde'
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'Demasiados intentos de login, intenta más tarde'
  },
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 mensajes
    message: 'Estás enviando mensajes muy rápido'
  },
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 búsquedas
    message: 'Demasiadas búsquedas, intenta más tarde'
  },
  profile: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // 20 actualizaciones
    message: 'Demasiadas actualizaciones de perfil, intenta más tarde'
  }
};

/**
 * Clase para gestionar rate limiting
 */
export class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Verifica si una solicitud debe ser limitada
   * @param key - Identificador único (IP, userId, etc)
   * @param config - Configuración de rate limiting
   * @returns true si debe ser limitada, false si está permitida
   */
  isLimited(key: string, config: typeof rateLimiterConfig.api): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(key);

    // Si no hay registro o expiró, crear uno nuevo
    if (!record || now > record.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return false;
    }

    // Incrementar contador
    record.count++;

    // Verificar si excede el límite
    if (record.count > config.max) {
      logger.warn('⚠️ Rate limit excedido', {
        key,
        count: record.count,
        max: config.max,
        resetTime: new Date(record.resetTime).toISOString()
      });
      return true;
    }

    return false;
  }

  /**
   * Obtiene información de rate limiting para una clave
   */
  getInfo(key: string): { count: number; remaining: number; resetTime: number } | null {
    const record = this.requestCounts.get(key);
    if (!record) return null;

    return {
      count: record.count,
      remaining: Math.max(0, 100 - record.count), // Asume max de 100
      resetTime: record.resetTime
    };
  }

  /**
   * Limpia registros expirados
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

// Instancia global del rate limiter
export const rateLimiter = new RateLimiter();

// Limpiar registros cada 5 minutos
setInterval(() => {
  rateLimiter.cleanup();
  logger.info('🧹 Rate limiter cleanup ejecutado');
}, 5 * 60 * 1000);

/**
 * Hook para verificar rate limiting en componentes React
 * Uso: const { isLimited, info } = useRateLimiter('chat', rateLimiterConfig.chat);
 */
export const useRateLimiter = (
  type: keyof typeof rateLimiterConfig,
  userId: string
) => {
  const config = rateLimiterConfig[type];
  const key = `${type}:${userId}`;

  const isLimited = rateLimiter.isLimited(key, config);
  const info = rateLimiter.getInfo(key);

  return {
    isLimited,
    info,
    message: config.message,
    resetTime: info?.resetTime
  };
};
