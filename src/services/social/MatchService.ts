/**
 * MatchService - Servicio para gestionar likes y matches.
 *
 * @version 1.0.0
 * @since 2026-01-02
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface Like {
  id?: string;
  liker_id: string;
  liked_id: string;
  created_at?: string;
}

export interface Match {
  id?: string;
  user1_id: string;
  user2_id: string;
  created_at?: string;
}

class MatchService {
  private toCanonicalPair(idA: string, idB: string): { a: string; b: string } {
    return idA < idB ? { a: idA, b: idB } : { a: idB, b: idA };
  }

  /**
   * Registra un 'like' de un usuario a otro.
   */
  async createLike(
    likerId: string,
    likedId: string,
  ): Promise<{ success: boolean; isMatch: boolean; error?: any }> {
    if (!likerId || !likedId) {
      logger.warn("createLike: likerId y likedId son requeridos.");
      return {
        success: false,
        isMatch: false,
        error: "IDs de usuario inválidos",
      };
    }

    try {
      // 1. Insertar el nuevo 'like'
      const { error: insertError } = await (supabase as any)
        .from("profile_likes")
        .insert({ liker_id: likerId, liked_id: likedId });

      if (insertError) {
        // Ignorar error de duplicado (el usuario ya dio like)
        if (insertError.code === "23505") {
          logger.debug("El usuario ya había dado like a este perfil.", {
            likerId,
            likedId,
          });
        } else {
          throw insertError;
        }
      }

      // 2. Verificar si es un match mutuo
      const isMatch = await this.checkForMatch(likerId, likedId);

      return { success: true, isMatch };
    } catch (error) {
      logger.error("Error en createLike:", { error });
      return { success: false, isMatch: false, error };
    }
  }

  /**
   * Verifica si un 'like' es mutuo y crea un 'match' si lo es.
   */
  private async checkForMatch(
    user1Id: string,
    user2Id: string,
  ): Promise<boolean> {
    try {
      // Verificar si user2 también ha dado like a user1
      const { data, error } = await (supabase as any)
        .from("profile_likes")
        .select("id")
        .eq("liker_id", user2Id)
        .eq("liked_id", user1Id)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // ¡Es un match!
        logger.info("¡Match! Creando registro de match...", {
          user1Id,
          user2Id,
        });
        await this.createMatch(user1Id, user2Id);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error en checkForMatch:", { error });
      return false;
    }
  }

  /**
   * Crea un registro de 'match' entre dos usuarios.
   */
  private async createMatch(user1Id: string, user2Id: string): Promise<void> {
    try {
      const { a: profileId1, b: profileId2 } = this.toCanonicalPair(
        user1Id,
        user2Id,
      );

      const { error } = await (supabase as any).from("matches").insert({
        profile_id_1: profileId1,
        profile_id_2: profileId2,
        // Importante: mantener compatibilidad con RLS antigua que valida auth.uid() = user1_id
        user1_id: user1Id,
        user2_id: user2Id,
        status: "accepted",
        matched_at: new Date().toISOString(),
      });

      if (error) {
        // Ignorar error de duplicado si el match ya existe
        if (error.code !== "23505") {
          throw error;
        }
      }
      // Aquí se podría disparar una notificación a ambos usuarios
    } catch (error) {
      logger.error("Error en createMatch:", { error });
    }
  }

  /**
   * Verifica si existe un match entre dos usuarios.
   */
  async checkExistingMatch(user1Id: string, user2Id: string): Promise<boolean> {
    if (!user1Id || !user2Id) return false;

    try {
      const { data, error } = await (supabase as any)
        .from("matches")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(profile_id_1.eq.${user1Id},profile_id_2.eq.${user2Id}),and(profile_id_1.eq.${user2Id},profile_id_2.eq.${user1Id}),and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`,
        )
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      logger.error("Error en checkExistingMatch:", { error });
      return false;
    }
  }

  /**
   * Obtiene el conjunto de IDs de usuarios con los que el usuario actual tiene match.
   */
  async getMatchedUserIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    try {
      const { data, error } = await (supabase as any)
        .from("matches")
        .select("profile_id_1, profile_id_2, user1_id, user2_id")
        .eq("status", "accepted")
        .or(
          `profile_id_1.eq.${userId},profile_id_2.eq.${userId},user1_id.eq.${userId},user2_id.eq.${userId}`,
        );

      if (error) throw error;

      const ids: string[] = [];
      for (const row of data || []) {
        const candidates = [
          row.profile_id_1,
          row.profile_id_2,
          row.user1_id,
          row.user2_id,
        ].filter(Boolean);

        if (candidates.includes(userId)) {
          for (const candidate of candidates) {
            if (candidate && candidate !== userId) ids.push(candidate);
          }
        }
      }
      return Array.from(new Set(ids));
    } catch (error) {
      logger.error("Error en getMatchedUserIds:", { error });
      return [];
    }
  }
}

export const matchService = new MatchService();
