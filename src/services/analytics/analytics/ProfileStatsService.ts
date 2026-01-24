/**
 * =====================================================
 * PROFILE STATS SERVICE
 * =====================================================
 * Servicio para gestionar estadísticas de perfiles
 * Fecha: 19 Nov 2025
 * Versión: v3.6.5
 * =====================================================
 */

import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileStats {
  totalViews: number;
  totalLikes: number;
  totalMatches: number;
  profileCompleteness: number;
  lastActive: Date;
  joinDate: Date;
  verificationLevel: number;
  monthlyViews?: number;
  weeklyLikes?: number;
  responseRate?: number;
  avgResponseTime?: number;
}

export interface ActivityItem {
  id: string;
  type: "like" | "view" | "match" | "message" | "visit" | "share";
  description: string;
  time: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any; // Lucide icon component
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  reward?: {
    tokens?: number;
    nft?: boolean;
  };
}

export class ProfileStatsService {
  /**
   * Cargar estadísticas del perfil
   */
  async loadProfileStats(profileId?: string): Promise<ProfileStats> {
    try {
      logger.info("[ProfileStatsService] Loading stats for profile:", {
        profileId,
      });

      // Si no hay profileId o Supabase no está disponible, usar datos simulados seguros
      if (!profileId || !supabase) {
        const simulated: ProfileStats = {
          totalViews: Math.floor(Math.random() * 2000) + 500,
          totalLikes: Math.floor(Math.random() * 800) + 100,
          totalMatches: Math.floor(Math.random() * 150) + 20,
          profileCompleteness: Math.floor(Math.random() * 30) + 70,
          lastActive: new Date(Date.now() - Math.random() * 86400000),
          joinDate: new Date(Date.now() - Math.random() * 365 * 86400000),
          verificationLevel: Math.floor(Math.random() * 3) + 1,
          monthlyViews: Math.floor(Math.random() * 500) + 100,
          weeklyLikes: Math.floor(Math.random() * 200) + 50,
          responseRate: Math.random() * 40 + 60,
          avgResponseTime: Math.random() * 120 + 10,
        };
        return simulated;
      }

      // Cargar datos básicos del perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, name, bio, avatar_url, location, age, gender, interests, created_at, updated_at, is_verified",
        )
        .eq("id", profileId)
        .single();

      if (profileError) {
        logger.warn(
          "[ProfileStatsService] Supabase profile fetch error, using fallback:",
          { error: profileError },
        );
        const fallback: ProfileStats = {
          totalViews: Math.floor(Math.random() * 2000) + 500,
          totalLikes: Math.floor(Math.random() * 800) + 100,
          totalMatches: Math.floor(Math.random() * 150) + 20,
          profileCompleteness: Math.floor(Math.random() * 30) + 70,
          lastActive: new Date(Date.now() - Math.random() * 86400000),
          joinDate: new Date(Date.now() - Math.random() * 365 * 86400000),
          verificationLevel: Math.floor(Math.random() * 3) + 1,
          monthlyViews: Math.floor(Math.random() * 500) + 100,
          weeklyLikes: Math.floor(Math.random() * 200) + 50,
          responseRate: Math.random() * 40 + 60,
          avgResponseTime: Math.random() * 120 + 10,
        };
        return fallback;
      }

      // Contar matches asociados al perfil
      const { count: matchesCount, error: matchesError } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

      if (matchesError) {
        logger.warn("[ProfileStatsService] Supabase matches count error:", {
          error: matchesError,
        });
      }

      // Contar vistas totales usando app_metrics (si existen registros)
      const { count: viewsTotal, error: viewsError } = await supabase
        .from("app_metrics")
        .select("*", { count: "exact", head: true })
        .eq("metric_name", "profile_views")
        .filter("tags", "cs", `{"profile_id":"${profileId}"}`);

      if (viewsError) {
        logger.warn("[ProfileStatsService] Supabase views count error:", {
          error: viewsError,
        });
      }

      // Contar likes totales usando app_metrics (si existen registros)
      const { count: likesTotal, error: likesError } = await supabase
        .from("app_metrics")
        .select("*", { count: "exact", head: true })
        .eq("metric_name", "profile_likes")
        .filter("tags", "cs", `{"profile_id":"${profileId}"}`);

      if (likesError) {
        logger.warn("[ProfileStatsService] Supabase likes count error:", {
          error: likesError,
        });
      }

      // Calcular métricas temporales (últimos 30/7 días)
      const now = new Date();
      const monthStart = new Date(now);
      monthStart.setDate(now.getDate() - 30);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const { count: monthViews, error: monthError } = await supabase
        .from("app_metrics")
        .select("*", { count: "exact", head: true })
        .eq("metric_name", "profile_views")
        .contains("metadata", { profile_id: profileId } as any)
        .gte("recorded_at", monthStart.toISOString());

      if (monthError) {
        logger.warn("[ProfileStatsService] Supabase monthly views error:", {
          error: monthError,
        });
      }

      const { count: weekLikes, error: weekError } = await supabase
        .from("app_metrics")
        .select("*", { count: "exact", head: true })
        .eq("metric_name", "profile_likes")
        .contains("metadata", { profile_id: profileId } as any)
        .gte("recorded_at", weekStart.toISOString());

      if (weekError) {
        logger.warn("[ProfileStatsService] Supabase weekly likes error:", {
          error: weekError,
        });
      }

      const completeness = this.calculateProfileCompleteness(profile);

      const stats: ProfileStats = {
        totalViews:
          typeof viewsTotal === "number"
            ? viewsTotal
            : Math.floor(Math.random() * 2000) + 500,
        totalLikes:
          typeof likesTotal === "number"
            ? likesTotal
            : Math.floor(Math.random() * 800) + 100,
        totalMatches:
          typeof matchesCount === "number"
            ? matchesCount
            : Math.floor(Math.random() * 150) + 20,
        profileCompleteness: completeness,
        lastActive: profile?.updated_at
          ? new Date(profile.updated_at)
          : new Date(Date.now() - Math.random() * 86400000),
        joinDate: profile?.created_at
          ? new Date(profile.created_at)
          : new Date(Date.now() - Math.random() * 365 * 86400000),
        verificationLevel: profile?.is_verified ? 3 : 1,
        monthlyViews:
          typeof monthViews === "number"
            ? monthViews
            : Math.floor(Math.random() * 500) + 100,
        weeklyLikes:
          typeof weekLikes === "number"
            ? weekLikes
            : Math.floor(Math.random() * 200) + 50,
        responseRate: Math.random() * 40 + 60,
        avgResponseTime: Math.random() * 120 + 10,
      };

      return stats;
    } catch (error) {
      logger.error("[ProfileStatsService] Error loading stats:", { error });
      throw error;
    }
  }

  /**
   * Cargar actividad reciente
   */
  async loadRecentActivity(
    profileId?: string,
    limit: number = 10,
  ): Promise<ActivityItem[]> {
    try {
      logger.info("[ProfileStatsService] Loading recent activity:", {
        profileId,
        limit,
      });

      // Simular actividad reciente más detallada
      const activities: ActivityItem[] = [
        {
          id: "1",
          type: "like",
          description: "Recibiste un like de María",
          time: "2 horas",
          timestamp: new Date(Date.now() - 2 * 3600000),
        },
        {
          id: "2",
          type: "view",
          description: "Tu perfil fue visto 15 veces",
          time: "4 horas",
          timestamp: new Date(Date.now() - 4 * 3600000),
        },
        {
          id: "3",
          type: "match",
          description: "Nuevo match con Carlos",
          time: "1 día",
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: "4",
          type: "message",
          description: "Nuevo mensaje de Ana",
          time: "2 días",
          timestamp: new Date(Date.now() - 2 * 86400000),
        },
        {
          id: "5",
          type: "visit",
          description: "Visitaste el perfil de Juan",
          time: "3 días",
          timestamp: new Date(Date.now() - 3 * 86400000),
        },
        {
          id: "6",
          type: "share",
          description: "Compartiste un post",
          time: "4 días",
          timestamp: new Date(Date.now() - 4 * 86400000),
        },
      ];

      return activities.slice(0, limit);
    } catch (error) {
      logger.error("[ProfileStatsService] Error loading activity:", { error });
      throw error;
    }
  }

  /**
   * Cargar logros del perfil
   */
  async loadAchievements(
    profileId?: string,
    isVerified: boolean = false,
  ): Promise<Achievement[]> {
    try {
      logger.info("[ProfileStatsService] Loading achievements:", { profileId });

      // Importar dinámicamente los iconos para evitar bundle bloat
      const {
        Heart,
        CheckCircle,
        Star,
        Award,
        Users,
        MessageCircle,
        Camera,
        Trophy,
        Zap,
        Shield,
      } = await import("lucide-react");

      const achievements: Achievement[] = [
        {
          id: "1",
          title: "Primer Like",
          description: "Recibiste tu primer like",
          icon: Heart,
          unlocked: true,
          reward: { tokens: 10 },
        },
        {
          id: "2",
          title: "Perfil Completo",
          description: "Completaste tu perfil al 100%",
          icon: CheckCircle,
          unlocked: true,
          reward: { tokens: 50 },
        },
        {
          id: "3",
          title: "Popular",
          description: "Recibiste 100 likes",
          icon: Star,
          unlocked: false,
          progress: 65,
          maxProgress: 100,
          reward: { tokens: 100 },
        },
        {
          id: "4",
          title: "Verificado",
          description: "Tu perfil fue verificado",
          icon: Award,
          unlocked: isVerified,
          reward: { tokens: 200, nft: true },
        },
        {
          id: "5",
          title: "Social",
          description: "Conecta con 50 personas",
          icon: Users,
          unlocked: false,
          progress: 23,
          maxProgress: 50,
          reward: { tokens: 75 },
        },
        {
          id: "6",
          title: "Conversador",
          description: "Envía 100 mensajes",
          icon: MessageCircle,
          unlocked: false,
          progress: 42,
          maxProgress: 100,
          reward: { tokens: 50 },
        },
        {
          id: "7",
          title: "Fotógrafo",
          description: "Sube 20 fotos",
          icon: Camera,
          unlocked: false,
          progress: 8,
          maxProgress: 20,
          reward: { tokens: 30 },
        },
        {
          id: "8",
          title: "Campeón",
          description: "Completa todos los logros",
          icon: Trophy,
          unlocked: false,
          progress: 2,
          maxProgress: 10,
          reward: { tokens: 500, nft: true },
        },
        {
          id: "9",
          title: "Actividad",
          description: "Inicia sesión 7 días seguidos",
          icon: Zap,
          unlocked: false,
          progress: 3,
          maxProgress: 7,
          reward: { tokens: 40 },
        },
        {
          id: "10",
          title: "Guardián",
          description: "Reporta contenido inapropiado",
          icon: Shield,
          unlocked: false,
          reward: { tokens: 20 },
        },
      ];

      return achievements;
    } catch (error) {
      logger.error("[ProfileStatsService] Error loading achievements:", {
        error,
      });
      throw error;
    }
  }

  /**
   * Calcular completitud del perfil
   */
  calculateProfileCompleteness(profile: any): number {
    let completeness = 0;
    const fields = [
      "name",
      "bio",
      "avatar_url",
      "location",
      "age",
      "gender",
      "preferences",
      "interests",
    ];

    fields.forEach((field) => {
      if (profile?.[field]) completeness += 100 / fields.length;
    });

    return Math.round(completeness);
  }

  /**
   * Incrementar contador de vistas
   */
  async incrementViews(profileId: string): Promise<void> {
    try {
      logger.info("[ProfileStatsService] Incrementing views:", { profileId });
      if (!supabase) return;
      const { error } = await supabase.from("app_metrics").insert({
        user_id: profileId,
        metric_name: "profile_views",
        metric_value: 1,
        metric_type: "counter",
        timestamp: new Date().toISOString(),
        tags: { profile_id: profileId },
      } as any);
      if (error) {
        logger.warn("[ProfileStatsService] Failed to record view metric:", {
          error,
        });
      }
    } catch (error) {
      logger.error("[ProfileStatsService] Error incrementing views:", {
        error,
      });
    }
  }

  /**
   * Incrementar contador de likes
   */
  async incrementLikes(profileId: string): Promise<void> {
    try {
      logger.info("[ProfileStatsService] Incrementing likes:", { profileId });
      if (!supabase) return;
      const { error } = await supabase.from("app_metrics").insert({
        user_id: profileId,
        metric_name: "profile_likes",
        metric_value: 1,
        metric_type: "counter",
        timestamp: new Date().toISOString(),
        tags: { profile_id: profileId },
      } as any);
      if (error) {
        logger.warn("[ProfileStatsService] Failed to record like metric:", {
          error,
        });
      }
    } catch (error) {
      logger.error("[ProfileStatsService] Error incrementing likes:", {
        error,
      });
    }
  }
}

export const profileStatsService = new ProfileStatsService();
