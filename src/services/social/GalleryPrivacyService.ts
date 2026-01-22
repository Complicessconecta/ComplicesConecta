import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface GalleryUnlock {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
}

class GalleryPrivacyService {
  private static instance: GalleryPrivacyService;
  private readonly CMPX_COST = 100; // Costo de desbloqueo

  private constructor() {}

  public static getInstance(): GalleryPrivacyService {
    if (!GalleryPrivacyService.instance) {
      GalleryPrivacyService.instance = new GalleryPrivacyService();
    }
    return GalleryPrivacyService.instance;
  }

  async hasGalleryAccess(userId: string, galleryItemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('gallery_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('profile_id', galleryItemId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking gallery access', { error });
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking gallery access', { error });
      return false;
    }
  }

  async unlockGallery(
    userId: string,
    galleryItemId: string,
    creatorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const hasAccess = await this.hasGalleryAccess(userId, galleryItemId);

      if (hasAccess) {
        return { success: true };
      }

      const { data: balance } = await supabase
        .from('user_token_balances')
        .select('cmpx_balance')
        .eq('user_id', userId)
        .single();

      if (!balance || balance.cmpx_balance < this.CMPX_COST) {
        return { success: false, error: 'No tienes suficientes tokens CMPX' };
      }

      const { error } = await supabase
        .from('gallery_unlocks')
        .insert({
          user_id: userId,
          profile_id: galleryItemId,
        });

      if (error) {
        logger.error('Error unlocking gallery', { error });
        return { success: false, error: 'Error al desbloquear galería' };
      }

      logger.info('Gallery unlocked', {
        userId: userId.substring(0, 8) + '***',
        galleryItemId: galleryItemId.substring(0, 8) + '***',
        creatorId: creatorId.substring(0, 8) + '***',
      });
      return { success: true };
    } catch (error) {
      logger.error('Error unlocking gallery', { error });
      return { success: false, error: 'Error al desbloquear galería' };
    }
  }

  getCMPCost(): number {
    return this.CMPX_COST;
  }
}

export const galleryPrivacyService = GalleryPrivacyService.getInstance();
export type { GalleryPrivacyService };
