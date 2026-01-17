// Servicio de Baneo Permanente con Huella Digital
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { generateDigitalFingerprint, DigitalFingerprint, checkFingerprintBanned } from "@/services/auth/digitalFingerprint";

export interface PermanentBanData {
  userId: string;
  banReason: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence?: Record<string, any>;
  worldIdNullifierHash?: string;
  moderationLogId?: string;
}

export interface BanCheckResult {
  isBanned: boolean;
  banId?: string;
  banReason?: string;
  bannedAt?: string;
  fingerprint?: DigitalFingerprint;
}

/**
 * Crear baneo permanente con huella digital
 */
export const createPermanentBan = async (
  banData: PermanentBanData,
  _bannedBy: string,
): Promise<string> => {
  try {
    logger.info("🚫 Creando baneo permanente", { userId: banData.userId });

    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    // Generar huella digital
    // TODO: Crear función RPC create_permanent_ban en Supabase
    // const fingerprint = await generateDigitalFingerprint(
    //   banData.worldIdNullifierHash,
    // );
    // const rpcPayload: Record<string, unknown> = {
    //   p_user_id: banData.userId,
    //   p_canvas_hash: fingerprint.canvasHash,
    //   p_combined_hash: fingerprint.combinedHash,
    //   p_ban_reason: banData.banReason,
    //   p_banned_by: bannedBy,
    //   p_severity: banData.severity,
    //   p_evidence: banData.evidence || {},
    // };
    // if (banData.worldIdNullifierHash) {
    //   rpcPayload.p_worldid_nullifier_hash = banData.worldIdNullifierHash;
    // }

    // const { data, error } = await supabase.rpc(
    //   "create_permanent_ban",
    //   rpcPayload as any,
    // );

    // if (error) throw error;

    // logger.info("✅ Baneo permanente creado", { banId: data });

    // return data;

    // Por ahora, retornar un valor por defecto
    logger.warn("Función RPC create_permanent_ban no implementada aún");
    return "mock-ban-id";
  } catch (error) {
    logger.error("Error creando baneo permanente:", {
      error: error instanceof Error ? error.message : String(error),
      userId: banData.userId,
    });
    throw error;
  }
};

/**
 * Verificar si usuario está baneado por huella digital
 */
export const checkUserBanned = async (
  userId: string,
  worldIdNullifierHash?: string,
): Promise<BanCheckResult> => {
  try {
    if (!supabase) {
      return { isBanned: false };
    }

    // Generar huella digital actual
    const fingerprint = await generateDigitalFingerprint(worldIdNullifierHash);

    // Verificar baneo por fingerprint
    const isBanned = await checkFingerprintBanned(
      fingerprint,
      worldIdNullifierHash,
    );

    if (!isBanned) {
      return { isBanned: false, fingerprint };
    }

    // Obtener detalles del baneo
    const { data: banData, error } = await supabase
      .from("permanent_bans")
      .select(
        "id, ban_reason, banned_at, combined_hash, worldid_nullifier_hash",
      )
      .or(
        `combined_hash.eq.${fingerprint.combinedHash},worldid_nullifier_hash.eq.${worldIdNullifierHash || ""}`,
      )
      .eq("is_active", true)
      .order("banned_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error obteniendo detalles de baneo:", error);
    }

    const result: BanCheckResult = {
      isBanned: true,
      fingerprint,
    };
    if (banData?.id) result.banId = banData.id;
    if (banData?.ban_reason) result.banReason = banData.ban_reason;
    if (banData?.banned_at) result.bannedAt = banData.banned_at;
    return result;
  } catch (error) {
    logger.error("Error verificando baneo:", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return { isBanned: false };
  }
};

/**
 * Levantar baneo permanente (solo admins)
 */
export const liftPermanentBan = async (
  banId: string,
  liftedBy: string,
  reason?: string,
): Promise<void> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    // Obtener baneo
    const { data: ban, error: banError } = await supabase
      .from("permanent_bans")
      .select("fingerprint_ids, user_id")
      .eq("id", banId)
      .single();

    if (banError) throw banError;

    // Desactivar baneo
    const { error: updateError } = await supabase
      .from("permanent_bans")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
        metadata: {
          lifted_by: liftedBy,
          lifted_at: new Date().toISOString(),
          lift_reason: reason,
        },
      })
      .eq("id", banId);

    if (updateError) throw updateError;

    // Desbanear fingerprints asociados
    if (ban.fingerprint_ids && ban.fingerprint_ids.length > 0) {
      await supabase
        .from("digital_fingerprints")
        .update({
          is_banned: false,
          updated_at: new Date().toISOString(),
        })
        .in("id", ban.fingerprint_ids);
    }

    // Desbloquear usuario
    if (ban.user_id) {
      await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null,
        })
        .eq("id", ban.user_id);
    }

    logger.info("✅ Baneo permanente levantado", { banId });
  } catch (error) {
    logger.error("Error levantando baneo:", {
      error: error instanceof Error ? error.message : String(error),
      banId,
    });
    throw error;
  }
};

/**
 * Obtener todos los baneos permanentes
 */
export const getPermanentBans = async (): Promise<any[]> => {
  try {
    if (!supabase) {
      throw new Error("Supabase no está disponible");
    }

    const { data, error } = await supabase
      .from("permanent_bans")
      .select(
        `
        *,
        banned_by_user:profiles!permanent_bans_banned_by_fkey(id, name),
        user:profiles!permanent_bans_user_id_fkey(id, name)
      `,
      )
      .eq("is_active", true)
      .order("banned_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error("Error obteniendo baneos permanentes:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
