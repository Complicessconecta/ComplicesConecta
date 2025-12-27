/**
 * CoupleProfilesService - Wrapper de compatibilidad
 * 
 * Este archivo actúa como punto de entrada unificado para los servicios de pareja.
 * Redirige a AdvancedCoupleService que contiene la implementación real (con Supabase).
 */

import { generateMockCoupleProfiles } from '@/fixtures/coupleProfiles';
import { advancedCoupleService } from './AdvancedCoupleService';

export type RelationshipType = 'man-woman' | 'man-man' | 'woman-woman';

export interface CoupleProfileWithPartners {
  id: string;
  couple_name: string;
  couple_bio: string | null;
  relationship_type: RelationshipType;
  partner1_id: string;
  partner2_id: string;
  couple_images: string[] | null;
  is_verified: boolean | null;
  is_premium: boolean | null;
  created_at: string;
  updated_at: string;
  profile_id?: string;
  username?: string;
  partner1_first_name: string;
  partner1_last_name: string;
  partner1_age: number;
  partner1_bio: string | null;
  partner1_gender: string;
  partner1_interested_in?: 'male' | 'female' | 'both';
  partner2_first_name: string;
  partner2_last_name: string;
  partner2_age: number;
  partner2_bio: string | null;
  partner2_gender: string;
  partner2_interested_in?: 'male' | 'female' | 'both';
  location?: string;
  isOnline?: boolean;
}

export async function getAllCoupleProfiles(
  limit: number = 20,
  offset: number = 0
): Promise<CoupleProfileWithPartners[]> {
  try {
    const profiles = await advancedCoupleService.getNearbyCouples(0, 0, 50, Math.max(limit + offset, limit));

    if (profiles.length === 0) {
      const mockProfiles = generateMockCoupleProfiles();
      return mockProfiles.slice(offset, offset + limit);
    }

    const mapped = profiles.map((profile) => {
      const [p1 = 'Partner 1', p2 = 'Partner 2'] = profile.couple_name.split('&').map((s) => s.trim());

      const couple_images = (profile.photos && profile.photos.length > 0) ? profile.photos : null;

      const mappedProfile: CoupleProfileWithPartners = {
        id: profile.id,
        couple_name: profile.couple_name,
        couple_bio: profile.bio || null,
        relationship_type: 'man-woman',
        partner1_id: profile.partner1_id,
        partner2_id: profile.partner2_id,
        couple_images,
        is_verified: profile.is_verified,
        is_premium: profile.is_premium,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        partner1_first_name: p1,
        partner1_last_name: '',
        partner1_age: 30,
        partner1_bio: null,
        partner1_gender: 'unknown',
        partner2_first_name: p2,
        partner2_last_name: '',
        partner2_age: 30,
        partner2_bio: null,
        partner2_gender: 'unknown',
      };

      return mappedProfile;
    });

    return mapped.slice(offset, offset + limit);
  } catch {
    const mockProfiles = generateMockCoupleProfiles();
    return mockProfiles.slice(offset, offset + limit);
  }
}

// Re-exportar tipos desde el servicio real
export type { CoupleProfile, CouplePreferences } from './AdvancedCoupleService';

// Exportar la instancia del servicio avanzado como default para mantener compatibilidad
export const coupleProfilesService = advancedCoupleService;
export default coupleProfilesService;

