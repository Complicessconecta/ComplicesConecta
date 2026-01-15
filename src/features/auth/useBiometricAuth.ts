import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { usePersistedState } from "@/hooks/usePersistedState";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

// Reemplazamos la interfaz, ya que el plugin nativo devuelve diferentes datos
interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: "face" | "fingerprint" | "iris" | "none";
}

const SERVER = "com.complicesconecta.app";

/**
 * Hook para gestión de autenticación biométrica NATIVA y PIN de respaldo.
 * Utiliza @capgo/capacitor-native-biometric para interactuar con el hardware del dispositivo.
 */
export const useBiometricAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricConfig, setBiometricConfig] =
    usePersistedState<BiometricAvailability | null>("biometric_config", null);
  const [isBiometricEnabled, setIsBiometricEnabled] =
    usePersistedState<boolean>("biometric_enabled", false);
  const [pinHash, setPinHash] = usePersistedState<string | null>(
    "user_pin_hash",
    null,
  );

  // Comprobar disponibilidad al iniciar
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability =
    useCallback(async (): Promise<BiometricAvailability> => {
      const fallback: BiometricAvailability = {
        isAvailable: false,
        biometryType: "none",
      };

      if (!Capacitor.isNativePlatform()) {
        setBiometricConfig(fallback);
        return fallback;
      }

      try {
        const raw = (await NativeBiometric.isAvailable()) as unknown;
        const result =
          typeof raw === "object" && raw !== null
            ? (raw as { isAvailable?: boolean; biometryType?: string | null })
            : {};

        const normalized: BiometricAvailability = {
          isAvailable: !!result.isAvailable,
          biometryType:
            (result.biometryType as BiometricAvailability["biometryType"]) ??
            "none",
        };

        setBiometricConfig(normalized);

        if (!normalized.isAvailable) {
          setIsBiometricEnabled(false); // Desactivar si ya no está disponible
        }

        return normalized;
      } catch (error) {
        logger.error("Error verificando disponibilidad biométrica nativa:", {
          error,
        });
        setBiometricConfig(fallback);
        return fallback;
      }
    }, [setIsBiometricEnabled]);

  /**
   * Registra las credenciales del usuario en el dispositivo de forma segura.
   * El plugin se encarga de la gestión del Keystore/Keychain.
   */
  const registerBiometric = useCallback(
    async (username?: string, token?: string): Promise<BiometricAuthResult> => {
      // Para integraciones que no pasan credenciales explícitas (ej. BiometricSettings)
      // devolvemos un error controlado en lugar de lanzar excepción.
      if (!username || !token) {
        logger.warn(
          "registerBiometric llamado sin username/token. Flujo demo o configuración incompleta.",
        );
        return {
          success: false,
          error:
            "No se pudo registrar la credencial biométrica: falta información de usuario.",
        };
      }
      if (!biometricConfig?.isAvailable) {
        return { success: false, error: "Biometría no disponible." };
      }
      setIsLoading(true);
      try {
        await NativeBiometric.setCredentials({
          server: SERVER,
          username,
          password: token, // Guardamos el token de sesión de forma segura
        });
        setIsBiometricEnabled(true);
        toast.success("Biometría activada correctamente.");
        return { success: true };
      } catch (error) {
        logger.error("Error al registrar la credencial biométrica:", { error });
        toast.error("No se pudo activar la biometría.");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [biometricConfig?.isAvailable, setIsBiometricEnabled],
  );

  /**
   * Autentica al usuario usando la credencial guardada.
   */
  const authenticateBiometric = useCallback(
    async (
      _username: string,
    ): Promise<BiometricAuthResult & { token?: string }> => {
      if (!isBiometricEnabled) {
        return { success: false, error: "Biometría no activada." };
      }
      setIsLoading(true);
      try {
        const result = await NativeBiometric.getCredentials({
          server: SERVER,
        });
        // En un flujo real, usaríamos este token para autenticarnos contra Supabase
        toast.success("Autenticación biométrica exitosa.");
        return { success: true, token: result.password };
      } catch (error) {
        logger.error("Error en la autenticación biométrica:", { error });
        toast.error("Fallo en la autenticación biométrica.");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [isBiometricEnabled],
  );

  /**
   * Elimina las credenciales biométricas del dispositivo.
   */
  const deleteBiometricCredentials = useCallback(
    async (_username: string) => {
      setIsLoading(true);
      try {
        await NativeBiometric.deleteCredentials({
          server: SERVER,
        });
        setIsBiometricEnabled(false);
        toast.info("Biometría desactivada.");
      } catch (error) {
        logger.error("Error eliminando credenciales biométricas:", { error });
        toast.error("No se pudo desactivar la biometría.");
      } finally {
        setIsLoading(false);
      }
    },
    [setIsBiometricEnabled],
  );

  // --- Lógica de PIN de Respaldo ---

  const simpleHash = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "STATIC_SALT_FOR_DEMO"); // ¡EN PRODUCCIÓN USAR UN SALT REAL POR USUARIO!
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  /**
   * Establece o cambia el PIN del usuario.
   */
  const setPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        toast.error("El PIN debe tener 6 dígitos numéricos.");
        return false;
      }
      setIsLoading(true);
      try {
        const hash = await simpleHash(pin);
        setPinHash(hash);
        toast.success("PIN de respaldo configurado.");
        return true;
      } catch (error) {
        logger.error("Error al guardar el hash del PIN:", { error });
        toast.error("No se pudo configurar el PIN.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setPinHash],
  );

  /**
   * Verifica el PIN ingresado por el usuario.
   */
  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pinHash) {
        toast.error("No hay un PIN configurado.");
        return false;
      }
      if (pin.length !== 6) return false;

      setIsLoading(true);
      try {
        const hashToVerify = await simpleHash(pin);
        if (hashToVerify === pinHash) {
          toast.success("PIN correcto.");
          return true;
        } else {
          toast.error("PIN incorrecto.");
          return false;
        }
      } catch (error) {
        logger.error("Error al verificar el PIN:", { error });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pinHash],
  );

  const clearPin = useCallback(() => {
    setPinHash(null);
  }, [setPinHash]);

  /**
   * Flujo de autenticación unificado: intenta biometría, si falla, ofrece PIN.
   */
  const authenticate = useCallback(
    async (
      username: string,
    ): Promise<{
      success: boolean;
      method: "biometric" | "pin" | "none";
      token?: string;
    }> => {
      if (isBiometricEnabled && biometricConfig?.isAvailable) {
        const biometricResult = await authenticateBiometric(username);
        if (biometricResult.success) {
          const result: any = {
            success: true,
            method: "biometric" as const,
          };
          if (biometricResult.token) {
            result.token = biometricResult.token;
          }
          return result;
        }
        // Si la biometría falla, el toast de error ya se mostró. No hacemos nada y dejamos que la UI pida el PIN.
      }

      // Si la biometría no está activada o falló, el siguiente paso sería que la UI pida el PIN.
      // La verificación del PIN (`verifyPin`) se llamaría desde el componente de UI.
      // Este `authenticate` solo inicia el flujo.
      if (pinHash) {
        toast.info(
          "La biometría falló o no está disponible. Por favor, usa tu PIN.",
        );
        return { success: false, method: "pin" }; // Indica a la UI que debe pedir el PIN
      }

      return { success: false, method: "none" };
    },
    [
      isBiometricEnabled,
      biometricConfig?.isAvailable,
      authenticateBiometric,
      pinHash,
    ],
  );

  const getBiometricConfigSnapshot =
    useCallback(async (): Promise<BiometricAvailability | null> => {
      return biometricConfig;
    }, [biometricConfig]);

  const setBiometricEnabledFlag = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      setIsBiometricEnabled(enabled);

      if (!enabled) {
        try {
          await NativeBiometric.deleteCredentials({
            server: SERVER,
          });
        } catch (error) {
          logger.error(
            "Error limpiando credenciales biométricas al desactivar:",
            { error },
          );
        }
      }

      return true;
    },
    [setIsBiometricEnabled],
  );

  const clearBiometricSessions = useCallback(async (): Promise<boolean> => {
    try {
      await NativeBiometric.deleteCredentials({
        server: SERVER,
      });
      setIsBiometricEnabled(false);
      toast.info("Sesiones biométricas limpiadas.");
      return true;
    } catch (error) {
      logger.error("Error limpiando sesiones biométricas:", { error });
      toast.error("No se pudieron limpiar las sesiones biométricas.");
      return false;
    }
  }, [setIsBiometricEnabled]);

  return {
    isLoading,
    isBiometricEnabled,
    isEnabled: isBiometricEnabled,
    biometricType: biometricConfig?.biometryType,
    isBiometricAvailable: biometricConfig?.isAvailable,
    biometricConfig,
    hasPin: !!pinHash,

    // Funciones
    checkBiometricAvailability,
    registerBiometric,
    authenticateBiometric,
    deleteBiometricCredentials,
    setPin,
    verifyPin,
    clearPin,
    authenticate, // Flujo unificado
    getBiometricConfig: getBiometricConfigSnapshot,
    setBiometricEnabled: setBiometricEnabledFlag,
    clearBiometricSessions,
  };
};
