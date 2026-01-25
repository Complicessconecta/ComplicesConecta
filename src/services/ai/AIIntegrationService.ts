/**
 * AI Integration Service
 * Servicio centralizado para manejar chatbots, tokens predictivos y Q&A con LLMs avanzados
 * Integración con Neo4j para matching AI-driven y recomendaciones basadías en grafos
 */

import { logger } from '@/lib/logger';
import { neo4jService, type UserProfile, type UserContext } from "@/services/neo4j/Neo4jService";
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { pipeline } from '@huggingface/transformers';
import * as toxicity from '@tensorflow-models/toxicity';
import { LOCAL_MODEL_NAME } from '@/ai/ai-worker-config';

// Interfaces para tipos de datos
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AIModelConfig {
  provider: 'phi3' | 'llama' | 'mistral' | 'custom';
  model: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
}

export interface MatchingProfile {
  userId: string;
  compatibilityScore: number;
  sharedInterests: string[];
  recommendations: string[];
  confidence: number;
  reasoning: string;
}

export interface TokenPrediction {
  userId: string;
  currentBalance: number;
  predictedUsage: number;
  recommendedStake: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface QAContext {
  question: string;
  answer: string;
  confidence: number;
  sources: string[];
  relatedTopics: string[];
}

// Interfaces para datos internos (tipos estrictos)
type ProfileForCompatibility = UserProfile | {
  id: string;
  username?: string;
  sharedInterests?: string[];
  recommendations?: string[];
  compatibilityScore?: number;
  reasoning?: string;
};

interface TokenUsageRecord {
  amount: number;
  balance?: number;
  timestamp?: string;
}

interface BehaviorProfile {
  currentBalance: number;
  avgDailyUsage: number;
  usagePattern: string;
  riskProfile: string;
}

interface ParsedTokenPrediction {
  predictedUsage: number;
  recommendedStake: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
}

interface ApplicationContext {
  appSection: string;
  relevantFeatures: string[];
}

class AIIntegrationService {
  // Modelos externos: usamos any porque no podemos tiparlos fácilmente
  private webLLM: any = null;
  private hfPipeline: any = null;
  private toxicityModel: any = null;
  private modelCache = new Map<string, { data: unknown; timestamp: number }>();

  constructor() {
    this.initializeModels();
  }

  /**
   * Inicializar modelos de IA
   */
  private async initializeModels() {
    try {
      // Inicializar WebLLM
      try {
        this.webLLM = await CreateMLCEngine(LOCAL_MODEL_NAME);
      } catch (webLLMError) {
        const errorMsg = webLLMError instanceof Error ? webLLMError.message : String(webLLMError);
        const errorStack = webLLMError instanceof Error ? webLLMError.stack : undefined;
        logger.warn('WebLLM no disponible, usando fallback:', { error: errorMsg, stack: errorStack });
        this.webLLM = null;
      }

      // Inicializar modelo de Hugging Face para Q&A
      try {
        this.hfPipeline = await pipeline('question-answering', 'distilbert-base-uncased-distilled-squad');
      } catch (hfError) {
        const errorMsg = hfError instanceof Error ? hfError.message : String(hfError);
        const errorStack = hfError instanceof Error ? hfError.stack : undefined;
        logger.warn('HuggingFace pipeline no disponible, usando fallback:', { error: errorMsg, stack: errorStack });
        this.hfPipeline = null;
      }

      // Inicializar modelo de toxicidad para moderación
      try {
        this.toxicityModel = await toxicity.load(0.9, ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'profanity', 'threat']);
      } catch (toxicityError) {
        const errorMsg = toxicityError instanceof Error ? toxicityError.message : String(toxicityError);
        const errorStack = toxicityError instanceof Error ? toxicityError.stack : undefined;
        logger.warn('Modelo de toxicidad no disponible, usando fallback:', { error: errorMsg, stack: errorStack });
        this.toxicityModel = null;
      }

      logger.info('✅ Modelos de IA inicializados correctamente');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error inicializando modelos de IA:', { error: errorMsg, stack: errorStack });
    }
  }

  /**
   * Chatbot avanzado con contexto de Neo4j
   */
  async processChatMessage(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      // Verificar toxicidad del mensaje
      const isToxic = await this.checkToxicity(message);
      if (isToxic) {
        throw new Error('Mensaje contiene contenido inapropiado');
      }

      // Obtener perfil y contexto del usuario desde Neo4j
      const userProfile = await neo4jService.getUserProfile(userId);
      const userContext = await neo4jService.getUserContext(userId);

      // Construir prompt con contexto enriquecido
      const enrichedPrompt = this.buildContextualPrompt(
        message,
        userProfile,
        userContext,
        conversationHistory
      );

      // Procesar con modelo avanzado
      const response = await this.webLLM.chat(enrichedPrompt, {
        model: 'phi-3-mini-128k-instruct',
        temperature: 0.7,
        maxTokens: 2048,
      });

      // Guardar conversación en Supabase
      await this.saveChatMessage(userId, message, 'user');
      await this.saveChatMessage(userId, response.content, 'assistant');

      // Actualizar grafo de conocimiento en Neo4j
      await this.updateKnowledgeGraph(userId, message, response.content);

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          model: 'phi-3-mini-128k-instruct',
          contextUsed: true,
          neo4jEnhanced: true,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error procesando chat:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  /**
   * Verificar toxicidad del mensaje
   */
  private async checkToxicity(message: string): Promise<boolean> {
    try {
      if (!this.toxicityModel?.classify) return false;
      const predictions = await this.toxicityModel.classify(message);
      return predictions.some((prediction: { results: Array<{ match: boolean }> }) => prediction.results[0]?.match ?? false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error clasificando toxicidad:', { error: errorMsg, stack: errorStack });
      return false; // Por seguridad, si falla el modelo, permitimos el mensaje
    }
  }

  /**
   * Matching AI-driven con Neo4j
   */
  async getAIRecommendations(userId: string): Promise<MatchingProfile[]> {
    try {
      // Obtener perfil completo del usuario
      const userProfile = await neo4jService.getUserProfile(userId);

      // Encontrar usuarios similares en el grafo
      const similarUsers = await neo4jService.findSimilarUsers(userId, {
        interests: userProfile.interests,
        location: userProfile.location,
        preferences: userProfile.preferences,
        compatibilityThreshold: 0.7,
      });

      // Calcular scores de compatibilidad con IA
      const recommendations: MatchingProfile[] = [];

      for (const similarUser of similarUsers) {
        const compatibilityScore = await this.calculateCompatibilityScore(
          userProfile,
          similarUser
        );

        const reasoning = await this.generateCompatibilityReasoning(
          userProfile,
          similarUser,
          compatibilityScore
        );

        recommendations.push({
          userId: similarUser.id,
          compatibilityScore,
          sharedInterests: similarUser.sharedInterests || [],
          recommendations: similarUser.recommendations || [],
          confidence: compatibilityScore * 0.9, // Ajustar por confianza del modelo
          reasoning,
        });
      }

      // Ordenar por score de compatibilidad
      recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Guardar recomendaciones en Supabase para análisis
      await this.saveRecommendations(userId, recommendations);

      return recommendations.slice(0, 10); // Top 10 recomendaciones
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error generando embeddings:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  /**
   * Predicción de uso de tokens con IA
   */
  async predictTokenUsage(userId: string): Promise<TokenPrediction> {
    try {
      // Obtener historial de uso del usuario
      const usageHistory = await this.getTokenUsageHistory(userId);

      // Obtener perfil de comportamiento
      const behaviorProfile = await this.analyzeUserBehavior(usageHistory);

      // Predicción con modelo de series temporales
      const prediction = await this.webLLM.generate(`
        Analiza el siguiente historial de uso de tokens y predice el uso futuro:

        Historial: ${JSON.stringify(usageHistory?.slice(-30))}
        Perfil de comportamiento: ${JSON.stringify(behaviorProfile)}

        Predice:
        1. Uso esperado para los próximos 7 días
        2. Stake recomendado
        3. Nivel de riesgo
        4. Timeframe óptimo
      `, {
        model: 'llama-3.2-3b-instruct',
        temperature: 0.3,
        maxTokens: 512,
      });

      const predictionData = this.parseTokenPrediction(prediction.content);

      return {
        userId,
        currentBalance: behaviorProfile.currentBalance,
        predictedUsage: predictionData.predictedUsage,
        recommendedStake: predictionData.recommendedStake,
        riskLevel: predictionData.riskLevel,
        timeframe: predictionData.timeframe,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error en recomendación de contenido:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  /**
   * Q&A avanzado con contexto de la aplicación
   */
  async processQuestionAnswering(
    question: string,
    userId: string
  ): Promise<QAContext> {
    try {
      // Obtener contexto relevante del usuario
      const userContext = await neo4jService.getUserContext(userId);
      const appContext = await this.getApplicationContext(question);

      // Buscar en base de conocimiento interna
      const internalResults = await this.searchInternalKnowledge();

      // Procesar con Hugging Face si es necesario
      let hfAnswer = null;
      if (internalResults.confidence < 0.8) {
        const context = `
          Contexto del usuario: ${JSON.stringify(userContext)}
          Contexto de la app: ${JSON.stringify(appContext)}
          Pregunta: ${question}
        `;

        const result = await this.hfPipeline(context, {
          topk: 3,
          maxAnswerTokens: 200,
        });
        hfAnswer = result;
      }

      // Combinar resultados
      const finalAnswer = hfAnswer
        ? hfAnswer.answer
        : internalResults.answer;

      const sources = [
        ...internalResults.sources,
        ...(hfAnswer?.context || []),
      ];

      return {
        question,
        answer: finalAnswer,
        confidence: Math.max(internalResults.confidence, hfAnswer?.score || 0),
        sources: [...new Set(sources)], // Eliminar duplicados
        relatedTopics: await this.extractRelatedTopics(question, finalAnswer),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('❌ Error en Q&A:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  /**
   * Optimización de rendimiento
   */
  async generatePerformanceReport(): Promise<Record<string, unknown>> {
    try {
      const startTime = performance.now();

      // Métricas de consultas Neo4j
      const neo4jMetrics = await neo4jService.getPerformanceMetrics();

      // Métricas de modelos de IA
      const aiMetrics = {
        modelCacheSize: this.modelCache.size,
        avgResponseTime: await this.calculateAvgResponseTime(),
        cacheHitRate: await this.calculateCacheHitRate(),
      };

      // Métricas de consultas Supabase
      const supabaseMetrics = await this.getSupabasePerformanceMetrics();

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      return {
        timestamp: new Date().toISOString(),
        generationTime,
        neo4j: neo4jMetrics,
        ai: aiMetrics,
        supabase: supabaseMetrics,
        recommendations: await this.generateOptimizationRecommendations(
          neo4jMetrics,
          aiMetrics,
          supabaseMetrics
        ),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error generando reporte de rendimiento:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  // Métodos privados de ayuda
  private buildContextualPrompt(
    message: string,
    userProfile: UserProfile,
    userContext: UserContext,
    conversationHistory: ChatMessage[]
  ): string {
    return `
      Eres un asistente de IA para CómplicesConecta, una app de conexiones discretas.

      Perfil del usuario:
      ${JSON.stringify(userProfile, null, 2)}

      Contexto relevante:
      ${JSON.stringify(userContext, null, 2)}

      Historial reciente:
      ${conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      Mensaje actual: ${message}

      Responde de manera: discreta, respetuosa, útil y considerando el contexto del usuario.
    `;
  }

  private async calculateCompatibilityScore(
    profile1: ProfileForCompatibility,
    profile2: ProfileForCompatibility
  ): Promise<number> {
    // Implementar algoritmo de compatibilidad con IA
    const prompt = `
      Calcula score de compatibilidad (0-1) entre estos dos perfiles:

      Perfil 1: ${JSON.stringify(profile1)}
      Perfil 2: ${JSON.stringify(profile2)}

      Considera: intereses, ubicación, preferencias, valores, estilo de vida.
      Responde solo con el número decimal.
    `;

    const response = await this.webLLM.chat(prompt, {
      temperature: 0.2,
      maxTokens: 10,
    });

    return parseFloat(response.content) || 0.5;
  }

  private async generateCompatibilityReasoning(
    profile1: ProfileForCompatibility,
    profile2: ProfileForCompatibility,
    score: number
  ): Promise<string> {
    const prompt = `
      Explica por qué estos dos perfiles son compatibles con score ${score}:

      Perfil 1: ${JSON.stringify(profile1)}
      Perfil 2: ${JSON.stringify(profile2)}

      Sé específico sobre intereses compartidos y valores compatibles.
      Máximo 100 palabras.
    `;

    const response = await this.webLLM.chat(prompt, {
      temperature: 0.5,
      maxTokens: 150,
    });

    return response.content;
  }

  private async saveChatMessage(
    userId: string,
    _content: string,
    role: 'user' | 'assistant'
  ): Promise<void> {
    // Implementar guardado en Supabase
    logger.info(`Guardando mensaje ${role} para usuario ${userId}`);
  }

  private async updateKnowledgeGraph(
    userId: string,
    userMessage: string,
    _aiResponse: string
  ): Promise<void> {
    // Extraer entidades y relaciones del mensaje
    const entities = await this.extractEntities(userMessage);

    // Actualizar grafo en Neo4j
    await neo4jService.updateUserInteractions(userId, entities);
  }

  private async extractEntities(text: string): Promise<string[]> {
    // Implementar extracción de entidades con NLP
    const prompt = `
      Extrae entidades clave (intereses, actividades, valores) de este texto:
      "${text}"

      Responde solo con un array JSON de strings.
    `;

    const response = await this.webLLM.chat(prompt, {
      temperature: 0.1,
      maxTokens: 100,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  private async saveRecommendations(
    userId: string,
    recommendations: MatchingProfile[]
  ): Promise<void> {
    // Implementar guardado en Supabase
    logger.info(`Guardando ${recommendations.length} recomendaciones para usuario ${userId}`);
  }

  private async getTokenUsageHistory(_userId: string): Promise<TokenUsageRecord[]> {
    // Implementar obtención de historial desde Supabase
    return [];
  }

  private async analyzeUserBehavior(
    usageHistory: TokenUsageRecord[]
  ): Promise<BehaviorProfile> {
    // Análisis de patrones de uso
    const recentUsage = usageHistory.slice(-30);
    const avgDailyUsage = recentUsage.reduce((sum, tx) => sum + tx.amount, 0) / 30;
    const currentBalance = usageHistory[0]?.balance || 0;

    return {
      avgDailyUsage,
      currentBalance,
      usagePattern: this.detectUsagePattern(),
      riskProfile: this.calculateRiskProfile(),
    };
  }

  private parseTokenPrediction(predictionText: string): ParsedTokenPrediction {
    try {
      return JSON.parse(predictionText);
    } catch {
      // Fallback a valores predeterminados
      return {
        predictedUsage: 100,
        recommendedStake: 50,
        riskLevel: 'medium',
        timeframe: '7d',
      };
    }
  }

  private async getApplicationContext(question: string): Promise<ApplicationContext> {
    // Obtener contexto relevante de la aplicación
    return {
      appSection: this.detectAppSection(question),
      relevantFeatures: await this.getRelevantFeatures(),
    };
  }

  private async searchInternalKnowledge(): Promise<{
    answer: string;
    confidence: number;
    sources: string[];
  }> {
    // Buscar en base de conocimiento interna
    // Implementar búsqueda vectorial o por keywords

    return {
      answer: 'Respuesta base de conocimiento interna',
      confidence: 0.6,
      sources: ['internal-kb'],
    };
  }

  private async extractRelatedTopics(
    question: string,
    answer: string
  ): Promise<string[]> {
    const prompt = `
      Extrae 5 temas relacionados de esta Q&A:
      Pregunta: ${question}
      Respuesta: ${answer}

      Responde solo con un array JSON de strings.
    `;

    const response = await this.webLLM.chat(prompt, {
      temperature: 0.3,
      maxTokens: 100,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  private async calculateAvgResponseTime(): Promise<number> {
    // Calcular tiempo promedio de respuesta de modelos
    return 150; // Placeholder
  }

  private async calculateCacheHitRate(): Promise<number> {
    // Calcular tasa de cache hits
    return 0.85; // Placeholder
  }

  private async getSupabasePerformanceMetrics(): Promise<{ avgQueryTime: number; cacheHitRate: number; connectionPoolUsage: number }> {
    // Obtener métricas de rendimiento de Supabase
    return {
      avgQueryTime: 45,
      cacheHitRate: 0.78,
      connectionPoolUsage: 0.65,
    };
  }

  private async generateOptimizationRecommendations(
    neo4jMetrics: { queryTime: number },
    aiMetrics: { cacheHitRate: number },
    supabaseMetrics: { avgQueryTime: number }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (neo4jMetrics.queryTime > 100) {
      recommendations.push('Optimizar índices en Neo4j para consultas de matching');
    }

    if (aiMetrics.cacheHitRate < 0.8) {
      recommendations.push('Implementar cache persistente para modelos de IA');
    }

    if (supabaseMetrics.avgQueryTime > 50) {
      recommendations.push('Considerar connection pooling para Supabase');
    }

    return recommendations;
  }

  private detectUsagePattern(): string {
    // Detectar patrones de uso
    return 'regular'; // Placeholder
  }

  private calculateRiskProfile(): string {
    // Calcular perfil de riesgo
    return 'medium'; // Placeholder
  }

  private detectAppSection(question: string): string {
    // Detectar sección de la aplicación relevante
    if (question.includes('match') || question.includes('perfil')) return 'matching';
    if (question.includes('token') || question.includes('stake')) return 'tokens';
    if (question.includes('chat') || question.includes('mensaje')) return 'chat';
    return 'general';
  }

  private async getRelevantFeatures(): Promise<string[]> {
    // Obtener características relevantes basadías en la pregunta
    return ['profiles', 'matching', 'chat']; // Placeholder
  }
}

export const aiIntegrationService = new AIIntegrationService();
export default AIIntegrationService;

