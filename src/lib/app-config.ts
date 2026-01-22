import { logger } from "@/lib/logger";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import { z } from "zod";

// Configuración de la aplicación - Separación Demo vs Producción
export interface AppConfig {
  mode: "demo" | "production";
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    demoCredentials: boolean;
    realAuth: boolean;
    adminAccess: boolean;
  };
  ui: {
    showDemoIndicator: boolean;
    demoLabel: string;
  };
}

// Cache para evitar múltiples llamadías y logs repetitivos
let cachedConfig: AppConfig | null = null;

// Obtener configuración desde variables de entorno
export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const mode = (import.meta.env.VITE_APP_MODE || "production") as
    | "demo"
    | "production";

  // Usar modo configurado directamente
  const realMode = mode;

  logger.info("?? Configuración de aplicación:", {
    mode,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL
      ? "✅ Configurada"
      : "❌ Faltante",
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? "✅ Configurada"
      : "❌ Faltante",
  });

  cachedConfig = {
    mode: realMode,
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || "https://demo.supabase.co",
      anonKey:
        import.meta.env.VITE_SUPABASE_ANON_KEY || "demo-anon-key-placeholder",
    },
    features: {
      demoCredentials: true, // Siempre permitir credenciales demo
      realAuth: realMode === "production", // Solo auth real en producción
      adminAccess: true, // Permitir acceso admin en ambos modos
    },
    ui: {
      showDemoIndicator: mode === "demo",
      demoLabel: mode === "demo" ? "(Demo)" : "",
    },
  };

  return cachedConfig;
};

// Credenciales demo permitidías (SOLO para demo)
export const DEMO_CREDENTIALS = [
  "single@outlook.es",
  "pareja@outlook.es",
];

// Función auxiliar para obtener contraseña desde env o fallback
const getPasswordFromEnv = (email: string): string | null => {
  // Convertir email a formato de variable de entorno
  // Ejemplo: single@outlook.es -> SINGLE_OUTLOOK_ES
  const envKey = email
    .toUpperCase()
    .replace("@", "_")
    .replace(".", "_")
    .replace("-", "_");

  // Buscar en variables de entorno primero
  const envPassword = import.meta.env[`VITE_DEMO_PASSWORD_${envKey}`];

  // Si no existe en env, NO usar fallback por seguridad
  return envPassword || null;
};

export const getProductionAdminEmails = (): string[] => {
  const envList = (import.meta.env.VITE_PROD_ADMIN_EMAILS as string | undefined)
    ?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envList && envList.length > 0) return envList;

  const primary = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)
    ?.trim()
    .toLowerCase();
  const secondary = (import.meta.env.VITE_PROD_ADMIN_EMAIL_2 as string | undefined)
    ?.trim()
    .toLowerCase();

  return [primary, secondary].filter((e): e is string => Boolean(e));
};

// Función para verificar si es credencial demo
export const isDemoCredential = (email: string): boolean => {
  try {
    // Validar formato de email con Zod
    const emailSchema = z.string().email();
    emailSchema.parse(email);
    
    const normalizedEmail = email.toLowerCase().trim();
    return DEMO_CREDENTIALS.includes(normalizedEmail);
  } catch (error) {
    return false;
  }
};

// Función para verificar si es admin de producción
export const isProductionAdmin = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return getProductionAdminEmails().includes(normalizedEmail);
};

// Función para verificar si es admin demo (admin Y djwacko28@gmail.com)
export const isDemoAdmin = (email: string): boolean => {
  void email;
  return false;
};

// Función para obtener contraseña demo - USA VARIABLES DE ENTORNO
export const getDemoPassword = (email: string): string | null => {
  const normalizedEmail = email
    .toLowerCase()
    .trim()
    .replace("@otlook.es", "@outlook.es")
    .replace("@outllok.es", "@outlook.es")
    .replace("@outlok.es", "@outlook.es")
    .replace("@outook.es", "@outlook.es");

  // Usar función auxiliar que consulta env primero, luego fallback
  return getPasswordFromEnv(normalizedEmail);
};

// Función para obtener contraseña de producción - USA VARIABLES DE ENTORNO
export const getProductionPassword = (email: string): string | null => {
  const normalizedEmail = email.toLowerCase().trim();
  if (!isProductionAdmin(normalizedEmail)) return null;
  return import.meta.env.VITE_PROD_PASSWORD_COMPLICESCONECTASW || null;
  return null;
};

// Función centralizada para manejar autenticación demo (SIN )
export const handleDemoAuth = (
  email: string,
  accountType: string = "single",
) => {
  if (!isDemoCredential(email)) {
    logger.info("❌ Email no es credencial demo:", { email });
    return null;
  }

  // Bloquear admins de producción en modo demo
  if (isProductionAdmin(email)) {
    logger.info("🚫 Credencial de producción bloqueada en modo demo");
    return null;
  }

  // Configurar accountType específico para admins
  const finalAccountType = accountType;

  const demoUser = {
    id: generateDemoUserUUID(email),
    email: email.toLowerCase().trim(),
    role: "user",
    accountType: finalAccountType,
    first_name:
      email === "single@outlook.es"
          ? "Sofía"
          : email === "pareja@outlook.es"
            ? "Carmen & Roberto"
              : email.split("@")[0],
    is_demo: true,
    created_at: new Date().toISOString(),
  };

  const demoSession = {
    user: demoUser,
    access_token: `demo-token-${Date.now()}`,
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Store authentication flag AND user data in localStorage for Navigation
  localStorage.setItem("demo_authenticated", "true");
  localStorage.setItem("userType", demoUser.accountType || demoUser.role);
  localStorage.setItem("demo_user", JSON.stringify(demoUser));

  logger.info("🎭 Demo user stored in localStorage:", { email, demoUser });

  logger.info("🎭 Sesión demo creada", { email, tipo: finalAccountType });

  return { user: demoUser, session: demoSession };
};

// Función para limpiar sesión demo
export const clearDemoAuth = () => {
  localStorage.removeItem("demo_authenticated");
  localStorage.removeItem("userType");
  localStorage.removeItem("demo_user");
  logger.info("🧹 Sesión demo limpiada");
};

// Función para verificar sesión demo existente
export const checkDemoSession = () => {
  const demoAuth = localStorage.getItem("demo_authenticated");

  // Solo verificar flag de autenticación - datos no se almacenan en localStorage
  if (demoAuth === "true") {
    // Retornar null para forzar recreación de sesión demo
    // Los datos se mantienen solo en memoria durante la sesión activa
    return null;
  }

  return null;
};

// Función para verificar si estamos en modo demo
export const isDemoMode = () => {
  const config = getAppConfig();
  const demoAuth = localStorage.getItem("demo_authenticated");
  return config.mode === "demo" || demoAuth === "true";
};

// Función para verificar si debemos usar Supabase real
export const shouldUseRealSupabase = () => {
  const config = getAppConfig();
  const demoAuth = localStorage.getItem("demo_authenticated");

  logger.info("🔍 shouldUseRealSupabase", { modo: config.mode, demoAuth });

  // En modo producción, SIEMPRE usar Supabase real
  // No importa si hay datos demo en localStorage
  if (config.mode === "production") {
    logger.info("🏢 Modo producción - usando Supabase real siempre");
    return true;
  }

  // En modo demo, solo usar Supabase para admins
  if (demoAuth === "true") {
    const demoUser = localStorage.getItem("demo_user");
    if (demoUser) {
      try {
        const user = JSON.parse(demoUser);
        const useSupabase = user.role === "admin";
        logger.info("🎭 Usuario demo", {
          email: user.email,
          admin: user.role === "admin",
          usarSupabase: useSupabase,
        });
        return useSupabase;
      } catch (error) {
        logger.error("❌ Error parsing demo user", {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }
  }

  logger.info("✅ Usando Supabase real por defecto");
  return true;
};

// Configuración global de la app
export const appConfig = getAppConfig();

// Log de configuración inicial
logger.info("🚀 ComplicesConecta iniciado", { modo: appConfig.mode });
if (appConfig.mode === "demo") {
  logger.info("🎭 Modo demo activo - credenciales de prueba habilitadías");
} else {
  logger.info("🔐 Modo producción activo - autenticación real requerida");
}

