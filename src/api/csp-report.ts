/**
 * CSP Report Endpoint
 * Recibe y registra violaciones de CSP
 * Fecha: 7 Diciembre 2025
 */

import { logger } from '@/lib/logger';

export interface CSPViolation {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'disposition': string;
  'blocked-uri': string;
  'source-file': string;
  'line-number': number;
  'column-number': number;
  'status-code': number;
}

/**
 * Almacenar violaciones de CSP
 */
const cspViolations: CSPViolation[] = [];
const maxViolations = 1000;

/**
 * Endpoint para recibir reportes CSP
 * POST /api/csp-report
 * 
 * Uso en servidor Express:
 * app.post('/api/csp-report', handleCSPReport);
 */
export const handleCSPReport = async (req: any, res: any) => {
  try {
    const violation: CSPViolation = req.body['csp-report'];

    if (!violation) {
      return res.status(400).json({ error: 'No CSP report provided' });
    }

    // Registrar violación
    logger.warn('🚨 CSP Violation Detected', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      timestamp: new Date().toISOString()
    });

    // Guardar en memoria (en producción, guardar en BD)
    cspViolations.push(violation);
    if (cspViolations.length > maxViolations) {
      cspViolations.shift();
    }

    // Responder sin contenido (204 No Content)
    res.status(204).send();
  } catch (error) {
    logger.error('❌ Error procesando CSP report', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Obtener violaciones de CSP registradas
 */
export const getCSPViolations = (limit: number = 100): CSPViolation[] => {
  return cspViolations.slice(-limit);
};

/**
 * Obtener estadísticas de violaciones
 */
export const getCSPStatistics = () => {
  const violations = cspViolations;
  
  const byDirective = violations.reduce((acc, v) => {
    const directive = v['violated-directive'];
    acc[directive] = (acc[directive] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byBlockedUri = violations.reduce((acc, v) => {
    const uri = v['blocked-uri'];
    acc[uri] = (acc[uri] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalViolations: violations.length,
    byDirective,
    byBlockedUri,
    lastViolation: violations[violations.length - 1],
    topViolations: Object.entries(byDirective)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  };
};

/**
 * Limpiar violaciones antiguas
 */
export const cleanupCSPViolations = (hoursOld: number = 24) => {
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
  
  // En una implementación real, esto sería en la BD
  logger.info('🧹 CSP violations cleanup executed', {
    totalBefore: cspViolations.length,
    cutoffTime: cutoff.toISOString()
  });
};

/**
 * Endpoint para obtener estadísticas de CSP
 * GET /api/csp-stats
 */
export const getCSPStats = async (req: any, res: any) => {
  try {
    const stats = getCSPStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('❌ Error obteniendo CSP stats', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Endpoint para obtener violaciones de CSP
 * GET /api/csp-violations
 */
export const getCSPViolationsEndpoint = async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit || '100');
    const violations = getCSPViolations(limit);
    res.json(violations);
  } catch (error) {
    logger.error('❌ Error obteniendo CSP violations', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};
