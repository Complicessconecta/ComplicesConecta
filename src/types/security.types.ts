/**
 * Tipos para SecurityService - ComplicesConecta v3.5.0
 * Reemplaza Record<string, any> con tipos especÃ­ficos
 */

/**
 * Patrones de actividad del usuario
 */
export interface ActivityPattern {
  loginFrequency: number; // logins por perÃ­odo
  sessionDuration: number; // minutos promedio
  actionCount: number; // acciones por sesiÃ³n
  deviceCount: number; // dispositivos Ãºnicos
  locationCount: number; // ubicaciones Ãºnicas
  timePattern: 'normal' | 'unusual'; // patrÃ³n temporal
}

/**
 * Actividad del usuario para anÃ¡lisis de comportamiento
 */
export interface UserActivity {
  action: string;
  timestamp?: string;
  userId?: string;
  deviceId?: string;
  location?: string;
  metadata?: ActivityMetadata;
}

/**
 * Metadatos de actividad
 */
export interface ActivityMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * Detalles de evento de auditorÃ­a
 */
export interface AuditEventDetails {
  action?: string;
  resource?: string;
  resourceId?: string;
  metadata?: ActivityMetadata;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * Log de auditorÃ­a mapeado
 */
export interface MappedAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: AuditEventDetails;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  riskScore: number;
}


