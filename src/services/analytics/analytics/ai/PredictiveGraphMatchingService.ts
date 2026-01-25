// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------
/**
 * PredictiveGraphMatchingService - Matching Predictivo con Neo4j + IA Emocional
 *
 * Usa Neo4j: (user)-[:LIKES|DISLIKES|VISITED]->(profile)
 * Friends-of-friends con peso emocional (GPT-4 analiza chats)
 * Score 400k params: compatibilidad + química + valores
 *
 * @version 3.5.0
 */

import { neo4jService } from "@/services/core/graph/Neo4jService";
import { emotionalAIService } from "@/services/analytics";
import { graphMatchingModel as _graphMatchingModel } from "@/lib/ai/graphMatchingModel";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { smartMatchingService } from "@/services/social";

export interface PredictiveMatch {
  userId: string;
  totalScore: number;
  compatibilityScore: number;
  emotionalScore: number;
  socialScore: number;
  graphScore: number;
  reasons: string[];
  confidence: number;
}

export interface PredictiveMatchOptions {
  limit?: number;
  minScore?: number;
  includeEmotionalAnalysis?: boolean;
}

export class PredictiveGraphMatchingService {
  private static instance: PredictiveGraphMatchingService;

  static getInstance(): PredictiveGraphMatchingService {
    if (!PredictiveGraphMatchingService.instance) {
      PredictiveGraphMatchingService.instance =
        new PredictiveGraphMatchingService();
    }
    return PredictiveGraphMatchingService.instance;
  }

  /**
   * Obtiene matches predictivos usando Neo4j + IA Emocional
   */
  async getPredictiveMatches(
    userId: string,
    options: PredictiveMatchOptions = {},
  ): Promise<PredictiveMatch[]> {
    try {
      logger.info("🔮 Obteniendo matches predictivos", {
        userId: userId.substring(0, 8) + "***",
      });

      const limit = options.limit || 20;
      const minScore = options.minScore || 30;

      // 1. Obtener friends-of-friends desde Neo4j
      const fofRecommendations = await neo4jService.getFriendsOfFriends(
        userId,
        limit * 2,
        true, // Excluir ya matched
      );

      if (fofRecommendations.length === 0) {
        logger.info("No hay friends-of-friends disponibles");
        return [];
      }

      // 2. Obtener perfiles de candidatos
      const candidateIds = fofRecommendations.map((f) => f.userId);
      const candidates = await this.getProfilesByIds(candidateIds);

      if (candidates.length === 0) {
        return [];
      }

      // 3. Calcular scores de compatibilidad tradicionales
      const compatibilityMatches = await smartMatchingService.findMatches(
        userId,
        {
          limit: limit * 2,
        },
      );

      // 4. Enriquecer con análisis emocional si está habilitado
      const enrichedMatches = await Promise.all(
        fofRecommendations.map(
          async (fof: {
            userId: string;
            mutualCount: number;
            path: string[];
          }) => {
            const candidate = candidates.find((c: any) => c.id === fof.userId);
            if (!candidate) return null;

            const compatibilityMatch = compatibilityMatches.matches.find(
              (m: { userId: string }) => m.userId === fof.userId,
            );

            // Análisis emocional de chats (si hay conversaciones)
            let emotionalScore = 0;
            let emotionalReasons: string[] = [];

            if (options.includeEmotionalAnalysis !== false) {
              const emotionalAnalysis =
                await emotionalAIService.analyzeChatEmotions(
                  userId,
                  fof.userId,
                );
              emotionalScore = emotionalAnalysis.score;
              emotionalReasons = emotionalAnalysis.reasons;
            }

            // Calcular score final
            const compatibilityScore = compatibilityMatch
              ? compatibilityMatch.totalScore
              : 0;
            const graphScore = Math.min(100, fof.mutualCount * 10); // 10 pts por amigo común

            // Peso: 40% compatibilidad, 30% grafo, 30% emocional
            const totalScore =
              compatibilityScore * 0.4 +
              graphScore * 0.3 +
              emotionalScore * 0.3;

            if (totalScore < minScore) return null;

            return {
              userId: fof.userId,
              totalScore,
              compatibilityScore,
              emotionalScore,
              socialScore: graphScore, // Alias
              graphScore,
              reasons: [
                ...emotionalReasons,
                `Conectado a través de ${fof.mutualCount} amigos en común`,
                compatibilityMatch
                  ? `Compatibilidad base: ${compatibilityScore.toFixed(0)}%`
                  : "Sin datos de compatibilidad base",
              ],
              confidence: 0.85,
            };
          },
        ),
      );

      // 5. Filtrar nulos y ordenar
      const validMatches = enrichedMatches
        .filter((m): m is PredictiveMatch => m !== null)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);

      logger.info(`✅ ${validMatches.length} matches predictivos encontrados`);
      return validMatches;
    } catch (error) {
      logger.error("Error getting predictive matches", { error });
      return [];
    }
  }

  private async getProfilesByIds(ids: string[]) {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, age, avatar_url, verified")
      .in("id", ids);

    if (error) {
      logger.error("Error fetching profiles", { error });
      return [];
    }
    return data || [];
  }
}

export const predictiveGraphMatchingService =
  PredictiveGraphMatchingService.getInstance();
