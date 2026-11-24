/**
 * Derivación de claves de encriptación usando PBKDF2
 *
 * C4 (2026-11-19): fin de la derivación determinista. Antes la clave se
 * derivaba de una sal fija del repo (APP_ENCRYPTION_SALT, eliminada) + el
 * userId, así que cualquiera con el repo podía derivarla. Ahora la clave
 * SOLO se deriva de una passphrase explícita que únicamente conoce el
 * usuario; sin ella las funciones lanzan un error (fail-closed). No hay
 * fallback, no hay clave por defecto y la reconstrucción ya no toma userId.
 * El cifrado de cliente NO protege contra XSS: lo secreto vive en el servidor.
 *
 * Mejoras de seguridad 2025-2026:
 * - Iteraciones aumentadas a 600000 (recomendado NIST 2025+)
 * - Validación de versiones en decrypt (solo "1.0"; los blobs "fallback"
 *   —base64 sin cifrar— se rechazan)
 */

import { logger } from "@/lib/logger";
import { ENCRYPTION_CONFIG } from "@/lib/security/encryptionConfig";

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
 * - Iteraciones aumentadas a 600000 (recomendado NIST 2025+)
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

  // Derivar clave final usando PBKDF2 con iteraciones aumentadas
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
 * C4 (2026-11-19): ELIMINADA la derivación determinista de clave.
 * Antes: generatePasswordBase(userId) = APP_ENCRYPTION_SALT + userId, con lo
 * que cualquiera con el repo derivaba la clave. Ahora no existe ninguna
 * función que genere una clave sin passphrase explícita del usuario.
 */
export function requirePassphrase(passphrase: string | undefined | null): string {
  if (!passphrase) {
    throw new Error(
      "Cifrado de cliente requiere una passphrase explícita del usuario; sin ella no se deriva ninguna clave (C4 fail-closed)",
    );
  }
  return passphrase;
}

/**
 * Obtiene o genera una clave de encriptación para un usuario
 *
 * C4 (2026-11-19): la clave SOLO se deriva de la passphrase explícita del
 * usuario. Sin passphrase lanza un error. El cache es solo en memoria y se
 * clavea por la passphrase (nunca se persiste); se limpia con clearKeyCache.
 *
 * @param passphrase - Passphrase explícita del usuario (obligatoria)
 * @param keyCache - Cache de claves en memoria (Map<string, EncryptionKey>)
 * @returns Clave de encriptación derivada
 */
export async function getEncryptionKey(
  passphrase: string,
  keyCache: Map<string, EncryptionKey>,
): Promise<EncryptionKey> {
  const validPassphrase = requirePassphrase(passphrase);

  // Verificar cache primero para performance
  if (keyCache.has(validPassphrase)) {
    return keyCache.get(validPassphrase)!;
  }

  // Generar salt único por cifrado
  const salt = window.crypto.getRandomValues(
    new Uint8Array(ENCRYPTION_CONFIG.saltLength),
  );

  // Derivar clave usando PBKDF2 a partir de la passphrase del usuario
  const key = await deriveKey(validPassphrase, salt);

  const encryptionKey = { key, salt };
  keyCache.set(validPassphrase, encryptionKey);

  logger.info("🔑 Clave de encriptación generada a partir de passphrase de usuario");

  return encryptionKey;
}

/**
 * Reconstruye una clave de encriptación usando un salt almacenado
 *
 * Se usa en decrypt para reconstruir la misma clave que se usó en encrypt.
 *
 * C4 (2026-11-19): ya no toma userId; exige la passphrase explícita del
 * usuario y lanza un error sin ella.
 *
 * @param passphrase - Passphrase explícita del usuario (obligatoria)
 * @param saltBuffer - Salt almacenado (en base64)
 * @returns Clave de encriptación derivada
 */
export async function reconstructEncryptionKey(
  passphrase: string,
  saltBuffer: ArrayBuffer,
): Promise<CryptoKey> {
  const validPassphrase = requirePassphrase(passphrase);

  // Derivar clave usando el salt almacenado y la passphrase del usuario
  const key = await deriveKey(validPassphrase, new Uint8Array(saltBuffer));

  return key;
}

/**
 * Valida la versión de datos encriptados
 *
 * C4 (2026-11-19): solo "1.0" es válida. Los blobs con versión "fallback"
 * (base64 sin cifrar) se rechazan: nunca se descifran como texto plano.
 *
 * @param version - Versión del algoritmo
 * @returns true si la versión es válida
 */
export function validateEncryptionVersion(version: string): boolean {
  return version === "1.0";
}

