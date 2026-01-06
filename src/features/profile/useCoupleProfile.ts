import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import type { CoupleProfile } from "@/services/couple/AdvancedCoupleService";
import {
  coupleProfilesService,
  getAllCoupleProfiles,
} from "@/services/couple/CoupleProfilesService";

// Extended interface for couple profiles with partner details
// Note: AdvancedCoupleService might return this structure implicitly or we might need to fetch partners separately
// For now, we align with what AdvancedCoupleService provides + partner expansion logic if needed
export interface CoupleProfileWithPartners extends CoupleProfile {
  partner1_first_name?: string;
  partner1_last_name?: string;
  partner1_age?: number;
  partner1_bio?: string | null;
  partner1_gender?: string;
  partner2_first_name?: string;
  partner2_last_name?: string;
  partner2_age?: number;
  partner2_bio?: string | null;
  partner2_gender?: string;
}

// Hook for fetching couple profile by ID
export const useCoupleProfile = (coupleId: string | undefined) => {
  return useQuery({
    queryKey: ["couple-profile", coupleId],
    queryFn: async () => {
      if (!coupleId) return null;

      logger.info("Fetching couple profile via Service", { coupleId });

      const profile = await coupleProfilesService.getCoupleProfile(coupleId);

      if (profile) {
        logger.info("✅ Couple profile fetched successfully:", {
          couple_name: profile.couple_name,
        });
        // The service already returns a rich object, we cast it to our extended type
        // In a real refactor, we would ensure getCoupleProfile returns the exact type
        return profile as unknown as CoupleProfileWithPartners;
      }

      return null;
    },
    enabled: !!coupleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching couple profiles with pagination
export const useCoupleProfiles = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["couple-profiles", page, limit],
    queryFn: async () => {
      logger.info("Fetching couple profiles via Service", { page, limit });

      const offset = Math.max(0, (page - 1) * limit);
      const data = await getAllCoupleProfiles(limit, offset);

      return {
        data: data as unknown as CoupleProfileWithPartners[],
        count: data.length,
        page,
        limit,
        totalPages: page,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
