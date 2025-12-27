/**
 * Utilidad para limpiar localStorage corrupto y resetear estado de autenticaci├│n
 * Utilidades para limpiar el almacenamiento local de forma segura
 */

import { logger } from '@/lib/logger';

// Funciones auxiliares para manejo seguro de localStorage
const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing localStorage item ${key}:`, error);
  }
};

const safeGetItem = <T>(key: string, options: { validate?: boolean; defaultValue?: T } = {}): T | null => {
  try {
    const value = localStorage.getItem(key);
    if (options.validate && value === null) {
      throw new Error(`Item ${key} no encontrado en localStorage`);
    }
    return value as T | null;
  } catch (error) {
    console.warn(`Error getting localStorage item ${key}:`, error);
    return options.defaultValue || null;
  }
};

export const clearAllStorage = () => {
  try {
    // Limpiar todas las claves relacionadas con autenticaci├│n
    const keysToRemove = [
      'demo_authenticated',
      'demo_user',
      'userType',
      'hasVisitedComplicesConecta',
      'sb-axtvqnozatbmllvwzuim-auth-token'
    ];

    keysToRemove.forEach(key => {
      safeRemoveItem(key);
    });

    logger.info('­ƒº╣ localStorage limpiado completamente');
    
    // Recargar p├ígina para aplicar cambios
    window.location.reload();
  } catch (error) {
    logger.error('Error limpiando localStorage:', { error: String(error) });
  }
};

export const resetAuthState = () => {
  try {
    // Solo limpiar claves de autenticaci├│n
    safeRemoveItem('demo_authenticated');
    safeRemoveItem('demo_user');
    safeRemoveItem('userType');
    
    logger.info('­ƒöä Estado de autenticaci├│n reseteado');
  } catch (error) {
    logger.error('Error reseteando autenticaci├│n:', { error: String(error) });
  }
};

// Funci├│n para debug - mostrar todo el localStorage
export const debugStorage = () => {
  logger.debug('Estado actual del localStorage');
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const value = safeGetItem<string>(key, { validate: false, defaultValue: '' });
        logger.debug(`${key}: ${value}`);
      }
    }
  }
};
