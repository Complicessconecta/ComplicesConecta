/**
 * =====================================================
 * REPORT MANAGEMENT SERVICE
 * =====================================================
 * Sistema completo de gestiÃ³n de reportes
 * Features: Crear, revisar, cerrar, documentaciÃ³n legal
 * Fecha: 19 Nov 2025
 * VersiÃ³n: v3.6.5
 * =====================================================
 */

import { logger } from '@/lib/logger';

export type ReportStatus = 'open' | 'in_review' | 'closed' | 'escalated';
export type ReportType = 
  | 'content_violation'     // ViolaciÃ³n de contenido (Ley Olimpia)
  | 'harassment'            // Acoso
  | 'fake_profile'          // Perfil falso
  | 'spam'                  // Spam
  | 'inappropriate_content' // Contenido inapropiado
  | 'scam'                  // Estafa
  | 'underage'              // Menor de edad
  | 'violence'              // Violencia
  | 'other';                // Otro

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Report {
  // Identificadores
  reportId: string;              // ID del reporte (ej: RPT-00000001)
  reportNumber: number;          // NÃºmero secuencial

  // InformaciÃ³n del usuario reportado
  reportedUserId: string;        // UUID del usuario
  reportedUserUniqueId: string;  // ID Ãºnico (SNG-XXXXXXXX o CPL-XXXXXXXX)
  reportedUserName?: string;
  reportedProfileType: 'single' | 'couple';

  // InformaciÃ³n del reportador
  reporterUserId: string;
  reporterUserUniqueId: string;
  reporterName?: string;
  reporterProfileType: 'single' | 'couple';

  // Detalles del reporte
  type: ReportType;
  priority: ReportPriority;
  status: ReportStatus;
  title: string;
  description: string;
  evidence: Evidence[];

  // Workflow
  createdAt: Date;
  openedAt: Date;
  reviewedAt?: Date;
  closedAt?: Date;
  
  // AsignaciÃ³n
  assignedTo?: string;          // ID del moderador
  assignedAt?: Date;

  // ResoluciÃ³n
  resolution?: string;
  resolutionNotes?: string;
  actionTaken?: ReportAction[];

  // DocumentaciÃ³n legal
  legalDocumentation?: LegalDocumentation;
  
  // Metadata
  tags?: string[];
  relatedReports?: string[];    // IDs de reportes relacionados
}

export interface Evidence {
  id: string;
  type: 'screenshot' | 'video' | 'message' | 'url' | 'document';
  url?: string;
  description?: string;
  timestamp: Date;
  uploadedBy: string;
  // Marca de agua con ID del reportero para trazabilidad
  watermarked: boolean;
}

export interface ReportAction {
  action: 'warning' | 'content_removal' | 'temporary_ban' | 'permanent_ban' | 'account_review' | 'no_action';
  performedBy: string;
  performedAt: Date;
  notes?: string;
  duration?: number; // Para bans temporales (en dÃ­as)
}

export interface LegalDocumentation {
  caseNumber?: string;
  lawyerAssigned?: string;
  courtFiling?: boolean;
  filingDate?: Date;
  legalNotes?: string;
  relatedLaws: string[]; // Ej: ["Ley Olimpia Art. 259 Ter", "CÃ³digo Penal Art. X"]
  authorityNotified?: boolean;
  authorityDetails?: string;
}

class ReportManagementService {
  private readonly REPORT_PREFIX = 'RPT';
  private readonly ID_LENGTH = 8;

  /**
   * Crear nuevo reporte
   */
  async createReport(data: {
    reportedUserId: string;
    reportedUserUniqueId: string;
    reporterUserId: string;
    reporterUserUniqueId: string;
    type: ReportType;
    title: string;
    description: string;
    evidence?: Evidence[];
  }): Promise<Report> {
    try {
      logger.info('[ReportManagement] Creating new report', {
        type: data.type,
        reportedUser: data.reportedUserUniqueId
      });

      // Generar ID de reporte
      const reportNumber = await this.getNextReportNumber();
      const reportId = `${this.REPORT_PREFIX}-${String(reportNumber).padStart(this.ID_LENGTH, '0')}`;

      // Determinar prioridad automÃ¡tica
      const priority = this.determinePriority(data.type);

      const now = new Date();

      const report: Report = {
        reportId,
        reportNumber,
        reportedUserId: data.reportedUserId,
        reportedUserUniqueId: data.reportedUserUniqueId,
        reportedProfileType: data.reportedUserUniqueId.startsWith('SNG') ? 'single' : 'couple',
        reporterUserId: data.reporterUserId,
        reporterUserUniqueId: data.reporterUserUniqueId,
        reporterProfileType: data.reporterUserUniqueId.startsWith('SNG') ? 'single' : 'couple',
        type: data.type,
        priority,
        status: 'open',
        title: data.title,
        description: data.description,
        evidence: data.evidence || [],
        createdAt: now,
        openedAt: now,
        tags: this.generateTags(data.type)
      };

      // Agregar documentaciÃ³n legal si aplica
      if (this.requiresLegalDocumentation(data.type)) {
        report.legalDocumentation = {
          relatedLaws: this.getRelatedLaws(data.type),
          authorityNotified: false
        };
      }

      // Guardar en BD
      await this.saveReport(report);

      // Notificar a moderadores
      await this.notifyModerators(report);

      logger.info('[ReportManagement] Report created successfully', { reportId });

      return report;
    } catch (error) {
      logger.error('[ReportManagement] Error creating report:', { error });
      throw error;
    }
  }

  /**
   * Obtener siguiente nÃºmero de reporte
   */
  private async getNextReportNumber(): Promise<number> {
    try {
      // TODO: En producciÃ³n, obtener desde Supabase
      const key = 'last_report_number';
      const lastNumber = parseInt(localStorage.getItem(key) || '0', 10);
      const nextNumber = lastNumber + 1;
      localStorage.setItem(key, String(nextNumber));

      return nextNumber;
    } catch (error) {
      logger.error('[ReportManagement] Error getting report number:', { error });
      return 1;
    }
  }

  /**
   * Determinar prioridad automÃ¡tica
   */
  private determinePriority(type: ReportType): ReportPriority {
    const criticalTypes: ReportType[] = ['content_violation', 'underage', 'violence'];
    const highTypes: ReportType[] = ['harassment', 'scam'];
    const mediumTypes: ReportType[] = ['fake_profile', 'inappropriate_content'];

    if (criticalTypes.includes(type)) return 'critical';
    if (highTypes.includes(type)) return 'high';
    if (mediumTypes.includes(type)) return 'medium';
    return 'low';
  }

  /**
   * Generar tags automÃ¡ticos
   */
  private generateTags(type: ReportType): string[] {
    const tags: string[] = [type];

    if (type === 'content_violation') {
      tags.push('ley_olimpia', 'legal');
    }

    if (type === 'underage') {
      tags.push('urgent', 'legal', 'law_enforcement');
    }

    if (type === 'violence' || type === 'harassment') {
      tags.push('safety', 'urgent');
    }

    return tags;
  }

  /**
   * Verificar si requiere documentaciÃ³n legal
   */
  private requiresLegalDocumentation(type: ReportType): boolean {
    return ['content_violation', 'underage', 'violence', 'scam'].includes(type);
  }

  /**
   * Obtener leyes relacionadas
   */
  private getRelatedLaws(type: ReportType): string[] {
    const laws: Record<ReportType, string[]> = {
      content_violation: [
        'Ley Olimpia - Art. 259 Ter (VideograbaciÃ³n no consentida)',
        'Ley Olimpia - Art. 259 QuÃ¡ter (DifusiÃ³n de contenido sexual)',
        'Ley Olimpia - Art. 259 Quinquies (Acoso sexual digital)'
      ],
      underage: [
        'CÃ³digo Penal Federal - Art. 202 (PornografÃ­a infantil)',
        'Ley General de los Derechos de NiÃ±as, NiÃ±os y Adolescentes'
      ],
      violence: [
        'CÃ³digo Penal - Art. 343 Bis (Violencia digital)',
        'Ley General de Acceso de las Mujeres a una Vida Libre de Violencia'
      ],
      harassment: [
        'CÃ³digo Penal - Art. 259 Quinquies (Acoso sexual digital)',
        'Ley Federal del Trabajo - Art. 133 (Hostigamiento)'
      ],
      scam: [
        'CÃ³digo Penal Federal - Art. 388 (Fraude)',
        'Ley Federal de ProtecciÃ³n al Consumidor'
      ],
      fake_profile: [],
      spam: [],
      inappropriate_content: [],
      other: []
    };

    return laws[type] || [];
  }

  /**
   * Guardar reporte en BD
   */
  private async saveReport(report: Report): Promise<void> {
    try {
      // TODO: En producciÃ³n, guardar en Supabase
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      reports.push(report);
      localStorage.setItem('reports', JSON.stringify(reports));

      logger.info('[ReportManagement] Report saved', { reportId: report.reportId });
    } catch (error) {
      logger.error('[ReportManagement] Error saving report:', { error });
      throw error;
    }
  }

  /**
   * Actualizar estado del reporte
   */
  async updateStatus(
    reportId: string,
    newStatus: ReportStatus,
    moderatorId: string,
    notes?: string
  ): Promise<void> {
    try {
      logger.info('[ReportManagement] Updating report status', { reportId, newStatus });

      const report = await this.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.status = newStatus;

      const now = new Date();

      if (newStatus === 'in_review') {
        report.reviewedAt = now;
        report.assignedTo = moderatorId;
        report.assignedAt = now;
      }

      if (newStatus === 'closed') {
        report.closedAt = now;
      }

      if (notes) {
        report.resolutionNotes = (report.resolutionNotes || '') + `\n[${now.toISOString()}] ${notes}`;
      }

      await this.updateReport(report);

      logger.info('[ReportManagement] Report status updated', { reportId, newStatus });
    } catch (error) {
      logger.error('[ReportManagement] Error updating status:', { error });
      throw error;
    }
  }

  /**
   * Buscar reporte por ID
   */
  async findById(reportId: string): Promise<Report | null> {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      const found = reports.find((r: Report) => r.reportId === reportId);

      return found || null;
    } catch (error) {
      logger.error('[ReportManagement] Error finding report:', { error });
      return null;
    }
  }

  /**
   * Actualizar reporte
   */
  private async updateReport(report: Report): Promise<void> {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      const index = reports.findIndex((r: Report) => r.reportId === report.reportId);

      if (index !== -1) {
        reports[index] = report;
        localStorage.setItem('reports', JSON.stringify(reports));
      }
    } catch (error) {
      logger.error('[ReportManagement] Error updating report:', { error });
      throw error;
    }
  }

  /**
   * Listar reportes por estado
   */
  async listByStatus(status: ReportStatus): Promise<Report[]> {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      return reports.filter((r: Report) => r.status === status);
    } catch (error) {
      logger.error('[ReportManagement] Error listing by status:', { error });
      return [];
    }
  }

  /**
   * Listar reportes de un usuario
   */
  async listByUserId(userId: string): Promise<Report[]> {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      return reports.filter((r: Report) => 
        r.reportedUserId === userId || r.reporterUserId === userId
      );
    } catch (error) {
      logger.error('[ReportManagement] Error listing by user:', { error });
      return [];
    }
  }

  /**
   * Obtener estadÃ­sticas de reportes
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<ReportStatus, number>;
    byType: Record<ReportType, number>;
    byPriority: Record<ReportPriority, number>;
  }> {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');

      const stats = {
        total: reports.length,
        byStatus: {} as Record<ReportStatus, number>,
        byType: {} as Record<ReportType, number>,
        byPriority: {} as Record<ReportPriority, number>
      };

      reports.forEach((r: Report) => {
        stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
        stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
        stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('[ReportManagement] Error getting stats:', { error });
      return {
        total: 0,
        byStatus: {} as Record<ReportStatus, number>,
        byType: {} as Record<ReportType, number>,
        byPriority: {} as Record<ReportPriority, number>
      };
    }
  }

  /**
   * Notificar a moderadores
   */
  private async notifyModerators(report: Report): Promise<void> {
    try {
      logger.info('[ReportManagement] Notifying moderators', { reportId: report.reportId });

      // TODO: En producciÃ³n, enviar notificaciÃ³n real
      // - Email a moderadores
      // - NotificaciÃ³n push
      // - Alerta en dashboard

      if (report.priority === 'critical') {
        logger.warn('[ReportManagement] CRITICAL PRIORITY REPORT', {
          reportId: report.reportId,
          type: report.type
        });
      }
    } catch (error) {
      logger.error('[ReportManagement] Error notifying moderators:', { error });
    }
  }

  /**
   * Descargar contenido de evidencia (solo moderadores/admin)
   */
  async downloadEvidence(
    reportId: string,
    evidenceId: string,
    moderatorId: string,
    reason: string
  ): Promise<void> {
    try {
      logger.info('[ReportManagement] Downloading evidence', {
        reportId,
        evidenceId,
        moderatorId,
        reason
      });

      // Registrar descarga para auditorÃ­a
      await this.logEvidenceAccess({
        reportId,
        evidenceId,
        moderatorId,
        action: 'download',
        reason,
        timestamp: new Date().toISOString()
      });

      // TODO: Implementar descarga real de evidencia
    } catch (error) {
      logger.error('[ReportManagement] Error downloading evidence:', { error });
      throw error;
    }
  }

  /**
   * Registrar acceso a evidencia (auditorÃ­a)
   */
  private async logEvidenceAccess(data: any): Promise<void> {
    try {
      const logs = JSON.parse(localStorage.getItem('evidence_access_logs') || '[]');
      logs.push(data);
      localStorage.setItem('evidence_access_logs', JSON.stringify(logs));

      logger.info('[ReportManagement] Evidence access logged', data);
    } catch (error) {
      logger.error('[ReportManagement] Error logging access:', { error });
    }
  }
}

export const reportManagementService = new ReportManagementService();
export default reportManagementService;

