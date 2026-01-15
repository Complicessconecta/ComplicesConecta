/**
 * Utilidades criptográficas para conversión de datos
 * 
 * Funciones auxiliares para convertir entre ArrayBuffer y Base64
 * Usadas por el sistema de encriptación
 */

/**
 * Convierte ArrayBuffer a string Base64
 * 
 * @param buffer - ArrayBuffer a convertir
 * @returns String en formato Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0);
  }
  return btoa(binary);
}

/**
 * Convierte string Base64 a ArrayBuffer
 * 
 * @param base64 - String en formato Base64
 * @returns ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convierte Uint8Array a string Base64
 * 
 * @param bytes - Uint8Array a convertir
 * @returns String en formato Base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const buffer = arrayBufferLikeToArrayBuffer(bytes.buffer);
  return arrayBufferToBase64(buffer);
}

/**
 * Convierte string Base64 a Uint8Array
 * 
 * @param base64 - String en formato Base64
 * @returns Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convierte ArrayBufferLike a ArrayBuffer
 * 
 * @param bufferLike - ArrayBufferLike a convertir
 * @returns ArrayBuffer
 */
export function arrayBufferLikeToArrayBuffer(bufferLike: ArrayBufferLike): ArrayBuffer {
  if (bufferLike instanceof ArrayBuffer) {
    return bufferLike;
  }
  // Si es SharedArrayBuffer, copiar a ArrayBuffer
  const uint8Array = new Uint8Array(bufferLike);
  const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(arrayBuffer).set(uint8Array);
  return arrayBuffer;
}
