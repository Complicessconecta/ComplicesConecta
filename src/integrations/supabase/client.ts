import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-generated";
import { AppConfig } from "@/config/app-config";
import { logger } from "@/lib/logger";
import { SecurityHelpers } from "./security-helpers";
import type { SupabaseAuthConfig } from "@/types/supabase-auth";

// CRÍTICO: Configuración de seguridad mejorada
const SECURE_AUTH_CONFIG: SupabaseAuthConfig = {
  // En producción usar HttpOnly cookies, en desarrollo localStorage cifrado
  persistSession: import.meta.env.PROD ? false : true, // false = cookies, true = localStorage
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: "pkce", // Tipo específico para TypeScript
  debug: false,
};

// Fallback logger si el import falla (no debería pasar, pero por seguridad)
type SafeLogArg =
  string | number | boolean | bigint | symbol | object | undefined;
const safeLogger = logger || {
  info: (...args: SafeLogArg[]) => console.log("[INFO]", ...args),
  warn: (...args: SafeLogArg[]) => console.warn("[WARN]", ...args),
  error: (...args: SafeLogArg[]) => console.error("[ERROR]", ...args),
};

// Supabase clients need the project root, not the REST endpoint.
// Ronda 9, stream E: sin variables (build local sin .env / preview sin
// vars en Vercel) la URL es `undefined` y `.replace` truena en el
// top-level del módulo. Este módulo lo evalúa al arrancar el chunk
// pages-chat, importado estáticamente por el bundle principal, así que
// el fallo deja la app en blanco en TODAS las rutas (ni /demo carga).
// Devolver "" deja que `isPlaceholderUrl` (que ya contempla !url) lo
// trate como stub, que es el comportamiento documentado para ese caso.
const normalizeSupabaseUrl = (url: string | undefined): string => {
  if (!url) return "";
  const trimmedUrl = url.replace(/\/+$/, "");
  return trimmedUrl.endsWith("/rest/v1")
    ? trimmedUrl.slice(0, -"/rest/v1".length)
    : trimmedUrl;
};

// Obtener las credenciales de Supabase desde variables de entorno con fallback a AppConfig
const supabaseUrl = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL || AppConfig.supabase.url,
);
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || AppConfig.supabase.anonKey;

// Validar que las variables de entorno estén configuradas
const isPlaceholderUrl =
  !supabaseUrl ||
  (typeof supabaseUrl === "string" &&
    (supabaseUrl.includes("your-supabase-url-here") ||
      supabaseUrl.includes("your_supabase_url_here") ||
      supabaseUrl.includes("placeholder") ||
      (!supabaseUrl.startsWith("http://") &&
        !supabaseUrl.startsWith("https://"))));
const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey.includes("your-supabase-anon-key-here") ||
  supabaseAnonKey.includes("your_supabase_anon_key_here") ||
  supabaseAnonKey.includes("placeholder-key");

// ¿Hay credenciales reales de Supabase? En los previews de Vercel las
// variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no están
// configuradas y el cliente es un stub cuya fetch siempre rechaza con
// "Supabase not configured - using stub client". Los flujos de registro
// y login deben consultar esto ANTES de llamar a supabase.auth y, si no
// hay backend, crear la cuenta demo local en vez de fallar con ese
// mensaje. Sin variables en Vercel, el registro real no puede funcionar:
// hace falta que Wacko las ponga en su panel de Vercel (ver reporte).
export const isSupabaseConfigured = !isPlaceholderUrl && !isPlaceholderKey;

if (isPlaceholderUrl || isPlaceholderKey) {
  safeLogger.warn(
    "⚠️ Variables de Supabase usando valores placeholder - activando modo demo",
    {
      urlConfigured: !isPlaceholderUrl,
      keyConfigured: !isPlaceholderKey,
    },
  );
  safeLogger.info("VITE_SUPABASE_URL:", {
    status:
      supabaseUrl && !isPlaceholderUrl
        ? "✅ Configurada"
        : "❌ Faltante/Placeholder",
  });
  safeLogger.info("VITE_SUPABASE_ANON_KEY:", {
    status:
      supabaseAnonKey && !isPlaceholderKey
        ? "✅ Configurada"
        : "❌ Faltante/Placeholder",
  });
  // No lanzar error, permitir modo demo
}

safeLogger.info("🔗 Conectando a Supabase:", { url: supabaseUrl });

// Variable global para almacenar la instancia única del cliente
let supabaseInstance: SupabaseClient<Database> | undefined;

// Variable para tracking de logs (solo para evitar spam)
// Nota: Esta variable se usa para controlar la frecuencia de logs en producción

declare global {
  var __cc_supabaseClient: SupabaseClient<Database> | undefined;
}

// Función para crear o retornar la instancia única del cliente
function getSupabaseClient(): SupabaseClient<Database> {
  if (globalThis.__cc_supabaseClient) {
    supabaseInstance = globalThis.__cc_supabaseClient;
    safeLogger.info("♻️ Reutilizando instancia global de Supabase", {});
    return supabaseInstance;
  }

  if (supabaseInstance) {
    safeLogger.info("♻️ Reutilizando instancia existente de Supabase", {});
    return supabaseInstance;
  }

  safeLogger.info("🆕 Creando nueva instancia de Supabase", {});

  // CRÍTICO: Validar y manejar errores de forma segura
  try {
    // Validar credenciales antes de crear cliente
    // Si es un placeholder, NO intentar crear el cliente (causará error de validación)
    if (isPlaceholderUrl || isPlaceholderKey) {
      safeLogger.warn(
        "⚠️ Credenciales de Supabase son placeholders - usando cliente stub",
        {
          urlPlaceholder: isPlaceholderUrl,
          keyPlaceholder: isPlaceholderKey,
        },
      );
      // Crear un cliente stub mínimo que no cause errores de validación
      // Usar una URL válida pero que no se usará realmente
      const stubUrl = "https://demo.supabase.co";
      const stubKey = "demo-anon-key-stub";
      supabaseInstance = createClient<Database>(stubUrl, stubKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: () =>
            Promise.reject(
              new Error("Supabase not configured - using stub client"),
            ),
        },
      });
      safeLogger.warn(
        "⚠️ Cliente stub de Supabase creado - modo demo activo",
        {},
      );
      globalThis.__cc_supabaseClient = supabaseInstance;
      return supabaseInstance;
    }

    // Si las credenciales son válidas, crear el cliente normalmente
    const finalUrl = supabaseUrl!;
    const finalKey = supabaseAnonKey!;

    supabaseInstance = createClient<Database>(finalUrl, finalKey, {
      auth: SECURE_AUTH_CONFIG,
      global: {
        headers: {
          apikey: supabaseAnonKey || "placeholder-key",
          Authorization: `Bearer ${supabaseAnonKey || "placeholder-key"}`,
          // Headers de seguridad adicionales
          "X-Requested-With": "XMLHttpRequest",
          "X-Client-Version": import.meta.env.VITE_APP_VERSION || "1.0.0",
        },
        fetch: SecurityHelpers.createSecureFetch(
          supabaseAnonKey || "placeholder-key",
        ),
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Configurar listeners de sesión para seguridad
    if (supabaseInstance) {
      SecurityHelpers.setupSessionListeners(supabaseInstance);
    }

    safeLogger.info("✅ Cliente de Supabase creado exitosamente", {
      url: finalUrl,
      persistSession: SECURE_AUTH_CONFIG.persistSession,
    });

    globalThis.__cc_supabaseClient = supabaseInstance;
    return supabaseInstance;
  } catch (error) {
    safeLogger.error("❌ Error crítico creando cliente de Supabase:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Crear cliente stub mínimo que no cause errores de validación
    try {
      const stubUrl = "https://demo.supabase.co";
      const stubKey = "demo-anon-key-stub";
      supabaseInstance = createClient<Database>(stubUrl, stubKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: () =>
            Promise.reject(
              new Error("Supabase not configured - using stub client"),
            ),
        },
      });
      safeLogger.warn("⚠️ Usando cliente stub de Supabase debido a error", {});
      globalThis.__cc_supabaseClient = supabaseInstance;
      return supabaseInstance;
    } catch (fallbackError) {
      safeLogger.error("❌ Error crítico creando cliente stub:", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      // Retornar un stub mínimo que no cause errores
      const stubUrl = "https://demo.supabase.co";
      const stubKey = "demo-anon-key-stub";
      supabaseInstance = createClient<Database>(stubUrl, stubKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: () =>
            Promise.reject(
              new Error("Supabase not configured - using stub client"),
            ),
        },
      });
      globalThis.__cc_supabaseClient = supabaseInstance;
      return supabaseInstance;
    }
  }
}

// Exportar el cliente de Supabase
export const supabase = getSupabaseClient();

// Verificar conectividad inicial y activar modo demo si es necesario
let isDemoMode = false;

// Solo intentar conectar a Supabase si no estamos en modo demo
const checkDemoMode = () => {
  const demoAuth = localStorage.getItem("demo_authenticated");
  return demoAuth === "true";
};

const initializeSupabase = async () => {
  // CORRECCIÓN: Manejar Promise correctamente
  try {
    // No bloquear el renderizado - ejecutar de forma asíncrona sin await
    setTimeout(async () => {
      if (!checkDemoMode()) {
        try {
          // CORRECCIÓN: Timeout configurable (10s dev, 5s prod)
          const timeoutMs = import.meta.env.DEV ? 10000 : 5000;
          const timeoutPromise: Promise<Error> = new Promise((resolve) => {
            setTimeout(() => resolve(new Error("Timeout")), timeoutMs);
          });

          const sessionPromise = supabase.auth.getSession();

          const raceResult = await Promise.race([
            sessionPromise,
            timeoutPromise,
          ]);
          if (raceResult instanceof Error) {
            safeLogger.warn("⚠️ Problema de conectividad con Supabase:", {
              error: raceResult.message,
            });
            if (
              raceResult.message.includes("Failed to fetch") ||
              raceResult.message.includes("CONNECTION_REFUSED") ||
              raceResult.message.includes("Invalid Refresh Token") ||
              raceResult.message.includes("Timeout")
            ) {
              isDemoMode = true;
              safeLogger.info("🔄 Activando modo demo offline", {});
            } else {
              safeLogger.info("✅ Conectado exitosamente a Supabase", {});
            }
            return;
          }

          if ("error" in raceResult && raceResult.error) {
            const _error = raceResult.error;
            safeLogger.warn("⚠️ Problema de conectividad con Supabase:", {
              error: _error.message,
            });
            if (
              _error.message.includes("Failed to fetch") ||
              _error.message.includes("CONNECTION_REFUSED") ||
              _error.message.includes("Invalid Refresh Token") ||
              _error.message.includes("Timeout")
            ) {
              isDemoMode = true;
              safeLogger.info("🔄 Activando modo demo offline", {});
            } else {
              safeLogger.info("✅ Conectado exitosamente a Supabase", {});
            }
          }
        } catch (err) {
          safeLogger.warn("⚠️ No se pudo verificar la sesión de Supabase:", {
            error: err instanceof Error ? err.message : String(err),
          });
          isDemoMode = true;
          safeLogger.info("🔄 Activando modo demo offline", {});
        }
      } else {
        isDemoMode = true;
        safeLogger.info(
          "🔄 Modo demo activo - evitando conexión a Supabase",
          {},
        );
      }
    }, 100); // Ejecutar después de 100ms para no bloquear el renderizado inicial
  } catch (error) {
    safeLogger.error("❌ Error crítico en initializeSupabase:", {
      error: error instanceof Error ? error.message : String(error),
    });
    isDemoMode = true;
  }
};

// CORRECCIÓN: Manejar Promise no manejada
initializeSupabase().catch((error) => {
  safeLogger.error("❌ Error no manejado en initializeSupabase:", {
    error: error instanceof Error ? error.message : String(error),
  });
  isDemoMode = true;
});

export { isDemoMode };
