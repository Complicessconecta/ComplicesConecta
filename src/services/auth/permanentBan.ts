// Servicio de Baneo Permanente con Huella Digital
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { retainIdentityAfterBan } from "@/lib/reportBlock";
import { generateDigitalFingerprint, DigitalFingerprint, checkFingerprintBanned } from "@/services/auth/digitalFingerprint";

export interface PermanentBanData {
  userId: string;
  banReason: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence?: Record<string, unknown>;
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
    const fingerprint = await generateDigitalFingerprint(
      banData.worldIdNullifierHash,
    );

    const { data, error } = await supabase
      .from("permanent_bans")
      .insert({
        user_id: banData.userId,
        combined_hash: fingerprint.combinedHash,
        ban_reason: banData.banReason,
        ban_type: "permanent",
        severity: banData.severity,
        banned_by: _bannedBy,
        canvas_hash: fingerprint.canvasHash,
        worldid_nullifier_hash: banData.worldIdNullifierHash || null,
        evidence: banData.evidence || {} as any,
      })
      .select("id")
      .single();

    if (error) throw error;

    logger.info("✅ Baneo permanente creado", { banId: data.id });

    // Ronda 12 (stream D): `createPermanentBan` es el único punto de
    // entrada del baneo permanente (lo llama el ModeratorDashboard);
    // aquí se retiene la identidad para que el baneado no se
    // re-registre con otro nombre (`retained_identities`, migración
    // 20261124050000; la consulta en registro es
    // `checkIdentityRetained`). Es best-effort y NUNCA rompe el
    // baneo: si el perfil no se puede leer o la tabla aún no existe,
    // solo queda el warning y el baneo ya quedó creado.
    await retainIdentityAfterPermanentBan(banData, _bannedBy);

    return data.id;
  } catch (error) {
    logger.error("Error creando baneo permanente:", {
      error: error instanceof Error ? error.message : String(error),
      userId: banData.userId,
    });
    throw error;
  }
};

/**
 * Retener la identidad del baneado tras un baneo permanente
 * (ronda 12, stream D). Best-effort: nunca lanza; si algo falla
 * solo queda un warning. El correo y el apodo se leen de `profiles`
 * (el `userId` del baneo puede venir en espacio auth uid o en
 * espacio `profiles.id`, así que se prueban los dos); `banned_by`
 * se resuelve al `profiles.id` del moderador porque esa columna es
 * FK a `profiles(id)` — un auth uid ahí violaría la FK, así que si
 * no se resuelve se guarda NULL.
 */
export const retainIdentityAfterPermanentBan = async (
  banData: PermanentBanData,
  bannedBy: string,
): Promise<void> => {
  try {
    if (!supabase) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("email,nickname,display_name")
      .eq("user_id", banData.userId)
      .maybeSingle();
    const row =
      profile ??
      (
        await supabase
          .from("profiles")
          .select("email,nickname,display_name")
          .eq("id", banData.userId)
          .maybeSingle()
      ).data;
    const email = (row as { email?: string | null } | null)?.email;
    const username =
      (row as { nickname?: string | null; display_name?: string | null } | null)
        ?.nickname ??
      (row as { display_name?: string | null } | null)?.display_name ??
      null;
    if (!email || !username) {
      logger.warn(
        "Retención de identidad omitida: sin correo o apodo del baneado",
        { userId: banData.userId },
      );
      return;
    }
    const { data: moderatorProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", bannedBy)
      .maybeSingle();
    const reportId =
      banData.evidence &&
      typeof banData.evidence.report_id === "string"
        ? (banData.evidence.report_id as string)
        : undefined;
    const result = await retainIdentityAfterBan({
      email,
      username,
      userId: banData.userId,
      reason: banData.banReason,
      // exactOptionalPropertyTypes: no pasar la clave cuando no hay
      // report_id (un `string | undefined` explícito no compila).
      ...(reportId ? { reportId } : {}),
      bannedBy:
        (moderatorProfile as { id?: string } | null)?.id ?? null,
    });
    if (!result.ok) {
      logger.warn("No se pudo retener la identidad tras el baneo", {
        userId: banData.userId,
        error: result.error,
      });
    }
  } catch (err) {
    logger.warn("No se pudo retener la identidad tras el baneo", {
      userId: banData.userId,
      error: err instanceof Error ? err.message : String(err),
    });
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
      logger.error("Error obteniendo detalles de baneo:", { error: error.message, details: error.details });
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

    // Desbloquear usuario - las columnas is_blocked no existen en profiles
    // El baneo se maneja a través de la tabla permanent_bans
    if (ban.user_id) {
      logger.info("Usuario desbaneado", { userId: ban.user_id });
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
