import { useState, useCallback } from "react";
import { logger } from "@/lib/logger";

/**
 * Hook seguro para persistir estado en localStorage con compatibilidad SSR
 * Reemplaza el uso directo de localStorage en toda la aplicación
 *
 * @param key - Clave única para localStorage
 * @param defaultValue - Valor por defecto si no existe en localStorage
 * @returns [state, setState] - Tupla con estado y función para actualizarlo
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Estado inicial con verificación SSR-safe
  const [state, setState] = useState<T>(() => {
    // Verificar si estamos en el cliente (no SSR)
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      // Intentar parsear como JSON primero
      try {
        const parsed = JSON.parse(item);
        // Solo loggear en desarrollo o para keys críticas
        if (
          import.meta.env.MODE === "development" ||
          key.includes("demo_") ||
          key.includes("auth_")
        ) {
          logger.info("Estado cargado desde localStorage:", {
            key,
            hasValue: !!parsed,
          });
        }
        return parsed;
      } catch {
        // Si falla JSON, tratar como string simple
        if (
          import.meta.env.MODE === "development" ||
          key.includes("demo_") ||
          key.includes("auth_")
        ) {
          logger.info("Estado cargado desde localStorage (string):", {
            key,
            value: item,
          });
        }
        return item as T;
      }
    } catch (_error) {
      logger.error("Error parsing localStorage value:", { key, error: _error });
      return defaultValue;
    }
  });

  // Función para actualizar estado y localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((currentState) => {
        const valueToStore = value instanceof Function ? value(currentState) : value;

        // Solo actualizar localStorage en el cliente
        if (typeof window !== "undefined") {
          if (valueToStore === null || valueToStore === undefined) {
            window.localStorage.removeItem(key);
            if (
              import.meta.env.MODE === "development" ||
              key.includes("demo_") ||
              key.includes("auth_")
            ) {
              logger.info("Valor removido de localStorage:", { key });
            }
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            if (
              import.meta.env.MODE === "development" ||
              key.includes("demo_") ||
              key.includes("auth_")
            ) {
              logger.info("Valor guardado en localStorage:", {
                key,
                hasValue: !!valueToStore,
              });
            }
          }
        }

        return valueToStore;
      });
    },
    [key],
  );

  // Sincronizar con cambios externos de localStorage
  // TEMPORALMENTE DESACTIVADO para evitar bucle infinito
  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   const handleStorageChange = (__e: any) => {
  //     if (__e.key === key && __e.newValue !== null) {
  //       try {
  //         const newValue = JSON.parse(__e.newValue);
  //         // Solo actualizar si el valor realmente cambió
  //         if (JSON.stringify(state) !== JSON.stringify(newValue)) {
  //           setState(newValue);
  //           logger.info("Estado sincronizado desde storage event:", { key });
  //         }
  //       } catch (_error) {
  //         logger.error("Error sincronizando storage event:", {
  //           key,
  //           error: String(_error),
  //         });
  //       }
  //     }
  //   };

  //   window.addEventListener("storage", handleStorageChange);
  //   return () => window.removeEventListener("storage", handleStorageChange);
  // }, [key, state]);

  return [state, setValue];
}

/**
 * Hook para limpiar localStorage de forma controlada
 */
export function useClearPersistedState() {
  return (keys: string[]) => {
    keys.forEach((key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch (_error) {
        console.warn(`Error removing localStorage key "${key}":`, _error);
      }
    });
  };
}
