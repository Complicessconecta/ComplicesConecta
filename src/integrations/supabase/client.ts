import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-generated";
import { AppConfig } from "@/config/app-config";

// CRÍTICO: Importar logger de forma segura con fallback
import { logger } from "@/lib/logger";

// Fallback logger si el import falla (no debería pasar, pero por seguridad)
const safeLogger = logger || {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
};

// Obtener las credenciales de Supabase desde variables de entorno con fallback a AppConfig
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || AppConfig.supabase.url;
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
let supabaseInstance: SupabaseClient<Database> | null = null;

declare global {
  var __cc_supabaseClient:
    | SupabaseClient<Database>
    | null
    | undefined;
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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          apikey: supabaseAnonKey || "placeholder-key",
          Authorization: `Bearer ${supabaseAnonKey || "placeholder-key"}`,
        },
        fetch: (url, options = {}) => {
          // Solo bloquear Supabase para usuarios demo no-admin
          const demoAuth = localStorage.getItem("demo_authenticated");
          const demoUser = localStorage.getItem("demo_user");

          // Si hay sesión demo activa, permitir acceso básico
          if (demoAuth === "true" && demoUser) {
            try {
              const user = JSON.parse(demoUser);
              // Permitir acceso básico para usuarios demo (solo bloquear operaciones críticas)
              const isWriteOperation =
                options?.method &&
                ["POST", "PUT", "PATCH", "DELETE"].includes(
                  options.method.toUpperCase(),
                );

              if (isWriteOperation && user.role !== "admin") {
                safeLogger.info(
                  "🚫 Bloqueando operación de escritura para usuario demo:",
                  { email: user.email, method: options.method },
                );
                return Promise.reject(
                  new Error("Demo mode - write operations restricted"),
                );
              } else {
                safeLogger.info("✅ Permitiendo acceso demo:", {
                  email: user.email,
                  method: options?.method || "GET",
                });
              }
            } catch {
              safeLogger.info(
                "🚫 Bloqueando Supabase - error parsing demo user",
                {},
              );
              return Promise.reject(
                new Error("Demo mode active - parse error"),
              );
            }
          }

          // Para usuarios de producción o admins demo, permitir Supabase
          safeLogger.info("🔗 Permitiendo llamada a Supabase:", {
            url: typeof url === "string" ? url.substring(0, 50) + "..." : url,
          });
          return fetch(url, {
            ...options,
            headers: {
              ...(options?.headers || {}),
              apikey: supabaseAnonKey || "placeholder-key",
              Authorization: `Bearer ${supabaseAnonKey || "placeholder-key"}`,
              "Access-Control-Allow-Origin": "*",
            },
          });
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    safeLogger.info("✅ Cliente de Supabase creado exitosamente", {
      url: finalUrl,
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

// Exportar la instancia única del cliente
// CRÍTICO: Crear instancia de forma segura sin bloquear la carga
const supabase: SupabaseClient<Database> = getSupabaseClient();

export { supabase };

// Verificar conectividad inicial y activar modo demo si es necesario
let isDemoMode = false;

// Solo intentar conectar a Supabase si no estamos en modo demo
const checkDemoMode = () => {
  const demoAuth = localStorage.getItem("demo_authenticated");
  return demoAuth === "true";
};

const initializeSupabase = async () => {
  // No bloquear el renderizado - ejecutar de forma asíncrona sin await
  setTimeout(async () => {
    if (!checkDemoMode()) {
      try {
        // Timeout de 5 segundos para evitar que se quede colgado
        const timeoutPromise: Promise<Error> = new Promise((resolve) => {
          setTimeout(() => resolve(new Error("Timeout")), 5000);
        });

        const sessionPromise = supabase.auth.getSession();

        const raceResult = await Promise.race([sessionPromise, timeoutPromise]);
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
      safeLogger.info("🔄 Modo demo activo - evitando conexión a Supabase", {});
    }
  }, 100); // Ejecutar después de 100ms para no bloquear el renderizado inicial
};

// Initialize on module load (no bloquea)
initializeSupabase();

export { isDemoMode };
