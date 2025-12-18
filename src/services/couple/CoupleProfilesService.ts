/**
 * CoupleProfilesService - Wrapper de re-exportación
 * 
 * Este archivo actúa como wrapper para mantener compatibilidad con imports antiguos.
 * Re-exporta el servicio real desde su ubicación actual en @/features/profile/
 * 
 * @version 3.6.3
 */

// Re-exportar desde la ubicación real
export { coupleProfilesService } from '@/services/couple/CoupleProfilesService';
export type { CoupleProfile, CoupleProfileView, CoupleProfileLike, CoupleProfileReport, CreateCoupleProfileData } from '@/services/couple/CoupleProfilesService';

// Re-exportar default desde el módulo original
import { coupleProfilesService } from '@/services/couple/CoupleProfilesService';
export default coupleProfilesService;
