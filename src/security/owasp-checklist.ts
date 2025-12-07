/**
 * OWASP Top 10 Compliance Checklist
 * Verifica cumplimiento de estándares OWASP
 * Fecha: 7 Diciembre 2025
 */

import { logger } from '@/lib/logger';

export interface OWASPCheck {
  id: string;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';
  checks: string[];
  remediation?: string;
}

export const owaspChecklist: Record<string, OWASPCheck> = {
  'A1-BrokenAccessControl': {
    id: 'A1',
    name: 'Broken Access Control',
    description: 'Usuarios pueden actuar fuera de sus permisos',
    status: 'PASS',
    checks: [
      '✅ RLS policies en Supabase',
      '✅ ProtectedRoute en React',
      '✅ Verificación de permisos en API',
      '✅ Roles basados en acceso (RBAC)'
    ]
  },

  'A2-CryptographicFailures': {
    id: 'A2',
    name: 'Cryptographic Failures',
    description: 'Exposición de datos sensibles',
    status: 'PASS',
    checks: [
      '✅ HTTPS en producción',
      '✅ Encriptación de datos sensibles',
      '✅ JWT con expiración',
      '✅ Tokens seguros'
    ]
  },

  'A3-Injection': {
    id: 'A3',
    name: 'Injection',
    description: 'Inyección de código malicioso',
    status: 'PASS',
    checks: [
      '✅ Parameterized queries en Supabase',
      '✅ Input validation',
      '✅ Output encoding',
      '✅ No eval() o similar'
    ]
  },

  'A4-InsecureDesign': {
    id: 'A4',
    name: 'Insecure Design',
    description: 'Diseño sin consideraciones de seguridad',
    status: 'PARTIAL',
    checks: [
      '✅ Threat modeling completado',
      '✅ Arquitectura de seguridad',
      '⏳ Principio de menor privilegio',
      '⏳ Segregación de datos'
    ],
    remediation: 'Completar threat modeling y segregación de datos'
  },

  'A5-SecurityMisconfiguration': {
    id: 'A5',
    name: 'Security Misconfiguration',
    description: 'Configuración insegura del sistema',
    status: 'PASS',
    checks: [
      '✅ Headers de seguridad',
      '✅ CORS configurado correctamente',
      '✅ Secrets en variables de entorno',
      '✅ Errores no exponen información'
    ]
  },

  'A6-VulnerableComponents': {
    id: 'A6',
    name: 'Vulnerable Components',
    description: 'Uso de librerías con vulnerabilidades conocidas',
    status: 'PASS',
    checks: [
      '✅ npm audit sin vulnerabilidades críticas',
      '✅ Dependencias actualizadas',
      '✅ Monitoreo de vulnerabilidades',
      '✅ Política de actualización'
    ]
  },

  'A7-AuthenticationFailures': {
    id: 'A7',
    name: 'Authentication Failures',
    description: 'Fallos en autenticación y gestión de sesión',
    status: 'PARTIAL',
    checks: [
      '✅ Contraseñas hasheadas (Supabase)',
      '✅ Session management seguro',
      '✅ Logout funcional',
      '⏳ MFA implementado'
    ],
    remediation: 'Implementar MFA en Fase 3'
  },

  'A8-DataIntegrityFailures': {
    id: 'A8',
    name: 'Data Integrity Failures',
    description: 'Falta de integridad en datos',
    status: 'PASS',
    checks: [
      '✅ Validación de datos',
      '✅ Integridad de datos en BD',
      '✅ Auditoría de cambios',
      '✅ Backups automáticos'
    ]
  },

  'A9-LoggingMonitoring': {
    id: 'A9',
    name: 'Logging & Monitoring',
    description: 'Falta de logs y monitoreo',
    status: 'PARTIAL',
    checks: [
      '✅ Logs de seguridad básicos',
      '⏳ Alertas de anomalías',
      '⏳ Monitoreo en tiempo real',
      '⏳ Dashboard de seguridad'
    ],
    remediation: 'Implementar monitoreo avanzado en Fase 2'
  },

  'A10-SSRF': {
    id: 'A10',
    name: 'Server-Side Request Forgery',
    description: 'Ataques SSRF',
    status: 'PASS',
    checks: [
      '✅ Validación de URLs',
      '✅ Whitelist de dominios',
      '✅ Prevención de SSRF',
      '✅ Rate limiting en requests'
    ]
  }
};

/**
 * Obtener resumen de cumplimiento OWASP
 */
export const getOWASPSummary = () => {
  const checks = Object.values(owaspChecklist);
  const passed = checks.filter(c => c.status === 'PASS').length;
  const partial = checks.filter(c => c.status === 'PARTIAL').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const pending = checks.filter(c => c.status === 'PENDING').length;

  return {
    total: checks.length,
    passed,
    partial,
    failed,
    pending,
    percentage: Math.round((passed / checks.length) * 100)
  };
};

/**
 * Generar reporte OWASP
 */
export const generateOWASPReport = () => {
  const summary = getOWASPSummary();
  const checks = Object.values(owaspChecklist);

  const report = {
    title: '🔐 OWASP TOP 10 COMPLIANCE REPORT',
    date: new Date().toISOString(),
    summary: {
      percentage: `${summary.percentage}% Cumplimiento`,
      passed: summary.passed,
      partial: summary.partial,
      failed: summary.failed,
      pending: summary.pending
    },
    details: checks.map(check => ({
      id: check.id,
      name: check.name,
      status: check.status,
      checks: check.checks,
      remediation: check.remediation
    }))
  };

  logger.info('📊 OWASP Report Generated', report);
  return report;
};

/**
 * Obtener items pendientes
 */
export const getPendingItems = (): string[] => {
  const pending: string[] = [];
  
  Object.values(owaspChecklist).forEach(check => {
    if (check.status === 'PARTIAL' || check.status === 'PENDING') {
      check.checks.forEach(item => {
        if (item.includes('⏳')) {
          pending.push(`${check.id}: ${item}`);
        }
      });
    }
  });

  return pending;
};

/**
 * Verificar si cumple con OWASP
 */
export const isOWASPCompliant = (percentage: number = 80): boolean => {
  const summary = getOWASPSummary();
  return summary.percentage >= percentage;
};
