/**
 * Utilidad para mostrar información de variables de entorno en consola
 * Versión: 3.5.1
 * 
 * 🔒 SEGURIDAD: Requiere confirmación explícita antes de mostrar secretos
 * Uso: Importar y llamar showEnvInfo() en la consola del navegador
 * 
 * NOTA: Este archivo usa `as any` para acceso dinámico a variables de entorno
 * y console.log intencionalmente para debugging en consola del navegador
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function showEnvInfo(): {
  env: Record<string, unknown>;
  viteVars: Record<string, string>;
  mode: string;
  dev: boolean;
  prod: boolean;
  baseUrl: string;
} {
  // ⚠️ SEGURIDAD: Solicitar confirmación antes de mostrar secretos
  if (import.meta.env.DEV) {
    const confirmed = confirm(
      '⚠️ ADVERTENCIA DE SEGURIDAD\n\n' +
      'Estás a punto de mostrar variables de entorno y secretos en consola.\n' +
      'NO compartas esta información en pantalla compartida o capturas.\n\n' +
      '¿Deseas continuar?'
    );
    
    if (!confirmed) {
      console.warn('❌ Visualización de secretos cancelada por el usuario');
      return {
        env: {},
        viteVars: {},
        mode: '',
        dev: false,
        prod: false,
        baseUrl: ''
      };
    }
  }

  console.group('🔐 Variables de Entorno - ComplicesConecta v3.5.1');
  
  const env = import.meta.env as Record<string, unknown>;
  
  console.log('📋 Todas las variables de entorno:');
  console.table(env);
  
  console.log('\n🔑 Variables VITE_*:');
  const viteVars: Record<string, string> = {};
  
  Object.keys(env).forEach((key) => {
    if (key.startsWith('VITE_')) {
      const value = env[key];
      viteVars[key] = String(value || '');
    }
  });
  
  console.table(viteVars);
  
  // ⚠️ SOLO mostrar contraseñas si el usuario confirmó
  console.log('\n🔐 Contraseñas disponibles:');
  const passwordKeys = Object.keys(env).filter(key => 
    key.match(/PASSWORD/i) && key.startsWith('VITE_')
  );
  
  passwordKeys.forEach((key) => {
    console.log(`  ${key}:`, env[key]);
  });
  
  console.log('\n⚙️ Información del entorno:');
  console.log('Mode:', env.MODE);
  console.log('Dev:', env.DEV);
  console.log('Prod:', env.PROD);
  console.log('Base URL:', env.BASE_URL);
  
  console.groupEnd();
  
  return {
    env,
    viteVars,
    mode: String(env.MODE || ''),
    dev: Boolean(env.DEV),
    prod: Boolean(env.PROD),
    baseUrl: String(env.BASE_URL || '')
  };
}

// Hacer disponible globalmente para uso en consola
// CR├ìTICO: Asegurar que las funciones est├®n disponibles inmediatamente
if (typeof window !== 'undefined') {
  const exposeEnvFunctions = () => {
    // SOLO en desarrollo - NO en producción
    if (!import.meta.env.DEV) {
      return;
    }
    
    console.log('🔧 Exponiendo funciones debug en desarrollo...');
    
    try {
      // Usar Object.defineProperty para evitar errores de redefinición
      Object.defineProperty(window, 'showEnvInfo', {
        value: showEnvInfo,
        writable: true,
        configurable: true,
        enumerable: true
      });
      
      Object.defineProperty(window, 'env', {
        value: import.meta.env,
        writable: true,
        configurable: true,
        enumerable: true
      });
      
      Object.defineProperty(window, 'getPassword', {
        value: (key: string) => {
          const value = import.meta.env[key];
          if (typeof value === 'string' && value.includes('****')) {
            return 'Contraseña oculta por seguridad';
          }
          return value || 'Variable no encontrada';
        },
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      // Si falla Object.defineProperty, usar asignación directa (solo en dev)
      (window as unknown as Record<string, unknown>).showEnvInfo = showEnvInfo;
      (window as unknown as Record<string, unknown>).env = import.meta.env;
      (window as unknown as Record<string, unknown>).getPassword = (key: string) => {
        const value = import.meta.env[key];
        if (typeof value === 'string' && value.includes('****')) {
          return 'Contraseña oculta por seguridad';
        }
        return value || 'Variable no encontrada';
      };
      (window as unknown as Record<string, unknown>).showErrorReport = () => {
        console.log('📊 Error Report Service Status:');
        console.log('- Service available:', !!(window as any).errorReportService);
        console.log('- Recent errors:', (window as any).__ERROR_LOGS__ || []);
        return (window as any).errorReportService?.showReport() || 'No error report service available';
      };
    }
  };

  // Solo exponer en desarrollo
  if (import.meta.env.DEV) {
    exposeEnvFunctions();
  }
  // También exponer cuando el DOM esté listo (por si acaso)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', exposeEnvFunctions);
  } else {
    // DOM ya está listo, exponer de nuevo para asegurar
    exposeEnvFunctions();
  }
  
  // Exponer también después de breves delays para asegurar
  setTimeout(exposeEnvFunctions, 0);
  setTimeout(exposeEnvFunctions, 100);
  setTimeout(exposeEnvFunctions, 500);
  setTimeout(exposeEnvFunctions, 1000);
  
  // Log solo una vez en desarrollo
  if (import.meta.env.DEV) {
    setTimeout(() => {
      if ((window as unknown as Record<string, unknown>).showEnvInfo) {
        console.log('✅ Utilidad de variables de entorno cargada');
        console.log('💡 Usa showEnvInfo() en la consola para ver información');
        console.log('💡 Usa window.env para acceder a todas las variables');
        console.log('💡 Usa getPassword("VITE_XXX") para ver una contraseña específica');
      }
    }, 100);
  }
}

