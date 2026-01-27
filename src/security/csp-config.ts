/**
 * Content Security Policy (CSP) Configuration
 * Implementa políticas de seguridad estrictas para prevenir XSS y ataques de inyección
 */

export const CSP_CONFIG = {
  // CSP para desarrollo (más permisivo para debugging)
  development: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Solo para desarrollo con Vite HMR
      "'unsafe-eval'", // Solo para desarrollo
      "https://vercel.live", // Vite dev server
      "ws:", // WebSockets para HMR
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS necesita inline styles
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://axtvqnozatbmllvwzuim.supabase.co", // Supabase
      "https://api.openai.com", // OpenAI
      "wss://axtvqnozatbmllvwzuim.supabase.co", // Supabase realtime
    ],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  },

  // CSP para producción (estricto)
  production: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // NO incluir 'unsafe-inline' o 'unsafe-eval' en producción
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Necesario para Tailwind CSS (considerar nonce)
      "https://fonts.googleapis.com", // Google Fonts
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"], // Google Fonts
    "connect-src": [
      "'self'",
      "https://axtvqnozatbmllvwzuim.supabase.co", // Supabase
      "https://api.openai.com", // OpenAI
      "wss://axtvqnozatbmllvwzuim.supabase.co", // Supabase realtime
    ],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
    "report-uri": ["/api/csp-violation-report"], // Reportar violaciones
    "report-to": ["csp-endpoint"],
  },
};

/**
 * Genera el string del CSP para el meta tag
 */
export function generateCSPHeader(isProduction: boolean = false): string {
  const config = isProduction ? CSP_CONFIG.production : CSP_CONFIG.development;
  
  const directives = Object.entries(config)
    .map(([directive, sources]) => {
      const sourceList = sources.join(' ');
      return `${directive} ${sourceList}`;
    })
    .join('; ');

  return directives;
}

/**
 * Meta tag CSP para HTML
 */
export function getCSPMetaTag(isProduction: boolean = false): string {
  const cspValue = generateCSPHeader(isProduction);
  return `<meta http-equiv="Content-Security-Policy" content="${cspValue}">`;
}

/**
 * Report-To endpoint para CSP violations
 */
export const CSP_REPORT_ENDPOINT = {
  "csp-endpoint": {
    "group": "csp-endpoint",
    "max_age": 10886400,
    "endpoints": [{
      "url": "/api/csp-violation-report"
    }]
  }
};

/**
 * Función para inyectar CSP en el DOM
 */
export function injectCSP(isProduction: boolean = false): void {
  if (typeof document === 'undefined') return;

  // Remover CSP existente si hay
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Agregar nuevo CSP
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPHeader(isProduction);
  document.head.appendChild(meta);

  // Agregar Report-To endpoint
  const reportToScript = document.createElement('script');
  reportToScript.textContent = `
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('CSP: Service Worker registered for reporting');
      });
    }
  `;
  document.head.appendChild(reportToScript);
}

/**
 * Validación de CSP en runtime
 */
export class CSPValidator {
  private static violations: Array<{
    timestamp: number;
    blockedURI: string;
    violatedDirective: string;
    originalPolicy: string;
  }> = [];

  static logViolation(violation: SecurityPolicyViolationEvent): void {
    this.violations.push({
      timestamp: Date.now(),
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      originalPolicy: violation.originalPolicy,
    });

    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.warn('🚨 CSP Violation:', {
        blockedURI: violation.blockedURI,
        violatedDirective: violation.violatedDirective,
        originalPolicy: violation.originalPolicy,
      });
    }

    // En producción, enviar a endpoint de monitoreo
    if (import.meta.env.PROD) {
      this.reportViolation(violation);
    }
  }

  private static async reportViolation(violation: SecurityPolicyViolationEvent): Promise<void> {
    try {
      await fetch('/api/csp-violation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          blockedURI: violation.blockedURI,
          violatedDirective: violation.violatedDirective,
          originalPolicy: violation.originalPolicy,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }

  static getViolations(): typeof CSPValidator.violations {
    return [...this.violations];
  }

  static clearViolations(): void {
    this.violations = [];
  }
}

// Configurar listener para CSP violations
if (typeof document !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (event) => {
    CSPValidator.logViolation(event);
  });
}
