/**
 * Content Security Policy Configuration
 * Protege contra ataques XSS e inyección de código
 * Fecha: 7 Diciembre 2025
 */

export interface CSPPolicy {
  [key: string]: string[];
}

/**
 * Políticas CSP por ambiente
 */
export const cspPolicies = {
  // Política CSP para desarrollo
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.supabase.co', 'ws://localhost:*', 'http://localhost:*'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"]
  } as CSPPolicy,

  // Política CSP para producción
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.supabase.co'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': []
  } as CSPPolicy
};

/**
 * Convertir objeto CSP a string de header
 */
export const buildCSPHeader = (policy: CSPPolicy): string => {
  return Object.entries(policy)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Obtener política CSP según el ambiente
 */
export const getCSPPolicy = (isDevelopment: boolean = true): CSPPolicy => {
  return isDevelopment ? cspPolicies.development : cspPolicies.production;
};

/**
 * Obtener header CSP completo
 */
export const getCSPHeader = (isDevelopment: boolean = true): string => {
  const policy = getCSPPolicy(isDevelopment);
  return buildCSPHeader(policy);
};

/**
 * Headers de seguridad adicionales
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
