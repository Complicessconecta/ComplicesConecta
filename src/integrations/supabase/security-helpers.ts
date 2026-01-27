import { logger } from "@/lib/logger";
import { secureStorage, SecureSessionData } from "@/lib/storage/secure-storage";

/**
 * Helpers de seguridad para Supabase
 * Implementa funciones de limpieza y validación seguras
 */
export class SecurityHelpers {
  /**
   * Crea un fetch interceptor con seguridad mejorada
   */
  static createSecureFetch(supabaseAnonKey: string) {
    return (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Agregar headers de seguridad
      const secureHeaders = {
        ...init?.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
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
  static setupSessionListeners(client: any) {
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
        this.clearAllSecureData();
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
   * Limpia todos los datos sensibles de forma completa
   */
  static clearAllSecureData(): void {
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
        'supabase.project.ref',
        'supabase.auth.expires_at',
        'supabase.auth.expires_in',
      ];

      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          // Ignorar errores al limpiar
        }
      });

      // Limpiar cookies si es posible
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('sb-') || name.includes('supabase')) {
            // Limpiar cookie en todos los dominios posibles
            const domains = [
              window.location.hostname,
              `.${window.location.hostname}`,
              'localhost',
              '.localhost',
            ];

            domains.forEach(domain => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain};secure`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
            });
          }
        });
      }

      // Limpiar variables globales
      if (typeof window !== 'undefined') {
        delete (window as any).__supabaseUser;
        delete (window as any).__supabaseSession;
      }

      logger.info("🧹 Todos los datos sensibles limpiados completamente");
    } catch (error) {
      logger.error("❌ Error limpiando datos seguros:", error);
    }
  }

  /**
   * Verifica si hay una sesión activa y válida
   */
  static async validateSession(client: any): Promise<boolean> {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        logger.error("❌ Error validando sesión:", error);
        return false;
      }

      const isValid = !!session && !!session.user;
      
      if (!isValid) {
        this.clearAllSecureData();
      }

      return isValid;
    } catch (error) {
      logger.error("❌ Error en validación de sesión:", error);
      this.clearAllSecureData();
      return false;
    }
  }

  /**
   * Cierra sesión de forma segura
   */
  static async secureSignOut(client: any): Promise<void> {
    try {
      await client.auth.signOut();
      this.clearAllSecureData();
      logger.info("✅ Cierre de sesión seguro completado");
    } catch (error) {
      logger.error("❌ Error en cierre de sesión seguro:", error);
      // Forzar limpieza incluso si hay error
      this.clearAllSecureData();
      throw error;
    }
  }

  /**
   * Detecta posibles riesgos de secuestro de sesión
   */
  static detectSessionHijacking(): boolean {
    try {
      const sessionData = secureStorage.getItem<SecureSessionData>('cc_secure_session');
      
      if (!sessionData) {
        return false;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - sessionData.lastActivity;
      
      // Si la última actividad fue hace más de 1 hora, es sospechoso
      const oneHour = 60 * 60 * 1000;
      if (timeSinceLastActivity > oneHour) {
        logger.warn("⚠️ Posible secuestro de sesión detectado - inactividad prolongada", {
          lastActivity: new Date(sessionData.lastActivity),
          timeSinceLastActivity: timeSinceLastActivity,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("❌ Error detectando secuestro de sesión:", error);
      return true; // Asumir riesgo si hay error
    }
  }

  /**
   * Implementa timeout de sesión por inactividad
   */
  static setupInactivityTimeout(timeoutMs: number = 30 * 60 * 1000): () => void {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logger.warn("⏰ Sesión cerrada por inactividad");
        this.clearAllSecureData();
        window.location.href = '/auth';
      }, timeoutMs);
    };

    // Eventos que resetean el timeout
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Iniciar timeout
    resetTimeout();

    // Retornar función de limpieza
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }

  /**
   * Verifica si el entorno es seguro
   */
  static isSecureEnvironment(): boolean {
    try {
      // Verificar HTTPS en producción
      if (import.meta.env.PROD && window.location.protocol !== 'https:') {
        logger.warn("⚠️ Ambiente inseguro: HTTP en producción");
        return false;
      }

      // Verificar si hay extensiones sospechosas (solo en desarrollo)
      if (import.meta.env.DEV) {
        const hasSuspiciousExtensions = this.detectSuspiciousExtensions();
        if (hasSuspiciousExtensions) {
          logger.warn("⚠️ Extensiones sospechosas detectadas");
        }
      }

      return true;
    } catch (error) {
      logger.error("❌ Error verificando entorno seguro:", error);
      return false;
    }
  }

  /**
   * Detecta extensiones de navegador sospechosas (solo para desarrollo)
   */
  private static detectSuspiciousExtensions(): boolean {
    try {
      // Lista de extensiones comunes que podrían ser riesgosas
      const suspiciousPatterns = [
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
      ];

      // Verificar si hay scripts de extensiones inyectados
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const src = script.src || '';
        if (suspiciousPatterns.some(pattern => src.includes(pattern))) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
