import { logger } from "@/lib/logger";
import { secureStorage } from "@/lib/storage/secure-storage";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase-generated";
import { CertificatePinning } from "@/security/certificate-pinning";

/**
 * C4/C5 (2026-11-19): la sesión ya NO se copia a localStorage. La única
 * fuente de sesión es Supabase Auth (getSession, en memoria). La última
 * actividad solo se guarda en memoria (para detectSessionHijacking) y se
 * pierde al recargar la página, lo cual es el comportamiento seguro.
 * clearAllSecureData elimina además la clave legacy `cc_secure_session`.
 */

// Última actividad de sesión, SOLO en memoria (nunca en localStorage).
let lastActivityTimestamp: number | null = null;

/**
 * Helpers de seguridad para Supabase
 * Implementa funciones de limpieza y validación seguras
 */
export class SecurityHelpers {
  /**
   * Crea un fetch interceptor con seguridad mejorada
   */
  static createSecureFetch(supabaseAnonKey: string) {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();

      await CertificatePinning.validateRequestUrl(url);
      
      // Agregar headers de seguridad.
      // C2 (2026-11-19): NO sobrescribir un Authorization que ya trae el
      // llamador. supabase-js pone el JWT de sesión en functions.invoke y
      // los llamadores también pueden pasarlo explícito; antes, la línea
      // de abajo reemplazaba cualquier JWT por la anon key, así que TODAS
      // las Edge Functions con auth (C2) recibían 401 aunque el llamador
      // hiciera todo bien. La anon key solo es el valor por defecto
      // cuando nadie puso Authorization (PostgREST/Auth/Realtime, donde
      // la anon key sí es la credencial correcta).
      const secureHeaders = new Headers(init?.headers);
      if (!secureHeaders.has("apikey")) {
        secureHeaders.set("apikey", supabaseAnonKey);
      }
      if (!secureHeaders.has("Authorization")) {
        secureHeaders.set("Authorization", `Bearer ${supabaseAnonKey}`);
      }
      secureHeaders.set("X-Requested-With", "XMLHttpRequest");
      secureHeaders.set("Cache-Control", "no-cache");
      secureHeaders.set("Pragma", "no-cache");
      secureHeaders.set(
        "X-Client-Version",
        import.meta.env.VITE_APP_VERSION || "1.0.0",
      );
      secureHeaders.set("X-Client-Platform", "web");

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
        logger.error("❌ Secure fetch error:", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }

  /**
   * Configura listeners de sesión para manejo seguro.
   * C4/C5 (2026-11-19): ya NO se guarda ninguna copia de la sesión en
   * localStorage (antes: secureStorage.setItem('cc_secure_session', ...)).
   * La sesión vive solo en Supabase Auth (memoria); aquí solo se actualiza
   * el timestamp de actividad en memoria.
   */
  static setupSessionListeners(client: SupabaseClient<Database>) {
    client.auth.onAuthStateChange((event, session) => {
      logger.info("🔐 Auth state change:", { event, hasSession: !!session });

      if (event === 'SIGNED_IN' && session) {
        // Solo memoria: registrar actividad, sin persistir sesión.
        lastActivityTimestamp = Date.now();
        logger.info("✅ Sesión iniciada (solo en memoria, sin copia en localStorage)");
      }

      if (event === 'SIGNED_OUT') {
        // Limpiar datos seguros al cerrar sesión
        lastActivityTimestamp = null;
        this.clearAllSecureData();
        logger.info("🧹 Datos seguros limpiados al cerrar sesión");
      }

      if (event === 'TOKEN_REFRESHED') {
        // Actualizar timestamp de actividad solo en memoria
        lastActivityTimestamp = Date.now();
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
        // C4/C5: clave legacy de sesión copiada a localStorage (ya no se crea;
        // se elimina aquí para limpiar navegadores con sesiones viejas).
        'cc_secure_session',
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
        delete window.__supabaseUser;
        delete window.__supabaseSession;
      }

      logger.info("🧹 Todos los datos sensibles limpiados completamente");
    } catch (error) {
      logger.error("❌ Error limpiando datos seguros:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Verifica si hay una sesión activa y válida
   */
  static async validateSession(client: SupabaseClient<Database>): Promise<boolean> {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        logger.error("❌ Error validando sesión:", {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }

      const isValid = !!session && !!session.user;
      
      if (!isValid) {
        this.clearAllSecureData();
      }

      return isValid;
    } catch (error) {
      logger.error("❌ Error en validación de sesión:", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.clearAllSecureData();
      return false;
    }
  }

  /**
   * Cierra sesión de forma segura
   */
  static async secureSignOut(client: SupabaseClient<Database>): Promise<void> {
    try {
      await client.auth.signOut();
      this.clearAllSecureData();
      logger.info("✅ Cierre de sesión seguro completado");
    } catch (error) {
      logger.error("❌ Error en cierre de sesión seguro:", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Forzar limpieza incluso si hay error
      this.clearAllSecureData();
      throw error;
    }
  }

  /**
   * Detecta posibles riesgos de secuestro de sesión.
   * C4/C5 (2026-11-19): la última actividad se lee SOLO de memoria (antes:
   * secureStorage.getItem('cc_secure_session')). Sin actividad registrada
   * en esta sesión, no hay nada sospechoso que detectar.
   */
  static detectSessionHijacking(): boolean {
    try {
      if (lastActivityTimestamp === null) {
        return false;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTimestamp;
      
      // Si la última actividad fue hace más de 1 hora, es sospechoso
      const oneHour = 60 * 60 * 1000;
      if (timeSinceLastActivity > oneHour) {
        logger.warn("⚠️ Posible secuestro de sesión detectado - inactividad prolongada", {
          lastActivity: new Date(lastActivityTimestamp),
          timeSinceLastActivity: timeSinceLastActivity,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("❌ Error detectando secuestro de sesión:", {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.error("❌ Error verificando entorno seguro:", {
        error: error instanceof Error ? error.message : String(error),
      });
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
