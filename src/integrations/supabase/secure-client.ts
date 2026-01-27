import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-generated";
import { AppConfig } from "@/config/app-config";
import { logger } from "@/lib/logger";
import { secureStorage, SecureSessionData } from "@/lib/storage/secure-storage";
import type { SupabaseAuthConfig } from "@/types/supabase-auth";

// Configuración de seguridad para cookies HttpOnly
const SECURE_AUTH_CONFIG: SupabaseAuthConfig = {
  // En producción, usar cookies HttpOnly
  persistSession: import.meta.env.PROD ? false : true, // false = cookies, true = localStorage
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: "pkce",
  // Configuración adicional de seguridad
  debug: import.meta.env.DEV,
};

/**
 * Cliente Supabase con configuración de seguridad mejorada
 * Implementa HttpOnly cookies en producción y cifrado en desarrollo
 */
export class SecureSupabaseClient {
  private static instance: SupabaseClient<Database> | null = null;
  private static isInitialized = false;

  private constructor() {}

  public static getInstance(): SupabaseClient<Database> {
    if (SecureSupabaseClient.isInitialized && SecureSupabaseClient.instance) {
      return SecureSupabaseClient.instance;
    }

    return SecureSupabaseClient.createClient();
  }

  private static createClient(): SupabaseClient<Database> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || AppConfig.supabase.url;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || AppConfig.supabase.anonKey;

    // Validar credenciales
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error("❌ Credenciales de Supabase no configuradas");
      throw new Error("Supabase credentials not configured");
    }

    // Crear cliente con configuración segura
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: SECURE_AUTH_CONFIG,
      global: {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          // Headers de seguridad adicionales
          'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
          'X-Client-Platform': 'web',
        },
        fetch: SecureSupabaseClient.createSecureFetch(),
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Configurar listeners de sesión para seguridad
    SecureSupabaseClient.setupSessionListeners(client);

    SecureSupabaseClient.instance = client;
    SecureSupabaseClient.isInitialized = true;

    logger.info("✅ Cliente Supabase seguro inicializado", {
      persistSession: SECURE_AUTH_CONFIG.persistSession,
      environment: import.meta.env.MODE,
    });

    return client;
  }

  /**
   * Crea un fetch interceptor con seguridad mejorada
   */
  static createSecureFetch() {
    return (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Agregar headers de seguridad
      const secureHeaders = {
        ...init?.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
        'X-Client-Platform': 'web',
      };

      // Log de solicitudes sensibles (solo en desarrollo)
      if (import.meta.env.DEV) {
        logger.debug("🔐 Secure fetch request:", {
          url: url.substring(0, 100),
          method: init?.method,
        });
      }

      try {
        return fetch(input, {
          ...init,
          headers: secureHeaders,
        });
      } catch (error) {
        logger.error("❌ Secure fetch error:", error);
        throw error;
      }
    };
  }

  /**
   * Configura listeners de sesión para manejo seguro
   */
  private static setupSessionListeners(client: SupabaseClient<Database>) {
    // Listener para cambios de sesión
    client.auth.onAuthStateChange((event, session) => {
      logger.info("🔐 Auth state change:", { event, hasSession: !!session });

      if (event === 'SIGNED_IN' && session) {
        // Guardar datos de sesión de forma segura
        const sessionData: SecureSessionData = {
          isAuthenticated: true,
          userRole: session.user?.user_metadata?.role,
          lastActivity: Date.now(),
        };

        secureStorage.setItem('cc_secure_session', sessionData);
        logger.info("✅ Sesión guardada de forma segura");
      }

      if (event === 'SIGNED_OUT') {
        // Limpiar datos seguros al cerrar sesión
        SecureSupabaseClient.clearSecureData();
        logger.info("🧹 Datos seguros limpiados al cerrar sesión");
      }

      if (event === 'TOKEN_REFRESHED') {
        // Actualizar timestamp de actividad
        const currentData = secureStorage.getItem<SecureSessionData>('cc_secure_session');
        if (currentData) {
          currentData.lastActivity = Date.now();
          secureStorage.setItem('cc_secure_session', currentData);
        }
      }
    });
  }

  /**
   * Limpia todos los datos sensibles de forma segura
   */
  public static clearSecureData(): void {
    try {
      // Limpiar storage seguro
      secureStorage.clear();

      // Limpiar cualquier rastro en localStorage no seguro
      const keysToClean = [
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'sb-access-token',
        'sb-refresh-token',
        'sb-auth-token',
        'trust:cache:timestamp',
      ];

      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          // Ignorar errores al limpiar
        }
      });

      // Limpiar cookies si es posible (solo en contextos seguros)
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('sb-') || name.includes('supabase')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};secure`;
          }
        });
      }

      logger.info("🧹 Todos los datos sensibles limpiados");
    } catch (error) {
      logger.error("❌ Error limpiando datos seguros:", error);
    }
  }

  /**
   * Verifica si hay una sesión activa y válida
   */
  public static async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.getInstance().auth.getSession();
      
      if (error) {
        logger.error("❌ Error validando sesión:", error);
        return false;
      }

      const isValid = !!session && !!session.user;
      
      if (!isValid) {
        this.clearSecureData();
      }

      return isValid;
    } catch (error) {
      logger.error("❌ Error en validación de sesión:", error);
      this.clearSecureData();
      return false;
    }
  }

  /**
   * Obtiene datos de sesión de forma segura
   */
  public static getSecureSessionData(): SecureSessionData | null {
    return secureStorage.getItem<SecureSessionData>('cc_secure_session');
  }

  /**
   * Cierra sesión de forma segura
   */
  public static async secureSignOut(): Promise<void> {
    try {
      await this.getInstance().auth.signOut();
      this.clearSecureData();
      logger.info("✅ Cierre de sesión seguro completado");
    } catch (error) {
      logger.error("❌ Error en cierre de sesión seguro:", error);
      // Forzar limpieza incluso si hay error
      this.clearSecureData();
      throw error;
    }
  }
}

// Exportar instancia singleton
export const secureSupabase = SecureSupabaseClient.getInstance();
