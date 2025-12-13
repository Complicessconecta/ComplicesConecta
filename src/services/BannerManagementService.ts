/**
 * BannerManagementService - Gestión de Banners desde Admin
 * =========================================================
 * Descripción: Servicio para CRUD de configuración de banners
 * Fecha: 12 Dic 2025
 * Versión: v3.8.0
 * 
 * Funcionalidades:
 * - Crear/Actualizar/Eliminar banners
 * - Obtener configuración activa
 * - Gestionar visibilidad y estilos
 * - Solo acceso admin (RLS en BD)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface BannerConfig {
  id: string;
  banner_type: 'beta' | 'news' | 'announcement' | 'maintenance' | 'custom';
  title: string;
  description?: string;
  is_active: boolean;
  show_close_button: boolean;
  background_color: string; // Tailwind gradient class
  text_color: string; // Tailwind text color
  icon_type?: string; // 'rocket', 'bell', 'gift', etc
  cta_text?: string;
  cta_link?: string;
  storage_key?: string;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateBannerInput {
  banner_type: BannerConfig['banner_type'];
  title: string;
  description?: string;
  is_active?: boolean;
  show_close_button?: boolean;
  background_color?: string;
  text_color?: string;
  icon_type?: string;
  cta_text?: string;
  cta_link?: string;
  storage_key?: string;
  priority?: number;
}

export interface UpdateBannerInput extends Partial<CreateBannerInput> {}

// ============================================================================
// SERVICIO
// ============================================================================

class BannerManagementServiceClass {
  /**
   * Obtener todas las configuraciones de banners
   */
  async getAllBanners(): Promise<BannerConfig[]> {
    try {
      const { data, error } = await (supabase.from('banner_config') as any)
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error obteniendo banners:', { error: error.message });
        return [];
      }

      logger.info('✅ Banners obtenidos exitosamente', { count: data?.length || 0 });
      return (data || []) as BannerConfig[];
    } catch (error) {
      logger.error('❌ Error inesperado en getAllBanners:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Obtener configuración de un banner específico
   */
  async getBannerByType(bannerType: BannerConfig['banner_type']): Promise<BannerConfig | null> {
    try {
      const { data, error } = await (supabase.from('banner_config') as any)
        .select('*')
        .eq('banner_type', bannerType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe
          logger.info(`ℹ️ Banner ${bannerType} no encontrado`);
          return null;
        }
        logger.error('❌ Error obteniendo banner:', { error: error.message });
        return null;
      }

      return (data || null) as BannerConfig | null;
    } catch (error) {
      logger.error('❌ Error inesperado en getBannerByType:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Obtener solo banners activos
   */
  async getActiveBanners(): Promise<BannerConfig[]> {
    try {
      const client = getSupabase();
      const { data, error } = await (client.from('banner_config') as any)
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        logger.error('❌ Error obteniendo banners activos:', { error: error.message });
        return [];
      }

      return (data || []) as BannerConfig[];
    } catch (error) {
      logger.error('❌ Error inesperado en getActiveBanners:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Crear nuevo banner
   */
  async createBanner(input: CreateBannerInput): Promise<BannerConfig | null> {
    try {
      const { data, error } = await (supabase.from('banner_config') as any)
        .insert([
          {
            banner_type: input.banner_type,
            title: input.title,
            description: input.description || null,
            is_active: input.is_active ?? true,
            show_close_button: input.show_close_button ?? true,
            background_color: input.background_color || 'from-purple-600 to-blue-600',
            text_color: input.text_color || 'text-white',
            icon_type: input.icon_type || null,
            cta_text: input.cta_text || null,
            cta_link: input.cta_link || null,
            storage_key: input.storage_key || null,
            priority: input.priority || 0,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creando banner:', { error: error.message });
        return null;
      }

      logger.info('✅ Banner creado exitosamente', { id: data?.id, type: input.banner_type });
      return (data || null) as BannerConfig | null;
    } catch (error) {
      logger.error('❌ Error inesperado en createBanner:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Actualizar banner existente
   */
  async updateBanner(bannerId: string, input: UpdateBannerInput): Promise<BannerConfig | null> {
    try {
      const updateData: Record<string, any> = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;
      if (input.show_close_button !== undefined) updateData.show_close_button = input.show_close_button;
      if (input.background_color !== undefined) updateData.background_color = input.background_color;
      if (input.text_color !== undefined) updateData.text_color = input.text_color;
      if (input.icon_type !== undefined) updateData.icon_type = input.icon_type;
      if (input.cta_text !== undefined) updateData.cta_text = input.cta_text;
      if (input.cta_link !== undefined) updateData.cta_link = input.cta_link;
      if (input.priority !== undefined) updateData.priority = input.priority;

      const { data, error } = await (supabase.from('banner_config') as any)
        .update(updateData)
        .eq('id', bannerId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error actualizando banner:', { error: error.message });
        return null;
      }

      logger.info('✅ Banner actualizado exitosamente', { id: bannerId });
      return (data || null) as BannerConfig | null;
    } catch (error) {
      logger.error('❌ Error inesperado en updateBanner:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Eliminar banner
   */
  async deleteBanner(bannerId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('banner_config') as any)
        .delete()
        .eq('id', bannerId);

      if (error) {
        logger.error('❌ Error eliminando banner:', { error: error.message });
        return false;
      }

      logger.info('✅ Banner eliminado exitosamente', { id: bannerId });
      return true;
    } catch (error) {
      logger.error('❌ Error inesperado en deleteBanner:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Alternar visibilidad de banner
   */
  async toggleBannerVisibility(bannerId: string, isActive: boolean): Promise<BannerConfig | null> {
    try {
      return await this.updateBanner(bannerId, { is_active: isActive });
    } catch (error) {
      logger.error('❌ Error toggling visibility:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Resetear estado de cierre de banner (para todos los usuarios)
   */
  async resetBannerDismissal(bannerType: BannerConfig['banner_type']): Promise<boolean> {
    try {
      const banner = await this.getBannerByType(bannerType);
      if (!banner || !banner.storage_key) {
        logger.warn('⚠️ Banner no tiene storage_key configurado');
        return false;
      }

      // Nota: Esto requeriría una edge function para limpiar localStorage de todos los usuarios
      // Por ahora, solo registramos la intención
      logger.info('📝 Reset de dismissal solicitado', { 
        bannerType,
        storageKey: banner.storage_key,
        nota: 'Requiere edge function para limpiar localStorage global'
      });

      return true;
    } catch (error) {
      logger.error('❌ Error en resetBannerDismissal:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

export const BannerManagementService = new BannerManagementServiceClass();
