/**
 * SecurityAuditService - Sistema de auditoría de seguridad avanzado
 * Implementa monitoreo continuo, detección de amenazas y respuesta automática
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/supabase-generated';

interface SecurityEventRow {
  id: string;
  user_id: string | null;
  event_type: string | null;
  metadata: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  description: string | null;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: 'login' | 'logout' | 'suspicious_activity' | 'failed_login' | 'data_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ThreatDetection {
  threatId: string;
  threatType: 'brute_force' | 'data_breach' | 'suspicious_pattern' | 'unauthorized_access' | 'malware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: string[];
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  mitigationActions: string[];
  confidence: number;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  averageResponseTime: number;
  threatDetectionRate: number;
  falsePositiveRate: number;
  securityScore: number;
}

export interface SecurityReport {
  period: string;
  metrics: SecurityMetrics;
  topThreats: ThreatDetection[];
  recentEvents: SecurityEvent[];
  recommendations: string[];
  complianceStatus: {
    gdpr: boolean;
    ccpa: boolean;
    iso27001: boolean;
  };
}

export class SecurityAuditService {
  private static instance: SecurityAuditService;
  private readonly THREAT_THRESHOLDS = {
    brute_force_attempts: 5,
    suspicious_login_hours: 2,
    data_access_frequency: 100,
    admin_action_frequency: 50
  };

  private constructor() {
    this.startContinuousMonitoring();
  }

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  /**
   * Inicia el monitoreo continuo de seguridad
   */
  private startContinuousMonitoring(): void {
    // Monitoreo cada 5 minutos
    setInterval(async () => {
      await this.performSecurityScan();
    }, 5 * 60 * 1000);

    // Análisis de amenazas cada hora
    setInterval(async () => {
      await this.analyzeThreats();
    }, 60 * 60 * 1000);

    logger.info('🔒 Security monitoring started');
  }

  /**
   * Registra un evento de seguridad
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return;
      }

      const securityEventData = {
        user_id: event.userId,
        event_type: event.eventType,
        severity: event.severity,
        description: event.description,
        metadata: event.metadata as unknown as Json,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('security_events' as any)
        .insert(securityEventData);

      if (error) {
        logger.error('Error logging security event:', { error: error.message });
      } else {
        logger.info('🔒 Security event logged', { eventType: event.eventType, severity: event.severity });
      }
    } catch (error) {
      logger.error('Error in logSecurityEvent:', { error: String(error) });
    }
  }

  /**
   * Realiza un escaneo de seguridad completo
   */
  async performSecurityScan(): Promise<void> {
    try {
      logger.info('🔍 Performing security scan...');

      // Verificar eventos sospechosos recientes
      await this.checkSuspiciousActivity();
      
      // Verificar patrones de acceso anómalos
      await this.checkAnomalousAccess();
      
      // Verificar integridad de datos
      await this.checkDataIntegrity();
      
      // Verificar configuración de seguridad
      await this.checkSecurityConfiguration();

      logger.info('✅ Security scan completed');
    } catch (error) {
      logger.error('Error in security scan:', { error: String(error) });
    }
  }

  /**
   * Verifica actividad sospechosa
   */
  private async checkSuspiciousActivity(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug('Supabase no está disponible');
        return;
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentEvents, error } = await supabase
        .from('security_events' as any)
        .select('*')
        .gte('created_at', oneHourAgo)
        .eq('event_type', 'failed_login');

      if (error) {
        logger.error('Error checking suspicious activity:', { error: error.message });
        return;
      }

      // Agrupar por IP y usuario
      const activityMap = new Map<string, number>();
      (recentEvents as unknown as SecurityEventRow[] | null)?.forEach((event) => {
        const key = `${event.ip_address || 'unknown'}-${event.user_id || 'unknown'}`;
        activityMap.set(key, (activityMap.get(key) || 0) + 1);
      });

      // Detectar intentos de fuerza bruta
      for (const [key, count] of activityMap.entries()) {
        if (count >= this.THREAT_THRESHOLDS.brute_force_attempts) {
          const [ipAddress, userId] = key.split('-');
          
          await this.logSecurityEvent({
            userId,
            eventType: 'suspicious_activity',
            severity: 'high',
            description: `Multiple failed login attempts detected: ${count} attempts`,
            metadata: { ipAddress, attemptCount: count },
            ipAddress
          });

          // Bloquear IP temporalmente
          await this.blockIPAddress(ipAddress, '1 hour');
        }
      }
    } catch (error) {
      logger.error('Error in checkSuspiciousActivity:', { error: String(error) });
    }
  }

  /**
   * Verifica acceso anómalo
   */
  private async checkAnomalousAccess(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug('Supabase no está disponible');
        return;
      }

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: accessEvents, error } = await supabase
        .from('security_events' as any)
        .select('*')
        .gte('created_at', oneDayAgo)
        .eq('event_type', 'data_access');

      if (error) {
        logger.error('Error checking anomalous access:', { error: error.message });
        return;
      }

      // Detectar acceso excesivo a datos
      const accessCounts = new Map<string, number>();
      (accessEvents as unknown as SecurityEventRow[] | null)?.forEach((event) => {
        const userId = event.user_id || 'unknown';
        accessCounts.set(userId, (accessCounts.get(userId) || 0) + 1);
      });

      for (const [userId, count] of accessCounts.entries()) {
        if (count > this.THREAT_THRESHOLDS.data_access_frequency) {
        await this.logSecurityEvent({
          userId,
          eventType: 'suspicious_activity',
          severity: 'medium',
          description: `Excessive data access detected: ${count} accesses in 24h`,
          metadata: { accessCount: count }
        });
        }
      }
    } catch (error) {
      logger.error('Error in checkAnomalousAccess:', { error: String(error) });
    }
  }

  /**
   * Verifica integridad de datos
   */
  private async checkDataIntegrity(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug('Supabase no está disponible');
        return;
      }

      // Verificar perfiles duplicados usando query directo
      // Nota: Esta es una simplificación. En producción, usar RPC con función SQL
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name')
        .limit(100);

      if (error) {
        logger.error('Error checking data integrity:', { error: error.message });
        return;
      }

      // Verificar duplicados básico por nombre
      const nameCounts = new Map<string, number>();
      (profiles as Array<{ id: string; name: string | null }> | null)?.forEach((profile) => {
        const key = profile.name || 'unknown';
        nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
      });

      const duplicateCount = Array.from(nameCounts.values()).filter(count => count > 1).length;
      
      if (duplicateCount > 0) {
        await this.logSecurityEvent({
          userId: 'system',
          eventType: 'suspicious_activity',
          severity: 'medium',
          description: `Possible duplicate profiles detected: ${duplicateCount} potential duplicates`,
          metadata: { duplicateCount }
        });
      }
    } catch (error) {
      logger.error('Error in checkDataIntegrity:', { error: String(error) });
    }
  }

  /**
   * Verifica configuración de seguridad
   */
  private async checkSecurityConfiguration(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug('Supabase no está disponible');
        return;
      }

      // Verificar usuarios sin 2FA habilitado
      const { data: usersWithout2FA, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('two_factor_enabled', false)
        .eq('is_admin', true);

      if (error) {
        logger.error('Error checking security configuration:', { error: error.message });
        return;
      }

      if (usersWithout2FA && usersWithout2FA.length > 0) {
        await this.logSecurityEvent({
          userId: 'system',
          eventType: 'suspicious_activity',
          severity: 'high',
          description: `Admin users without 2FA: ${usersWithout2FA.length} users`,
          metadata: { usersWithout2FA: usersWithout2FA.length }
        });
      }
    } catch (error) {
      logger.error('Error in checkSecurityConfiguration:', { error: String(error) });
    }
  }

  /**
   * Analiza amenazas detectadas
   */
  async analyzeThreats(): Promise<ThreatDetection[]> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return [];
      }

      const threats: ThreatDetection[] = [];
      
      // Analizar eventos críticos no resueltos
      const { data: criticalEvents, error } = await supabase
        .from('security_events' as any)
        .select('*')
        .eq('severity', 'critical')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        logger.error('Error analyzing threats:', { error: error.message });
        return threats;
      }

      if (criticalEvents && (criticalEvents as unknown as SecurityEventRow[]).length > 0) {
        threats.push({
          threatId: `threat-${Date.now()}`,
          threatType: 'suspicious_pattern',
          severity: 'critical',
          description: `${(criticalEvents as unknown as SecurityEventRow[]).length} critical security events detected`,
          affectedUsers: [...new Set((criticalEvents as unknown as SecurityEventRow[]).map((e) => e.user_id || ''))] as string[],
          detectedAt: new Date().toISOString(),
          status: 'active',
          mitigationActions: ['Review events', 'Implement additional monitoring', 'Notify security team'],
          confidence: 0.9
        });
      }

      return threats;
    } catch (error) {
      logger.error('Error in analyzeThreats:', { error: String(error) });
      return [];
    }
  }

  /**
   * Bloquea una dirección IP
   */
  private async blockIPAddress(ipAddress: string, duration: string): Promise<void> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return;
      }

      const expiresAt = new Date();
      if (duration.includes('hour')) {
        expiresAt.setHours(expiresAt.getHours() + parseInt(duration));
      } else if (duration.includes('day')) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
      }

      const { error } = await supabase
        .from('blocked_ips' as any)
        .insert({
          ip_address: ipAddress,
          blocked_at: new Date().toISOString(),
          duration: duration,
          reason: 'Suspicious activity detected',
          blocked_by: 'security_system',
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('Error blocking IP address:', { error: error.message });
      } else {
        logger.info('🚫 IP address blocked', { ipAddress, duration });
      }
    } catch (error) {
      logger.error('Error in blockIPAddress:', { error: String(error) });
    }
  }

  /**
   * Obtiene métricas de seguridad
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return this.getDefaultMetrics();
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: events, error } = await supabase
        .from('security_events' as any)
        .select('*')
        .gte('created_at', oneWeekAgo);

      if (error) {
        logger.error('Error getting security metrics:', { error: error.message });
        return this.getDefaultMetrics();
      }

      const rows = (events as unknown as SecurityEventRow[] | null) || [];
      const totalEvents = rows.length;
      const criticalEvents = rows.filter((e) => e.severity === 'critical').length;
      const resolvedEvents = 0;
      
      const averageResponseTime = this.calculateAverageResponseTime(rows);
      const threatDetectionRate = this.calculateThreatDetectionRate(rows);
      const falsePositiveRate = this.calculateFalsePositiveRate(rows);
      const securityScore = this.calculateSecurityScore(totalEvents, criticalEvents, resolvedEvents);

      return {
        totalEvents,
        criticalEvents,
        resolvedEvents,
        averageResponseTime,
        threatDetectionRate,
        falsePositiveRate,
        securityScore
      };
    } catch (error) {
      logger.error('Error in getSecurityMetrics:', { error: String(error) });
      return this.getDefaultMetrics();
    }
  }

  /**
   * Genera reporte de seguridad
   */
  async generateSecurityReport(): Promise<SecurityReport> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        throw new Error('Supabase no está disponible');
      }

      const metrics = await this.getSecurityMetrics();
      const threats = await this.analyzeThreats();
      
      const { data: recentEvents, error } = await supabase
        .from('security_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error generating security report:', { error: error.message });
      }

      const recommendations = this.generateSecurityRecommendations(metrics, threats);
      const complianceStatus = await this.checkComplianceStatus();

      // Mapear recentEvents a SecurityEvent[]
      const mappedEvents: SecurityEvent[] = ((recentEvents as unknown as SecurityEventRow[] | null) || []).map((event) => ({
        id: event.id || '',
        userId: event.user_id || '',
        eventType: (event.event_type || 'login') as any,
        severity: (event.severity || 'low') as any,
        description: event.description || '',
        metadata: (event.metadata as Record<string, any>) || {},
        ipAddress: (event.ip_address as string) || undefined,
        userAgent: (event.user_agent as string) || undefined,
        timestamp: event.created_at || '',
        resolved: false,
        resolvedAt: undefined,
        resolvedBy: undefined
      }));

      return {
        period: 'Last 7 days',
        metrics,
        topThreats: threats.slice(0, 5),
        recentEvents: mappedEvents,
        recommendations,
        complianceStatus
      };
    } catch (error) {
      logger.error('Error in generateSecurityReport:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Métodos auxiliares
   */
  private getDefaultMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      criticalEvents: 0,
      resolvedEvents: 0,
      averageResponseTime: 0,
      threatDetectionRate: 0,
      falsePositiveRate: 0,
      securityScore: 100
    };
  }

  private calculateAverageResponseTime(_events: SecurityEventRow[]): number {
    return 0;
  }

  private calculateThreatDetectionRate(events: SecurityEventRow[]): number {
    const suspiciousEvents = events.filter(e => e.event_type === 'suspicious_activity').length;
    return events.length > 0 ? (suspiciousEvents / events.length) * 100 : 0;
  }

  private calculateFalsePositiveRate(events: SecurityEventRow[]): number {
    const falsePositives = events.filter(e => {
      const meta = e.metadata as any;
      return meta && typeof meta === 'object' && meta.falsePositive === true;
    }).length;
    return events.length > 0 ? (falsePositives / events.length) * 100 : 0;
  }

  private calculateSecurityScore(totalEvents: number, criticalEvents: number, resolvedEvents: number): number {
    if (totalEvents === 0) return 100;
    
    const resolutionRate = resolvedEvents / totalEvents;
    const criticalRate = criticalEvents / totalEvents;
    
    return Math.max(0, 100 - (criticalRate * 50) + (resolutionRate * 30));
  }

  private generateSecurityRecommendations(metrics: SecurityMetrics, threats: ThreatDetection[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.securityScore < 70) {
      recommendations.push('Implementar medidas de seguridad adicionales');
    }
    
    if (metrics.criticalEvents > 5) {
      recommendations.push('Revisar y mejorar políticas de seguridad');
    }
    
    if (metrics.averageResponseTime > 60) {
      recommendations.push('Mejorar tiempo de respuesta a incidentes');
    }
    
    if (threats.length > 0) {
      recommendations.push('Investigar amenazas activas inmediatamente');
    }
    
    return recommendations;
  }

  private async checkComplianceStatus(): Promise<SecurityReport['complianceStatus']> {
    // TODO: Implementar verificación real de cumplimiento
    return {
      gdpr: true,
      ccpa: true,
      iso27001: false
    };
  }
}

export const securityAuditService = SecurityAuditService.getInstance();
