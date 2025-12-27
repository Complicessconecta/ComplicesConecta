/**
 * Datadog RUM (Real User Monitoring) Configuration
 * ComplicesConecta v3.4.1
 * 
 * Monitorea el rendimiento frontend en tiempo real:
 * - Page loads y navegación
 * - User interactions (clicks, inputs, etc)
 * - Errores de JavaScript
 * - Requests HTTP (fetch, XHR)
 * - Web Vitals (LCP, FID, CLS)
 * - Session replays
 */

import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

// Configuración de entorno
const _isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Inicializar Datadog RUM
 * Solo se ejecuta en producción o si está explícitamente habilitado en dev
 */
export function initializeDatadogRUM() {
  // Por ahora, solo en producción
  // En dev, puedes habilitar con: VITE_DATADOG_RUM_ENABLED=true
  const rumEnabled = isProduction || import.meta.env.VITE_DATADOG_RUM_ENABLED === 'true';
  
  if (!rumEnabled) {
    console.log('📊 Datadog RUM: Deshabilitado en desarrollo');
    return;
  }

  try {
    // Inicializar RUM (Real User Monitoring)
    datadogRum.init({
      // IMPORTANTE: Estos valores deben obtenerse de Datadog Dashboard
      // 1. Ir a: https://us5.datadoghq.com/rum/application/create
      // 2. Crear aplicación "complicesconecta"
      // 3. Copiar applicationId y clientToken
      applicationId: import.meta.env.VITE_DATADOG_APP_ID || 'PLACEHOLDER_APP_ID',
      clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN || 'PLACEHOLDER_CLIENT_TOKEN',
      
      // Configuración del sitio (US5)
      site: 'us5.datadoghq.com',
      
      // Información de la aplicación
      service: 'complicesconecta',
      env: isProduction ? 'production' : 'development',
      version: '3.4.1',
      
      // Sampling rates (porcentaje de sesiones a monitorear)
      sessionSampleRate: isProduction ? 100 : 0, // 100% en prod, 0% en dev
      sessionReplaySampleRate: isProduction ? 20 : 0, // 20% de sesiones con replay
      
      // Rastreo de interacciones del usuario
      trackUserInteractions: true,
      // trackFrustrations: true, // Detecta rage clicks, dead clicks, etc (si está disponible)
      
      // Rastreo de recursos (CSS, JS, imágenes, etc)
      trackResources: true,
      trackLongTasks: true, // Tareas que bloquean el thread principal
      
      // Privacidad
      defaultPrivacyLevel: 'mask-user-input', // Enmascara inputs por defecto
      
      // Rastreo de vistas
      trackViewsManually: false, // Auto-detecta cambios de página
      
      // Configuración avanzada
      beforeSend: (event) => {
        // Filtrar información sensible antes de enviar
        if (event.type === 'error') {
          // No enviar errores de wallet extensions
          const message = event.error?.message?.toLowerCase() || '';
          const walletErrors = [
            'wallet', 'ethereum', 'solana', 'metamask', 'tronweb', 'bybit'
          ];
          
          if (walletErrors.some(keyword => message.includes(keyword))) {
            return false; // No enviar este evento
          }
        }
        
        // Remover información sensible de URLs
        if (event.view?.url) {
          event.view.url = event.view.url.replace(/password=[^&]*/gi, 'password=***');
          event.view.url = event.view.url.replace(/token=[^&]*/gi, 'token=***');
        }
        
        return true; // Enviar el evento
      },
      
      // Configuración de proxy (si es necesario)
      proxy: import.meta.env.VITE_DATADOG_PROXY_URL,
      
      // Permitir fallback a XMLHttpRequest si fetch falla
      allowFallbackToLocalStorage: true,
    });

    // Inicializar Logs Browser
    datadogLogs.init({
      clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN || 'PLACEHOLDER_CLIENT_TOKEN',
      site: 'us5.datadoghq.com',
      service: 'complicesconecta',
      env: isProduction ? 'production' : 'development',
      version: '3.4.1',
      
      // Configuración de logs
      forwardErrorsToLogs: true, // Enviar errores de JS como logs
      forwardConsoleLogs: isProduction ? ['error', 'warn'] : [], // Solo errores en prod
      sessionSampleRate: 100, // 100% de logs
      
      // Contexto global
      beforeSend: (log) => {
        // Filtrar logs de wallet
        const message = log.message?.toLowerCase() || '';
        const walletKeywords = ['wallet', 'ethereum', 'solana', 'metamask'];
        
        if (walletKeywords.some(keyword => message.includes(keyword))) {
          return false;
        }
        
        return true;
      },
    });

    // Agregar contexto global del usuario
    if (typeof window !== 'undefined') {
      // User info (se actualizará después del login)
      datadogRum.setUser({
        id: 'anonymous', // Se actualizará en login
        email: undefined,
        name: undefined,
      });

      // Contexto global
      datadogRum.setGlobalContextProperty('browser', navigator.userAgent);
      datadogRum.setGlobalContextProperty('screen', {
        width: window.screen.width,
        height: window.screen.height,
      });
    }

    console.log('✅ Datadog RUM inicializado correctamente');
    
    // Log inicial
    datadogLogs.logger.info('ComplicesConecta iniciado', {
      version: '3.4.1',
      environment: isProduction ? 'production' : 'development',
    });

  } catch (error) {
    console.error('❌ Error inicializando Datadog RUM:', error);
  }
}

/**
 * Actualizar información del usuario después del login
 */
export function setDatadogUser(userId: string, email?: string, name?: string) {
  try {
    datadogRum.setUser({
      id: userId,
      email: email,
      name: name,
    });
    
    datadogLogs.logger.info('Usuario autenticado', {
      userId,
      email,
    });
  } catch (error) {
    console.error('Error actualizando usuario en Datadog:', error);
  }
}

/**
 * Limpiar información del usuario después del logout
 */
export function clearDatadogUser() {
  try {
    datadogRum.setUser({
      id: 'anonymous',
      email: undefined,
      name: undefined,
    });
    
    datadogLogs.logger.info('Usuario cerró sesión');
  } catch (error) {
    console.error('Error limpiando usuario en Datadog:', error);
  }
}

/**
 * Rastrear evento personalizado
 */
export function trackCustomEvent(name: string, context?: Record<string, any>) {
  try {
    datadogRum.addAction(name, context);
  } catch (error) {
    console.error('Error rastreando evento:', error);
  }
}

/**
 * Agregar error personalizado
 */
export function trackError(error: Error, context?: Record<string, any>) {
  try {
    datadogRum.addError(error, context);
    datadogLogs.logger.error(error.message, {
      error: {
        stack: error.stack,
        ...context,
      },
    });
  } catch (err) {
    console.error('Error rastreando error:', err);
  }
}

/**
 * Iniciar transacción manual (para medir performance de operaciones específicas)
 */
export function startTransaction(name: string, _type: string = 'custom') {
  try {
    datadogRum.startView(name);
    return {
      end: () => {
        // View se detiene automáticamente al cambiar de página
      },
    };
  } catch (error) {
    console.error('Error iniciando transacción:', error);
    return { end: () => {} };
  }
}

// Export de instancias para uso directo
export { datadogRum, datadogLogs };


