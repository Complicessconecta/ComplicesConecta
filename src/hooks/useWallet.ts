// Hook personalizado para gestión de billetera de tokens
// Fase 2: Módulo de Billetera y Tokens CMPX

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { walletService, WalletBalance, TokenTransaction } from '@/services/wallet/WalletService';

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar balance de billetera
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadWallet();
  }, [user?.id]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setWallet(null);
        return;
      }

      const walletData = await walletService.getOrCreateWallet(user.id);
      setWallet(walletData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar billetera';
      setError(errorMsg);
      console.error('Error loading wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de transacciones
  const loadTransactions = async (limit: number = 50) => {
    try {
      if (!user?.id) {
        setTransactions([]);
        return;
      }

      const txHistory = await walletService.getTransactionHistory(user.id, limit);
      setTransactions(txHistory);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  // Agregar tokens
  const addTokens = async (
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    description?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const updatedWallet = await walletService.addTokens(
        user.id,
        amount,
        tokenType,
        description,
        metadata
      );

      setWallet(updatedWallet);
      await loadTransactions();

      return updatedWallet;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al agregar tokens';
      setError(errorMsg);
      throw err;
    }
  };

  // Deducir tokens
  const deductTokens = async (
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    description?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const updatedWallet = await walletService.deductTokens(
        user.id,
        amount,
        tokenType,
        description,
        metadata
      );

      setWallet(updatedWallet);
      await loadTransactions();

      return updatedWallet;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al deducir tokens';
      setError(errorMsg);
      throw err;
    }
  };

  // Verificar saldo suficiente
  const hasSufficientBalance = async (
    amount: number,
    tokenType: 'cmpx' | 'gtk'
  ): Promise<boolean> => {
    try {
      if (!user?.id) {
        return false;
      }

      return await walletService.hasSufficientBalance(user.id, amount, tokenType);
    } catch (err) {
      console.error('Error checking balance:', err);
      return false;
    }
  };

  // Refrescar datos de billetera
  const refresh = () => {
    loadWallet();
    loadTransactions();
  };

  return {
    wallet,
    transactions,
    loading,
    error,
    addTokens,
    deductTokens,
    hasSufficientBalance,
    loadTransactions,
    refresh,
  };
}
