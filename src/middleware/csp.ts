/**
 * CSP Middleware
 * Aplica Content Security Policy headers
 * Fecha: 7 Diciembre 2025
 */

import { getCSPHeader, securityHeaders } from '@/config/csp.config';
import { logger } from '@/lib/logger';

/**
 * Aplicar CSP headers en respuesta HTTP
 * Uso en servidor Express o similar:
 * app.use(cspMiddleware);
 */
export const cspMiddleware = (req: any, res: any, next: any) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const cspHeader = getCSPHeader(isDevelopment);

  // Aplicar header CSP
  res.setHeader('Content-Security-Policy', cspHeader);

  // Aplicar header CSP Report-Only (para monitoreo sin bloquear)
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    cspHeader + '; report-uri /api/csp-report'
  );

  // Aplicar headers de seguridad adicionales
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  logger.info('🔐 CSP headers aplicados', {
    isDevelopment,
    cspLength: cspHeader.length,
    headers: Object.keys(securityHeaders).length
  });

  next();
};

/**
 * Hook para obtener CSP headers en React
 * Uso: const { cspHeader, isDevelopment } = useCSPHeaders();
 */
export const useCSPHeaders = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const cspHeader = getCSPHeader(isDevelopment);

  return {
    cspHeader,
    isDevelopment,
    securityHeaders
  };
};

/**
 * Verificar si un recurso cumple con CSP
 */
export const isCSPCompliant = (url: string, isDevelopment: boolean = true): boolean => {
  // En desarrollo, permitir más recursos
  if (isDevelopment) {
    return true;
  }

  // En producción, verificar dominios permitidos
  const allowedDomains = [
    'self',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.supabase.co'
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => 
      domain === 'self' ? urlObj.origin === window.location.origin : urlObj.hostname.includes(domain)
    );
  } catch {
    return false;
  }
};
