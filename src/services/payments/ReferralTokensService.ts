import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referee_id: string;
  reward_type: "cmpx" | "gtk";
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  confirmed_at?: string;
}

export interface UserReferralBalance {
  id: string;
  user_id: string;
  referral_code: string;
  total_referrals: number;
  total_earned: number;
  monthly_earned: number;
  cmpx_balance: number;
  gtk_balance: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralTransaction {
  id: string;
  user_id: string;
  transaction_type: "earn" | "spend" | "transfer";
  token_type: "cmpx" | "gtk";
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface UserReferralBalanceRow {
  id: string;
  user_id: string;
  referral_code: string;
  total_referrals: number | null;
  total_earned: number | null;
  monthly_earned: number | null;
  cmpx_balance: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ReferralTransactionRow {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  metadata: unknown | null;
  created_at: string | null;
}

interface ReferralStatisticsRow {
  id: string;
  user_id: string;
  conversion_rate: number | null;
  total_clicks: number | null;
  total_conversions: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReferralStatistics {
  id: string;
  user_id: string;
  referral_code: string;
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  monthly_earned: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReferralRewardData {
  referrer_id: string;
  referee_id: string;
  reward_type: "cmpx" | "gtk";
  amount: number;
}

export class ReferralTokensService {
  constructor() {
    logger.info("ReferralTokensService initialized");
  }

  private resolveUserId(userId?: string): string {
    if (userId && userId.trim().length > 0) return userId;
    return this.getCurrentUserId();
  }

  /**
   * Obtener ID del usuario actual
   */
  private getCurrentUserId(): string {
    const demoUser = localStorage.getItem("demo_user");
    if (demoUser) {
      try {
        const user = JSON.parse(demoUser);
        return user.id || "demo-user-id";
      } catch {
        return "demo-user-id";
      }
    }
    throw new Error("No authenticated user found");
  }

  /**
   * Generar código de referido único usando datos reales de Supabase
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      logger.info("Generating referral code in Supabase", { userId });

      // Usar la función de Supabase para generar código único
      const { data, error } = await (supabase as any).rpc(
        "generate_referral_code",
        {
          user_id: userId,
        },
      );

      if (error) {
        logger.error("Error generating referral code:", error);
        // Fallback: generar código simple
        return `REF${userId.slice(-8).toUpperCase()}`;
      }

      logger.info("✅ Referral code generated successfully", { code: data });
      return String(data) || `REF${userId.slice(-8).toUpperCase()}`;
    } catch (error) {
      logger.error("Error in generateReferralCode:", { error: String(error) });
      return `REF${userId.slice(-8).toUpperCase()}`;
    }
  }

  /**
   * Obtener balance de referidos del usuario usando datos reales de Supabase
   */
  async getUserReferralBalance(
    userId: string,
  ): Promise<UserReferralBalance | null> {
    try {
      const resolvedUserId = this.resolveUserId(userId);
      logger.info("Getting user referral balance from Supabase", {
        userId: resolvedUserId,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return null;
      }

      const { data, error } = await supabase
        .from("user_referral_balances")
        .select("*")
        .eq("user_id", resolvedUserId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          // Crear balance inicial si no existe
          const referralCode = await this.generateReferralCode(resolvedUserId);
          if (!supabase) {
            logger.error("Supabase no está disponible");
            return null;
          }

          const { data: newBalance, error: createError } = await supabase
            .from("user_referral_balances")
            .insert({
              user_id: resolvedUserId,
              referral_code: referralCode,
              total_referrals: 0,
              total_earned: 0,
              monthly_earned: 0,
              cmpx_balance: 0,
              last_reset_date: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            logger.error("Error checking referral balance:", { error: createError.message, details: createError.details });
            return null;
          }

          // Mapear a UserReferralBalance incluyendo campos faltantes
          const balance: UserReferralBalance = {
            id: newBalance.id,
            user_id: newBalance.user_id,
            referral_code: newBalance.referral_code,
            total_referrals: newBalance.total_referrals || 0,
            total_earned: newBalance.total_earned || 0,
            monthly_earned: newBalance.monthly_earned || 0,
            cmpx_balance: newBalance.cmpx_balance || 0,
            gtk_balance: 0, // No existe en user_referral_balances, usar 0 por defecto
            created_at: newBalance.created_at || new Date().toISOString(),
            updated_at: newBalance.updated_at || new Date().toISOString(),
          };

          return balance;
        }
        logger.error("Error getting referral balance:", { error: error.message, details: error.details });
        return null;
      }

      logger.info("✅ Referral balance loaded successfully", { balance: data });

      const row = data as unknown as UserReferralBalanceRow;

      // Mapear a UserReferralBalance incluyendo gtk_balance
      return {
        id: row.id,
        user_id: row.user_id,
        referral_code: row.referral_code,
        total_referrals: row.total_referrals ?? 0,
        total_earned: row.total_earned ?? 0,
        monthly_earned: row.monthly_earned ?? 0,
        cmpx_balance: row.cmpx_balance ?? 0,
        gtk_balance: 0, // No existe en user_referral_balances, usar 0 por defecto
        created_at: row.created_at || "",
        updated_at: row.updated_at || row.created_at || "",
      };
    } catch (error) {
      logger.error("Error in getUserReferralBalance:", {
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Crear recompensa de referido usando transacciones de Supabase
   * NOTA: La tabla referral_rewards existe, pero usamos referral_transactions para mejor trazabilidad
   */
  async createReferralReward(
    rewardData: CreateReferralRewardData,
  ): Promise<ReferralReward | null> {
    try {
      logger.info("Creating referral reward via transaction", { rewardData });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return null;
      }

      // Crear transacción de recompensa
      // Obtener balance actual para calcular balance_before y balance_after
      const currentBalance = await this.getUserReferralBalance(
        rewardData.referrer_id,
      );
      const balanceBefore = currentBalance?.cmpx_balance || 0;
      const balanceAfter = balanceBefore + rewardData.amount;

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return null;
      }

      const { data, error } = await supabase
        .from("referral_transactions")
        .insert({
          user_id: rewardData.referee_id,
          referrer_id: rewardData.referrer_id,
          transaction_type: "earn",
          amount: rewardData.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Recompensa de referido: ${rewardData.referee_id}`,
          metadata: {
            referrer_id: rewardData.referrer_id,
            referee_id: rewardData.referee_id,
            reward_type: rewardData.reward_type,
          },
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating referral reward transaction:", { error: error.message, details: error.details });
        return null;
      }

      logger.info("✅ Referral reward created successfully", {
        transactionId: data.id,
      });

      // Mapear transacción a formato ReferralReward
      const reward: ReferralReward = {
        id: data.id,
        referrer_id: rewardData.referrer_id,
        referee_id: rewardData.referee_id,
        reward_type: rewardData.reward_type,
        amount: data.amount,
        status: "confirmed", // Las transacciones se confirman inmediatamente
        created_at: data.created_at || new Date().toISOString(),
        confirmed_at: data.created_at || new Date().toISOString(),
      };

      return reward;
    } catch (error) {
      logger.error("Error in createReferralReward:", { error: String(error) });
      return null;
    }
  }

  /**
   * Confirmar recompensa de referido
   * NOTA: Con referral_transactions las recompensas ya se confirman automáticamente
   */
  async confirmReferralReward(rewardId: string): Promise<boolean> {
    try {
      logger.info("Referral reward already confirmed via transaction", {
        rewardId,
      });
      // Las transacciones se confirman inmediatamente al crearlas
      return true;
    } catch (error) {
      logger.error("Error in confirmReferralReward:", { error: String(error) });
      return false;
    }
  }

  /**
   * Obtener transacciones de referidos del usuario usando datos reales de Supabase
   */
  async getUserReferralTransactions(
    userId: string,
    page = 0,
    limit = 20,
  ): Promise<ReferralTransaction[]> {
    try {
      const resolvedUserId = this.resolveUserId(userId);
      logger.info("Getting user referral transactions from Supabase", {
        userId: resolvedUserId,
        page,
        limit,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return [];
      }

      const { data, error } = await supabase
        .from("referral_transactions")
        .select("*")
        .eq("user_id", resolvedUserId)
        .order("created_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        logger.error("Error getting referral transactions:", { error: error.message, details: error.details });
        return [];
      }

      logger.info("✅ Referral transactions loaded successfully", {
        count: data?.length || 0,
      });

      const rows = (data || []) as unknown as ReferralTransactionRow[];

      // Mapear a ReferralTransaction
      return rows.map((tx) => {
        const meta =
          tx.metadata && typeof tx.metadata === "object"
            ? (tx.metadata as Record<string, unknown>)
            : undefined;
        const rewardType = meta?.["reward_type"];

        return {
          id: tx.id,
          user_id: tx.user_id,
          transaction_type: tx.transaction_type as
            | "earn"
            | "spend"
            | "transfer",
          token_type:
            rewardType === "gtk" ? "gtk" : ("cmpx" as const),
          amount: tx.amount,
          description: tx.description || "",
          ...(meta ? { metadata: meta } : {}),
          created_at: tx.created_at || "",
        };
      });
    } catch (error) {
      logger.error("Error in getUserReferralTransactions:", {
        error: String(error),
      });
      return [];
    }
  }

  /**
   * Obtener estadísticas de referidos usando datos reales de Supabase
   */
  async getReferralStatistics(
    userId: string,
  ): Promise<ReferralStatistics | null> {
    try {
      const resolvedUserId = this.resolveUserId(userId);
      logger.info("Getting referral statistics from Supabase", {
        userId: resolvedUserId,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return null;
      }

      const balance = await this.getUserReferralBalance(resolvedUserId);
      if (!balance) return null;

      // referral_statistics real solo contiene conversion_rate/total_clicks/total_conversions
      const { data, error } = await supabase
        .from("referral_statistics")
        .select("*")
        .eq("user_id", resolvedUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("Error getting referral stats:", { error: error.message, details: error.details });
        return null;
      }

      let statsRow: ReferralStatisticsRow | null = data
        ? (data as unknown as ReferralStatisticsRow)
        : null;

      if (!statsRow && (!error || error.code === "PGRST116")) {
        // Crear fila mínima si no existe (sin columnas fantasma)
        const { data: created, error: createError } = await (supabase as any)
          .from("referral_statistics")
          .insert({
            user_id: resolvedUserId,
            conversion_rate: 0,
            total_clicks: 0,
            total_conversions: 0,
          })
          .select("*")
          .single();

        if (createError) {
          logger.error("Error updating referral status:", { error: createError.message, details: createError.details });
          // Si falla, seguimos con fallback determinista local
          statsRow = null;
        } else {
          statsRow = created as unknown as ReferralStatisticsRow;
        }
      }

      const activeReferrals = statsRow?.total_conversions ?? 0;
      const totalReferrals = balance.total_referrals;
      const conversionRate =
        statsRow?.conversion_rate ??
        (totalReferrals > 0
          ? (Math.min(activeReferrals, totalReferrals) / totalReferrals) * 100
          : 0);

      return {
        id: statsRow?.id || `local-${resolvedUserId}`,
        user_id: resolvedUserId,
        referral_code: balance.referral_code,
        total_referrals: totalReferrals,
        active_referrals: Math.min(activeReferrals, totalReferrals),
        total_earned: balance.total_earned,
        monthly_earned: balance.monthly_earned,
        conversion_rate: conversionRate,
        created_at: statsRow?.created_at || balance.created_at,
        updated_at: statsRow?.updated_at || statsRow?.created_at || balance.updated_at,
      };
    } catch (error) {
      logger.error("Error in getReferralStatistics:", { error: String(error) });
      return null;
    }
  }

  /**
   * Obtener leaderboard de referidos usando datos reales de Supabase
   */
  async getReferralLeaderboard(limit = 10): Promise<
    Array<{
      user_id: string;
      referral_code: string;
      total_referrals: number;
      total_earned: number;
      monthly_earned: number;
      rank: number;
    }>
  > {
    try {
      logger.info("Getting referral leaderboard from Supabase", { limit });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return [];
      }

      // Usar user_referral_balances en lugar de referral_leaderboard que no existe
      const { data, error } = await supabase
        .from("user_referral_balances")
        .select("*")
        .order("total_earned", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Error getting referral leaderboard:", { error: error.message, details: error.details });
        return [];
      }

      logger.info("✅ Referral leaderboard loaded successfully", {
        count: data?.length || 0,
      });

      const rows = (data || []) as unknown as UserReferralBalanceRow[];

      // Mapear a formato de leaderboard
      return rows.map((balance, index: number) => ({
        user_id: balance.user_id,
        referral_code: balance.referral_code,
        total_referrals: balance.total_referrals ?? 0,
        total_earned: balance.total_earned ?? 0,
        monthly_earned: balance.monthly_earned ?? 0,
        rank: index + 1,
      }));
    } catch (error) {
      logger.error("Error in getReferralLeaderboard:", {
        error: String(error),
      });
      return [];
    }
  }

  /**
   * Procesar referido usando datos reales de Supabase
   */
  async processReferral(
    referralCode: string,
    newUserId: string,
  ): Promise<boolean> {
    try {
      logger.info("Processing referral in Supabase", {
        referralCode,
        newUserId,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return false;
      }

      // Buscar el usuario que tiene el código de referido
      const { data: referrerBalance, error: balanceError } = await supabase
        .from("user_referral_balances")
        .select("user_id")
        .eq("referral_code", referralCode)
        .single();

      if (balanceError || !referrerBalance) {
        logger.error("Referral code not found:", { referralCode });
        return false;
      }

      // Crear recompensa para el referidor
      const rewardData: CreateReferralRewardData = {
        referrer_id: referrerBalance.user_id,
        referee_id: newUserId,
        reward_type: "cmpx",
        amount: 100, // Recompensa base
      };

      const reward = await this.createReferralReward(rewardData);
      if (!reward) {
        logger.error("Failed to create referral reward");
        return false;
      }

      // Obtener balance actual
      if (!supabase) {
        logger.error("Supabase no está disponible");
        return false;
      }

      const { data: currentBalanceData, error: balanceError2 } = await supabase
        .from("user_referral_balances")
        .select("total_referrals, total_earned, monthly_earned, cmpx_balance")
        .eq("user_id", referrerBalance.user_id)
        .single();

      if (balanceError2 || !currentBalanceData) {
        logger.error("Error getting current balance:", {
          error: balanceError2?.message || "Unknown error",
        });
        return false;
      }

      // Actualizar balance del referidor
      if (!supabase) {
        logger.error("Supabase no está disponible");
        return false;
      }

      const { error: updateError2 } = await supabase
        .from("user_referral_balances")
        .update({
          total_referrals: (currentBalanceData.total_referrals || 0) + 1,
          total_earned:
            (currentBalanceData.total_earned || 0) + rewardData.amount,
          monthly_earned:
            (currentBalanceData.monthly_earned || 0) + rewardData.amount,
          cmpx_balance:
            (currentBalanceData.cmpx_balance || 0) + rewardData.amount,
        })
        .eq("user_id", referrerBalance.user_id);

      if (updateError2) {
        logger.error("Error updating referral balance:", { error: updateError2.message, details: updateError2.details });
        return false;
      }

      // Confirmar la recompensa
      await this.confirmReferralReward(reward.id);

      logger.info("✅ Referral processed successfully", {
        referralCode,
        newUserId,
      });
      return true;
    } catch (error) {
      logger.error("Error in processReferral:", { error: String(error) });
      return false;
    }
  }
}

export const referralTokensService = new ReferralTokensService();
