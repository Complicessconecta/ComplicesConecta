import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-generated";
import { logger } from "@/lib/logger";

// Wrapper de seguridad para el logger
const safeLogger = logger || {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
};

let supabase: SupabaseClient<Database>;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // 1. AUDITORÍA DE INICIALIZACIÓN: Verificación estricta de variables de entorno
  if (!supabaseUrl || supabaseUrl.includes("your-supabase-url")) {
    throw new Error(
      "La variable de entorno VITE_SUPABASE_URL no está definida o es un placeholder.",
    );
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes("your-supabase-anon-key")) {
    throw new Error(
      "La variable de entorno VITE_SUPABASE_ANON_KEY no está definida o es un placeholder.",
    );
  }

  safeLogger.info("🔗 Inicializando cliente de Supabase...");

  // Creación del cliente de Supabase
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  safeLogger.info("✅ Cliente de Supabase creado exitosamente.");
} catch (error) {
  // GESTIÓN DE ERROR RUIDOSA: Si algo falla, se notifica de forma masiva.
  const errorMessage = `
  🚨🚨🚨 ERROR CRÍTICO DE INICIALIZACIÓN DE SUPABASE 🚨🚨🚨
  =============================================================
  No se pudo inicializar el cliente de Supabase. Esto usualmente
  se debe a que las variables de entorno no están disponibles
  o son incorrectas en el entorno de despliegue (Vercel).

  Asegúrate de que las siguientes variables estén configuradas
  en tu proveedor de hosting:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

  Error original: ${(error as Error).message}
  URL detectada: ${import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) ?? "NO DEFINIDA"}...
  Key detectada: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? "Presente" : "NO DEFINIDA"}
  Entorno: ${import.meta.env.MODE}
  =============================================================
  `;
  console.error(errorMessage);
  alert(
    "ERROR CRÍTICO: No se pudo conectar con Supabase. Revisa la consola (F12) para más detalles. Las variables de entorno podrían estar ausentes.",
  );

  // Se crea un cliente "stub" para evitar que la aplicación crashe por completo.
  // Cualquier intento de usar Supabase a partir de aquí fallará, pero la UI no morirá.
  supabase = createClient<Database>("https://error.supabase.co", "error-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: () => {
        console.error(
          "Se intentó usar el cliente de Supabase, pero falló al inicializar.",
        );
        return Promise.reject(
          new Error(
            "El cliente de Supabase no está configurado debido a un error de inicialización.",
          ),
        );
      },
    },
  });
  safeLogger.warn(
    "⚠️ Se ha creado un cliente STUB de Supabase para prevenir que la aplicación se rompa. Todas las llamadas a la API fallarán.",
  );
}

const isDemoMode = !import.meta.env.VITE_SUPABASE_URL;

export { supabase, isDemoMode };
