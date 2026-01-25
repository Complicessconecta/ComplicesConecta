// Servicio de ranking bayesiano de clubes
// Fase 6: Ranking Bayesiano de Clubes

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ClubRanking {
  clubId: string;
  clubName: string;
  averageRating: number;
  totalReviews: number;
  bayesianScore: number;
  rank: number;
}

export class ClubRankingService {
  private static instance: ClubRankingService;

  // Constante m para el algoritmo bayesiano (mínimo de votos necesarios)
  private readonly MIN_REVIEWS = 5;

  private constructor() {}

  static getInstance(): ClubRankingService {
    if (!ClubRankingService.instance) {
      ClubRankingService.instance = new ClubRankingService();
    }
    return ClubRankingService.instance;
  }

  /**
   * Calcular score bayesiano para un club
   * Fórmula: (v * R + m * C) / (v + m)
   * Donde:
   * - v = número de votos (reseñas)
   * - R = promedio del club
   * - m = constante (mínimo de votos necesarios)
   * - C = promedio global (3.0 como base)
   */
  calculateBayesianScore(
    averageRating: number,
    totalReviews: number,
    globalAverage: number = 3.0
  ): number {
    const v = totalReviews;
    const R = averageRating;
    const m = this.MIN_REVIEWS;
    const C = globalAverage;

    return (v * R + m * C) / (v + m);
  }

  /**
   * Recalcular ranking bayesiano de todos los clubes
   */
  async recalculateAllRankings(): Promise<void> {
    try {
      // Obtener todos los clubes con sus calificaciones
      const { data: clubs, error } = await supabase
        .from('clubs')
        .select('id, name, average_rating, total_reviews')
        .not('average_rating', 'is', null);

      if (error) throw error;

      // Calcular promedio global
      const globalAverage = clubs.reduce((sum, club) => sum + (club.average_rating || 0), 0) / clubs.length;

      // Calcular score bayesiano para cada club
      const rankings = clubs.map((club) => ({
        clubId: club.id,
        clubName: club.name,
        averageRating: club.average_rating || 0,
        totalReviews: club.total_reviews || 0,
        bayesianScore: this.calculateBayesianScore(
          club.average_rating || 0,
          club.total_reviews || 0,
          globalAverage
        ),
      }));

      // Ordenar por score bayesiano (descendente)
      rankings.sort((a, b) => b.bayesianScore - a.bayesianScore);

      // Asignar rangos y actualizar en base de datos
      for (let i = 0; i < rankings.length; i++) {
        const item = rankings[i];
        if (!item) continue;

        const { clubId, bayesianScore } = item;

        await supabase
          .from('clubs')
          .update({
            bayesian_score: bayesianScore,
          })
          .eq('id', clubId);
      }

      logger.info('Ranking bayesiano recalculado exitosamente:', {
        clubsCount: rankings.length,
      });
    } catch (error) {
      logger.error('Error recalculando ranking bayesiano:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener top clubes por ranking bayesiano
   */
  async getTopClubs(limit: number = 20): Promise<ClubRanking[]> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, average_rating, total_reviews, bayesian_score')
        .not('bayesian_score', 'is', null)
        .order('bayesian_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((club, index) => ({
        clubId: club.id,
        clubName: club.name,
        averageRating: club.average_rating || 0,
        totalReviews: club.total_reviews || 0,
        bayesianScore: club.bayesian_score || 0,
        rank: index + 1,
      }));
    } catch (error) {
      logger.error('Error obteniendo top clubes:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener ranking de un club específico
   */
  async getClubRanking(clubId: string): Promise<ClubRanking | null> {
    try {
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, average_rating, total_reviews, bayesian_score')
        .eq('id', clubId)
        .single();

      if (clubError || !club) {
        return null;
      }

      // Obtener el rango del club
      const { data: clubsAbove, error: rankError } = await supabase
        .from('clubs')
        .select('id')
        .gt('bayesian_score', club.bayesian_score || 0)
        .not('bayesian_score', 'is', null);

      if (rankError) throw rankError;

      const rank = (clubsAbove?.length || 0) + 1;

      return {
        clubId: club.id,
        clubName: club.name,
        averageRating: club.average_rating || 0,
        totalReviews: club.total_reviews || 0,
        bayesianScore: club.bayesian_score || 0,
        rank,
      };
    } catch (error) {
      logger.error('Error obteniendo ranking del club:', {
        error: error instanceof Error ? error.message : String(error),
        clubId,
      });
      throw error;
    }
  }

  /**
   * Obtener clubes cercanos por ranking
   */
  async getNearbyClubs(
    clubId: string,
    limit: number = 5
  ): Promise<ClubRanking[]> {
    try {
      const clubRanking = await this.getClubRanking(clubId);

      if (!clubRanking) {
        return [];
      }

      const currentRank = clubRanking.rank;

      // Obtener clubes con rangos cercanos
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, average_rating, total_reviews, bayesian_score')
        .not('bayesian_score', 'is', null)
        .order('bayesian_score', { ascending: false })
        .limit(limit * 2);

      if (error) throw error;

      // Filtrar clubes cercanos en ranking
      const nearbyClubs = (data || [])
        .filter((_, index) => Math.abs(index + 1 - currentRank) <= limit)
        .map((club, index) => ({
          clubId: club.id,
          clubName: club.name,
          averageRating: club.average_rating || 0,
          totalReviews: club.total_reviews || 0,
          bayesianScore: club.bayesian_score || 0,
          rank: index + 1,
        }));

      return nearbyClubs;
    } catch (error) {
      logger.error('Error obteniendo clubes cercanos:', {
        error: error instanceof Error ? error.message : String(error),
        clubId,
      });
      throw error;
    }
  }
}

export const clubRankingService = ClubRankingService.getInstance();
