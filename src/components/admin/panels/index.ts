/**
 * Ãndice de exportaciÃ³n para paneles del Dashboard Administrativo v3.5.0
 * Facilita las importaciones y evita errores de mÃ³dulos no encontrados
 * 
 * NOTA: Se usan los componentes funcionales en lugar de placeholders
 */

export { ReportsPanel } from './ReportsPanel'
export { UserManagementPanel } from '@/components/admin/UserManagementPanel'
export { TokenSystemPanel } from '@/components/admin/TokenSystemPanel'
export { AnalyticsPanel } from '@/components/admin/AnalyticsPanel'


export { default as PerformancePanel } from '@/components/admin/PerformancePanel'
export { default as SecurityPanel } from '@/components/admin/SecurityPanel'

// Tipos de paneles disponibles
export type PanelType = 
  | 'reports' 
  | 'users' 
  | 'tokens' 
  | 'analytics' 
  | 'performance' 
  | 'security'

// ConfiguraciÃ³n de paneles
export interface PanelConfig {
  id: PanelType
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  requiredRole: 'admin' | 'moderator'
}

