import { logger } from "@/lib/logger";
/**
 * Sistema de control de funciones por fase
 * Gestiona qué funcionalidades están disponibles según la fase actual
 */

export type AppPhase = "beta" | "premium" | "vip";

export interface FeatureFlags {
  // Funciones básicas (siempre disponibles)
  chat: boolean;
  profiles: boolean;
  discover: boolean;
  matches: boolean;
  requests: boolean;

  // Sistema de tokens (beta)
  tokens: boolean;
  referrals: boolean;

  // Funciones premium (deshabilitadías en beta)
  premiumChat: boolean;
  vipEvents: boolean;
  prioritySupport: boolean;
  advancedFilters: boolean;
  unlimitedLikes: boolean;
  readReceipts: boolean;

  // Funciones VIP (futuro)
  exclusiveEvents: boolean;
  personalConcierge: boolean;
  customBadges: boolean;
}

// Configuración por fase
const PHASE_FEATURES: Record<AppPhase, FeatureFlags> = {
  beta: {
    // Básicas
    chat: true,
    profiles: true,
    discover: true,
    matches: true,
    requests: true,

    // Tokens
    tokens: true,
    referrals: true,

    // Premium (HABILITAdías EN BETA - Solo con tokens, sin Stripe)
    premiumChat: true,
    vipEvents: true,
    prioritySupport: true,
    advancedFilters: true,
    unlimitedLikes: true,
    readReceipts: true,

    // VIP (DESHABILITAdías)
    exclusiveEvents: false,
    personalConcierge: false,
    customBadges: false,
  },

  premium: {
    // Básicas
    chat: true,
    profiles: true,
    discover: true,
    matches: true,
    requests: true,

    // Tokens
    tokens: true,
    referrals: true,

    // Premium (HABILITAdías)
    premiumChat: true,
    vipEvents: true,
    prioritySupport: true,
    advancedFilters: true,
    unlimitedLikes: true,
    readReceipts: true,

    // VIP (DESHABILITAdías)
    exclusiveEvents: false,
    personalConcierge: false,
    customBadges: false,
  },

  vip: {
    // Todías habilitadías
    chat: true,
    profiles: true,
    discover: true,
    matches: true,
    requests: true,
    tokens: true,
    referrals: true,
    premiumChat: true,
    vipEvents: true,
    prioritySupport: true,
    advancedFilters: true,
    unlimitedLikes: true,
    readReceipts: true,
    exclusiveEvents: true,
    personalConcierge: true,
    customBadges: true,
  },
};

/**
 * Obtiene la fase actual de la aplicación
 */
export function getCurrentPhase(): AppPhase {
  const phase = import.meta.env.VITE_APP_PHASE as AppPhase;
  return phase || "beta";
}

/**
 * Obtiene las funciones disponibles para la fase actual
 */
export function getFeatureFlags(): FeatureFlags {
  const currentPhase = getCurrentPhase();
  return PHASE_FEATURES[currentPhase];
}

/**
 * Verifica si una función específica está habilitada
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const features = getFeatureFlags();
  return features[feature];
}

/**
 * Hook personalizado para usar funciones
 */
export function useFeatures() {
  const features = getFeatureFlags();
  const currentPhase = getCurrentPhase();

  return {
    features,
    currentPhase,
    isFeatureEnabled,
    premiumFeatures: {
      enabled: true, // Always enabled during beta
      stripeEnabled: false, // Disabled during beta
      tokenPurchaseEnabled: true, // Token-based purchases enabled
    },
    isBeta: currentPhase === "beta",
    isPremium: currentPhase === "premium",
    isVip: currentPhase === "vip",
  };
}

/**
 * Obtiene mensaje explicativo para funciones deshabilitadías
 */
export function getFeatureDisabledMessage(
  _feature: keyof FeatureFlags,
): string {
  const currentPhase = getCurrentPhase();

  const messages: Record<AppPhase, string> = {
    beta: "Esta función estará disponible después de la fase beta. ¡Mantente atento!",
    premium:
      "Esta función requiere membresía VIP. Actualiza tu cuenta para acceder.",
    vip: "Función no disponible en este momento.",
  };

  return messages[currentPhase];
}

/**
 * Lista de funciones premium para mostrar en UI
 */
export const PREMIUM_FEATURES_LIST = [
  {
    name: "Chat Premium",
    description: "Mensajes ilimitados y funciones avanzadías",
    icon: "💬",
    key: "premiumChat" as keyof FeatureFlags,
  },
  {
    name: "Eventos VIP",
    description: "Acceso exclusivo a eventos premium",
    icon: "🎉",
    key: "vipEvents" as keyof FeatureFlags,
  },
  {
    name: "Soporte Prioritario",
    description: "Atención al cliente 24/7 prioritaria",
    icon: "🚀",
    key: "prioritySupport" as keyof FeatureFlags,
  },
  {
    name: "Filtros Avanzados",
    description: "Búsquedías más precisas y detalladías",
    icon: "🔍",
    key: "advancedFilters" as keyof FeatureFlags,
  },
  {
    name: "Likes Ilimitados",
    description: "Sin límites en tus conexiones diarias",
    icon: "❤️",
    key: "unlimitedLikes" as keyof FeatureFlags,
  },
  {
    name: "Confirmación de Lectura",
    description: "Sabe cuándo leen tus mensajes",
    icon: "✓",
    key: "readReceipts" as keyof FeatureFlags,
  },
];

logger.info(`🎯 Features initialized for phase: ${getCurrentPhase()}`);
logger.info(`🪙 Tokens enabled: ${isFeatureEnabled("tokens")}`);
logger.info(
  `👑 Premium features: ${isFeatureEnabled("premiumChat") ? "enabled" : "disabled"}`,
);

