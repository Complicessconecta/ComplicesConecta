/**
 * Sistema de encriptación para datos sensibles en localStorage y Supabase
 * Protege información crítica sin modificar lógica de autenticación existente
 * 
 * Mejoras de seguridad 2025-2026:
 * - Iteraciones PBKDF2 aumentadías a 600000 (recomendado NIST 2025+)
 * - Password base mejorado con constante de aplicación + userId
 * - IV único y aleatorio garantizado por cada encrypt
 * - Validación extra en decrypt
 * - Logging mejorado sin exponer datos sensibles
 * 
 * NOTA DE SEGURIDAD CRÍTICA:
 * - Client-side encryption NO protege contra XSS, malware o acceso físico al dispositivo
 * - Solo mitiga exposición en reposo si el atacante no tiene la sesión activa
 * - Para protección real, usar encriptación del lado del servidor + TLS
 */

import { logger } from "@/lib/logger";
import { ENCRYPTION_CONFIG, SENSITIVE_DATA_TYPES, ENCRYPTION_VERSION, ENCRYPTION_FALLBACK_VERSION } from "@/lib/security/encryptionConfig";
import { checkCryptoSupport, getEncryptionKey,  reconstructEncryptionKey, validateEncryptionVersion, type EncryptionKey } from "@/lib/security/keyDerivation";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@/lib/security/utils/cryptoUtils";

/**
 * Datos encriptados con metadata
 */
export interface EncryptedData {
  data: string; // Datos encriptados en base64
  iv: string; // Vector de inicialización
  salt: string; // Salt para derivación de clave
  type: string; // Tipo de dato encriptado
  timestamp: number; // Timestamp de encriptación
  version: string; // Versión del algoritmo
}

/**
 * Clase principal de encriptación
 * 
 * Implementa singleton pattern para cache de claves
 */
class DataEncryption {
  private keyCache = new Map<string, EncryptionKey>();
  private isSupported: boolean;

  constructor() {
    this.isSupported = checkCryptoSupport();

    if (!this.isSupported) {
      logger.warn("⚠️ Web Crypto API no soportada, usando fallback");
    }
  }

  /**
   * Encripta datos sensibles
   * 
   * Mejoras de seguridad:
   * - IV único y aleatorio por cada encrypt
   * - Validación de tipo de dato
   * - Logging sin exponer datos sensibles
   * 
   * @param data - Datos a encriptar
   * @param userId - ID del usuario
   * @param dataType - Tipo de dato (debe estar en SENSITIVE_DATA_TYPES)
   * @returns Datos encriptados con metadata
   */
  public async encryptData(
    data: any,
    userId: string,
    dataType: string,
  ): Promise<EncryptedData> {
    try {
      if (!this.isSupported) {
        // Fallback: retornar datos sin encriptar pero marcados
        logger.warn("🔓 Datos no encriptados (crypto no soportado)", {
          dataType,
        });
        return {
          data: btoa(JSON.stringify(data)),
          iv: "",
          salt: "",
          type: dataType,
          timestamp: Date.now(),
          version: "fallback",
        };
      }

      const { key, salt } = await getEncryptionKey(userId, this.keyCache);

      // Generar IV aleatorio único para cada encrypt
      const iv = window.crypto.getRandomValues(
        new Uint8Array(ENCRYPTION_CONFIG.ivLength),
      );

      // Convertir datos a buffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));

      // Encriptar
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
        },
        key,
        dataBuffer,
      );

      const result: EncryptedData = {
        data: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        type: dataType,
        timestamp: Date.now(),
        version: ENCRYPTION_VERSION,
      };

      logger.info("🔐 Datos encriptados exitosamente", {
        dataType,
        userId: userId.substring(0, 8) + "***",
        size: encryptedBuffer.byteLength,
      });

      return result;
    } catch (error) {
      logger.error("❌ Error encriptando datos", { dataType, error });
      throw new Error(`Error de encriptación: ${error}`);
    }
  }

  /**
   * Desencripta datos
   */
  public async decryptData<T = any>(
    encryptedData: EncryptedData,
    userId: string,
  ): Promise<T> {
    try {
      // Validar versión
      if (!validateEncryptionVersion(encryptedData.version)) {
        throw new Error(
          `Versión de encriptación no soportada: ${encryptedData.version}`,
        );
      }

      // Manejar fallback
      if (encryptedData.version === ENCRYPTION_FALLBACK_VERSION) {
        const jsonString = atob(encryptedData.data);
        return JSON.parse(jsonString);
      }

      if (!this.isSupported) {
        throw new Error("No se puede desencriptar: crypto no soportado");
      }

      // Reconstruir clave usando el salt almacenado
      const saltBuffer = base64ToArrayBuffer(encryptedData.salt);
      const key = await reconstructEncryptionKey(userId, saltBuffer);

      // Reconstruir IV y datos
      const ivBuffer = base64ToArrayBuffer(encryptedData.iv);
      const dataBuffer = base64ToArrayBuffer(encryptedData.data);

      // Desencriptar datos
      const iv = new Uint8Array(ivBuffer);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        dataBuffer,
      );

      // Convertir de vuelta a objeto
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      const result = JSON.parse(jsonString);

      logger.info("🔓 Datos desencriptados exitosamente", {
        dataType: encryptedData.type,
        userId: userId.substring(0, 8) + "***",
      });

      return result;
    } catch (error) {
      logger.error("❌ Error desencriptando datos", {
        dataType: encryptedData.type,
        error,
      });
      throw error;
    }
  }

  /**
   * Limpia cache de claves (para logout)
   */
  public clearKeyCache(userId?: string): void {
    if (userId) {
      this.keyCache.delete(userId);
      logger.info("🧹 Cache de clave limpiado para usuario", {
        userId: userId.substring(0, 8) + "***",
      });
    } else {
      this.keyCache.clear();
      logger.info("🧹 Cache de claves completamente limpiado");
    }
  }
}

// Instancia singleton
const dataEncryption = new DataEncryption();

/**
 * Wrapper para localStorage con encriptación automática
 */
export class SecureStorage {
  /**
   * Guarda datos encriptados en localStorage
   */
  public static async setItem(
    key: string,
    value: any,
    userId: string,
    dataType: string = SENSITIVE_DATA_TYPES.USER_PREFERENCES,
  ): Promise<void> {
    try {
      const encryptedData = await dataEncryption.encryptData(
        value,
        userId,
        dataType,
      );
      localStorage.setItem(`encrypted_${key}`, JSON.stringify(encryptedData));

      logger.info("💾 Datos guardados encriptados en localStorage", {
        key,
        dataType,
        userId: userId.substring(0, 8) + "***",
      });
    } catch (error) {
      logger.error("❌ Error guardando datos encriptados", { key, error });
      // Fallback: guardar sin encriptar
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  /**
   * Recupera y desencripta datos de localStorage
   */
  public static async getItem<T = any>(
    key: string,
    userId: string,
  ): Promise<T | null> {
    try {
      // Intentar cargar versión encriptada primero
      const encryptedItem = localStorage.getItem(`encrypted_${key}`);

      if (encryptedItem) {
        const encryptedData: EncryptedData = JSON.parse(encryptedItem);
        return await dataEncryption.decryptData<T>(encryptedData, userId);
      }

      // Fallback: cargar versión no encriptada
      const plainItem = localStorage.getItem(key);
      if (plainItem) {
        logger.info("📖 Cargando datos no encriptados (fallback)", { key });
        return JSON.parse(plainItem);
      }

      return null;
    } catch (error) {
      logger.error("❌ Error cargando datos de localStorage", { key, error });
      return null;
    }
  }

  /**
   * Elimina datos encriptados
   */
  public static removeItem(key: string): void {
    localStorage.removeItem(`encrypted_${key}`);
    localStorage.removeItem(key); // También remover versión no encriptada

    logger.info("🗑️ Datos eliminados de localStorage", { key });
  }

  /**
   * Migra datos existentes a formato encriptado
   */
  public static async migrateToEncrypted(
    key: string,
    userId: string,
    dataType: string,
  ): Promise<boolean> {
    try {
      const plainItem = localStorage.getItem(key);
      if (!plainItem) return false;

      const data = JSON.parse(plainItem);
      await this.setItem(key, data, userId, dataType);

      // Remover versión no encriptada después de migrar
      localStorage.removeItem(key);

      logger.info("🔄 Datos migrados a formato encriptado", { key, dataType });
      return true;
    } catch (error) {
      logger.error("❌ Error migrando datos a encriptado", { key, error });
      return false;
    }
  }
}

/**
 * Hook para usar encriptación en componentes React
 */
export const useDataEncryption = (userId: string) => {
  const encryptAndStore = async (
    key: string,
    data: any,
    dataType: string = SENSITIVE_DATA_TYPES.USER_PREFERENCES,
  ) => {
    await SecureStorage.setItem(key, data, userId, dataType);
  };

  const decryptAndLoad = async <T = any>(key: string): Promise<T | null> => {
    return await SecureStorage.getItem<T>(key, userId);
  };

  const removeSecure = (key: string) => {
    SecureStorage.removeItem(key);
  };

  const migrateData = async (key: string, dataType: string) => {
    return await SecureStorage.migrateToEncrypted(key, userId, dataType);
  };

  const clearUserCache = () => {
    dataEncryption.clearKeyCache(userId);
  };

  return {
    encryptAndStore,
    decryptAndLoad,
    removeSecure,
    migrateData,
    clearUserCache,
  };
};

export {
  dataEncryption,
  SENSITIVE_DATA_TYPES,
  ENCRYPTION_CONFIG,
  ENCRYPTION_VERSION,
  ENCRYPTION_FALLBACK_VERSION,
};
export default DataEncryption;

