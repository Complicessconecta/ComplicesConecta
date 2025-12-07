/**
 * TokenService - Servicio unificado de gestión de tokens CMPX/GTK
 * 
 * Centraliza toda la lógica de tokens:
 * - Balances (CMPX y GTK)
 * - Transacciones
 * - Staking
 * - Recompensas
 * - Referidos
 * 
 * Integra:
 * - TokenAnalyticsService (analytics)
 * - ReferralTokensService (referidos)
 * - useTokens hook (estado de React)
 * 
 * @version 3.5.0
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { TokenAnalyticsService } from '@/services/TokenAnalyticsService';
import { referralTokensService } from '@/services/ReferralTokensService';

type UnsafeSupabase = {
  from: (table: string) => any;
};

export interface TokenBalance {
  cmpx: number;
  gtk: number;
  totalValue?: number; // Valor total en USD o moneda fiat
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earn' | 'spend' | 'transfer' | 'reward' | 'stake' | 'unstake';
  token_type: 'cmpx' | 'gtk';
  amount: number;
  balance_after: number;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface StakingRecord {
  id: string;
  user_id: string;
  token_type: 'cmpx' | 'gtk';
  amount: number;
  start_date: string;
  end_date: string;
  reward_percentage?: number;
  reward_claimed?: boolean;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  user_id: string;
  reward_type: 'world_id' | 'referral' | 'daily_login' | 'activity' | 'premium';
  token_type: 'cmpx' | 'gtk';
  amount: number;
  claimed: boolean;
  claimed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ReferralState {
  referralCode: string;
  totalReferrals: number;
  monthlyEarned: number;
  monthlyLimit: number;
}

export interface ProcessReferralResult {
  success: boolean;
  message: string;
}

export interface PremiumAccessInfo {
  featureId: string;
  expiresAt: string;
  purchasedAt: string;
  cost: number;
}

const PREMIUM_FEATURES_CONFIG: Array<{
  id: string;
  cost: number;
  durationDays: number;
}> = [
  { id: 'premium_chat', cost: 100, durationDays: 30 },
  { id: 'advanced_filters', cost: 75, durationDays: 30 },
  { id: 'unlimited_likes', cost: 50, durationDays: 30 },
  { id: 'vip_events', cost: 150, durationDays: 30 },
  { id: 'priority_support', cost: 80, durationDays: 30 },
  { id: 'profile_boost', cost: 60, durationDays: 7 },
];

class TokenService {
  private static instance: TokenService;
  private analyticsService: TokenAnalyticsService;
  private referralService: typeof referralTokensService;

  private constructor() {
    this.analyticsService = TokenAnalyticsService.getInstance();
    this.referralService = referralTokensService;
  }

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Obtiene balance de tokens del usuario
   */
  async getBalance(userId: string): Promise<TokenBalance | null> {
    try {
      logger.info('💰 Obteniendo balance de tokens', { userId: userId.substring(0, 8) + '***' });

      if (!supabase) {
        logger.error('Supabase no está disponible');
        return null;
      }

      const sb = supabase as unknown as UnsafeSupabase;

      const { data, error } = await sb
        .from('user_token_balances')
        .select('cmpx_balance, gtk_balance')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        logger.warn('Balance no encontrado, creando balance inicial', { userId });
        // Crear balance inicial si no existe
        return await this.createInitialBalance(userId);
      }

      return {
        cmpx: data.cmpx_balance || 0,
        gtk: data.gtk_balance || 0
      };
    } catch (error) {
      logger.error('Error obteniendo balance:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Crea balance inicial para usuario nuevo
   */
  private async createInitialBalance(userId: string): Promise<TokenBalance> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return { cmpx: 0, gtk: 0 };
      }

      const initialBalance: TokenBalance = {
        cmpx: 100, // Tokens de bienvenida
        gtk: 0
      };

      const sb = supabase as unknown as UnsafeSupabase;

      const { error } = await sb
        .from('user_token_balances')
        .insert({
          user_id: userId,
          cmpx_balance: initialBalance.cmpx,
          gtk_balance: initialBalance.gtk,
        });

      if (error) {
        logger.error('Error creando balance inicial:', { error: error.message });
      } else {
        logger.info('✅ Balance inicial creado', { userId: userId.substring(0, 8) + '***' });
      }

      return initialBalance;
    } catch (error) {
      logger.error('Error crítico creando balance inicial:', { error: error instanceof Error ? error.message : String(error) });
      return { cmpx: 0, gtk: 0 };
    }
  }

  /**
   * Agrega tokens al balance del usuario
   */
  async addTokens(
    userId: string,
    tokenType: 'cmpx' | 'gtk',
    amount: number,
    transactionType: 'earn' | 'reward',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      logger.info('➕ Agregando tokens', {
        userId: userId.substring(0, 8) + '***',
        tokenType,
        amount,
        transactionType
      });

      // Obtener balance actual
      const balance = await this.getBalance(userId);
      if (!balance) {
        throw new Error('Balance no encontrado');
      }

      const newBalance = tokenType === 'cmpx'
        ? balance.cmpx + amount
        : balance.gtk + amount;

      if (!supabase) {
        logger.error('Supabase no está disponible');
        return false;
      }

      // Actualizar balance
      const updateField = tokenType === 'cmpx' ? 'cmpx_balance' : 'gtk_balance';

      const sb = supabase as unknown as UnsafeSupabase;

      const { error: updateError } = await sb
        .from('user_token_balances')
        .update({ [updateField]: newBalance })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Registrar transacción
      await this.recordTransaction({
        user_id: userId,
        transaction_type: transactionType,
        token_type: tokenType,
        amount,
        balance_after: newBalance,
        description,
        metadata
      });

      logger.info('✅ Tokens agregados exitosamente', {
        userId: userId.substring(0, 8) + '***',
        amount,
        newBalance
      });

      return true;
    } catch (error) {
      logger.error('Error agregando tokens:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Resta tokens del balance (gasto)
   */
  async spendTokens(
    userId: string,
    tokenType: 'cmpx' | 'gtk',
    amount: number,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      logger.info('➖ Gastando tokens', {
        userId: userId.substring(0, 8) + '***',
        tokenType,
        amount
      });

      const balance = await this.getBalance(userId);
      if (!balance) {
        throw new Error('Balance no encontrado');
      }

      const currentBalance = tokenType === 'cmpx' ? balance.cmpx : balance.gtk;
      
      if (currentBalance < amount) {
        logger.warn('Balance insuficiente', {
          userId: userId.substring(0, 8) + '***',
          required: amount,
          available: currentBalance
        });
        return false;
      }

      const newBalance = currentBalance - amount;

      if (!supabase) {
        logger.error('Supabase no está disponible');
        return false;
      }

      // Actualizar balance
      const updateField = tokenType === 'cmpx' ? 'cmpx_balance' : 'gtk_balance';
      const sb = supabase as unknown as UnsafeSupabase;

      const { error: updateError } = await sb
        .from('user_token_balances')
        .update({ [updateField]: newBalance })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Registrar transacción
      await this.recordTransaction({
        user_id: userId,
        transaction_type: 'spend',
        token_type: tokenType,
        amount: -amount,
        balance_after: newBalance,
        description,
        metadata
      });

      logger.info('✅ Tokens gastados exitosamente', {
        userId: userId.substring(0, 8) + '***',
        amount,
        newBalance
      });

      return true;
    } catch (error) {
      logger.error('Error gastando tokens:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Registra una transacción
   */
  private async recordTransaction(data: {
    user_id: string;
    transaction_type: TokenTransaction['transaction_type'];
    token_type: 'cmpx' | 'gtk';
    amount: number;
    balance_after: number;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return;
      }

      const sb = supabase as unknown as UnsafeSupabase;

      await sb
        .from('token_transactions')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      logger.error('Error registrando transacción:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Obtiene historial de transacciones
   */
  async getTransactions(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      tokenType?: 'cmpx' | 'gtk';
      transactionType?: TokenTransaction['transaction_type'];
    }
  ): Promise<TokenTransaction[]> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return [];
      }

      const sb = supabase as unknown as UnsafeSupabase;

      let query = sb
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.tokenType) {
        query = query.eq('token_type', options.tokenType);
      }

      if (options?.transactionType) {
        query = query.eq('transaction_type', options.transactionType);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as TokenTransaction[];
    } catch (error) {
      logger.error('Error obteniendo transacciones:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Inicia staking de tokens
   */
  async startStaking(
    userId: string,
    tokenType: 'cmpx' | 'gtk',
    amount: number,
    durationDays: number
  ): Promise<StakingRecord | null> {
    try {
      logger.info('🔒 Iniciando staking', {
        userId: userId.substring(0, 8) + '***',
        tokenType,
        amount,
        durationDays
      });

      // Verificar balance
      const balance = await this.getBalance(userId);
      if (!balance) {
        throw new Error('Balance no encontrado');
      }

      const currentBalance = tokenType === 'cmpx' ? balance.cmpx : balance.gtk;
      if (currentBalance < amount) {
        throw new Error('Balance insuficiente para staking');
      }

      // Restar tokens del balance (bloquear)
      await this.spendTokens(userId, tokenType, amount, 'Staking - Tokens bloqueados', {
        staking_duration: durationDays
      });

      // Crear registro de staking
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      
      // Calcular APY según tipo de token
      const apy = tokenType === 'cmpx' ? 8.0 : 12.5;
      
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return null;
      }

      const sb = supabase as unknown as UnsafeSupabase;

      const { data, error } = await sb
        .from('staking_records')
        .insert({
          user_id: userId,
          token_type: tokenType,
          amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reward_percentage: apy,
          reward_claimed: false,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('✅ Staking iniciado exitosamente', {
        userId: userId.substring(0, 8) + '***',
        stakingId: data.id
      });

      return data as StakingRecord;
    } catch (error) {
      logger.error('Error iniciando staking:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Completa staking y libera tokens + recompensas
   */
  async completeStaking(stakingId: string, userId: string): Promise<boolean> {
    try {
      logger.info('✅ Completando staking', { stakingId, userId: userId.substring(0, 8) + '***' });

      if (!supabase) {
        logger.error('Supabase no está disponible');
        return false;
      }

      // Obtener registro de staking
      const sb = supabase as unknown as UnsafeSupabase;

      const { data: stakingRaw, error: fetchError } = await sb
        .from('staking_records')
        .select('*')
        .eq('id', stakingId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (fetchError || !stakingRaw) {
        throw new Error('Staking no encontrado');
      }

      const staking = stakingRaw as {
        start_date: string;
        end_date: string | null;
        apy?: number;
        amount: number;
        token_type: 'cmpx' | 'gtk';
      };

      // Calcular recompensas basado en duración y APY
      const startDate = new Date(staking.start_date);
      const endDate = staking.end_date ? new Date(staking.end_date) : null;
      const now = new Date();
      // Si end_date es null, usar fecha actual; si existe pero es futura, usar fecha actual
      const actualEndDate = endDate && endDate > now ? now : (endDate || now);
      // Calcular días staked: siempre calcular desde startDate hasta actualEndDate
      const daysStaked = Math.max(0, Math.floor((actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const apy = staking.apy || 10.0;
      const dailyRate = apy / 365 / 100;
      const rewardsEarned = Math.floor(staking.amount * dailyRate * daysStaked);

      // Actualizar staking como completado
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return false;
      }
      
      await sb
        .from('staking_records')
        .update({
          status: 'completed',
          reward_claimed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stakingId);

      // Agregar tokens de vuelta + recompensas
      await this.addTokens(userId, staking.token_type as 'cmpx' | 'gtk', staking.amount, 'reward', 'Staking completado - Tokens liberados');
      if (rewardsEarned > 0) {
        await this.addTokens(userId, staking.token_type as 'cmpx' | 'gtk', rewardsEarned, 'reward', 'Recompensas de staking');
      }

      logger.info('✅ Staking completado exitosamente', {
        stakingId,
        rewardsEarned
      });

      return true;
    } catch (error) {
      logger.error('Error completando staking:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Obtiene analytics de tokens
   */
  async getAnalytics(userId: string, _period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.analyticsService.generateCurrentMetrics();
  }

  /**
   * Obtiene servicio de referidos
   */
  getReferralService() {
    return this.referralService;
  }

  /**
   * API de alto nivel: estado de referidos de un usuario
   * Delegado a ReferralTokensService (Supabase)
   */
  async getReferralState(userId: string): Promise<ReferralState | null> {
    try {
      const balance = await this.referralService.getUserReferralBalance(userId);
      if (!balance) {
        return null;
      }

      // Límite mensual actual: mantener en línea con TOKEN_CONFIG de lib/tokens (500 CMPX)
      const MONTHLY_LIMIT = 500;

      return {
        referralCode: balance.referral_code,
        totalReferrals: balance.total_referrals,
        monthlyEarned: balance.monthly_earned,
        monthlyLimit: MONTHLY_LIMIT,
      };
    } catch (error) {
      logger.error('Error obteniendo estado de referidos:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * API de alto nivel: procesar un código de referido para un nuevo usuario
   * Usa ReferralTokensService.processReferral que ya escribe en Supabase
   */
  async processReferralReward(inviterCode: string, newUserId: string): Promise<ProcessReferralResult> {
    try {
      const ok = await this.referralService.processReferral(inviterCode, newUserId);

      if (!ok) {
        return {
          success: false,
          message: 'No se pudo procesar el código de referido. Verifica el código o inténtalo más tarde.',
        };
      }

      return {
        success: true,
        message: 'Recompensa de referido procesada correctamente.',
      };
    } catch (error) {
      logger.error('Error procesando recompensa de referido via TokenService:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        message: 'Error interno al procesar el código de referido.',
      };
    }
  }

  /**
   * API de alto nivel: acceso premium del usuario
   * Integrado a tabla premium_access en Supabase.
   */
  async getPremiumAccess(userId: string): Promise<PremiumAccessInfo[]> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return [];
      }

      const sb = supabase as unknown as UnsafeSupabase;

      const { data, error } = await sb
        .from('premium_access')
        .select('feature_id, expires_at, purchased_at, cost')
        .eq('user_id', userId)
        .order('expires_at', { ascending: false });

      if (error || !data) {
        if (error) {
          logger.error('Error obteniendo premium_access:', { error: error.message ?? String(error) });
        }
        return [];
      }

      return (data as Array<{ feature_id: string; expires_at: string; purchased_at: string; cost: number }>).map(
        (row) => ({
          featureId: row.feature_id,
          expiresAt: row.expires_at,
          purchasedAt: row.purchased_at,
          cost: row.cost,
        }),
      );
    } catch (error) {
      logger.error('Error en getPremiumAccess:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * API de alto nivel: comprar feature premium usando tokens
   * Integra balance CMPX + tabla premium_access.
   */
  async purchasePremiumFeature(
    userId: string,
    featureId: string
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return { success: false, message: 'Supabase no está disponible. Inténtalo más tarde.' };
      }

      const feature = PREMIUM_FEATURES_CONFIG.find((f) => f.id === featureId);
      if (!feature) {
        return { success: false, message: 'Función premium no encontrada.' };
      }

      const sb = supabase as unknown as UnsafeSupabase;

      // Verificar si ya tiene acceso activo
      const now = new Date();
      const { data: existing, error: existingError } = await sb
        .from('premium_access')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('feature_id', featureId)
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (!existingError && existing && existing.expires_at) {
        const expiresAt = new Date(existing.expires_at as string);
        if (expiresAt > now) {
          return {
            success: false,
            message: 'Ya tienes acceso activo a esta función premium.',
          };
        }
      }

      // Verificar balance CMPX
      const balance = await this.getBalance(userId);
      if (!balance) {
        return { success: false, message: 'No se pudo obtener tu balance de tokens.' };
      }

      if (balance.cmpx < feature.cost) {
        return {
          success: false,
          message: `Tokens insuficientes. Necesitas ${feature.cost} CMPX, tienes ${balance.cmpx}.`,
        };
      }

      // Cobrar tokens usando lógica existente
      const spent = await this.spendTokens(userId, 'cmpx', feature.cost, `Compra premium: ${featureId}`, {
        feature_id: featureId,
      });

      if (!spent) {
        return { success: false, message: 'No se pudo completar el cobro de tokens.' };
      }

      const expiresAtDate = new Date(now.getTime() + feature.durationDays * 24 * 60 * 60 * 1000);

      const { error: insertError } = await sb
        .from('premium_access')
        .insert({
          user_id: userId,
          feature_id: featureId,
          expires_at: expiresAtDate.toISOString(),
          purchased_at: now.toISOString(),
          cost: feature.cost,
        });

      if (insertError) {
        logger.error('Error insertando premium_access:', { error: insertError.message ?? String(insertError) });
        return { success: false, message: 'Error al guardar tu acceso premium.' };
      }

      const newBalance = balance.cmpx - feature.cost;

      return {
        success: true,
        message: `¡Acceso premium ${featureId} activado por ${feature.durationDays} días!`,
        newBalance,
      };
    } catch (error) {
      logger.error('Error en purchasePremiumFeature:', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: 'Error interno al procesar tu compra premium.',
      };
    }
  }
}

// Exportar instancia singleton
export const tokenService = TokenService.getInstance();

// Exportar también como clase para testing
export { TokenService };

