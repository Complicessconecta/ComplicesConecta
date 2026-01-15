/**
 * Configuración de encriptación para datos sensibles
 * 
 * NOTA DE SEGURIDAD CRÍTICA:
 * - Client-side encryption NO protege contra XSS, malware o acceso físico al dispositivo
 * - Solo mitiga exposición en reposo si el atacante no tiene la sesión activa
 * - Para protección real, usar encriptación del lado del servidor + TLS
 * 
 * Mejoras de seguridad 2025-2026:
 * - Iteraciones PBKDF2 aumentadas a 600000 (recomendado NIST 2025+ para resistencia a GPU/ASIC brute-force)
 * - Password base mejorado con constante de aplicación + userId
 * - IV único y aleatorio garantizado por cada encrypt
 */

/**
 * Configuración de encriptación usando AES-GCM + PBKDF2
 * 
 * Por qué 600000+ iteraciones:
 * - NIST SP 800-132 recomienda mínimo 10000 para 2011, pero para 2025+ se recomienda 600000+
 * - GPU/ASIC modernos pueden hacer ~1M hashes/segundo, por lo que 100k es insuficiente
 * - 600k iteraciones proporciona ~60x más resistencia a brute-force que 10k original
 */
export const ENCRYPTION_CONFIG = {
  algorithm: "AES-GCM" as const,
  keyLength: 256,
  ivLength: 12,
  tagLength: 16,
  iterations: 600000, // PBKDF2 iterations - Aumentado para resistencia a GPU/ASIC brute-force (NIST 2025+)
  saltLength: 16,
} as const;

/**
 * Tipos de datos que requieren encriptación
 * 
 * Clasificación por sensibilidad:
 * - PROFILE_PRIVATE: Datos personales no públicos
 * - CONTACT_INFO: Información de contacto (email, teléfono)
 * - LOCATION_DATA: Ubicación y datos geográficos
 * - TOKEN_BALANCE: Saldo de tokens CMPX/GTK
 * - TRANSACTION_HISTORY: Historial de transacciones
 * - STAKING_INFO: Información de staking
 * - CHAT_MESSAGES: Mensajes de chat privados
 * - PRIVATE_NOTES: Notas privadas del usuario
 * - USER_PREFERENCES: Preferencias del usuario
 * - SECURITY_SETTINGS: Configuraciones de seguridad
 */
export const SENSITIVE_DATA_TYPES = {
  // Datos de perfil sensibles
  PROFILE_PRIVATE: "profile_private",
  CONTACT_INFO: "contact_info",
  LOCATION_DATA: "location_data",

  // Datos de tokens y transacciones
  TOKEN_BALANCE: "token_balance",
  TRANSACTION_HISTORY: "transaction_history",
  STAKING_INFO: "staking_info",

  // Datos de chat y comunicación
  CHAT_MESSAGES: "chat_messages",
  PRIVATE_NOTES: "private_notes",

  // Configuraciones sensibles
  USER_PREFERENCES: "user_preferences",
  SECURITY_SETTINGS: "security_settings",
} as const;

/**
 * Constante de aplicación para mejorar la derivación de clave
 * 
 * Esta constante se combina con userId para crear una base de password más fuerte
 * que simplemente `complices_${userId}_encryption_key`
 * 
 * NOTA: En producción, esto debería ser un valor único por deployment o
 * almacenado en variables de entorno del servidor
 */
export const APP_ENCRYPTION_SALT = "complices_connect_v3_9_1_secure_salt_2026";

/**
 * Versión del algoritmo de encriptación
 * 
 * Se usa para detectar cambios en el algoritmo y manejar migraciones
 */
export const ENCRYPTION_VERSION = "1.0" as const;

/**
 * Versión fallback para navegadores sin Web Crypto API
 */
export const ENCRYPTION_FALLBACK_VERSION = "fallback" as const;
