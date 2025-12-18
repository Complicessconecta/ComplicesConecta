/**
 * CoupleProfilesService - Wrapper de compatibilidad
 * 
 * Este archivo actúa como punto de entrada unificado para los servicios de pareja.
 * Redirige a AdvancedCoupleService que contiene la implementación real (con Supabase).
 */

import { advancedCoupleService } from './AdvancedCoupleService';

// Re-exportar tipos desde el servicio real
export type { CoupleProfile, CouplePreferences } from './AdvancedCoupleService';

// Exportar la instancia del servicio avanzado como default para mantener compatibilidad
export const coupleProfilesService = advancedCoupleService;
export default coupleProfilesService;
