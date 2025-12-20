📋 ANÁLISIS DE SEGURIDAD - app-config.ts
🔴 PROBLEMAS IDENTIFICADOS:
Línea 274: Logger expone lista completa de credenciales demo

typescript
logger.info('📝 Credenciales demo:', DEMO_CREDENTIALS);
Línea 277: Logger expone email de admin producción

typescript
logger.info('🏢 Credenciales producción:', { email: 'complicesconectasw@outlook.es' });
Líneas 70-75: Contraseñas hardcodeadas en el código (aunque con fallback a env vars)

typescript
const DEFAULT_DEMO_PASSWORDS: Record<string, string> = {
  'single@outlook.es': '123456',
  'pareja@outlook.es': '123456',
  'admin': '123456',
  'djwacko28@gmail.com': 'Magy_Wacko_nala28' // ⚠️ CRÍTICO
};
Línea 104 y 149: Contraseñas hardcodeadas como fallback

typescript
password: import.meta.env.VITE_PROD_PASSWORD_COMPLICESCONECTASW || 'Magy_Wacko_nala28'
✅ PROPUESTA DE SANITIZACIÓN
app-config.ts SANITIZADO:
typescript
import { logger } from '@/lib/logger';
// Configuración de la aplicación - Separación Demo vs Producción
export interface AppConfig {
  mode: 'demo' | 'production';
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
  
  const mode = (import.meta.env.VITE_APP_MODE || 'production') as 'demo' | 'production';
  
  // Usar modo configurado directamente
  const realMode = mode;
  
  // ✅ SANITIZADO: No loguear valores de keys, solo estado
  logger.info('🔧 Configuración de aplicación:', {
    mode,
    supabaseConfigured: !!import.meta.env.VITE_SUPABASE_URL,
    anonKeyConfigured: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });
  
  cachedConfig = {
    mode: realMode,
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder'
    },
    features: {
      demoCredentials: true,
      realAuth: realMode === 'production',
      adminAccess: true
    },
    ui: {
      showDemoIndicator: mode === 'demo',
      demoLabel: mode === 'demo' ? '(Demo)' : ''
    }
  };
  
  return cachedConfig;
};
// Credenciales demo permitidas - LEER DE ENV VARS
export const DEMO_CREDENTIALS = [
  import.meta.env.VITE_DEMO_EMAIL_1 || 'single@outlook.es',
  import.meta.env.VITE_DEMO_EMAIL_2 || 'pareja@outlook.es',
  import.meta.env.VITE_DEMO_EMAIL_ADMIN || 'admin',
  import.meta.env.VITE_DEMO_EMAIL_DJ || 'djwacko28@gmail.com'
];
// ❌ ELIMINADO: DEFAULT_DEMO_PASSWORDS - NO hardcodear contraseñas
// Las contraseñas SOLO deben venir de variables de entorno
// Función auxiliar para obtener contraseña desde env
const getPasswordFromEnv = (email: string): string | null => {
  const envKey = email.toUpperCase()
    .replace('@', '_')
    .replace('.', '_')
    .replace('-', '_');
  
  // ✅ SANITIZADO: Solo consultar env vars, sin fallback hardcodeado
  return import.meta.env[`VITE_DEMO_PASSWORD_${envKey}`] || null;
};
// Lista de emails admin para verificación rápida
const _ADMIN_EMAILS = [
  'admin',
  'djwacko28@gmail.com',
  'complicesconectasw@outlook.es'
];
// Configuración de credenciales para modo producción
export const productionCredentials = {
  email: import.meta.env.VITE_PROD_EMAIL || 'complicesconectasw@outlook.es',
  // ✅ SANITIZADO: Solo env var, sin fallback hardcodeado
  password: import.meta.env.VITE_PROD_PASSWORD || null
};
// Función para verificar si es credencial demo
export const isDemoCredential = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim()
    .replace('@otlook.es', '@outlook.es')
    .replace('@outllok.es', '@outlook.es')
    .replace('@outlok.es', '@outlook.es')
    .replace('@outook.es', '@outlook.es');
    
  return DEMO_CREDENTIALS.includes(normalizedEmail);
};
// Función para verificar si es admin de producción
export const isProductionAdmin = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return normalizedEmail === (import.meta.env.VITE_PROD_EMAIL || 'complicesconectasw@outlook.es');
};
// Función para verificar si es admin demo
export const isDemoAdmin = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return normalizedEmail === 'admin' || normalizedEmail === 'djwacko28@gmail.com';
};
// Función para obtener contraseña demo
export const getDemoPassword = (email: string): string | null => {
  const normalizedEmail = email.toLowerCase().trim()
    .replace('@otlook.es', '@outlook.es')
    .replace('@outllok.es', '@outlook.es')
    .replace('@outlok.es', '@outlook.es')
    .replace('@outook.es', '@outlook.es');
  
  return getPasswordFromEnv(normalizedEmail);
};
// Función para obtener contraseña de producción
export const getProductionPassword = (email: string): string | null => {
  const normalizedEmail = email.toLowerCase().trim();
  const prodEmail = import.meta.env.VITE_PROD_EMAIL || 'complicesconectasw@outlook.es';
  
  if (normalizedEmail === prodEmail) {
    return import.meta.env.VITE_PROD_PASSWORD || null;
  }
  return null;
};
// Función centralizada para manejar autenticación demo
export const handleDemoAuth = (email: string, accountType: string = 'single') => {
  const _config = getAppConfig();
  
  if (!isDemoCredential(email)) {
    logger.info('❌ Email no es credencial demo:', { email });
    return null;
  }
  
  const prodEmail = import.meta.env.VITE_PROD_EMAIL || 'complicesconectasw@outlook.es';
  if (email.toLowerCase().trim() === prodEmail) {
    logger.info('🚫 Email de producción no permitido en modo demo');
    return null;
  }
  
  const finalAccountType = isDemoAdmin(email) ? 'admin' : accountType;
  
  const demoUser = {
    id: `demo-${Date.now()}`,
    email: email.toLowerCase().trim(),
    role: isDemoAdmin(email) ? 'admin' : 'user',
    accountType: finalAccountType,
    first_name: email === 'admin' ? 'Admin Demo' : 
                email === 'single@outlook.es' ? 'Sofía' :
                email === 'pareja@outlook.es' ? 'Carmen & Roberto' :
                email === 'djwacko28@gmail.com' ? 'DJ Wacko' :
                email.split('@')[0],
    is_demo: true,
    created_at: new Date().toISOString()
  };
  
  const demoSession = {
    user: demoUser,
    access_token: `demo-token-${Date.now()}`,
    expires_at: Date.now() + (24 * 60 * 60 * 1000)
  };
  
  localStorage.setItem('demo_authenticated', 'true');
  localStorage.setItem('userType', demoUser.accountType || demoUser.role);
  localStorage.setItem('demo_user', JSON.stringify(demoUser));
  
  logger.info('🎭 Sesión demo creada', { email, tipo: finalAccountType });
  
  return { user: demoUser, session: demoSession };
};
// Función para limpiar sesión demo
export const clearDemoAuth = () => {
  localStorage.removeItem('demo_authenticated');
  localStorage.removeItem('userType');
  localStorage.removeItem('demo_user');
  logger.info('🧹 Sesión demo limpiada');
};
// Función para verificar sesión demo existente
export const checkDemoSession = () => {
  const demoAuth = localStorage.getItem('demo_authenticated');
  return demoAuth === 'true' ? null : null;
};
// Función para verificar si estamos en modo demo
export const isDemoMode = () => {
  const config = getAppConfig();
  const demoAuth = localStorage.getItem('demo_authenticated');
  return config.mode === 'demo' || demoAuth === 'true';
};
// Función para verificar si debemos usar Supabase real
export const shouldUseRealSupabase = () => {
  const config = getAppConfig();
  const demoAuth = localStorage.getItem('demo_authenticated');
  
  if (config.mode === 'production') {
    return true;
  }
  
  if (demoAuth === 'true') {
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      try {
        const user = JSON.parse(demoUser);
        return user.role === 'admin';
      } catch (error) {
        logger.error('❌ Error parsing demo user', { error: error instanceof Error ? error.message : String(error) });
        return false;
      }
    }
  }
  
  return true;
};
// Configuración global de la app
export const appConfig = getAppConfig();
// ✅ SANITIZADO: Log sin exponer credenciales
logger.info('🚀 ComplicesConecta iniciado', { modo: appConfig.mode });
if (appConfig.mode === 'demo') {
  logger.info('🎭 Modo demo activo - credenciales de prueba habilitadas');
} else {
  logger.info('🔐 Modo producción activo - autenticación real requerida');
}
✅ CONFIRMACIÓN DE ESTRATEGIA
ACCIÓN 1 - SANITIZAR app-config.ts:

✅ Eliminar línea 274: logger.info('📝 Credenciales demo:', DEMO_CREDENTIALS);
✅ Eliminar línea 277: logger.info('🏢 Credenciales producción:', { email: '...' });
✅ Eliminar línea 70-75: DEFAULT_DEMO_PASSWORDS (hardcodeadas)
✅ Cambiar línea 104 y 149: Fallback hardcodeado → solo env vars
✅ Cambiar línea 34-38: Logger no expone valores de keys, solo estado booleano
✅ Cambiar línea 61-66: DEMO_CREDENTIALS lee de env vars
ACCIÓN 2 - ELIMINAR showEnvInfo.ts:

✅ Eliminar archivo completo
✅ Buscar y eliminar importaciones en main.tsx y otros archivos
ACCIÓN 3 - LIMPIEZA:

✅ Sanitizar todos los logs que expongan credenciales o keys
¿Confirmas que proceda con estos cambios de hardening?