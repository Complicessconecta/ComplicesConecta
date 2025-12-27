/**
 * ConfiguraciÃ³n para separar lÃ³gica demo y producciÃ³n
 * MÃ³dulo dedicado para gestionar el comportamiento segÃºn el entorno
 */

import { logger } from '@/lib/logger';

// Tipos para configuraciÃ³n
export interface DemoConfig {
  enabled: boolean;
  profiles: any[];
  mockData: boolean;
  skipValidations: boolean;
}

export interface ProductionConfig {
  enabled: boolean;
  supabaseUrl: string;
  requireAuth: boolean;
  strictValidations: boolean;
}

export interface AppMode {
  isDemo: boolean;
  isProduction: boolean;
  current: 'demo' | 'production';
}

// ConfiguraciÃ³n demo
export const demoConfig: DemoConfig = {
  enabled: import.meta.env.VITE_APP_MODE === 'demo',
  profiles: [], // Se cargarÃ¡n desde mock data
  mockData: true,
  skipValidations: false // Mantener validaciones incluso en demo
};

// ConfiguraciÃ³n producciÃ³n
export const productionConfig: ProductionConfig = {
  enabled: import.meta.env.VITE_APP_MODE === 'production' || import.meta.env.VITE_APP_MODE !== 'demo',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  requireAuth: true,
  strictValidations: true
};

// Modo actual de la aplicaciÃ³n
export const appMode: AppMode = {
  isDemo: demoConfig.enabled,
  isProduction: productionConfig.enabled,
  current: demoConfig.enabled ? 'demo' : 'production'
};

/**
 * Determina si se debe usar datos demo o reales
 * @param userAuthenticated - Si el usuario estÃ¡ autenticado
 * @param forceProduction - Forzar modo producciÃ³n
 * @returns boolean indicando si usar datos demo
 */
export const shouldUseDemoData = (userAuthenticated: boolean = false, forceProduction: boolean = false): boolean => {
  // Si se fuerza producciÃ³n, nunca usar demo
  if (forceProduction) {
    logger.info('Modo producciÃ³n forzado, usando datos reales');
    return false;
  }

  // Si el usuario estÃ¡ autenticado, usar datos reales
  if (userAuthenticated) {
    logger.info('Usuario autenticado, usando datos reales');
    return false;
  }

  // Si estamos en modo demo y el usuario no estÃ¡ autenticado
  if (appMode.isDemo && !userAuthenticated) {
    logger.info('Modo demo activo para usuario no autenticado');
    return true;
  }

  // Por defecto, usar datos reales en producciÃ³n
  logger.info('Usando datos reales por defecto');
  return false;
};

/**
 * Obtiene la configuraciÃ³n de datos segÃºn el contexto
 * @param context - Contexto de la aplicaciÃ³n
 * @returns configuraciÃ³n apropiada
 */
export const getDataConfig = (context: {
  userAuthenticated?: boolean;
  userType?: 'admin' | 'user' | 'guest';
  forceMode?: 'demo' | 'production';
}) => {
  const { userAuthenticated = false, userType = 'guest', forceMode } = context;

  // Forzar modo especÃ­fico si se especifica
  if (forceMode) {
    return {
      useDemo: forceMode === 'demo',
      useSupabase: forceMode === 'production',
      requireAuth: forceMode === 'production',
      mode: forceMode
    };
  }

  // Usuarios admin siempre en producciÃ³n
  if (userType === 'admin') {
    return {
      useDemo: false,
      useSupabase: true,
      requireAuth: true,
      mode: 'production' as const
    };
  }

  // Determinar segÃºn autenticaciÃ³n y configuraciÃ³n
  const useDemo = shouldUseDemoData(userAuthenticated);
  
  return {
    useDemo,
    useSupabase: !useDemo,
    requireAuth: !useDemo,
    mode: useDemo ? 'demo' as const : 'production' as const
  };
};

/**
 * Wrapper para servicios que necesitan comportamiento diferente en demo/producciÃ³n
 */
export class ServiceWrapper<T> {
  private demoService: T;
  private productionService: T;

  constructor(demoService: T, productionService: T) {
    this.demoService = demoService;
    this.productionService = productionService;
  }

  /**
   * Obtiene el servicio apropiado segÃºn el contexto
   */
  getService(context: Parameters<typeof getDataConfig>[0]): T {
    const config = getDataConfig(context);
    return config.useDemo ? this.demoService : this.productionService;
  }
}

/**
 * Hook para obtener configuraciÃ³n reactiva
 */
export const useAppMode = () => {
  return {
    ...appMode,
    getDataConfig,
    shouldUseDemoData,
    ServiceWrapper
  };
};

// Log de configuraciÃ³n inicial
logger.info('ConfiguraciÃ³n de modo de aplicaciÃ³n:', {
  mode: appMode.current,
  isDemo: appMode.isDemo,
  isProduction: appMode.isProduction,
  env: import.meta.env.VITE_APP_MODE
});

