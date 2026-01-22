/**
 * Derivación de claves de encriptación usando PBKDF2
 * 
 * Mejoras de seguridad 2025-2026:
 * - Iteraciones aumentadías a 600000 (recomendado NIST 2025+)
 * - Password base mejorado con constante de aplicación + userId
 * - Validación de versiones en decrypt
 * 
 * NOTA: La derivación de clave basada en userId es determinista por usuario,
 * lo que permite desencriptar datos almacenados anteriormente.
 */

import { logger } from "@/lib/logger";
import { ENCRYPTION_CONFIG, APP_ENCRYPTION_SALT } from "@/lib/security/encryptionConfig";

/**
 * Interfaz para clave de encriptación derivada
 */
export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

/**
 * Verifica soporte de Web Crypto API
 * 
 * @returns true si Web Crypto API está disponible
 */
export function checkCryptoSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle !== undefined
  );
}

/**
 * Genera una clave de encriptación derivada de contraseña usando PBKDF2
 * 
 * Mejoras de seguridad:
 * - Iteraciones aumentadías a 600000 (recomendado NIST 2025+)
 * - SHA-256 para hash
 * - AES-GCM 256-bit para clave final
 * 
 * @param password - Contraseña base para derivación
 * @param salt - Salt único para derivación
 * @returns CryptoKey derivada
 * @throws Error si Web Crypto API no está soportada
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  if (!checkCryptoSupport()) {
    throw new Error("Encriptación no soportada en este navegador");
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importar contraseña como clave base
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derivar clave final usando PBKDF2 con iteraciones aumentadías
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: ENCRYPTION_CONFIG.keyLength },
    false,
    ["encrypt", "decrypt"],
  );

  return key;
}

/**
 * Genera un password base mejorado para derivación de clave
 * 
 * Mejoras de seguridad:
 * - Combina constante de aplicación + userId
 * - Más fuerte que simplemente `complices_${userId}_encryption_key`
 * - Determinista por usuario (permite desencriptar datos anteriores)
 * 
 * @param userId - ID del usuario
 * @returns Password base para derivación
 */
export function generatePasswordBase(userId: string): string {
  // Combinar constante de aplicación + userId para password base más fuerte
  // Esto es determinista por usuario, lo que permite desencriptar datos almacenados anteriormente
  return `${APP_ENCRYPTION_SALT}_${userId}_encryption_key`;
}

/**
 * Obtiene o genera una clave de encriptación para un usuario
 * 
 * Mejoras de seguridad:
 * - Cache de claves para performance (evita re-derivación)
 * - Salt único por usuario
 * - Password base mejorado
 * 
 * @param userId - ID del usuario
 * @param keyCache - Cache de claves (Map<string, EncryptionKey>)
 * @returns Clave de encriptación derivada
 */
export async function getEncryptionKey(
  userId: string,
  keyCache: Map<string, EncryptionKey>,
): Promise<EncryptionKey> {
  // Verificar cache primero para performance
  if (keyCache.has(userId)) {
    return keyCache.get(userId)!;
  }

  // Generar salt único por usuario
  const salt = window.crypto.getRandomValues(
    new Uint8Array(ENCRYPTION_CONFIG.saltLength),
  );

  // Generar password base mejorado
  const password = generatePasswordBase(userId);

  // Derivar clave usando PBKDF2
  const key = await deriveKey(password, salt);

  const encryptionKey = { key, salt };
  keyCache.set(userId, encryptionKey);

  logger.info("🔑 Clave de encriptación generada", {
    userId: userId.substring(0, 8) + "***",
  });

  return encryptionKey;
}

/**
 * Reconstruye una clave de encriptación usando un salt almacenado
 * 
 * Se usa en decrypt para reconstruir la misma clave que se usó en encrypt
 * 
 * @param userId - ID del usuario
 * @param saltBuffer - Salt almacenado (en base64)
 * @returns Clave de encriptación derivada
 */
export async function reconstructEncryptionKey(
  userId: string,
  saltBuffer: ArrayBuffer,
): Promise<CryptoKey> {
  // Generar el mismo password base que se usó en encrypt
  const password = generatePasswordBase(userId);

  // Derivar clave usando el salt almacenado
  const key = await deriveKey(password, new Uint8Array(saltBuffer));

  return key;
}

/**
 * Valida la versión de datos encriptados
 * 
 * @param version - Versión del algoritmo
 * @returns true si la versión es válida
 */
export function validateEncryptionVersion(version: string): boolean {
  return version === "1.0" || version === "fallback";
}

