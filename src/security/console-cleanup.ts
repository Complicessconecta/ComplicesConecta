/**
 * Console Cleanup for Production
 * Elimina console.log en producción y limpia logs sensibles
 */

// Guardar referencias originales
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  trace: console.trace,
};

// Detectar si estamos en producción
const isProduction = import.meta.env.PROD;

// Lista de patrones sensibles que deben ser bloqueados
const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /auth/i,
  /session/i,
  /credential/i,
  /bearer/i,
  /jwt/i,
  /supabase.*auth/i,
  /access.*token/i,
  /refresh.*token/i,
];

type ConsolePrimitive = string | number | boolean | bigint | symbol | undefined;

type ConsoleLeaf = ConsolePrimitive | Error;

type ConsoleArray = Array<ConsoleLeaf>;

type ConsoleObject = Record<string, ConsoleLeaf | ConsoleArray>;

type ConsoleValue = ConsoleLeaf | ConsoleArray | ConsoleObject;

function isConsoleRecord(value: ConsoleValue): value is ConsoleObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Error);
}

/**
 * Verifica si un mensaje contiene información sensible
 */
function containsSensitiveInfo(message: ConsoleValue): boolean {
  const messageStr = String(message ?? "");
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(messageStr));
}

/**
 * Limpia información sensible de los logs
 */
function sanitizeLogMessage(...args: ConsoleValue[]): ConsoleValue[] {
  return args.map((arg) => {
    if (isConsoleRecord(arg)) {
      const sanitized: ConsoleObject = { ...arg };
      Object.keys(sanitized).forEach((key) => {
        if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
          sanitized[key] = "[REDACTED]";
        }
      });
      return sanitized;
    }

    if (typeof arg === "string") {
      // Para strings, reemplazar patrones sensibles
      let sanitized = arg;
      SENSITIVE_PATTERNS.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, "[REDACTED]");
      });
      return sanitized;
    }
    return arg;
  });
}

/**
 * Configura el cleanup de console para producción
 */
export function setupConsoleCleanup(): void {
  if (!isProduction) {
    // En desarrollo, mantener console normal pero con sanitización
    console.log = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.warn("🚨 Sensitive data detected in console.log:", ...sanitizeLogMessage(...args));
      } else {
        originalConsole.log(...args);
      }
    };

    console.info = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.warn("🚨 Sensitive data detected in console.info:", ...sanitizeLogMessage(...args));
      } else {
        originalConsole.info(...args);
      }
    };

    console.debug = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.warn("🚨 Sensitive data detected in console.debug:", ...sanitizeLogMessage(...args));
      } else {
        originalConsole.debug(...args);
      }
    };

    console.trace = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.warn("🚨 Sensitive data detected in console.trace:", ...sanitizeLogMessage(...args));
      } else {
        originalConsole.trace(...args);
      }
    };

    // Mantener warn y error siempre visibles
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

  } else {
    // En producción, deshabilitar completamente console.log/info/debug/trace
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.trace = () => {};

    // Mantener warn y error para debugging crítico
    console.warn = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.warn('🚨 Sensitive data detected:', ...sanitizeLogMessage(...args));
      } else {
        originalConsole.warn(...args);
      }
    };

    console.error = (...args: ConsoleValue[]) => {
      if (args.some(containsSensitiveInfo)) {
        originalConsole.error('🚨 Sensitive data detected:', ...sanitizeLogMessage(...args));
      } else {
        originalConsole.error(...args);
      }
    };
  }
}

/**
 * Previene el acceso a DevTools en producción
 */
export function setupDevToolsProtection(): void {
  if (!isProduction) return;

  const devtools: { open: boolean; orientation?: 'vertical' | 'horizontal' } = {
    open: false,
  };

  const threshold = 160;

  // Detectar si DevTools está abierto
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        console.clear();
        console.warn('🚨 DevTools detected in production mode');
        
        // Opcional: Redirigir o mostrar advertencia
        // window.location.href = '/devtools-warning';
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Prevenir F12 y Ctrl+Shift+I
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return;
    }

    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return;
    }

    // Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return;
    }

    // Ctrl+U (ver fuente)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return;
    }
  });

  // Prevenir clic derecho
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

/**
 * Limpia localStorage al cerrar la pestaña
 */
export function setupTabCloseCleanup(): void {
  const cleanup = () => {
    try {
      // Limpiar solo datos no críticos (los críticos ya están cifrados)
      const keysToClean = [
        'temp-data',
        'cache-timestamp',
        'ui-state',
      ];

      keysToClean.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('🧹 Tab cleanup completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error during tab cleanup:', message);
    }
  };

  // Limpiar al cerrar pestaña
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
}

/**
 * Configura todas las protecciones de seguridad para producción
 */
export function setupProductionSecurity(): void {
  if (isProduction) {
    setupConsoleCleanup();
    setupDevToolsProtection();
    setupTabCloseCleanup();
    
    console.log('🛡️ Production security protections enabled');
  } else {
    setupConsoleCleanup();
    console.log('🔧 Development mode with console sanitization');
  }
}

/**
 * Restaura el console original (para testing)
 */
export function restoreOriginalConsole(): void {
  Object.assign(console, originalConsole);
}

/**
 * Verifica si el console está modificado
 */
export function isConsoleModified(): boolean {
  return console.log !== originalConsole.log ||
         console.info !== originalConsole.info ||
         console.debug !== originalConsole.debug ||
         console.trace !== originalConsole.trace;
}
