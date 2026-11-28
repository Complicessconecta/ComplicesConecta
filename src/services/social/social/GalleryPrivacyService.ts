import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, resolveStoredDemoAccountType } from "@/lib/app-config";
import {
  debitDemoWallet,
  getDemoGalleryUnlockCreatedAt,
  recordDemoGalleryUnlock,
  type DemoAccountType,
} from "@/lib/demo-wallet";
import { logger } from "@/lib/logger";
import {
  GALLERY_UNLOCK_VALIDITY_MS,
  isGalleryUnlockValid,
} from "@/services/payments/WelcomeTokensService";
import { tokenService } from "@/services/payments/TokenService";

export interface GalleryUnlock {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
}

class GalleryPrivacyService {
  private static instance: GalleryPrivacyService;
  /**
   * Costo de desbloqueo (ronda 24, stream C: se CONSERVA el precio
   * del código frente al objetivo de 20 CMPX de la ronda; la
   * diferencia queda reportada). Antes el desbloqueo era GRATIS (se
   * comprobaba el saldo pero nunca se debitaba) y PERMANENTE; ahora
   * se debita y dura 24 h (`GALLERY_UNLOCK_VALIDITY_MS`, expiración
   * derivada de `created_at`: la tabla no tiene columna `expires_at`
   * y no hay migración autorizada en la ronda).
   */
  private readonly CMPX_COST = 100; // Costo de desbloqueo

  private constructor() {}

  public static getInstance(): GalleryPrivacyService {
    if (!GalleryPrivacyService.instance) {
      GalleryPrivacyService.instance = new GalleryPrivacyService();
    }
    return GalleryPrivacyService.instance;
  }

  /**
   * ¿Tiene el usuario un desbloqueo VIGENTE de esta galería? Un
   * desbloqueo vale 24 h desde su creación; expirado, hay que volver
   * a pagar. En demo se lee el almacén local
   * (`cc_demo_gallery_unlocks_v1`).
   */
  async hasGalleryAccess(
    userId: string,
    galleryItemId: string,
  ): Promise<boolean> {
    if (isDemoMode()) {
      const createdAt = getDemoGalleryUnlockCreatedAt(userId, galleryItemId);
      return isGalleryUnlockValid(createdAt);
    }

    try {
      const { data, error } = await supabase
        .from("gallery_unlocks")
        .select("created_at")
        .eq("user_id", userId)
        .eq("profile_id", galleryItemId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        logger.error("Error checking gallery access", { error });
        return false;
      }

      const latest = (data as unknown as { created_at: string }[] | null)?.[0];
      return isGalleryUnlockValid(latest?.created_at);
    } catch (error) {
      logger.error("Error checking gallery access", { error });
      return false;
    }
  }

  /**
   * Desbloquea una galería privada por 24 h. Si ya hay un desbloqueo
   * vigente NO se vuelve a cobrar. Si no, se debita `CMPX_COST` del
   * saldo (demo: billetera demo; real: `user_token_balances` vía
   * `TokenService`) y se registra el desbloqueo con su `created_at`.
   */
  async unlockGallery(
    userId: string,
    galleryItemId: string,
    creatorId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode()) {
      return this.unlockGalleryDemo(userId, galleryItemId, creatorId);
    }

    try {
      const hasAccess = await this.hasGalleryAccess(userId, galleryItemId);

      if (hasAccess) {
        return { success: true };
      }

      const { data: balance } = await supabase
        .from("user_token_balances")
        .select("cmpx_balance")
        .eq("user_id", userId)
        .single();

      if (!balance || balance.cmpx_balance < this.CMPX_COST) {
        return { success: false, error: "No tienes suficientes tokens CMPX" };
      }

      // Ronda 24, stream C: antes no se debitaba nada (desbloqueo
      // gratis). Ahora el desbloqueo cobra CMPX_COST de verdad.
      const debited = await tokenService.spendTokens(
        userId,
        "cmpx",
        this.CMPX_COST,
        "Desbloqueo de galería privada",
        { reason: "gallery_unlock", profile_id: galleryItemId },
      );
      if (!debited) {
        return { success: false, error: "No tienes suficientes tokens CMPX" };
      }

      const { error } = await supabase.from("gallery_unlocks").insert({
        user_id: userId,
        profile_id: galleryItemId,
      });

      if (error) {
        logger.error("Error unlocking gallery", { error });
        return { success: false, error: "Error al desbloquear galería" };
      }

      logger.info("Gallery unlocked", {
        userId: userId.substring(0, 8) + "***",
        galleryItemId: galleryItemId.substring(0, 8) + "***",
        creatorId: creatorId.substring(0, 8) + "***",
        costCmpx: this.CMPX_COST,
        validMs: GALLERY_UNLOCK_VALIDITY_MS,
      });
      return { success: true };
    } catch (error) {
      logger.error("Error unlocking gallery", { error });
      return { success: false, error: "Error al desbloquear galería" };
    }
  }

  private async unlockGalleryDemo(
    userId: string,
    galleryItemId: string,
    creatorId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (await this.hasGalleryAccess(userId, galleryItemId)) {
      return { success: true };
    }

    const accountType: DemoAccountType =
      resolveStoredDemoAccountType() ?? "single";
    const debited = debitDemoWallet(accountType, this.CMPX_COST);
    if (!debited) {
      return { success: false, error: "No tienes suficientes tokens CMPX" };
    }

    recordDemoGalleryUnlock(userId, galleryItemId);
    logger.info("Gallery unlocked (demo)", {
      userId: userId.substring(0, 8) + "***",
      galleryItemId: galleryItemId.substring(0, 8) + "***",
      creatorId: creatorId.substring(0, 8) + "***",
      costCmpx: this.CMPX_COST,
      validMs: GALLERY_UNLOCK_VALIDITY_MS,
    });
    return { success: true };
  }

  getCMPCost(): number {
    return this.CMPX_COST;
  }
}

export const galleryPrivacyService = GalleryPrivacyService.getInstance();
export type { GalleryPrivacyService };
