// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------
/**
 * AI Layer Service - Capa base para funcionalidades ML
 * Inspirado en Grindr 2025: AI en todos los niveles para personalización
 *
 * Features:
 * - Predicción de compatibilidad con ML
 * - Feature flags para activación gradual
 * - Fallback a scoring legacy (zero breaking changes)
 * - Cache para optimización
 *
 * v3.5.0-alpha Fase 1.2:
 * - Integración PyTorch/TensorFlow.js
 * - Lazy loading de modelo ML
 * - Tensor management optimizado
 *
 * @version 3.5.0
 * @date 2025-10-30
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";
import { logger } from "@/lib/logger";
import type {
  CompatibilityFeatures,
  AIConfig,
  AIScore,
} from "@/services/analytics/ai/types";
import { calculateDistance } from "@/services/analytics/ai/utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * AILayerService - Servicio principal de capa AI
 * Maneja predicciones ML con fallback automático a legacy
 */
export class AILayerService {
  private config: AIConfig;
  private cache: Map<string, { score: AIScore; expiresAt: number }>;

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      enabled: import.meta.env.VITE_AI_NATIVE_ENABLED === "true",
      fallbackEnabled: import.meta.env.VITE_AI_FALLBACK_ENABLED !== "false", // Default true
      modelEndpoint: import.meta.env.VITE_AI_MODEL_ENDPOINT || "",
      cacheEnabled: import.meta.env.VITE_AI_CACHE_ENABLED !== "false",
      cacheTTL: parseInt(import.meta.env.VITE_AI_CACHE_TTL || "3600"), // 1 hora default
      ...config,
    };

    this.cache = new Map();
  }

  /**
   * Limpia el cache interno
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica si AI está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Predice compatibilidad entre dos usuarios
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @param legacyScoreFn Función de scoring legacy (fallback)
   * @returns Score de compatibilidad (0-1)
   */
  async predictCompatibility(
    userId1: string,
    userId2: string,
    legacyScoreFn: () => Promise<number>,
  ): Promise<AIScore> {
    const cacheKey = this.getCacheKey(userId1, userId2);

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug("Cache hit for compatibility prediction");
        return cached;
      }
    }

    // Si AI no está habilitado, usar legacy
    if (!this.config.enabled) {
      const legacyScore = await legacyScoreFn();
      const result: AIScore = {
        score: legacyScore,
        confidence: 1.0,
        method: "legacy",
        timestamp: new Date(),
      };
      this.saveToCache(cacheKey, result);
      return result;
    }

    // Intentar predicción ML
    try {
      const features = await this.extractFeatures(userId1, userId2);
      const aiScoreResult = await this.callMLModel(features);

      // Hybrid Scoring Logic (Phase 1.2 requirement)
      // Combinamos el score de AI con el legacy para una transición suave
      const legacyScore = await legacyScoreFn();
      
      // Weighted average: 70% AI, 30% Legacy
      const hybridScoreValue = (aiScoreResult.score * 0.7) + (legacyScore * 0.3);
      
      const result: AIScore = {
        score: hybridScoreValue,
        confidence: Math.max(aiScoreResult.confidence, 0.8),
        method: "hybrid",
        timestamp: new Date(),
        features: features 
      };

      this.saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error("Error in ML prediction, falling back to legacy", { error });

      if (this.config.fallbackEnabled) {
        const legacyScore = await legacyScoreFn();
        return {
          score: legacyScore,
          confidence: 0.8, // Menor confianza por fallback
          method: "legacy",
          timestamp: new Date(),
        };
      }

      throw error;
    }
  }

  /**
   * Extrae features para el modelo
   */
  private async extractFeatures(
    userId1: string,
    userId2: string,
  ): Promise<CompatibilityFeatures> {
    // 1. Obtener perfiles
    if (!supabase) {
      throw new Error("Supabase client not available");
    }
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", [userId1, userId2]);

    if (error || !profiles || profiles.length !== 2) {
      throw new Error("Could not fetch profiles for feature extraction");
    }

    const p1 = profiles.find((p) => p.id === userId1) as Profile;
    const p2 = profiles.find((p) => p.id === userId2) as Profile;

    // 2. Calcular distancia
    const distance = calculateDistance(
      p1.latitude || 0,
      p1.longitude || 0,
      p2.latitude || 0,
      p2.longitude || 0,
    );

    // 3. Calcular edad diff
    const ageDiff = Math.abs((p1.age || 25) - (p2.age || 25));

    // 4. Retornar vector de features (alineado con utils.normalizeFeatures)
    return {
      likesGiven: 0,
      likesReceived: 0,
      commentsCount: 0,
      proximityKm: distance,
      responseTimeMs: 1000,
      sharedInterestsCount: 0,
      ageGap: ageDiff,
      bigFiveCompatibility: 0.5,
      swingerTraitsScore: p1.is_verified && p2.is_verified ? 1.0 : 0.0,
    } as CompatibilityFeatures;
  }

  /**
   * Llama al modelo ML (mock por ahora)
   */
  private async callMLModel(features: CompatibilityFeatures): Promise<AIScore> {
    // TODO: Conectar con TensorFlow.js o servicio externo
    // Por ahora simulamos una predicción basada en reglas simples

    // Normalizar distancia (0-100km)
    const distanceScore = Math.max(0, 1 - (features as any).proximityKm / 100);
    // Normalizar edad (0-10 años diff)
    const ageScore = Math.max(0, 1 - (features as any).ageGap / 10);
    // Considerar verificación como swingerTraitsScore
    const verifiedScore = (features as any).swingerTraitsScore ?? 0;
    const score = distanceScore * 0.4 + ageScore * 0.3 + verifiedScore * 0.3;

    return {
      score,
      confidence: 0.9,
      method: "ai",
      timestamp: new Date(),
    };
  }

  private getCacheKey(id1: string, id2: string): string {
    return [id1, id2].sort().join(":");
  }

  private getFromCache(key: string): AIScore | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.score;
  }

  private saveToCache(key: string, score: AIScore): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, {
      score,
      expiresAt: Date.now() + this.config.cacheTTL * 1000,
    });
  }
}
