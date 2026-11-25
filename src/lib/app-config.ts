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

// Cache para evitar múltiples llamadas y logs repetitivos
let cachedConfig: AppConfig | null = null;

// Obtener configuración desde variables de entorno
export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const mode = (import.meta.env.VITE_APP_MODE || "production") as
    "demo" | "production";

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

// Credenciales demo permitidas (SOLO para demo)
export const DEMO_CREDENTIALS = ["single@outlook.es", "pareja@outlook.es"];

// C4/C5 (2026-11-19): las contraseñas demo/admin/producción se eliminaron del
// bundle. No existe ninguna función que lea VITE_*_PASSWORD en el cliente.
// El login real es Supabase Auth (signInWithPassword); el modo demo es
// local y sin contraseña, y nunca otorga admin.

export const getProductionAdminEmails = (): string[] => {
  const envList = (import.meta.env.VITE_PROD_ADMIN_EMAILS as string | undefined)
    ?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envList && envList.length > 0) return envList;

  const primary = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)
    ?.trim()
    .toLowerCase();
  const secondary = (
    import.meta.env.VITE_PROD_ADMIN_EMAIL_2 as string | undefined
  )
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

// Función para verificar si es admin demo (admin Y admin2)
export const isDemoAdmin = (email: string): boolean => {
  void email;
  return false;
};

// C4/C5 (2026-11-19): getDemoPassword y getProductionPassword se eliminaron.
// Eran código muerto / inseguro: leían contraseñas de variables VITE_*,
// que se incrustan en el bundle del navegador y por tanto no son secretas.
// El login real es Supabase Auth; el modo demo es local y sin contraseña.

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

  // C3: accountType limitado a "single"/"couple". Un "admin" forjado nunca
  // se persiste en demo_user: el modo demo no tiene administradores.
  const finalAccountType = accountType === "couple" ? "couple" : "single";

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

// Tipo de cuenta demo guardado en `demo_user` (localStorage).
//
// El objeto cambia de forma según quién lo escribió: handleDemoAuth lo
// guarda con `accountType`, pero el signIn de useAuth lo reescribe con
// forma de Profile (`profile_type` / `relationship_type`, sin
// `accountType`). Leer solo `accountType` hacía que una sesión de pareja
// resolviera como single (el editor single mostraba un mock aleatorio, el
// engranaje abría el editor equivocado y el balance demo era el de single).
// Resolver con todas las variantes conocidas; el email es el último
// respaldo (la identidad demo siempre trae su email).
export type DemoAccountType = "single" | "couple";

export const resolveDemoAccountType = (
  user: unknown,
): DemoAccountType | null => {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;
  for (const key of [
    "accountType",
    "type",
    "profile_type",
    "relationship_type",
  ]) {
    const value = u[key];
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "couple") return "couple";
      if (normalized === "single") return "single";
    }
  }
  const email = typeof u.email === "string" ? u.email.toLowerCase().trim() : "";
  if (email === "pareja@outlook.es") return "couple";
  if (email === "single@outlook.es") return "single";
  return null;
};

/**
 * Ronda 9, stream D: tipo de cuenta de la SESIÓN demo actual, leído
 * de localStorage (`demo_user` y, como respaldo, la clave `userType`
 * que escriben `handleDemoAuth` y `restoreLocalDemoSession`).
 *
 * Por qué hace falta: en la ruta de inicialización de `useAuth` el
 * `user` (mock) se construye solo con `{id, email}` — sin
 * `accountType` ni `profile_type` — y el `email.includes("couple")`
 * de `useTokens` tampoco cubre `pareja@outlook.es` ni las cuentas
 * `@demo.local` creadas por registro. Una sesión de pareja resolvía
 * como single y /tokens mostraba la wallet de Sofía (test ronda 8:
 * CMPX 1350 / GTK 850 / 4 NFTs en sesión de pareja, en vez de
 * 2000 / 1500 / 2). Las páginas de perfil no caían en esto porque
 * hardcodean su propio tipo ("single"/"couple").
 */
export const resolveStoredDemoAccountType = (): DemoAccountType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("demo_user");
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const fromUser = resolveDemoAccountType(parsed);
      if (fromUser) return fromUser;
    }
    const rawUserType = window.localStorage.getItem("userType");
    if (rawUserType) {
      // El valor puede venir entrecomillado ('"couple"'): el setter
      // de usePersistedState de DemoSelector serializa con
      // JSON.stringify, mientras los lectores comparan en crudo.
      const userType = rawUserType.replace(/^"|"$/g, "");
      if (userType === "couple" || userType === "single") return userType;
    }
  } catch {
    // demo_user corrupto o sin almacenamiento: sin veredicto.
  }
  return null;
};

/**
 * Tipo de cuenta demo del usuario actual, en orden de fiabilidad:
 * perfil cargado (`useAuth` lo resuelve desde `demo_user`) → `user`
 * de la sesión → `demo_user`/`userType` de localStorage. `null` si
 * ninguna fuente dice el tipo (el llamador decide el fallback).
 */
export const resolveCurrentDemoAccountType = (
  profile: unknown,
  user: unknown,
): DemoAccountType | null =>
  resolveDemoAccountType(profile) ??
  resolveDemoAccountType(user) ??
  resolveStoredDemoAccountType();

// Claves demo conocidas (exactas) y prefijos de datos demo por
// conversación/usuario. /demo promete que los datos demo no se guardan
// tras cerrar sesión; antes solo se borraban 3 claves y todo lo demás
// (chats, ajustes de privacidad, NFTs demo, wallet demo, historias)
// persistía tras el logout.
const DEMO_STORAGE_KEYS = [
  "demo_authenticated",
  "demo_user",
  "demo-user",
  "demo_stories",
  "userType",
  "wallet_demo_created",
] as const;

const DEMO_STORAGE_PREFIXES = [
  "demo_",
  "demo-",
  "chat_messages:",
  "single_privacy:",
  "couple_privacy:",
  "demo_nfts:",
  "demo_nfts_updated:",
] as const;

// Función para limpiar sesión demo
export const clearDemoAuth = () => {
  try {
    DEMO_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    // Barrido por prefijo (claves por chat/usuario, p. ej.
    // chat_messages:<id>, single_privacy:<userId>, demo_nfts:<uid>).
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    keys.forEach((key) => {
      if (DEMO_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
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

  // En modo demo, una sesión demo NUNCA activa Supabase real (C3).
  // Antes, un demo_user con role "admin" forjado en localStorage activaba
  // la ruta de Supabase real; ese privilegio ya no existe.
  if (demoAuth === "true") {
    logger.info("🎭 Sesión demo activa - Supabase real deshabilitado (C3)");
    return false;
  }

  logger.info("✅ Usando Supabase real por defecto");
  return true;
};

// Configuración global de la app
export const appConfig = getAppConfig();

// Log de configuración inicial
logger.info("🚀 ComplicesConecta iniciado", { modo: appConfig.mode });
if (appConfig.mode === "demo") {
  logger.info("🎭 Modo demo activo - credenciales de prueba habilitadas");
} else {
  logger.info("🔐 Modo producción activo - autenticación real requerida");
}
