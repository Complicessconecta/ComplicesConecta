import CryptoJS from 'crypto-js';

// Clave de encriptación derivada de variables de entorno o fallback
const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Servicio de almacenamiento seguro con cifrado AES
 * Protege datos sensibles en localStorage contra XSS y acceso no autorizado
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
   * Cifra datos usando AES-256 antes de guardarlos
   */
  private encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Descifra datos usando AES-256
   */
  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Guarda datos cifrados en localStorage
   */
  public setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = this.encrypt(serializedValue);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`Error setting secure item ${key}:`, error);
      throw new Error(`Failed to securely store ${key}`);
    }
  }

  /**
   * Obtiene y descifra datos desde localStorage
   */
  public getItem<T>(key: string): T | null {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;

      const decryptedValue = this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      // Si hay error de desencriptación, eliminar el dato corrupto
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Elimina un item del localStorage
   */
  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
    }
  }

  /**
   * Limpia todos los datos seguros
   */
  public clear(): void {
    try {
      // Solo eliminar keys que sabemos que son nuestros (prefijo específico)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cc_secure_') || key.startsWith('demo_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }

  /**
   * Verifica si un item existe
   */
  public hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Obtiene todos los keys seguros
   */
  public getKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cc_secure_') || key.startsWith('demo_'))) {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Exportar instancia singleton
export const secureStorage = SecureStorage.getInstance();

// Tipos para datos comunes
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
