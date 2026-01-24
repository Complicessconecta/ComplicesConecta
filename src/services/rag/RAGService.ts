/**
 * RAG (Retrieval-Augmented Generation) Service for CómplicesConecta
 * Servicio para preguntas y respuestas con documentos del proyecto
 */

import { logger } from '@/lib/logger';
import { aiIntegrationService } from '@/services/ai/AIIntegrationService';

export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  metadata: {
    title: string;
    section?: string;
    page?: number;
    relevance?: number;
  };
  embedding: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface QARequest {
  question: string;
  userId: string;
  context?: string;
}

export interface QAResponse {
  answer: string;
  confidence: number;
  sources: string[];
  relatedQuestions: string[];
  processingTime: number;
  chunksUsed: number;
}

class RAGService {
  private documents: DocumentChunk[] = [];
  private embeddingsCache = new Map<string, number[]>();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializar el servicio RAG
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadProjectDocuments();
      await this.generateEmbeddings();
      this.isInitialized = true;
      logger.info('✅ RAG Service inicializado correctamente');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error inicializando RAG:', { error: errorMsg, stack: errorStack });
      this.isInitialized = false;
    }
  }

  /**
   * Procesar pregunta del usuario
   */
  async processQuestion(request: QARequest): Promise<QAResponse> {
    const startTime = performance.now();

    try {
      if (!this.isInitialized) {
        return {
          answer: 'El servicio RAG no está inicializado. Por favor, intenta más tarde.',
          confidence: 0.1,
          sources: [],
          relatedQuestions: [],
          processingTime: performance.now() - startTime,
          chunksUsed: 0
        };
      }

      // 1. Generar embedding para la pregunta
      const queryEmbedding = await this.generateEmbedding(request.question);

      // 2. Buscar documentos relevantes
      const searchResults = await this.searchDocuments(queryEmbedding, 5, 0.6);

      if (searchResults.length === 0) {
        return {
          answer: 'No encontré información relevante para tu pregunta en la documentación disponible.',
          confidence: 0.1,
          sources: [],
          relatedQuestions: [],
          processingTime: performance.now() - startTime,
          chunksUsed: 0
        };
      }

      // 3. Construir contexto para la IA
      const context = this.buildContext(searchResults);

      // 4. Generar respuesta con IA
      const aiResponse = await this.generateAnswer(request.question, context, request.userId);

      // 5. Generar preguntas relacionadías
      const relatedQuestions = await this.generateRelatedTopics(request.question, searchResults);

      const endTime = performance.now();

      return {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        sources: searchResults.map(r => r.chunk.source),
        relatedQuestions,
        processingTime: endTime - startTime,
        chunksUsed: searchResults.length
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error procesando pregunta RAG:', { error: errorMsg, stack: errorStack });
      throw error;
    }
  }

  /**
   * Cargar documentos del proyecto
   */
  private async loadProjectDocuments(): Promise<void> {
    // Documentos clave del proyecto CómplicesConecta
    const projectDocs = [
      {
        id: 'matching-algorithm',
        content: `
          El algoritmo de matching de CómplicesConecta utiliza Neo4j para analizar compatibilidad entre usuarios.
          Considera factores como intereses compartidos, ubicación, preferencias y patrones de comportamiento.
          El sistema asigna un score de compatibilidad de 0 a 1, donde 0.7+ se considera una buena coincidencia.
          La IA optimiza continuamente estos scores basándose en interacciones exitosas.
        `,
        source: 'DIAGRAMAS_FLUJOS_CONSOLIDADO.md',
        metadata: {
          title: 'Algoritmo de Matching',
          section: 'Core Features'
        }
      },
      {
        id: 'token-system',
        content: `
          CómplicesConecta utiliza dos tokens principales: CMPX y GTK.
          CMPX es el token de utilidad principal para staking y rewards.
          GTK (Gentlemen Token Key) es un token premium con beneficios exclusivos.
          El staking genera rewards basados en APY variable según las condiciones del mercado.
          Los tokens pueden ser transferidos, staked o usados para acceder a características premium.
        `,
        source: 'TOKEN_SYSTEM_SPEC.md',
        metadata: {
          title: 'Sistema de Tokens',
          section: 'Web3 Integration'
        }
      },
      {
        id: 'privacy-security',
        content: `
          La privacidad es fundamental en CómplicesConecta.
          Todos los datos son encriptados usando AES-256.
          Los perfiles discretos permiten control total sobre la visibilidad.
          Cumplimos con GDPR y Ley Olimpia para protección de datos.
          La IA se ejecuta localmente en el browser para máxima privacidad.
        `,
        source: 'PRIVACY_POLICY.md',
        metadata: {
          title: 'Privacidad y Seguridad',
          section: 'Compliance'
        }
      },
      {
        id: 'ai-features',
        content: `
          La IA de CómplicesConecta incluye chatbot contextual, matching predictivo y análisis de comportamiento.
          Utilizamos Phi-3-mini para procesamiento local y WebLLM para inferencia.
          La moderación de contenido usa TensorFlow para detectar toxicidad.
          Las recomendaciones se optimizan continuamente con machine learning.
        `,
        source: 'AI_INTEGRATION.md',
        metadata: {
          title: 'Características de IA',
          section: 'Technology'
        }
      },
      {
        id: 'clubs-verification',
        content: `
          Los clubs verificados en CómplicesConecta pasan por un proceso de validación riguroso.
          Se verifica la autenticidad, calidad de contenido y cumplimiento de normas.
          Los clubs verificados tienen acceso a características especiales y mayor visibilidad.
          Los usuarios pueden reportar clubs que no cumplan con los estándares.
        `,
        source: 'CLUBS_GUIDELINES.md',
        metadata: {
          title: 'Verificación de Clubs',
          section: 'Community'
        }
      },
      {
        id: 'worldid-integration',
        content: `
          World ID proporciona verificación de identidad humana sin comprometer privacidad.
          La integración permite acceso a características premium y mayor confianza.
          Los usuarios verificados con World ID reciben beneficios exclusivos.
          El proceso es opcional y respeta completamente la privacidad del usuario.
        `,
        source: 'WORLDID_INTEGRATION.md',
        metadata: {
          title: 'Integración World ID',
          section: 'Identity'
        }
      }
    ];

    this.documents = projectDocs.map(doc => {
      const chunk: DocumentChunk = {
        id: doc.id,
        content: doc.content.trim(),
        source: doc.source,
        metadata: doc.metadata,
        embedding: (doc as any).embedding || []
      };

      return chunk as DocumentChunk;
    });

    logger.info(`Cargados ${this.documents.length} documentos del proyecto`);
  }

  /**
   * Generar embeddings para todos los documentos
   */
  private async generateEmbeddings(): Promise<void> {
    try {
      for (const doc of this.documents) {
        if (!this.embeddingsCache.has(doc.id)) {
          // Simular generación de embedding
          // En producción, usaríamos sentence-transformers o API de embeddings
          const embedding = await this.generateEmbedding(doc.content);
          (doc as any).embedding = embedding;
          this.embeddingsCache.set(doc.id, embedding);
        }
      }
      logger.info('Embeddings generados para todos los documentos');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error generando embedding:', { error: errorMsg, stack: errorStack });
    }
  }

  /**
   * Generar embedding para un texto
   */
  private async generateEmbedding(_text: string): Promise<number[]> {
    // Simular embedding de 384 dimensiones (como sentence-transformers)
    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5);

    // Normalizar el embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Buscar documentos relevantes usando similitud coseno
   */
  private async searchDocuments(
    queryEmbedding: number[],
    maxResults: number,
    minRelevance: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const doc of this.documents) {
      if (!doc.embedding) continue;

      // Calcular similitud coseno
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity >= minRelevance) {
        results.push({
          chunk: doc,
          score: similarity,
          relevance: similarity >= 0.8 ? 'high' : similarity >= 0.6 ? 'medium' : 'low'
        });
      }
    }

    // Ordenar por score y limitar resultados
    return results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, maxResults);
  }

  /**
   * Calcular similitud coseno entre dos embeddings
   */
  private cosineSimilarity(a: number[] | undefined, b: number[] | undefined): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] ?? 0;
      const bVal = b[i] ?? 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  /**
   * Construir contexto para la IA
   */
  private buildContext(searchResults: SearchResult[]): string {
    return searchResults
      .map(result => `
        Fuente: ${result.chunk.source}
        Título: ${result.chunk.metadata.title}
        Contenido: ${result.chunk.content}
        Relevancia: ${result.relevance} (${(result.score * 100).toFixed(1)}%)
      `)
      .join('\n---\n');
  }

  /**
   * Generar respuesta usando IA
   */
  private async generateAnswer(
    question: string,
    context: string,
    userId: string
  ): Promise<{ answer: string; confidence: number }> {
    try {
      const prompt = `
        Basado en el siguiente contexto de la documentación de CómplicesConecta, responde la pregunta del usuario.

        CONTEXTO:
        ${context}

        PREGUNTA: ${question}

        Instrucciones:
        1. Responde basándote únicamente en el contexto proporcionado
        2. Sé claro, conciso y útil
        3. Si la información no está en el contexto, indícalo claramente
        4. Proporciona ejemplos cuando sea relevante
        5. Mantén un tono profesional pero amigable

        Respuesta:
      `;

      const aiResponse = await aiIntegrationService.processQuestionAnswering(prompt, userId);

      return {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error generando respuesta:', { error: errorMsg, stack: errorStack });
      return {
        answer: 'No pude generar una respuesta basada en la documentación disponible.',
        confidence: 0.1
      };
    }
  }

  /**
   * Generar preguntas relacionadías
   */
  private async generateRelatedTopics(
    _originalQuestion: string,
    searchResults: SearchResult[]
  ): Promise<string[]> {
    // Extraer temas clave de los resultados
    const topics = searchResults.map(r => r.chunk.metadata.title);

    // Generar preguntas relacionadías basadías en los temas
    const relatedQuestions = [
      `¿Cómo funciona ${topics[0]} en CómplicesConecta?`,
      `¿Cuáles son los beneficios de ${topics[1] || 'la plataforma'}?`,
      `¿Qué medidías de seguridad implementa CómplicesConecta?`,
      `¿Cómo puedo empezar a usar ${topics[2] || 'las características principales'}?`,
      `¿Qué requisitos necesito para ${topics[0] || 'usar la plataforma'}?`
    ];

    // Eliminar duplicados y limitar a 5 preguntas
    return [...new Set(relatedQuestions)].slice(0, 5);
  }

  /**
   * Agregar nuevo documento
   */
  async addDocument(document: Omit<DocumentChunk, 'embedding'>): Promise<void> {
    const embedding = await this.generateEmbedding(document.content);

    const newDoc: DocumentChunk = {
      ...document,
      embedding
    };

    this.documents.push(newDoc);
    this.embeddingsCache.set(document.id, embedding);

    logger.info(`Documento agregado: ${document.id}`);
  }

  /**
   * Eliminar documento
   */
  removeDocument(documentId: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === documentId);
    if (index !== -1) {
      this.documents.splice(index, 1);
      this.embeddingsCache.delete(documentId);
      logger.info(`Documento eliminado: ${documentId}`);
      return true;
    }
    return false;
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats(): {
    totalDocuments: number;
    cachedEmbeddings: number;
    isInitialized: boolean;
    avgDocumentLength: number;
  } {
    const avgLength = this.documents.reduce((sum, doc) => sum + doc.content.length, 0) / this.documents.length;

    return {
      totalDocuments: this.documents.length,
      cachedEmbeddings: this.embeddingsCache.size,
      isInitialized: this.isInitialized,
      avgDocumentLength: avgLength || 0
    };
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.embeddingsCache.clear();
    logger.info('Cache de embeddings limpiado');
  }
}

export const ragService = new RAGService();
export default RAGService;

