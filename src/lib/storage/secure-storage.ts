/**
 * @deprecated C4 (2026-11-19) — STUB FAIL-CLOSED.
 *
 * El "almacenamiento seguro" anterior era reversible por cualquiera con el
 * repo: cifraba con AES usando una clave fija ('default-encryption-key-
 * change-in-production') o la variable VITE_STORAGE_ENCRYPTION_KEY, que se
 * incrusta en el bundle del navegador y por tanto no es secreta (C4/C5).
 *
 * Este módulo ya NO cifra nada:
 * - setItem() LANZA un error (fail-closed): nada se guarda "cifrado".
 * - getItem() SIEMPRE devuelve undefined: nada guardado con la clave vieja
 *   se vuelve a leer (esos datos se consideran comprometidos).
 * - removeItem()/clear() SÍ funcionan: limpian las claves legacy de
 *   localStorage, para que los datos viejos no queden ahí.
 *
 * La sesión real es Supabase Auth (getSession, en memoria); nada de sesión
 * se copia a localStorage. Lo que deba ser secreto vive en el servidor.
 * Las interfaces exportadas se conservan para no romper importadores.
 */

const LEGACY_KEY_PREFIXES = ["cc_secure_", "demo_"] as const;

function isLegacyKey(key: string | null): boolean {
  if (!key) return false;
  return LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function collectLegacyKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (isLegacyKey(key)) keys.push(key as string);
    }
  } catch {
    // Sin acceso a localStorage: no hay nada que limpiar.
  }
  return keys;
}

/**
 * Servicio de almacenamiento seguro — DEPRECADO, stub fail-closed (C4).
 * @deprecated No cifra ni guarda nada. Usar Supabase Auth para sesión.
 */
export class SecureStorage {
  private static instance: SecureStorage;

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * @deprecated Fail-closed (C4): siempre lanza. Nada se guarda "cifrado".
   */
  public setItem<T>(key: string, _value: T): void {
    void key;
    throw new Error(
      "SecureStorage está deshabilitado (C4): el cifrado de cliente con clave fija fue eliminado; no se guarda nada en localStorage",
    );
  }

  /**
   * @deprecated Fail-closed (C4): siempre devuelve undefined. Los datos
   * guardados con la clave vieja se consideran comprometidos y no se leen.
   */
  public getItem<T>(_key: string): T | undefined {
    return undefined;
  }

  /**
   * Elimina un item del localStorage (limpieza de claves legacy).
   */
  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
    }
  }

  /**
   * Limpia las claves legacy conocidas (cc_secure_*, demo_*) de localStorage.
   */
  public clear(): void {
    try {
      collectLegacyKeys().forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Error clearing secure storage:", error);
    }
  }

  /**
   * Verifica si un item existe (solo presencia en localStorage, sin leerlo).
   */
  public hasItem(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene las claves legacy conocidas presentes en localStorage.
   */
  public getKeys(): string[] {
    return collectLegacyKeys();
  }
}

// Exportar instancia singleton
export const secureStorage = SecureStorage.getInstance();

// Tipos para datos comunes (conservados para compatibilidad de importadores;
// ya NO se persiste ningún dato de sesión en localStorage).
export interface SecureSessionData {
  isAuthenticated: boolean;
  userRole?: string;
  lastActivity: number;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

export interface SecureDemoData {
  authenticated: boolean;
  userData?: {
    email: string;
    role: string;
    accountType: string;
  };
  flags?: {
    [key: string]: boolean | string;
  };
}
