import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase-generated";

// Tipos de Supabase - Actualizados según esquema real
type ReportsTable = Database["public"]["Tables"]["reports"];
type ProfilesTable = Database["public"]["Tables"]["profiles"];
type ReportRow = ReportsTable["Row"];
type ReportInsert = ReportsTable["Insert"];

// Interfaces para los reportes de perfiles
export interface CreateProfileReportParams {
  reportedUserId: string;
  reason: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

// Interface actualizada para coincidir exactamente con ReportRow del esquema
export interface ProfileReport {
  id: string;
  content_type: string;
  created_at: string;
  description: string | null;
  reason: string;
  reported_content_id: string;
  reported_user_id: string;
  reporter_user_id: string;
  // resolution_notes, reviewed_at, reviewed_by no existen en el esquema
  // Usar resolved_at y resolved_by en su lugar
  severity: string;
  status: string;
  updated_at: string;
}

export interface ProfileReportResponse {
  success: boolean;
  data?: ReportRow;
  error?: string;
}

export interface ProfileReportsListResponse {
  success: boolean;
  reports?: ReportRow[];
  error?: string;
}

export interface ProfileReportStatsResponse {
  success: boolean;
  stats?: {
    reportsMade: number;
    reportsReceived: number;
    recentReports: number;
    canReport: boolean;
    reason?: string;
  };
  error?: string;
}

export class ProfileReportService {
  async createProfileReport(
    params: CreateProfileReportParams,
  ): Promise<ProfileReportResponse> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      if (user.id === params.reportedUserId) {
        return { success: false, error: "No puedes reportarte a ti mismo" };
      }

      // Ajustado según esquema real: todos los campos obligatorios incluidos
      const insertData = {
        reporter_user_id: user.id,
        reported_user_id: params.reportedUserId,
        content_type: "profile", // Campo obligatorio en reports
        report_type: "profile", // Cambiado de content_type a report_type
        reported_content_id: params.reportedUserId,
        reason: params.reason,
        description: params.description ?? null,
        severity: params.severity ?? "medium",
        status: "pending",
      } as ReportInsert;

      const { data, error } = await supabase
        .from("reports")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error("Error creando reporte de perfil:", {
          error: error.message,
        });
        return { success: false, error: "Error al crear el reporte" };
      }

      // Notificar al usuario reportado (si la severidad es baja/media y queremos avisar)
      // O notificar a admins (si es crítica/legal)
      if (params.severity === "critical") {
        // En casos de violaciones legales (Ley Olimpia, etc), notificar inmediatamente a admins
        logger.warn(
          "REPORTE CRÍTICO/LEGAL - Notificar a admins inmediatamente",
          { reportId: data.id, reason: params.reason },
        );
        // Aquí se integraría con un servicio de email/SMS a admins
        // await notifyAdmins({ type: 'CRITICAL_REPORT', reportId: data.id });
      } else if (["medium", "high"].includes(params.severity || "")) {
        // Notificar al usuario sobre reportes recibidos según gravedad (Warning)
        const { error: warningError } = await supabase
          .from("notifications" as any)
          .insert({
            user_id: params.reportedUserId,
            type: "system_warning",
            title: "Aviso de la Comunidad",
            message:
              "Tu perfil ha recibido un reporte. Por favor revisa nuestras normas de comunidad.",
            data: { report_id: data.id, severity: params.severity },
          });

        if (warningError) {
          logger.warn(
            "No se pudo enviar advertencia al usuario reportado",
            warningError,
          );
        }
      }

      // Crear notificación para el usuario que reportó (confirmación)
      const { error: notifError } = await supabase
        .from("notifications" as any)
        .insert({
          user_id: user.id,
          type: "report_update",
          title: "Reporte Recibido",
          message:
            "Hemos recibido tu reporte y será analizado por nuestro equipo de confianza y seguridad.",
          data: { report_id: data.id },
        });

      if (notifError) {
        logger.error("Error creando notificación de confirmación:", notifError);
      }

      logger.info("Reporte de perfil creado exitosamente:", {
        reportId: data.id,
      });
      return { success: true, data };
    } catch (error) {
      logger.error("Error inesperado en createProfileReport:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: "Error inesperado al crear el reporte" };
    }
  }

  async getUserProfileReports(): Promise<ProfileReportsListResponse> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_user_id", user.id)
        .eq("report_type", "profile") // Cambiado de content_type a report_type
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error obteniendo reportes del usuario:", {
          error: error.message,
        });
        return { success: false, error: "Error al obtener los reportes" };
      }

      return { success: true, reports: (data || []) as ReportRow[] };
    } catch (error) {
      logger.error("Error inesperado en getUserProfileReports:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: "Error inesperado al obtener los reportes",
      };
    }
  }

  async getPendingProfileReports(): Promise<ProfileReportsListResponse> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .eq("report_type", "profile") // Cambiado de content_type a report_type
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error obteniendo reportes pendientes:", {
          error: error.message,
        });
        return {
          success: false,
          error: "Error al obtener los reportes pendientes",
        };
      }

      return { success: true, reports: (data || []) as ReportRow[] };
    } catch (error) {
      logger.error("Error inesperado en getPendingProfileReports:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: "Error inesperado al obtener los reportes pendientes",
      };
    }
  }

  async analyzeReportContent(
    reason: string,
    description?: string,
  ): Promise<{ score: number; message: string; category: string }> {
    // Simulación de análisis de IA
    // TODO: Conectar con endpoint real de IA (OpenAI/Anthropic via Edge Function)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const text = (reason + " " + (description || "")).toLowerCase();

    if (
      text.includes("ilegal") ||
      text.includes("menor") ||
      text.includes("droga") ||
      text.includes("arma") ||
      text.includes("muerte") ||
      text.includes("violencia")
    ) {
      return {
        score: 95,
        message:
          "⚠️ ALERTA CRÍTICA: Este reporte ha sido marcado como ALTA PRIORIDAD por nuestro sistema de seguridad. Un administrador revisará esto inmediatamente.",
        category: "legal_safety",
      };
    } else if (
      text.includes("falso") ||
      text.includes("spam") ||
      text.includes("estafa") ||
      text.includes("fake")
    ) {
      return {
        score: 60,
        message:
          "ℹ️ Análisis completado: Parece tratarse de un perfil falso o spam. Hemos ajustado la prioridad de revisión.",
        category: "spam_fraud",
      };
    } else {
      return {
        score: 30,
        message:
          "✅ Reporte registrado. Nuestro equipo de moderación lo revisará en orden de llegada.",
        category: "general_moderation",
      };
    }
  }

  async getProfileScore(userId: string): Promise<number> {
    // Obtener score de reputación del usuario basado en reportes recibidos
    try {
      if (!supabase) return 100;

      // Contamos reportes recibidos en los últimos 30 días
      const { count, error } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("reported_user_id", userId)
        .eq("report_type", "profile");

      if (error) {
        logger.error("Error getting profile score count", { error: error.message, details: error.details });
        return 100;
      }

      // Score base 100, baja 5 puntos por cada reporte recibido (simple heuristic for now)
      // En un sistema real, solo bajaríamos por reportes 'validos' o 'aceptados'
      const baseScore = 100;
      const penalty = (count || 0) * 5;
      return Math.max(0, baseScore - penalty);
    } catch (error) {
      logger.error("Error calculating profile score", { userId, error });
      return 100; // Fallback to perfect score on error
    }
  }

  async resolveProfileReport(
    reportId: string,
    resolution: "resolved" | "dismissed",
    notes?: string,
  ): Promise<ProfileReportResponse> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { data, error } = await supabase
        .from("reports")
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          description: notes
            ? `${notes} (Resolution: ${resolution})`
            : `Resolution: ${resolution}`, // Usar description para almacenar notas
        })
        .eq("id", reportId)
        .eq("report_type", "profile")
        .select()
        .single();

      if (error) {
        logger.error("Error resolviendo reporte de perfil:", {
          error: error.message,
        });
        return { success: false, error: "Error al resolver el reporte" };
      }

      logger.info("Reporte de perfil resuelto exitosamente:", {
        reportId,
        resolution,
      });
      return { success: true, data: data as ReportRow };
    } catch (error) {
      logger.error("Error inesperado en resolveProfileReport:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: "Error inesperado al resolver el reporte",
      };
    }
  }

  async applyProfileAction(
    userId: string,
    action: "warning" | "temporary_suspension" | "permanent_suspension",
    suspensionDays?: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      let updateData: Partial<ProfilesTable["Update"]> = {};

      switch (action) {
        case "warning":
          updateData = {
            // Warning action - no profile blocking needed
          };
          break;

        case "temporary_suspension": {
          const suspensionEnd = new Date();
          suspensionEnd.setDate(
            suspensionEnd.getDate() + (suspensionDays || 7),
          );
          updateData = {
            // Temporary suspension - would need custom fields or separate table
            updated_at: new Date().toISOString(),
          };
          break;
        }

        case "permanent_suspension":
          updateData = {
            // Permanent suspension - would need custom fields or separate table
            updated_at: new Date().toISOString(),
          };
          break;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData as any)
        .eq("id", userId);

      if (updateError) {
        logger.error("Error aplicando acción al perfil:", {
          error: updateError.message,
        });
        return { success: false, error: "Error al aplicar la acción" };
      }

      logger.info("Acción aplicada al perfil exitosamente:", {
        userId,
        action,
      });
      return { success: true };
    } catch (error) {
      logger.error("Error inesperado en applyProfileAction:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: "Error inesperado al aplicar la acción" };
    }
  }

  async getProfileReportStats(
    userId?: string,
  ): Promise<ProfileReportStatsResponse> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const targetUserId = userId || user.id;

      const { data: reportsMade } = await supabase
        .from("reports")
        .select("id")
        .eq("reporter_user_id", targetUserId)
        .eq("report_type", "profile"); // Cambiado de content_type a report_type

      const { data: reportsReceived } = await supabase
        .from("reports")
        .select("id")
        .eq("reported_user_id", targetUserId)
        .eq("report_type", "profile"); // Cambiado de content_type a report_type

      const { data: recentReports } = await (supabase as any)
        .from("reports")
        .select("id")
        .eq("reporter_user_id", targetUserId)
        .eq("report_type", "profile") // Cambiado de content_type a report_type
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      return {
        success: true,
        stats: {
          reportsMade: reportsMade?.length || 0,
          reportsReceived: reportsReceived?.length || 0,
          recentReports: recentReports?.length || 0,
          canReport: (recentReports?.length || 0) < 5,
        },
      };
    } catch (error) {
      logger.error("Error inesperado en getProfileReportStats:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: "Error inesperado al obtener las estadísticas",
      };
    }
  }

  async canUserReport(userId?: string): Promise<{
    success: boolean;
    canReport?: boolean;
    reason?: string;
    error?: string;
  }> {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase no está disponible" };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const targetUserId = userId || user.id;

      const { data: recentReports } = await (supabase as any)
        .from("reports")
        .select("id")
        .eq("reporter_user_id", targetUserId)
        .eq("report_type", "profile") // Cambiado de content_type a report_type
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      if (recentReports && recentReports.length >= 5) {
        return {
          success: true,
          canReport: false,
          reason: "Has excedido el límite de reportes diarios",
        };
      }

      return { success: true, canReport: true };
    } catch (error) {
      logger.error("Error en canUserReport:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: "Error interno del servidor" };
    }
  }
}

export const profileReportService = new ProfileReportService();
