/**
 * =====================================================
 * DESKTOP NOTIFICATION SERVICE
 * =====================================================
 * Servicio para gestionar notificaciones nativas del navegador
 * Fecha: 2025-01-29
 * VersiÃ³n: v3.4.1
 * =====================================================
 */

import { logger } from '@/lib/logger';
import type { ErrorAlert } from './ErrorAlertService';
import type { PerformanceMetric } from './PerformanceMonitoringService';

// =====================================================
// INTERFACES
// =====================================================

export interface NotificationConfig {
  enabled: boolean;
  criticalOnly: boolean;
  sound: boolean;
  frequency: number; // MÃ­nimo de milisegundos entre notificaciones
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

// =====================================================
// SERVICE CLASS
// =====================================================

class DesktopNotificationService {
  private permission: NotificationPermission = 'default';
  private config: NotificationConfig;
  private lastNotificationTime: number = 0;
  private notificationQueue: NotificationOptions[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.checkPermission();
  }

  /**
   * Cargar configuraciÃ³n de localStorage
   */
  private loadConfig(): NotificationConfig {
    try {
      const saved = localStorage.getItem('notification_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Error loading notification config:', { error: String(error) });
    }

    // ConfiguraciÃ³n por defecto
    return {
      enabled: false,
      criticalOnly: true,
      sound: true,
      frequency: 60000 // 1 minuto entre notificaciones
    };
  }

  /**
   * Guardar configuraciÃ³n en localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('notification_config', JSON.stringify(this.config));
    } catch (error) {
      logger.error('Error saving notification config:', { error: String(error) });
    }
  }

  /**
   * Verificar permisos de notificaciÃ³n
   */
  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      logger.info('Notification permission:', { permission: this.permission });
    } else {
      logger.warn('Browser does not support notifications');
    }
  }

  /**
   * Solicitar permisos de notificaciÃ³n
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.error('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        logger.info('âœ… Notification permission granted');
        this.config.enabled = true;
        this.saveConfig();
        return true;
      } else {
        logger.warn('âŒ Notification permission denied');
        this.config.enabled = false;
        this.saveConfig();
        return false;
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', { error: String(error) });
      return false;
    }
  }

  /**
   * Actualizar configuraciÃ³n
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    logger.info('Notification config updated:', this.config);
  }

  /**
   * Obtener configuraciÃ³n actual
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Verificar si puede enviar notificaciÃ³n
   */
  private canNotify(): boolean {
    if (!this.config.enabled) return false;
    if (this.permission !== 'granted') return false;
    
    // Verificar frecuencia
    const now = Date.now();
    if (now - this.lastNotificationTime < this.config.frequency) {
      logger.debug('Notification throttled by frequency limit');
      return false;
    }

    return true;
  }

  /**
   * Mostrar notificaciÃ³n
   */
  private showNotification(options: NotificationOptions): void {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-72.png',
        tag: options.tag || 'analytics-alert',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || !this.config.sound
      });

      this.lastNotificationTime = Date.now();

      // Auto-cerrar despuÃ©s de 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Click handler
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navegar al dashboard de analytics
        if (window.location.pathname !== '/admin/analytics') {
          window.location.href = '/admin/analytics';
        }
      };

      logger.info('âœ… Notification shown:', { title: options.title });
    } catch (error) {
      logger.error('Error showing notification:', { error: String(error) });
    }
  }

  /**
   * Notificar error crÃ­tico
   */
  notifyError(alert: ErrorAlert): void {
    if (!this.canNotify()) return;

    // Si estÃ¡ en modo solo crÃ­ticos, filtrar
    if (this.config.criticalOnly && alert.severity !== 'critical') {
      return;
    }

    const emoji = this.getSeverityEmoji(alert.severity);
    
    this.showNotification({
      title: `${emoji} Error ${alert.severity.toUpperCase()}`,
      body: alert.message,
      tag: `error-${alert.id}`,
      requireInteraction: alert.severity === 'critical',
      icon: '/icon-error.png'
    });
  }

  /**
   * Notificar degradaciÃ³n de performance
   */
  notifyPerformance(metric: PerformanceMetric, threshold: number): void {
    if (!this.canNotify()) return;

    this.showNotification({
      title: 'âš ï¸ Performance Degradation',
      body: `${metric.name}: ${metric.value}${metric.unit} (threshold: ${threshold}${metric.unit})`,
      tag: 'performance-alert',
      icon: '/icon-warning.png'
    });
  }

  /**
   * Notificar alto uso de memoria
   */
  notifyHighMemory(usage: number, threshold: number): void {
    if (!this.canNotify()) return;

    this.showNotification({
      title: 'ðŸ§  High Memory Usage',
      body: `Memory usage: ${usage.toFixed(2)}MB (threshold: ${threshold}MB)`,
      tag: 'memory-alert',
      requireInteraction: true,
      icon: '/icon-memory.png'
    });
  }

  /**
   * Notificar errores repetidos
   */
  notifyRepeatedErrors(count: number, category: string): void {
    if (!this.canNotify()) return;

    this.showNotification({
      title: 'ðŸ” Repeated Errors Detected',
      body: `${count} errors in category: ${category} (last minute)`,
      tag: 'repeated-errors',
      requireInteraction: true,
      icon: '/icon-error.png'
    });
  }

  /**
   * NotificaciÃ³n personalizada
   */
  notify(options: NotificationOptions): void {
    if (!this.canNotify()) return;
    this.showNotification(options);
  }

  /**
   * Obtener emoji segÃºn severidad
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return 'ðŸ”´';
      case 'high': return 'ðŸŸ ';
      case 'medium': return 'ðŸŸ¡';
      case 'low': return 'ðŸŸ¢';
      default: return 'âšª';
    }
  }

  /**
   * Test de notificaciÃ³n
   */
  async testNotification(): Promise<boolean> {
    try {
      if (this.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) return false;
      }

      this.showNotification({
        title: 'âœ… Test Notification',
        body: 'Notificaciones configuradas correctamente',
        tag: 'test',
        icon: '/icon-success.png'
      });

      return true;
    } catch (error) {
      logger.error('Error testing notification:', { error: String(error) });
      return false;
    }
  }

  /**
   * Deshabilitar notificaciones
   */
  disable(): void {
    this.config.enabled = false;
    this.saveConfig();
    logger.info('Notifications disabled');
  }

  /**
   * Habilitar notificaciones
   */
  async enable(): Promise<boolean> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    this.config.enabled = true;
    this.saveConfig();
    logger.info('Notifications enabled');
    return true;
  }

  /**
   * Obtener estado de permisos
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Verificar soporte del navegador
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }
}

// Exportar instancia singleton
export const desktopNotificationService = new DesktopNotificationService();
export default desktopNotificationService;


