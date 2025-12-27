/**
 * Utilidad segura para localStorage con validaciÃ³n y sanitizaciÃ³n
 * VersiÃ³n: 3.6.3
 * 
 * Proporciona funciones seguras para leer y escribir en localStorage
 * con validaciÃ³n de esquema, sanitizaciÃ³n de datos y manejo de errores
 */

import { z } from 'zod';

/**
 * Esquemas de validaciÃ³n comunes para localStorage
 */
export const localStorageSchemas = {
  demo_authenticated: z.enum(['true', 'false']),
  demo_user: z.string().optional(),
  user_id: z.string().uuid().optional(),
  backup_history: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(5).optional(),
};

/**
 * Tipo para las claves vÃ¡lidas de localStorage
 */
export type LocalStorageKey = keyof typeof localStorageSchemas | string;

/**
 * Opciones para operaciones de localStorage
 */
interface LocalStorageOptions {
  validate?: boolean;
  schema?: z.ZodSchema;
  defaultValue?: unknown;
  sanitize?: boolean;
}

/**
 * Lee un valor de localStorage de forma segura
 * 
 * @param key - Clave del valor a leer
 * @param options - Opciones de lectura (validaciÃ³n, esquema, valor por defecto)
 * @returns Valor leÃ­do o valor por defecto si no existe o es invÃ¡lido
 */
export function safeGetItem<T = unknown>(
  key: LocalStorageKey,
  options: LocalStorageOptions = {}
): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return (options.defaultValue as T) ?? null;
    }

    const rawValue = window.localStorage.getItem(key);
    
    if (rawValue === null) {
      return (options.defaultValue as T) ?? null;
    }

    // Intentar parsear JSON
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      // Si no es JSON vÃ¡lido, usar el valor raw
      parsedValue = rawValue;
    }

    // Validar con esquema si se proporciona
    if (options.validate && options.schema) {
      const validationResult = options.schema.safeParse(parsedValue);
      if (!validationResult.success) {
        console.warn(`âš ï¸ Valor invÃ¡lido en localStorage para clave "${key}":`, validationResult.error);
        return (options.defaultValue as T) ?? null;
      }
      return validationResult.data as T;
    }

    // Validar con esquema predefinido si existe
    if (options.validate && localStorageSchemas[key as keyof typeof localStorageSchemas]) {
      const schema = localStorageSchemas[key as keyof typeof localStorageSchemas];
      const validationResult = schema.safeParse(parsedValue);
      if (!validationResult.success) {
        console.warn(`âš ï¸ Valor invÃ¡lido en localStorage para clave "${key}":`, validationResult.error);
        return (options.defaultValue as T) ?? null;
      }
      return validationResult.data as T;
    }

    return parsedValue as T;
  } catch (error) {
    console.error(`âŒ Error leyendo de localStorage para clave "${key}":`, error);
    return (options.defaultValue as T) ?? null;
  }
}

/**
 * Escribe un valor en localStorage de forma segura
 * 
 * @param key - Clave del valor a escribir
 * @param value - Valor a escribir
 * @param options - Opciones de escritura (validaciÃ³n)
 * @returns true si se escribiÃ³ correctamente, false si hubo error
 */
export function safeSetItem(
  key: LocalStorageKey,
  value: unknown,
  options: LocalStorageOptions = {}
): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    // Validar con esquema si se proporciona o existe predefinido
    if (options.validate) {
      const schema = options.schema || localStorageSchemas[key as keyof typeof localStorageSchemas];
      if (schema) {
        const validationResult = schema.safeParse(value);
        if (!validationResult.success) {
          console.error(`âŒ Intento de escribir valor invÃ¡lido en localStorage para clave "${key}":`, validationResult.error);
          return false;
        }
      }
    }

    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`âŒ Error escribiendo en localStorage para clave "${key}":`, error);
    return false;
  }
}

/**
 * Elimina un valor de localStorage
 */
export function safeRemoveItem(key: LocalStorageKey): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`âŒ Error eliminando de localStorage clave "${key}":`, error);
  }
}

/**
 * Limpia todo el localStorage
 */
export function safeClear(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  } catch (error) {
    console.error('âŒ Error limpiando localStorage:', error);
  }
}

