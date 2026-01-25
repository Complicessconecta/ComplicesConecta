// Servicio de gestión de billetera y tokens CMPX/GTK
// Fase 2: Módulo de Billetera y Tokens CMPX

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Database, Json } from "@/types/supabase-generated";

export interface WalletBalance {
  userId: string;
  cmpxBalance: number;
  gtkBalance: number;
  cmpxLocked: number;
  gtkLocked: number;
  lastSync: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  transactionType: 'earn' | 'spend' | 'transfer' | 'stake' | 'unstake' | 'reward';
  amount: number;
  tokenType: 'cmpx' | 'gtk';
  balanceAfter: number;
  description?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

type WalletBalancesRow = Database['public']['Tables']['wallet_balances']['Row'];
type TokenTransactionsRow = Database['public']['Tables']['token_transactions']['Row'];

export class WalletService {
  private static instance: WalletService;

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Obtener balance de billetera de un usuario
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const row = data as WalletBalancesRow;
      return {
        userId: row.user_id,
        cmpxBalance: row.cmpx_balance ?? 0,
        gtkBalance: row.gtk_balance ?? 0,
        cmpxLocked: row.cmpx_locked ?? 0,
        gtkLocked: row.gtk_locked ?? 0,
        lastSync: row.last_sync ?? new Date().toISOString(),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error obteniendo balance de billetera:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Crear billetera para un nuevo usuario
   */
  async createWallet(userId: string): Promise<WalletBalance> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .insert({
          user_id: userId,
          cmpx_balance: 0,
          gtk_balance: 0,
          cmpx_locked: 0,
          gtk_locked: 0,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Billetera creada exitosamente:', { userId });

      const row = data as WalletBalancesRow;
      return {
        userId: row.user_id,
        cmpxBalance: row.cmpx_balance ?? 0,
        gtkBalance: row.gtk_balance ?? 0,
        cmpxLocked: row.cmpx_locked ?? 0,
        gtkLocked: row.gtk_locked ?? 0,
        lastSync: row.last_sync ?? new Date().toISOString(),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error creando billetera:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Obtener o crear billetera de un usuario
   */
  async getOrCreateWallet(userId: string): Promise<WalletBalance> {
    try {
      const wallet = await this.getWalletBalance(userId);

      if (wallet) {
        return wallet;
      }

      return await this.createWallet(userId);
    } catch (error) {
      logger.error('Error obteniendo o creando billetera:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Agregar tokens a la billetera de un usuario
   */
  async addTokens(
    userId: string,
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletBalance> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      const balanceField = tokenType === 'cmpx' ? 'cmpx_balance' : 'gtk_balance';
      const currentBalance = tokenType === 'cmpx' ? wallet.cmpxBalance : wallet.gtkBalance;
      const newBalance = currentBalance + amount;

      // Actualizar balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallet_balances')
        .update({ [balanceField]: newBalance, last_sync: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar transacción
      await this.recordTransaction(userId, 'earn', amount, tokenType, newBalance, description, metadata);

      logger.info('Tokens agregados exitosamente:', {
        userId,
        amount,
        tokenType,
        newBalance,
      });

      const row = updatedWallet as WalletBalancesRow;
      return {
        userId: row.user_id,
        cmpxBalance: row.cmpx_balance ?? 0,
        gtkBalance: row.gtk_balance ?? 0,
        cmpxLocked: row.cmpx_locked ?? 0,
        gtkLocked: row.gtk_locked ?? 0,
        lastSync: row.last_sync ?? new Date().toISOString(),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error agregando tokens:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        tokenType,
      });
      throw error;
    }
  }

  /**
   * Deducir tokens de la billetera de un usuario
   */
  async deductTokens(
    userId: string,
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletBalance> {
    try {
      const wallet = await this.getWalletBalance(userId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const balanceField = tokenType === 'cmpx' ? 'cmpx_balance' : 'gtk_balance';
      const currentBalance = tokenType === 'cmpx' ? wallet.cmpxBalance : wallet.gtkBalance;

      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      // Actualizar balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallet_balances')
        .update({ [balanceField]: newBalance, last_sync: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar transacción
      await this.recordTransaction(userId, 'spend', amount, tokenType, newBalance, description, metadata);

      logger.info('Tokens deducidos exitosamente:', {
        userId,
        amount,
        tokenType,
        newBalance,
      });

      const row = updatedWallet as WalletBalancesRow;
      return {
        userId: row.user_id,
        cmpxBalance: row.cmpx_balance ?? 0,
        gtkBalance: row.gtk_balance ?? 0,
        cmpxLocked: row.cmpx_locked ?? 0,
        gtkLocked: row.gtk_locked ?? 0,
        lastSync: row.last_sync ?? new Date().toISOString(),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error deduciendo tokens:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        tokenType,
      });
      throw error;
    }
  }

  /**
   * Registrar una transacción de tokens
   */
  async recordTransaction(
    userId: string,
    transactionType: 'earn' | 'spend' | 'transfer' | 'stake' | 'unstake' | 'reward',
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    balanceAfter: number,
    description?: string,
    metadata?: Record<string, unknown>,
    relatedEntityType?: string,
    relatedEntityId?: string
  ): Promise<void> {
    try {
      const meta: Json = {
        balanceAfter,
        description,
        relatedEntityType,
        relatedEntityId,
        ...(metadata ?? {}),
      };

      const { error } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          transaction_type: transactionType,
          amount,
          token_type: tokenType,
          metadata: meta,
          status: 'completed',
        });

      if (error) throw error;

      logger.debug('Transacción registrada:', {
        userId,
        transactionType,
        amount,
        tokenType,
      });
    } catch (error) {
      logger.error('Error registrando transacción:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        transactionType,
      });
      throw error;
    }
  }

  /**
   * Obtener historial de transacciones de un usuario
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<TokenTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((tx) => {
        const row = tx as TokenTransactionsRow;
        const meta = (row.metadata ?? {}) as Record<string, unknown>;

        const balanceAfter =
          typeof meta.balanceAfter === 'number' ? meta.balanceAfter : 0;

        return {
          id: row.id,
          userId: row.user_id,
          transactionType: row.transaction_type as TokenTransaction['transactionType'],
          amount: row.amount,
          tokenType: row.token_type as TokenTransaction['tokenType'],
          balanceAfter,
          ...(typeof meta.description === 'string' ? { description: meta.description } : {}),
          metadata: meta,
          ...(typeof meta.relatedEntityType === 'string'
            ? { relatedEntityType: meta.relatedEntityType }
            : {}),
          ...(typeof meta.relatedEntityId === 'string'
            ? { relatedEntityId: meta.relatedEntityId }
            : {}),
          createdAt: row.created_at ?? new Date().toISOString(),
        };
      });
    } catch (error) {
      logger.error('Error obteniendo historial de transacciones:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Verificar si un usuario tiene saldo suficiente
   */
  async hasSufficientBalance(
    userId: string,
    amount: number,
    tokenType: 'cmpx' | 'gtk'
  ): Promise<boolean> {
    try {
      const wallet = await this.getWalletBalance(userId);

      if (!wallet) {
        return false;
      }

      const balance = tokenType === 'cmpx' ? wallet.cmpxBalance : wallet.gtkBalance;
      return balance >= amount;
    } catch (error) {
      logger.error('Error verificando saldo suficiente:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        tokenType,
      });
      return false;
    }
  }
}

export const walletService = WalletService.getInstance();
