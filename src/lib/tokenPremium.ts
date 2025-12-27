/**
 * Sistema Premium basado en Tokens CMPX
 * Gestiona acceso a funciones premium usando tokens en lugar de pagos Stripe
 */

// import { getUserTokenBalance } from '@/lib/tokens'; // Eliminado
// Mock function para compatibilidad
const getUserTokenBalance = (userId: string) => ({
  userId,
  cmpxBalance: 0,
  monthlyEarned: 0,
  lastResetDate: new Date().toISOString(),
  referralCode: `CMPX${userId.slice(-6).toUpperCase()}`,
  totalReferrals: 0
});
import { logger } from '@/lib/logger';

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  cost: number; // Costo en CMPX
  duration: number; // Duración en días
  category: 'chat' | 'discovery' | 'events' | 'profile';
  icon: string;
}

export interface UserPremiumAccess {
  userId: string;
  feature: string;
  expiresAt: string;
  purchasedAt: string;
  cost: number;
}

// Configuración de funciones premium con costos en CMPX
export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'premium_chat',
    name: 'Chat Premium',
    description: 'Mensajes ilimitados, confirmación de lectura y funciones avanzadas',
    cost: 100,
    duration: 30,
    category: 'chat',
    icon: '💬'
  },
  {
    id: 'advanced_filters',
    name: 'Filtros Avanzados',
    description: 'Búsquedas más precisas por edad, ubicación, intereses y preferencias',
    cost: 75,
    duration: 30,
    category: 'discovery',
    icon: '🔍'
  },
  {
    id: 'unlimited_likes',
    name: 'Likes Ilimitados',
    description: 'Sin límites en tus conexiones diarias, like a todos los perfiles',
    cost: 50,
    duration: 30,
    category: 'discovery',
    icon: '❤️'
  },
  {
    id: 'vip_events',
    name: 'Eventos VIP',
    description: 'Acceso exclusivo a eventos premium y descuentos especiales',
    cost: 150,
    duration: 30,
    category: 'events',
    icon: '🎉'
  },
  {
    id: 'priority_support',
    name: 'Soporte Prioritario',
    description: 'Atención al cliente 24/7 con respuesta prioritaria',
    cost: 80,
    duration: 30,
    category: 'profile',
    icon: '🚀'
  },
  {
    id: 'profile_boost',
    name: 'Impulso de Perfil',
    description: 'Tu perfil aparece primero en búsquedas y descubrimiento',
    cost: 60,
    duration: 7,
    category: 'profile',
    icon: '⭐'
  }
];

// Mock storage para accesos premium (en producción usar Supabase)
const userPremiumAccess: Map<string, UserPremiumAccess[]> = new Map();

/**
 * Verifica si usuario tiene acceso a función premium
 */
export function hasUserPremiumAccess(userId: string, featureId: string): boolean {
  const userAccess = userPremiumAccess.get(userId) || [];
  const access = userAccess.find(a => a.feature === featureId);
  
  if (!access) return false;
  
  const now = new Date();
  const expiresAt = new Date(access.expiresAt);
  
  return now < expiresAt;
}

/**
 * Compra función premium con tokens CMPX
 */
export function purchasePremiumFeature(
  userId: string, 
  featureId: string
): { success: boolean; message: string; newBalance?: number } {
  
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
  if (!feature) {
    return { success: false, message: 'Función premium no encontrada' };
  }
  
  const userBalance = getUserTokenBalance(userId);
  
  if (userBalance.cmpxBalance < feature.cost) {
    return { 
      success: false, 
      message: `Tokens insuficientes. Necesitas ${feature.cost} CMPX, tienes ${userBalance.cmpxBalance}` 
    };
  }
  
  // Verificar si ya tiene acceso activo
  if (hasUserPremiumAccess(userId, featureId)) {
    return { 
      success: false, 
      message: 'Ya tienes acceso activo a esta función premium' 
    };
  }
  
  // Descontar tokens
  userBalance.cmpxBalance -= feature.cost;
  
  // Agregar acceso premium
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (feature.duration * 24 * 60 * 60 * 1000));
  
  const access: UserPremiumAccess = {
    userId,
    feature: featureId,
    expiresAt: expiresAt.toISOString(),
    purchasedAt: now.toISOString(),
    cost: feature.cost
  };
  
  const currentAccess = userPremiumAccess.get(userId) || [];
  currentAccess.push(access);
  userPremiumAccess.set(userId, currentAccess);
  
  return {
    success: true,
    message: `¡${feature.name} activado por ${feature.duration} días!`,
    newBalance: userBalance.cmpxBalance
  };
}

/**
 * Obtiene todas las funciones premium del usuario
 */
export function getUserPremiumFeatures(userId: string): UserPremiumAccess[] {
  const userAccess = userPremiumAccess.get(userId) || [];
  const now = new Date();
  
  // Filtrar solo accesos activos
  return userAccess.filter(access => {
    const expiresAt = new Date(access.expiresAt);
    return now < expiresAt;
  });
}

/**
 * Obtiene tiempo restante de una función premium
 */
export function getPremiumFeatureTimeLeft(userId: string, featureId: string): number {
  const userAccess = userPremiumAccess.get(userId) || [];
  const access = userAccess.find(a => a.feature === featureId);
  
  if (!access) return 0;
  
  const now = new Date();
  const expiresAt = new Date(access.expiresAt);
  
  if (now >= expiresAt) return 0;
  
  return Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Obtiene estadísticas de uso premium
 */
export function getPremiumStats(userId: string) {
  const activeFeatures = getUserPremiumFeatures(userId);
  const totalSpent = userPremiumAccess.get(userId)?.reduce((sum, access) => sum + access.cost, 0) || 0;
  
  return {
    activeFeatures: activeFeatures.length,
    totalSpent,
    featuresUsed: userPremiumAccess.get(userId)?.length || 0
  };
}

/**
 * Verifica si funciones premium están habilitadas
 */
export function isPremiumEnabled(): boolean {
  // En beta: habilitado con tokens, sin Stripe
  // En producción: habilitado con Stripe + tokens
  return import.meta.env.VITE_APP_PHASE === 'beta' || 
         import.meta.env.VITE_PREMIUM_FEATURES_ENABLED === 'true';
}

/**
 * Obtiene mensaje sobre el sistema premium en beta
 */
export function getPremiumBetaMessage(): string {
  return 'Durante la fase beta, las funciones premium se pueden adquirir únicamente con tokens CMPX. ' +
         'No se requieren pagos con tarjeta. ¡Aprovecha para probar todas las funciones!';
}

/**
 * Mock data para desarrollo
 */
export function initializeMockPremiumData() {
  // Usuario demo con acceso a chat premium
  const demoAccess: UserPremiumAccess = {
    userId: 'demo-user-1',
    feature: 'premium_chat',
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días
    purchasedAt: new Date().toISOString(),
    cost: 100
  };
  
  userPremiumAccess.set('demo-user-1', [demoAccess]);
  
  logger.info('🎯 Premium system initialized');
  logger.info(`💎 Premium enabled: ${isPremiumEnabled()}`);
  logger.info(`🪙 Payment method: ${import.meta.env.VITE_APP_PHASE === 'beta' ? 'CMPX Tokens' : 'Stripe + Tokens'}`);
}

