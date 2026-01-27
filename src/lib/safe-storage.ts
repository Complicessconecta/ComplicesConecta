/**
 * Utilidad segura para localStorage con validación y sanitización
 * Versión: 3.6.3
 *
 * Proporciona funciones seguras para leer y escribir en localStorage
 * con validación de esquema, sanitización de datos y manejo de errores
 */

import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * Esquemas de validación comunes para localStorage
 */
export const localStorageSchemas = {
  demo_authenticated: z.enum(["true", "false"]),
  demo_user: z.string().optional(),
  user_id: z.string().uuid().optional(),
  backup_history: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(5).optional(),
};

/**
 * Tipo para las claves válidías de localStorage
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
 * @param options - Opciones de lectura (validación, esquema, valor por defecto)
 * @returns Valor leído o valor por defecto si no existe o es inválido
 */
export function safeGetItem<T = unknown>(
  key: LocalStorageKey,
  options: LocalStorageOptions = {},
): T | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return (options.defaultValue as T) ?? null;
    }

    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null) {
      return (options.defaultValue as T) ?? null;
    }

    // Intentar parsear JSON SOLO cuando el valor parece JSON.
    // Esto evita que strings simples como "true"/"false" se conviertan a boolean
    // y fallen la validación zod (demo_authenticated espera "true" | "false").
    const trimmed = rawValue.trim();
    const looksLikeJson =
      trimmed.startsWith("{") ||
      trimmed.startsWith("[") ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'));

    let parsedValue: unknown = rawValue;
    if (looksLikeJson) {
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {
        parsedValue = rawValue;
      }
    }

    // Validar con esquema si se proporciona
    if (options.validate && options.schema) {
      const validationResult = options.schema.safeParse(parsedValue);
      if (!validationResult.success) {
        logger.warn(`⚠️ Valor inválido en localStorage para clave "${key}":`, {
          error: validationResult.error,
        });
        return (options.defaultValue as T) ?? null;
      }
      return validationResult.data as T;
    }

    // Validar con esquema predefinido si existe
    if (
      options.validate &&
      localStorageSchemas[key as keyof typeof localStorageSchemas]
    ) {
      const schema =
        localStorageSchemas[key as keyof typeof localStorageSchemas];
      const validationResult = schema.safeParse(parsedValue);
      if (!validationResult.success) {
        logger.warn(`⚠️ Valor inválido en localStorage para clave "${key}":`, {
          error: validationResult.error,
        });
        return (options.defaultValue as T) ?? null;
      }
      return validationResult.data as T;
    }

    return parsedValue as T;
  } catch (error) {
    logger.error(`❌ Error leyendo de localStorage para clave "${key}":`, {
      error,
    });
    return (options.defaultValue as T) ?? null;
  }
}

/**
 * Escribe un valor en localStorage de forma segura
 *
 * @param key - Clave del valor a escribir
 * @param value - Valor a escribir
 * @param options - Opciones de escritura (validación)
 * @returns true si se escribió correctamente, false si hubo error
 */
export function safeSetItem(
  key: LocalStorageKey,
  value: unknown,
  options: LocalStorageOptions = {},
): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    // Validar con esquema si se proporciona o existe predefinido
    if (options.validate) {
      const schema =
        options.schema ||
        localStorageSchemas[key as keyof typeof localStorageSchemas];
      if (schema) {
        const validationResult = schema.safeParse(value);
        if (!validationResult.success) {
          logger.error(
            `❌ Intento de escribir valor inválido en localStorage para clave "${key}":`,
            { error: validationResult.error },
          );
          return false;
        }
      }
    }

    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    logger.error(`❌ Error escribiendo en localStorage para clave "${key}":`, {
      error,
    });
    return false;
  }
}

/**
 * Elimina un valor de localStorage
 */
export function safeRemoveItem(key: LocalStorageKey): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    logger.error(`❌ Error eliminando de localStorage clave "${key}":`, {
      error,
    });
  }
}

/**
 * Limpia todo el localStorage
 */
export function safeClear(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  } catch (error) {
    logger.error("❌ Error limpiando localStorage:", { error });
  }
}

