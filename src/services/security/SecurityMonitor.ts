/**
 * Security Monitor Service
 * Detecta y registra anomalÃ­as de seguridad
 * Fecha: 7 Diciembre 2025
 */

import { logger } from '@/lib/logger';

export type SecurityEventType = 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'VULNERABILITY' | 'CSP_VIOLATION';
export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  userId?: string;
  ip?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Servicio de monitoreo de seguridad
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;
  private eventCounters: Map<string, number> = new Map();

  /**
   * Registrar evento de seguridad
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Mantener lÃ­mite de eventos en memoria
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Incrementar contador
    const key = `${event.type}:${event.severity}`;
    this.eventCounters.set(key, (this.eventCounters.get(key) || 0) + 1);

    // Registrar segÃºn severidad
    if (event.severity === 'CRITICAL') {
      logger.error(`ðŸš¨ CRITICAL SECURITY EVENT: ${event.message}`, event.details);
    } else if (event.severity === 'HIGH') {
      logger.warn(`âš ï¸ HIGH SECURITY EVENT: ${event.message}`, event.details);
    } else if (event.severity === 'MEDIUM') {
      logger.warn(`âš ï¸ MEDIUM SECURITY EVENT: ${event.message}`, event.details);
    } else {
      logger.info(`â„¹ï¸ SECURITY EVENT: ${event.message}`, event.details);
    }
  }

  /**
   * Obtener eventos de seguridad
   */
  getEvents(filter?: { type?: SecurityEventType; severity?: SecuritySeverity; hours?: number; limit?: number }) {
    let filtered = [...this.events];

    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }

    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }

    if (filter?.hours) {
      const cutoff = new Date(Date.now() - filter.hours * 60 * 60 * 1000);
      filtered = filtered.filter(e => e.timestamp > cutoff);
    }

    const limit = filter?.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Obtener estadÃ­sticas de seguridad
   */
  getStatistics() {
    const events = this.events;
    const byType = events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = events.reduce((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Eventos por hora
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const eventsLastHour = events.filter(e => e.timestamp > oneHourAgo).length;

    return {
      totalEvents: events.length,
      eventsLastHour,
      byType,
      bySeverity,
      lastEvent: events[events.length - 1],
      criticalCount: bySeverity['CRITICAL'] || 0,
      highCount: bySeverity['HIGH'] || 0
    };
  }

  /**
   * Detectar anomalÃ­as
   */
  detectAnomalies(): string[] {
    const anomalies: string[] = [];
    const stats = this.getStatistics();

    // AnomalÃ­a: Muchos eventos crÃ­ticos
    if (stats.criticalCount > 5) {
      anomalies.push(`ðŸš¨ Demasiados eventos crÃ­ticos: ${stats.criticalCount}`);
    }

    // AnomalÃ­a: Muchos eventos en la Ãºltima hora
    if (stats.eventsLastHour > 100) {
      anomalies.push(`âš ï¸ Pico de eventos en Ãºltima hora: ${stats.eventsLastHour}`);
    }

    // AnomalÃ­a: Muchos fallos de autenticaciÃ³n
    const authFailures = stats.byType['AUTH_FAILURE'] || 0;
    if (authFailures > 10) {
      anomalies.push(`âš ï¸ MÃºltiples fallos de autenticaciÃ³n: ${authFailures}`);
    }

    // AnomalÃ­a: Muchas violaciones de rate limit
    const rateLimitEvents = stats.byType['RATE_LIMIT'] || 0;
    if (rateLimitEvents > 50) {
      anomalies.push(`âš ï¸ MÃºltiples violaciones de rate limit: ${rateLimitEvents}`);
    }

    return anomalies;
  }

  /**
   * Obtener resumen de seguridad
   */
  getSummary() {
    const stats = this.getStatistics();
    const anomalies = this.detectAnomalies();
    const health = anomalies.length === 0 ? 'HEALTHY' : anomalies.length <= 2 ? 'WARNING' : 'CRITICAL';

    return {
      health,
      stats,
      anomalies,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpiar eventos antiguos
   */
  cleanup(hoursOld: number = 24) {
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp > cutoff);
    const after = this.events.length;

    logger.info('ðŸ§¹ Security Monitor cleanup executed', {
      removed: before - after,
      remaining: after
    });
  }

  /**
   * Exportar eventos para anÃ¡lisis
   */
  exportEvents(format: 'json' | 'csv' = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'type', 'severity', 'message', 'userId'];
      const rows = this.events.map(e => [
        e.timestamp.toISOString(),
        e.type,
        e.severity,
        e.message,
        e.userId || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

// Instancia global
export const securityMonitor = new SecurityMonitor();

// Limpiar eventos cada hora
setInterval(() => {
  securityMonitor.cleanup(24);
}, 60 * 60 * 1000);

// Detectar anomalÃ­as cada 5 minutos
setInterval(() => {
  const anomalies = securityMonitor.detectAnomalies();
  if (anomalies.length > 0) {
    logger.warn('ðŸš¨ Security Anomalies Detected', { anomalies });
  }
}, 5 * 60 * 1000);

