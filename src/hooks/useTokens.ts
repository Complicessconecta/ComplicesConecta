/**
 * Hook useTokens() - Sistema de Tokens CMPX/GTK para fase Beta
 * Gestión completa de balances, transacciones, staking y recompensas
 * NOTA: Mock temporal hasta implementar tablas de tokens en BD
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { validateStaking } from '@/lib/zod-schemas';
import { isDemoMode, shouldUseRealSupabase, getAppConfig } from '@/lib/app-config';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { TokenService, type TokenTransaction as ServiceTokenTransaction } from '@/services/TokenService';

// Interfaces simplificadas para demo vs real
export interface TokenBalance {
  cmpx: number;
  gtk: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'reward' | 'staking' | 'referral' | 'purchase';
  token_type: 'cmpx' | 'gtk';
  amount: number;
  description: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface StakingRecord {
  id: string;
  user_id: string;
  token_type: 'cmpx' | 'gtk';
  amount: number;
  start_date: string;
  end_date: string;
  apy: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Reward {
  id: string;
  user_id: string;
  type: 'daily_login' | 'profile_completion' | 'referral' | 'world_id';
  token_type: 'cmpx' | 'gtk';
  amount: number;
  description: string;
  claimed: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface TokenStats {
  totalUsers: number;
  totalCMPX: number;
  totalGTK: number;
  totalStaked: number;
  totalTransactions: number;
}

export const useTokens = () => {
  const { user, isDemo, appMode: _appMode } = useAuth();
  const [balance, setBalance] = useState<TokenBalance>({ cmpx: 0, gtk: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stakingRecords, setStakingRecords] = useState<StakingRecord[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const config = getAppConfig();

  const tokenService = TokenService.getInstance();

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      loadTokenData();
    }
  }, [user?.id]);

  const loadTokenData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      logger.info(' Cargando datos de tokens', { mode: config.mode, demo: isDemo() });
      
      // Si es demo o no debemos usar Supabase real, usar datos mock
      if (isDemoMode()) {
        logger.info(' Cargando datos de tokens demo', { user: user.email });
        
        // Balance demo basado en el tipo de usuario
        let demoBalance: TokenBalance = { cmpx: 1250, gtk: 850 };
        
        // Ajustar balance según el usuario demo
        if (user.email?.includes('couple')) {
          demoBalance = { cmpx: 2000, gtk: 1500 };
        } else if (user.email?.includes('premium')) {
          demoBalance = { cmpx: 5000, gtk: 3000 };
        }
        
        // Intentar obtener balance personalizado del localStorage
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.accountType === 'couple') {
              demoBalance = { cmpx: 2000, gtk: 1500 };
            }
          } catch {
            logger.warn('Error parsing demo user for balance');
          }
        }
        
        setBalance(demoBalance);
        setLoading(false);
        
        // Transacciones demo
        const mockTransactions: Transaction[] = [
          {
            id: 'demo-tx-1',
            user_id: user.id,
            type: 'reward',
            token_type: 'cmpx',
            amount: 100,
            description: 'Recompensa por actividad diaria',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'completed'
          },
          {
            id: 'demo-tx-2',
            user_id: user.id,
            type: 'staking',
            token_type: 'gtk',
            amount: 50,
            description: 'Staking de tokens GTK',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed'
          },
          {
            id: 'demo-tx-3',
            user_id: user.id,
            type: 'referral',
            token_type: 'cmpx',
            amount: 25,
            description: 'Bonificación por referido',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            status: 'completed'
          }
        ];
        setTransactions(mockTransactions);
        
        // Registros de staking demo
        const mockStaking: StakingRecord[] = [
          {
            id: 'demo-stake-1',
            user_id: user.id,
            token_type: 'gtk',
            amount: 500,
            start_date: new Date(Date.now() - 604800000).toISOString(),
            end_date: new Date(Date.now() + 2419200000).toISOString(),
            apy: 12.5,
            status: 'active',
            created_at: new Date(Date.now() - 604800000).toISOString()
          }
        ];
        setStakingRecords(mockStaking);
        
        // Recompensas demo
        const mockRewards: Reward[] = [
          {
            id: 'demo-reward-1',
            user_id: user.id,
            type: 'daily_login',
            token_type: 'cmpx',
            amount: 10,
            description: 'Recompensa diaria por login',
            claimed: false,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-reward-2',
            user_id: user.id,
            type: 'profile_completion',
            token_type: 'gtk',
            amount: 25,
            description: 'Completar perfil al 100%',
            claimed: true,
            expires_at: null,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setRewards(mockRewards);
        
        logger.info(' Datos de tokens demo cargados - Balance:', demoBalance);
      } else {
        // Cargar datos reales desde Supabase usando TokenService
        logger.info(' Cargando datos de tokens reales desde Supabase (TokenService)...');
        
        try {
          const [realBalance, realTransactions] = await Promise.all([
            tokenService.getBalance(user.id),
            tokenService.getTransactions(user.id, { limit: 20 })
          ]);

          const mappedBalance: TokenBalance = {
            cmpx: realBalance?.cmpx ?? 0,
            gtk: realBalance?.gtk ?? 0
          };

          const mappedTransactions: Transaction[] = (realTransactions || []).map((tx: ServiceTokenTransaction) => ({
            id: tx.id,
            user_id: tx.user_id,
            type: mapTransactionType(tx.transaction_type),
            token_type: tx.token_type,
            amount: tx.amount,
            description: tx.description || '',
            created_at: tx.created_at,
            status: 'completed'
          }));

          setBalance(mappedBalance);
          setTransactions(mappedTransactions);
          setStakingRecords([]);
          setRewards([]);
          
          logger.info(' Datos reales cargados desde user_token_balances/token_transactions', { cmpx: mappedBalance.cmpx, gtk: mappedBalance.gtk });
        } catch (error) {
          logger.error(' Error cargando datos reales:', { error });
          // Fallback a datos vacíos
          setBalance({ cmpx: 0, gtk: 0 });
          setTransactions([]);
          setStakingRecords([]);
          setRewards([]);
        }
      }
    } catch (error) {
      logger.error(' Error cargando datos de tokens:', { error });
    } finally {
      setLoading(false);
    }
  };

  // Procesar referido
  const processReferral = async (referredUserId: string) => {
    if (!user) return false;
    
    if (isDemo() || !shouldUseRealSupabase()) {
      logger.info(' Simulando procesamiento de referido en modo demo');
      // Simular recompensa por referido
      const newTransaction: Transaction = {
        id: `demo-ref-${Date.now()}`,
        user_id: user.id,
        type: 'referral',
        token_type: 'cmpx',
        amount: 50,
        description: `Bonificación por referir usuario`,
        created_at: new Date().toISOString(),
        status: 'completed'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      setBalance(prev => ({ ...prev, cmpx: prev.cmpx + 50 }));
      logger.info(' Referido procesado en demo - +50 CMPX');
      return true;
    }
    
    try {
      logger.info(' Procesando referido real:', { referredUserId });
      // TODO: Implementar lógica real de referidos con Supabase Edge Functions
      logger.info(' Procesamiento de referidos reales no implementado aún');
      return false;
    } catch (error) {
      logger.error(' Error procesando referido:', { error });
      return false;
    }
  };

  // Hacer staking
  const stakeTokens = async (tokenType: 'cmpx' | 'gtk', amount: number, duration: number) => {
    if (!user) return false;
    
    if (isDemo() || !shouldUseRealSupabase()) {
      logger.info(' Simulando staking en modo demo:', { tokenType, amount, duration });
      
      // Verificar balance suficiente
      if (balance[tokenType] < amount) {
        throw new Error('Balance insuficiente para staking');
      }
      
      // Crear registro de staking
      const newStaking: StakingRecord = {
        id: `demo-stake-${Date.now()}`,
        user_id: user.id,
        token_type: tokenType,
        amount,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
        apy: tokenType === 'gtk' ? 12.5 : 8.0,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setStakingRecords(prev => [newStaking, ...prev]);
      setBalance(prev => ({ ...prev, [tokenType]: prev[tokenType] - amount }));
      
      logger.info(' Staking procesado en demo:', { tokenType, amount, duration });
      return true;
    }
    
    try {
      logger.info(' Procesando staking real:', { tokenType, amount, duration });
      // Validar datos con Zod antes de enviar
      const stakingData = validateStaking({
        userId: user.id,
        amount,
        duration,
        tokenType
      });
      
      // Usar función de Supabase para staking (tabla staking_records)
      const { data: _data, error } = await (supabase as any).rpc('start_staking', {
        user_id_param: stakingData.userId,
        amount_param: stakingData.amount,
        duration_days: stakingData.duration,
        token_type_param: stakingData.tokenType
      });
      
      if (error) {
        logger.error('❌ Error en staking:', { error });
        return false;
      }
      
      logger.info('✅ Staking procesado en real:', { tokenType, amount, duration });
      return true;
    } catch (error) {
      logger.error('❌ Error en staking:', { error });
      return false;
    }
  };

  // Reclamar recompensa
  const claimReward = async (rewardId: string) => {
    if (!user) return false;
    
    if (isDemo() || !shouldUseRealSupabase()) {
      logger.info('🎭 Reclamando recompensa en modo demo:', { rewardId });
      
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward || reward.claimed) {
        logger.info('❌ Recompensa no encontrada o ya reclamada');
        return false;
      }
      
      // Marcar como reclamada
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, claimed: true } : r
      ));
      
      // Añadir al balance
      setBalance(prev => ({
        ...prev,
        [reward.token_type]: prev[reward.token_type] + reward.amount
      }));
      
      // Añadir transacción
      const newTransaction: Transaction = {
        id: `demo-claim-${Date.now()}`,
        user_id: user.id,
        type: 'reward',
        token_type: reward.token_type,
        amount: reward.amount,
        description: `Recompensa reclamada: ${reward.description}`,
        created_at: new Date().toISOString(),
        status: 'completed'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      logger.info('✅ Recompensa reclamada en demo:', { amount: reward.amount, tokenType: reward.token_type });
      return true;
    }
    
    try {
      logger.info('🔗 Reclamando recompensa real:', { rewardId });
      logger.info('ℹ️ Reclamo de recompensas reales no implementado aún');
      return false;
    } catch (error) {
      logger.error('❌ Error reclamando recompensa:', { error });
      return false;
    }
  };

  // Refrescar datos
  const refreshTokenData = useCallback(async () => {
    logger.info('🔄 Refrescando datos de tokens', { mode: config.mode });
    setLoading(true);
    await loadTokenData();
    
    // Mostrar feedback visual al usuario
    if (typeof window !== 'undefined') {
      // Crear notificación temporal
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.textContent = '✅ Balance actualizado correctamente';
      document.body.appendChild(notification as Node);
      
      // Remover después de 3 segundos
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification as Node);
          }
        }, 300);
      }, 3000);
    }
  }, [config.mode, loadTokenData]);




  // Helper functions for the Tokens page
  const getBalanceMessage = () => {
    if (!balance) return "Balance no disponible en este momento.";
    return `Tienes ${balance.cmpx} tokens CMPX y ${balance.gtk} tokens GTK. Los tokens CMPX se pueden usar para funciones premium durante la fase Beta.`;
  };

  const getStakingMessage = () => {
    return "El staking te permite bloquear tus tokens por un período determinado y recibir recompensas. Durante la fase Beta, puedes hacer staking de tokens CMPX y GTK con un APY del 15-35% según la duración del staking.";
  };

  const refreshTokens = () => {
    refreshTokenData();
  };

  // Funciones adicionales requeridas por los componentes
  const startStaking = async (amount: number) => {
    return await stakeTokens('cmpx', amount, 30);
  };

  const completeStaking = async (stakingId: string) => {
    if (!user) return false;
    
    if (isDemo() || !shouldUseRealSupabase()) {
      logger.info('🎭 Completando staking en modo demo:', { stakingId });
      
      // Encontrar el staking record
      const staking = stakingRecords.find(s => s.id === stakingId);
      if (!staking) return false;
      
      // Calcular recompensa
      const reward = staking.amount * (staking.apy / 100) * (30 / 365); // Recompensa por 30 días
      
      // Actualizar balance y records
      setBalance(prev => ({ 
        ...prev, 
        [staking.token_type]: prev[staking.token_type] + staking.amount + reward 
      }));
      
      setStakingRecords(prev => 
        prev.map(s => s.id === stakingId ? { ...s, status: 'completed' } : s)
      );
      
      logger.info('✅ Staking completado en demo:', { stakingId, reward });
      return true;
    }
    
    try {
      logger.info('🔗 Completando staking real:', { stakingId });
      logger.info('ℹ️ Completar staking real no implementado aún');
      return false;
    } catch (error) {
      logger.error('❌ Error completando staking:', { error });
      return false;
    }
  };

  const claimWorldIdReward = async () => {
    logger.info('🌍 Reclamando recompensa World ID');
    // Mock implementation for demo
    if (isDemo()) {
      const worldIdReward: Reward = {
        id: `world-id-${Date.now()}`,
        user_id: user?.id || '',
        type: 'world_id',
        token_type: 'cmpx',
        amount: 500,
        description: 'Recompensa por verificación World ID',
        claimed: false,
        expires_at: null,
        created_at: new Date().toISOString()
      };
      setRewards(prev => [worldIdReward, ...prev]);
      return true;
    }
    return false;
  };

  // Propiedades computadas
  const pendingRewards = rewards.filter(r => !r.claimed);
  const hasPendingRewards = pendingRewards.length > 0;
  const hasActiveStaking = stakingRecords.some(s => s.status === 'active');
  const isWorldIdEligible = true; // Mock for demo
  const error = null; // Mock for demo

  // Balance con propiedades específicas
  const enhancedBalance = {
    balance: {
      cmpxBalance: balance.cmpx,
      cmpxStaked: balance.cmpx * 0.3, // 30% staked demo
      gtkBalance: balance.gtk,
      gtkStaked: balance.gtk * 0.2, // 20% staked demo
      cmpx: balance.cmpx,
      gtk: balance.gtk,
      monthlyEarned: balance.cmpx * 0.05, // 5% monthly earnings demo
      monthlyRemaining: 1000 - (balance.cmpx * 0.05), // Monthly limit demo
      monthlyLimit: 1000,
      totalReferrals: 3, // Demo referrals
      referralCode: `REF${user?.id || 'DEMO'}`
    }
  };

  return {
    // Estados
    balance: enhancedBalance.balance,
    transactions,
    stakingRecords,
    rewards,
    loading,
    error,

    // Propiedades computadas
    pendingRewards,
    hasPendingRewards,
    hasActiveStaking,
    isWorldIdEligible,

    // Acciones
    refreshTokenData,
    refreshTokens,
    processReferral,
    stakeTokens,
    startStaking,
    completeStaking,
    claimReward,
    claimWorldIdReward,
    loadTokenData,

    // Helper functions for UI
    getBalanceMessage,
    getStakingMessage,

    // Utilidades
    totalBalance: balance.cmpx + balance.gtk,
    availableRewards: rewards.filter(r => !r.claimed).length,
    activeStakings: stakingRecords.filter(s => s.status === 'active').length,
    
    // Información del modo
    isDemo: isDemo(),
    appMode: config.mode
  };
};
