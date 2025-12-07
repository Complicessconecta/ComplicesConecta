import { logger } from '@/lib/logger';
/**
 * Sistema de Tokens CMPX - ComplicesConecta
 * Gestión de recompensas por referidos y límites mensuales
 */

export interface UserTokenBalance {
  userId: string;
  cmpxBalance: number;
  monthlyEarned: number;
  lastResetDate: string;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
}

export interface ReferralReward {
  id: string;
  inviterId: string;
  invitedId: string;
  amount: number;
  type: 'referral_bonus' | 'welcome_bonus';
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

// Configuración del sistema
export const TOKEN_CONFIG = {
  REFERRAL_REWARD: 50, // CMPX para el invitador
  WELCOME_BONUS: 50,   // CMPX para el invitado
  MONTHLY_LIMIT: 500,  // CMPX máximo por mes
  RESET_DAY: 1,        // Día del mes para reset (1 = primer día)
} as const;

// Mock storage - En producción usar Supabase
const userBalances: Map<string, UserTokenBalance> = new Map();
const rewardHistory: ReferralReward[] = [];

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const ensureDemoMode = () => {
  if (!isDemoMode) {
    logger.error('❌ lib/tokens.ts solo debe usarse en modo demo (VITE_DEMO_MODE=true). Usa TokenService en producción.');
    throw new Error('Tokens mock solo disponible en modo demo');
  }
};

/**
 * Genera código de referido único para usuario
 */
export function generateReferralCode(userId: string): string {
  ensureDemoMode();
  const prefix = 'CMPX';
  const hash = userId.slice(-6).toUpperCase();
  return `${prefix}${hash}`;
}

/**
 * Obtiene balance de tokens del usuario
 */
export function getUserTokenBalance(userId: string): UserTokenBalance {
  ensureDemoMode();
  if (!userBalances.has(userId)) {
    const newBalance: UserTokenBalance = {
      userId,
      cmpxBalance: 0,
      monthlyEarned: 0,
      lastResetDate: new Date().toISOString(),
      referralCode: generateReferralCode(userId),
      totalReferrals: 0
    };
    userBalances.set(userId, newBalance);
  }
  
  const balance = userBalances.get(userId)!;
  
  // Verificar si necesita reset mensual
  const now = new Date();
  const lastReset = new Date(balance.lastResetDate);
  
  if (now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    balance.monthlyEarned = 0;
    balance.lastResetDate = now.toISOString();
    userBalances.set(userId, balance);
  }
  
  return balance;
}

/**
 * Verifica si usuario puede recibir más CMPX este mes
 */
export function canEarnTokens(userId: string, amount: number): boolean {
  ensureDemoMode();
  const balance = getUserTokenBalance(userId);
  return (balance.monthlyEarned + amount) <= TOKEN_CONFIG.MONTHLY_LIMIT;
}

/**
 * Procesa recompensa por referido
 */
export async function processReferralReward(
  inviterCode: string, 
  newUserId: string
): Promise<{ success: boolean; message: string; rewards?: ReferralReward[] }> {
  ensureDemoMode();
  
  // Buscar invitador por código
  const inviter = Array.from(userBalances.values())
    .find(user => user.referralCode === inviterCode);
  
  if (!inviter) {
    return { success: false, message: 'Código de referido inválido' };
  }
  
  // Verificar que no se auto-refiera
  if (inviter.userId === newUserId) {
    return { success: false, message: 'No puedes referirte a ti mismo' };
  }
  
  // Verificar límites mensuales
  if (!canEarnTokens(inviter.userId, TOKEN_CONFIG.REFERRAL_REWARD)) {
    return { 
      success: false, 
      message: `Límite mensual alcanzado (${TOKEN_CONFIG.MONTHLY_LIMIT} CMPX)` 
    };
  }
  
  // Crear balance para nuevo usuario
  const newUserBalance = getUserTokenBalance(newUserId);
  newUserBalance.referredBy = inviter.userId;
  
  // Crear recompensas
  const rewards: ReferralReward[] = [
    {
      id: `ref_${Date.now()}_${inviter.userId}`,
      inviterId: inviter.userId,
      invitedId: newUserId,
      amount: TOKEN_CONFIG.REFERRAL_REWARD,
      type: 'referral_bonus',
      timestamp: new Date().toISOString(),
      status: 'completed'
    },
    {
      id: `wel_${Date.now()}_${newUserId}`,
      inviterId: inviter.userId,
      invitedId: newUserId,
      amount: TOKEN_CONFIG.WELCOME_BONUS,
      type: 'welcome_bonus',
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
  ];
  
  // Aplicar recompensas
  const inviterBalance = getUserTokenBalance(inviter.userId);
  inviterBalance.cmpxBalance += TOKEN_CONFIG.REFERRAL_REWARD;
  inviterBalance.monthlyEarned += TOKEN_CONFIG.REFERRAL_REWARD;
  inviterBalance.totalReferrals += 1;
  
  newUserBalance.cmpxBalance += TOKEN_CONFIG.WELCOME_BONUS;
  // No contar welcome bonus en límite mensual
  
  // Guardar cambios
  userBalances.set(inviter.userId, inviterBalance);
  userBalances.set(newUserId, newUserBalance);
  rewardHistory.push(...rewards);
  
  return {
    success: true,
    message: `¡Recompensas asignadas! ${TOKEN_CONFIG.REFERRAL_REWARD} CMPX para invitador, ${TOKEN_CONFIG.WELCOME_BONUS} CMPX de bienvenida`,
    rewards
  };
}

/**
 * Obtiene historial de recompensas del usuario
 */
export function getUserRewardHistory(userId: string): ReferralReward[] {
  ensureDemoMode();
  return rewardHistory.filter(reward => 
    reward.inviterId === userId || reward.invitedId === userId
  );
}

/**
 * Obtiene estadísticas del sistema de tokens
 */
export function getTokenStats() {
  ensureDemoMode();
  const totalUsers = userBalances.size;
  const totalCMPX = Array.from(userBalances.values())
    .reduce((sum, user) => sum + user.cmpxBalance, 0);
  const totalReferrals = Array.from(userBalances.values())
    .reduce((sum, user) => sum + user.totalReferrals, 0);
  
  return {
    totalUsers,
    totalCMPX,
    totalReferrals,
    totalRewards: rewardHistory.length
  };
}

/**
 * Valida código de referido
 */
export function validateReferralCode(code: string): boolean {
  ensureDemoMode();
  return /^CMPX[A-Z0-9]{6}$/.test(code);
}

/**
 * Mock data para desarrollo
 */
export function initializeMockTokenData() {
  ensureDemoMode();
  // Usuario demo con algunos CMPX
  const demoUser: UserTokenBalance = {
    userId: 'demo-user-1',
    cmpxBalance: 150,
    monthlyEarned: 100,
    lastResetDate: new Date().toISOString(),
    referralCode: 'CMPXDEMO01',
    totalReferrals: 2
  };
  
  userBalances.set('demo-user-1', demoUser);
  
  logger.info('🪙 Sistema de tokens CMPX inicializado');
  logger.info(`📊 Configuración: ${TOKEN_CONFIG.REFERRAL_REWARD} CMPX por referido, límite ${TOKEN_CONFIG.MONTHLY_LIMIT}/mes`);
}
