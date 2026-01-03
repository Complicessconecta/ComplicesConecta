/**
 * MatchService - Servicio para gestionar likes y matches.
 * 
 * @version 1.0.0
 * @since 2026-01-02
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
  /**
   * Registra un 'like' de un usuario a otro.
   */
  async createLike(likerId: string, likedId: string): Promise<{ success: boolean; isMatch: boolean; error?: any }> {
    if (!likerId || !likedId) {
      logger.warn('createLike: likerId y likedId son requeridos.');
      return { success: false, isMatch: false, error: 'IDs de usuario inválidos' };
    }

    try {
      // 1. Insertar el nuevo 'like'
      const { error: insertError } = await (supabase as any)
        .from('likes')
        .insert({ liker_id: likerId, liked_id: likedId });

      if (insertError) {
        // Ignorar error de duplicado (el usuario ya dio like)
        if (insertError.code === '23505') {
          logger.debug('El usuario ya había dado like a este perfil.', { likerId, likedId });
        } else {
          throw insertError;
        }
      }

      // 2. Verificar si es un match mutuo
      const isMatch = await this.checkForMatch(likerId, likedId);

      return { success: true, isMatch };

    } catch (error) {
      logger.error('Error en createLike:', { error });
      return { success: false, isMatch: false, error };
    }
  }

  /**
   * Verifica si un 'like' es mutuo y crea un 'match' si lo es.
   */
  private async checkForMatch(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      // Verificar si user2 también ha dado like a user1
      const { data, error } = await (supabase as any)
        .from('likes')
        .select('id')
        .eq('liker_id', user2Id)
        .eq('liked_id', user1Id)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // ¡Es un match!
        logger.info('¡Match! Creando registro de match...', { user1Id, user2Id });
        await this.createMatch(user1Id, user2Id);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error en checkForMatch:', { error });
      return false;
    }
  }

  /**
   * Crea un registro de 'match' entre dos usuarios.
   */
  private async createMatch(user1Id: string, user2Id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .insert({ user1_id: user1Id, user2_id: user2Id });

      if (error) {
        // Ignorar error de duplicado si el match ya existe
        if (error.code !== '23505') {
          throw error;
        }
      }
      // Aquí se podría disparar una notificación a ambos usuarios

    } catch (error) {
      logger.error('Error en createMatch:', { error });
    }
  }

  /**
   * Verifica si existe un match entre dos usuarios.
   */
  async checkExistingMatch(user1Id: string, user2Id: string): Promise<boolean> {
    if (!user1Id || !user2Id) return false;

    try {
      const { data, error } = await (supabase as any)
        .from('matches')
        .select('id')
        .or(`(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      logger.error('Error en checkExistingMatch:', { error });
      return false;
    }
  }
}

export const matchService = new MatchService();
