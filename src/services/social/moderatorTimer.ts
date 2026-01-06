/**
 * Servicio de Timer de Conexión para Moderadores
 * Gestiona el seguimiento del tiempo y actividad de los moderadores
 */

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface ModeratorSession {
  id: string;
  moderator_id: string;
  session_start: string;
  session_end?: string;
  is_active: boolean;
  total_minutes: number;
  reports_reviewed: number;
  actions_taken: number;
}

/**
 * Iniciar sesión de moderador
 */
export const startModeratorSession = async (
  moderatorId: string,
): Promise<ModeratorSession> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    const { data, error } = await supabase
      .from("moderator_sessions")
      .insert({
        moderator_id: moderatorId,
        session_start: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info("Sesión de moderador iniciada", { sessionId: data.id });

    const session: ModeratorSession = {
      id: data.id,
      moderator_id: data.moderator_id,
      session_start: data.session_start,
      session_end: data.session_end ?? undefined,
      is_active: data.is_active ?? true,
      total_minutes: data.total_minutes ?? 0,
      reports_reviewed: data.reports_reviewed ?? 0,
      actions_taken: data.actions_taken ?? 0,
    };

    return session;
  } catch (error) {
    logger.error("Error iniciando sesión de moderador:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Finalizar sesión de moderador
 */
export const endModeratorSession = async (sessionId: string): Promise<void> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    const { error } = await supabase
      .from("moderator_sessions")
      .update({
        session_end: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", sessionId);

    if (error) throw error;

    logger.info("Sesión de moderador finalizada", { sessionId });
  } catch (error) {
    logger.error("Error finalizando sesión de moderador:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Obtener sesión activa del moderador
 */
export const getActiveSession = async (
  moderatorId: string,
): Promise<ModeratorSession | null> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    const { data, error } = await supabase
      .from("moderator_sessions")
      .select("*")
      .eq("moderator_id", moderatorId)
      .eq("is_active", true)
      .order("session_start", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned

    if (!data) {
      return null;
    }

    const session: ModeratorSession = {
      id: data.id,
      moderator_id: data.moderator_id,
      session_start: data.session_start,
      session_end: data.session_end ?? undefined,
      is_active: data.is_active ?? true,
      total_minutes: data.total_minutes ?? 0,
      reports_reviewed: data.reports_reviewed ?? 0,
      actions_taken: data.actions_taken ?? 0,
    };

    return session;
  } catch (error) {
    logger.error("Error obteniendo sesión activa:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * Actualizar minutos trabajados en tiempo real
 */
export const updateSessionMinutes = async (
  sessionId: string,
  reportsReviewed: number,
  actionsTaken: number,
): Promise<void> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("moderator_sessions")
      .select("session_start")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) return;

    const startTime = new Date(sessionData.session_start);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);

    const { error } = await supabase
      .from("moderator_sessions")
      .update({
        total_minutes: minutes,
        reports_reviewed: reportsReviewed,
        actions_taken: actionsTaken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) throw error;
  } catch (error) {
    logger.error("Error actualizando minutos de sesión:", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
