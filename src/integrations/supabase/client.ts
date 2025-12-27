import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-generated';
import { AppConfig } from '@/config/app-config';

// CRÃTICO: Importar logger de forma segura con fallback
import { logger } from '@/lib/logger';

// Fallback logger si el import falla (no deberÃ­a pasar, pero por seguridad)
const safeLogger = logger || {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

// Obtener las credenciales de Supabase desde variables de entorno con fallback a AppConfig
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || AppConfig.supabase.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || AppConfig.supabase.anonKey;

// Validar que las variables de entorno estÃ©n configuradas
const isPlaceholderUrl = !supabaseUrl || 
  (typeof supabaseUrl === 'string' && (
    supabaseUrl.includes('your-supabase-url-here') || 
    supabaseUrl.includes('your_supabase_url_here') ||
    supabaseUrl.includes('placeholder') ||
    (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))
  ));
const isPlaceholderKey = !supabaseAnonKey || 
  supabaseAnonKey.includes('your-supabase-anon-key-here') || 
  supabaseAnonKey.includes('your_supabase_anon_key_here') ||
  supabaseAnonKey.includes('placeholder-key');

if (isPlaceholderUrl || isPlaceholderKey) {
  safeLogger.warn('âš ï¸ Variables de Supabase usando valores placeholder - activando modo demo', {
    urlConfigured: !isPlaceholderUrl,
    keyConfigured: !isPlaceholderKey
  });
  safeLogger.info('VITE_SUPABASE_URL:', { status: supabaseUrl && !isPlaceholderUrl ? 'âœ… Configurada' : 'âŒ Faltante/Placeholder' });
  safeLogger.info('VITE_SUPABASE_ANON_KEY:', { status: supabaseAnonKey && !isPlaceholderKey ? 'âœ… Configurada' : 'âŒ Faltante/Placeholder' });
  // No lanzar error, permitir modo demo
}

safeLogger.info('ðŸ”— Conectando a Supabase:', { url: supabaseUrl });

// Variable global para almacenar la instancia Ãºnica del cliente
let supabaseInstance: SupabaseClient<Database> | null = null;

// FunciÃ³n para crear o retornar la instancia Ãºnica del cliente
function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    safeLogger.info('â™»ï¸ Reutilizando instancia existente de Supabase', {});
    return supabaseInstance;
  }

  safeLogger.info('ðŸ†• Creando nueva instancia de Supabase', {});
  
  // CRÃTICO: Validar y manejar errores de forma segura
  try {
    // Validar credenciales antes de crear cliente
    // Si es un placeholder, NO intentar crear el cliente (causarÃ¡ error de validaciÃ³n)
    if (isPlaceholderUrl || isPlaceholderKey) {
      safeLogger.warn('âš ï¸ Credenciales de Supabase son placeholders - usando cliente stub', {
        urlPlaceholder: isPlaceholderUrl,
        keyPlaceholder: isPlaceholderKey
      });
      // Crear un cliente stub mÃ­nimo que no cause errores de validaciÃ³n
      // Usar una URL vÃ¡lida pero que no se usarÃ¡ realmente
      const stubUrl = 'https://demo.supabase.co';
      const stubKey = 'demo-anon-key-stub';
      supabaseInstance = createClient<Database>(stubUrl, stubKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: () => Promise.reject(new Error('Supabase not configured - using stub client')),
        },
      });
      safeLogger.warn('âš ï¸ Cliente stub de Supabase creado - modo demo activo', {});
      return supabaseInstance;
    }
    
    // Si las credenciales son vÃ¡lidas, crear el cliente normalmente
    const finalUrl = supabaseUrl!;
    const finalKey = supabaseAnonKey!;
    
    supabaseInstance = createClient<Database>(
  finalUrl, 
  finalKey, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key',
        'Authorization': `Bearer ${supabaseAnonKey || 'placeholder-key'}`,
      },
      fetch: (url, options = {}) => {
        // Solo bloquear Supabase para usuarios demo no-admin
        const demoAuth = localStorage.getItem('demo_authenticated');
        const demoUser = localStorage.getItem('demo_user');
        
        // Si hay sesiÃ³n demo activa, permitir acceso bÃ¡sico
        if (demoAuth === 'true' && demoUser) {
          try {
            const user = JSON.parse(demoUser);
            // Permitir acceso bÃ¡sico para usuarios demo (solo bloquear operaciones crÃ­ticas)
            const isWriteOperation = options?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase());
            
            if (isWriteOperation && user.role !== 'admin') {
              safeLogger.info('ðŸš« Bloqueando operaciÃ³n de escritura para usuario demo:', { email: user.email, method: options.method });
              return Promise.reject(new Error('Demo mode - write operations restricted'));
            } else {
              safeLogger.info('âœ… Permitiendo acceso demo:', { email: user.email, method: options?.method || 'GET' });
            }
          } catch {
            safeLogger.info('ðŸš« Bloqueando Supabase - error parsing demo user', {});
            return Promise.reject(new Error('Demo mode active - parse error'));
          }
        }
        
        // Para usuarios de producciÃ³n o admins demo, permitir Supabase
        safeLogger.info('ðŸ”— Permitiendo llamada a Supabase:', { url: typeof url === 'string' ? url.substring(0, 50) + '...' : url });
        return fetch(url, {
          ...options,
          headers: {
            ...(options?.headers || {}),
            'apikey': supabaseAnonKey || 'placeholder-key',
            'Authorization': `Bearer ${supabaseAnonKey || 'placeholder-key'}`,
            'Access-Control-Allow-Origin': '*',
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
    
    safeLogger.info('âœ… Cliente de Supabase creado exitosamente', { url: finalUrl });
    return supabaseInstance;
  } catch (error) {
    safeLogger.error('âŒ Error crÃ­tico creando cliente de Supabase:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    // Crear cliente stub mÃ­nimo que no cause errores de validaciÃ³n
    try {
      const stubUrl = 'https://demo.supabase.co';
      const stubKey = 'demo-anon-key-stub';
      supabaseInstance = createClient<Database>(
        stubUrl,
        stubKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            fetch: () => Promise.reject(new Error('Supabase not configured - using stub client')),
          },
        }
      );
      safeLogger.warn('âš ï¸ Usando cliente stub de Supabase debido a error', {});
      return supabaseInstance;
    } catch (fallbackError) {
      safeLogger.error('âŒ Error crÃ­tico creando cliente stub:', { 
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      });
      // Retornar un stub mÃ­nimo que no cause errores
      throw new Error('Failed to create Supabase client');
    }
  }
}

// Exportar la instancia Ãºnica del cliente
// CRÃTICO: Crear instancia de forma segura sin bloquear la carga
let supabase: SupabaseClient<Database> | null = null;

try {
  supabase = getSupabaseClient();
} catch (error) {
  safeLogger.error('âŒ Error creando cliente de Supabase:', { error: error instanceof Error ? error.message : String(error) });
  // Crear cliente stub mÃ­nimo en caso de error
  try {
    const stubUrl = 'https://demo.supabase.co';
    const stubKey = 'demo-anon-key-stub';
    supabase = createClient<Database>(
      stubUrl,
      stubKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: () => Promise.reject(new Error('Supabase not configured - using stub client')),
        },
      }
    );
    safeLogger.warn('âš ï¸ Usando cliente stub de Supabase', {});
  } catch (fallbackError) {
    safeLogger.error('âŒ Error crÃ­tico creando cliente stub:', { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) });
    // No exportar null, crear un stub mÃ­nimo
    supabase = null as any;
  }
}

export { supabase };

// Verificar conectividad inicial y activar modo demo si es necesario
let isDemoMode = false;

// Solo intentar conectar a Supabase si no estamos en modo demo
const checkDemoMode = () => {
  const demoAuth = localStorage.getItem('demo_authenticated');
  return demoAuth === 'true';
};

const initializeSupabase = async () => {
  // No bloquear el renderizado - ejecutar de forma asÃ­ncrona sin await
  setTimeout(async () => {
    if (!checkDemoMode()) {
      try {
        // Timeout de 5 segundos para evitar que se quede colgado
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        // CRÃTICO: Verificar que supabase no sea null antes de usarlo
        if (!supabase) {
          safeLogger.warn('âš ï¸ Supabase no estÃ¡ disponible, activando modo demo', {});
          isDemoMode = true;
          return;
        }
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: _data, error: _error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (_error) {
          safeLogger.warn('âš ï¸ Problema de conectividad con Supabase:', { error: _error.message });
          if (_error.message.includes('Failed to fetch') || _error.message.includes('CONNECTION_REFUSED') || _error.message.includes('Invalid Refresh Token') || _error.message.includes('Timeout')) {
            isDemoMode = true;
            safeLogger.info('ðŸ”„ Activando modo demo offline', {});
          } else {
            safeLogger.info('âœ… Conectado exitosamente a Supabase', {});
          }
        }
      } catch (err) {
        safeLogger.warn('âš ï¸ No se pudo verificar la sesiÃ³n de Supabase:', { error: err instanceof Error ? err.message : String(err) });
        isDemoMode = true;
        safeLogger.info('ðŸ”„ Activando modo demo offline', {});
      }
    } else {
      isDemoMode = true;
      safeLogger.info('ðŸ”„ Modo demo activo - evitando conexiÃ³n a Supabase', {});
    }
  }, 100); // Ejecutar despuÃ©s de 100ms para no bloquear el renderizado inicial
};

// Initialize on module load (no bloquea)
initializeSupabase();

export { isDemoMode };

