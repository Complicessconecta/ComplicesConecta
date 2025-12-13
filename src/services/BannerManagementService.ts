/**
 * BannerManagementService - Gestión de Banners desde Admin
 * =========================================================
 * Descripción: Servicio para CRUD de configuración de banners
 * Fecha: 13 Dic 2025
 * Versión: v3.8.0
 *
 * Funcionalidades:
 * - Crear/Actualizar/Eliminar banners
 * - Obtener configuración activa
 * - Gestionar visibilidad y estilos
 * - Solo acceso admin (RLS en BD)
 */

import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Database } from "@/types/supabase";

// Wrapper seguro para Supabase
const supabase = supabaseClient; // No longer need || null due to the stub in client.ts

// ============================================================================
// TIPOS Y INTERFACES - Usando tipos generados por Supabase
// ============================================================================

type BannerConfigTable = Database["public"]["Tables"]["banner_config"];
export type BannerConfig = BannerConfigTable["Row"];
export type CreateBannerInput = BannerConfigTable["Insert"];
export type UpdateBannerInput = BannerConfigTable["Update"];

// ============================================================================
// SERVICIO
// ============================================================================

class BannerManagementServiceClass {
  /**
   * Obtener todas las configuraciones de banners
   */
  async getAllBanners(): Promise<BannerConfig[]> {
    try {
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return [];
      }

      const { data, error } = await supabase
        .from("banner_config")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("❌ Error obteniendo banners:", { error: error.message });
        return [];
      }

      logger.info("✅ Banners obtenidos exitosamente", {
        count: data?.length || 0,
      });
      return data || [];
    } catch (error) {
      logger.error("❌ Error inesperado en getAllBanners:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Obtener configuración de un banner específico
   */
  async getBannerByType(
    bannerType: BannerConfig["banner_type"],
  ): Promise<BannerConfig | null> {
    try {
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return null;
      }

      const { data, error } = await supabase
        .from("banner_config")
        .select("*")
        .eq("banner_type", bannerType)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          logger.info(`ℹ️ Banner ${bannerType} no encontrado`);
        } else {
          logger.error("❌ Error obteniendo banner:", { error: error.message });
        }
        return null;
      }

      return data;
    } catch (error) {
      logger.error("❌ Error inesperado en getBannerByType:", {
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
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return [];
      }

      const { data, error } = await supabase
        .from("banner_config")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) {
        logger.error("❌ Error obteniendo banners activos:", {
          error: error.message,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("❌ Error inesperado en getActiveBanners:", {
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
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return null;
      }

      const { data, error } = await supabase
        .from("banner_config")
        .insert(input)
        .select()
        .single();

      if (error) {
        logger.error("❌ Error creando banner:", { error: error.message });
        return null;
      }

      logger.info("✅ Banner creado exitosamente", {
        id: data?.id,
        type: input.banner_type,
      });
      return data;
    } catch (error) {
      logger.error("❌ Error inesperado en createBanner:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Actualizar banner existente
   */
  async updateBanner(
    bannerId: string,
    input: UpdateBannerInput,
  ): Promise<BannerConfig | null> {
    try {
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return null;
      }

      const { data, error } = await supabase
        .from("banner_config")
        .update(input)
        .eq("id", bannerId)
        .select()
        .single();

      if (error) {
        logger.error("❌ Error actualizando banner:", { error: error.message });
        return null;
      }

      logger.info("✅ Banner actualizado exitosamente", { id: bannerId });
      return data;
    } catch (error) {
      logger.error("❌ Error inesperado en updateBanner:", {
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
      if (!supabase) {
        logger.error("❌ Supabase no inicializado");
        return false;
      }

      const { error } = await supabase
        .from("banner_config")
        .delete()
        .eq("id", bannerId);

      if (error) {
        logger.error("❌ Error eliminando banner:", { error: error.message });
        return false;
      }

      logger.info("✅ Banner eliminado exitosamente", { id: bannerId });
      return true;
    } catch (error) {
      logger.error("❌ Error inesperado en deleteBanner:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Alternar visibilidad de banner
   */
  async toggleBannerVisibility(
    bannerId: string,
    isActive: boolean,
  ): Promise<BannerConfig | null> {
    return this.updateBanner(bannerId, { is_active: isActive });
  }

  /**
   * Resetear estado de cierre de banner (para todos los usuarios)
   */
  async resetBannerDismissal(
    bannerType: BannerConfig["banner_type"],
  ): Promise<boolean> {
    try {
      const banner = await this.getBannerByType(bannerType);
      if (!banner || !banner.storage_key) {
        logger.warn(
          "⚠️ Banner no tiene storage_key configurado para dismissal",
        );
        return false;
      }

      // Nota: Esto requeriría una edge function para limpiar localStorage de todos los usuarios.
      // Por ahora, solo registramos la intención.
      logger.info("📝 Reset de dismissal solicitado", {
        bannerType,
        storageKey: banner.storage_key,
        nota: "Implementación futura requiere edge function para limpieza global de localStorage.",
      });

      return true;
    } catch (error) {
      logger.error("❌ Error en resetBannerDismissal:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

export const BannerManagementService = new BannerManagementServiceClass();
