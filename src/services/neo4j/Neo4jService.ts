/**
 * Neo4j Service for AI-driven matching and graph-based recommendations
 * Servicio para manejar operaciones de Neo4j con optimización de rendimiento
 */

import { logger } from '@/lib/logger';

// Interfaces para tipos de datos
export interface UserProfile {
  id: string;
  username: string;
  interests: string[];
  location: string;
  preferences: Record<string, any>;
  age?: number;
  relationshipType?: string;
  discretionLevel?: number;
}

export interface UserContext {
  userId: string;
  recentInteractions: string[];
  preferences: Record<string, any>;
  behaviorPatterns: string[];
  compatibilityFactors: Record<string, number>;
}

export interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  connectionPoolUsage: number;
  timestamp: string;
}

export interface SimilarUser {
  id: string;
  username: string;
  compatibilityScore: number;
  sharedInterests: string[];
  recommendations: string[];
  reasoning?: string;
}

class Neo4jService {
  private driver: any = null;
  private isConnected = false;
  private cache = new Map<string, any>();
  private metrics: PerformanceMetrics[] = [];

  constructor() {
    this.initializeConnection();
  }

  /**
   * Inicializar conexión con Neo4j
   */
  private async initializeConnection() {
    try {
      // Usar variables de entorno para conexión
      const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
      const user = process.env.NEO4J_USER || 'neo4j';
      const password = process.env.NEO4J_PASSWORD || 'password';

      // Importación dinámica de neo4j-driver
      const neo4j = await import('neo4j-driver');
      
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
      
      // Verificar conexión
      const session = this.driver.session();
      await session.run('RETURN 1');
      session.close();
      
      this.isConnected = true;
      logger.info('✅ Conexión a Neo4j establecida');
    } catch (error) {
      logger.error('❌ Error conectando a Neo4j:', error);
      this.isConnected = false;
    }
  }

  /**
   * Obtener perfil completo de usuario con relaciones
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const cacheKey = `profile_${userId}`;
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const session = this.driver.session();
    try {
      const startTime = performance.now();
      
      const query = `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
        OPTIONAL MATCH (u)-[:LOCATED_IN]->(l:Location)
        OPTIONAL MATCH (u)-[:PREFERS]->(p:Preference)
        OPTIONAL MATCH (u)-[:HAS_RELATIONSHIP_TYPE]->(rt:RelationshipType)
        RETURN u, 
               COLLECT(i.name) as interests,
               l.name as location,
               p.properties as preferences,
               rt.name as relationshipType,
               u.discretion_level as discretionLevel,
               u.age as age
      `;

      const result = await session.run(query, { userId });
      const record = result.records[0];
      
      if (!record) {
        throw new Error(`Usuario ${userId} no encontrado`);
      }

      const profile: UserProfile = {
        id: record.get('u').properties.id,
        username: record.get('u').properties.username,
        interests: record.get('interests') || [],
        location: record.get('location') || '',
        preferences: record.get('preferences') || {},
        age: record.get('age'),
        relationshipType: record.get('relationshipType'),
        discretionLevel: record.get('discretionLevel'),
      };

      const queryTime = performance.now() - startTime;
      this.updatePerformanceMetrics('getUserProfile', queryTime);
      
      // Cache por 5 minutos
      this.queryCache.set(cacheKey, profile);
      setTimeout(() => this.queryCache.delete(cacheKey), 5 * 60 * 1000);

      return profile;
    } finally {
      await session.close();
    }
  }

  /**
   * Obtener contexto enriquecido del usuario
   */
  async getUserContext(userId: string): Promise<UserContext> {
    const session = this.driver.session();
    try {
      const startTime = performance.now();
      
      const query = `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:RECENTLY_INTERACTED_WITH]->(other:User)
        OPTIONAL MATCH (u)-[:CONNECTED_TO]->(conn:User)
        OPTIONAL MATCH (u)-[:HAS_BEHAVIOR_PATTERN]->(bp:BehaviorPattern)
        OPTIONAL MATCH (u)-[:LAST_ACTIVITY]->(la:Activity)
        RETURN u,
               COLLECT(DISTINCT other.id) as recentInteractions,
               COLLECT(DISTINCT conn.id) as activeConnections,
               COLLECT(bp.pattern) as behaviorPatterns,
               la.type as lastActivity,
               la.timestamp as lastActivityTime
        ORDER BY la.timestamp DESC
        LIMIT 1
      `;

      const result = await session.run(query, { userId });
      const record = result.records[0];

      const context: UserContext = {
        recentInteractions: record.get('recentInteractions') || [],
        activeConnections: record.get('activeConnections') || [],
        preferences: {},
        behaviorPatterns: record.get('behaviorPatterns') || [],
        lastActivity: record.get('lastActivity') || 'unknown',
      };

      const queryTime = performance.now() - startTime;
      this.updatePerformanceMetrics('getUserContext', queryTime);

      return context;
    } finally {
      await session.close();
    }
  }

  /**
   * Encontrar usuarios similares usando algoritmo de grafos
   */
  async findSimilarUsers(
    userId: string,
    options: {
      interests?: string[];
      location?: string;
      preferences?: Record<string, any>;
      compatibilityThreshold?: number;
    }
  ): Promise<SimilarUser[]> {
    const session = this.driver.session();
    try {
      const startTime = performance.now();
      
      const query = 
        MATCH (u:User {id: $userId})
        MATCH (other:User)
        WHERE other.id <> $userId
        
        // Calcular similitud de intereses
        OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i1:Interest)
        OPTIONAL MATCH (other)-[:HAS_INTEREST]->(i2:Interest)
        WITH other, COUNT(DISTINCT i1) as u_interests, COUNT(DISTINCT i2) as o_interests,
             COUNT(DISTINCT CASE WHEN i1.name = i2.name THEN i1.name END) as shared_interests
        
        // Calcular similitud de ubicación
        OPTIONAL MATCH (u)-[:LOCATED_IN]->(l1:Location)
        OPTIONAL MATCH (other)-[:LOCATED_IN]->(l2:Location)
        WITH other, u_interests, o_interests, shared_interests,
             CASE WHEN l1.name = l2.name THEN 1 ELSE 0 END as location_match
        
        // Calcular score de compatibilidad
        WITH other, 
             (toFloat(shared_interests) / GREATEST(u_interests, o_interests, 1)) * 0.5 as interest_score,
             location_match * 0.3 as location_score,
             0.2 as preference_score
        WITH other, (interest_score + location_score + preference_score) as similarity_score
        
        WHERE similarity_score >= $threshold
        
        // Obtener recomendaciones basadas en conexiones existentes
        OPTIONAL MATCH (other)-[:CONNECTED_TO]->(conn:User)
        OPTIONAL MATCH (other)-[:HAS_INTEREST]->(rec:Interest)
        
        RETURN other.id as id,
               other.username as username,
               shared_interests as sharedInterests,
               COLLECT(DISTINCT rec.name) as recommendations,
               similarity_score as similarityScore
        ORDER BY similarity_score DESC, shared_interests DESC
        LIMIT 20
      ;

      const result = await session.run(query, {
        userId,
        threshold: options.compatibilityThreshold || 0.5,
      });

      const similarUsers: SimilarUser[] = result.records.map(record => ({
        id: record.get('id'),
        username: record.get('username'),
        sharedInterests: record.get('sharedInterests'),
        recommendations: record.get('recommendations'),
        similarityScore: record.get('similarityScore'),
      }));

      const queryTime = performance.now() - startTime;
      this.updatePerformanceMetrics('findSimilarUsers', queryTime);

      return similarUsers;
    } finally {
      await session.close();
    }
  }

  /**
   * Actualizar interacciones del usuario en el grafo
   */
  async updateUserInteractions(
    userId: string,
    entities: string[]
  ): Promise<void> {
    const session = this.driver.session();
    try {
      const startTime = performance.now();
      
      // Crear o actualizar nodos de intereses si no existen
      const interestQuery = `
        UNWIND $entities as entity
        MERGE (i:Interest {name: entity})
        RETURN i
      `;
      
      await session.run(interestQuery, { entities });

      // Conectar usuario con intereses
      const interactionQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $entities as entity
        MATCH (i:Interest {name: entity})
        MERGE (u)-[:RECENTLY_INTERACTED_WITH {timestamp: datetime()}]->(i)
      `;
      
      await session.run(interactionQuery, { userId, entities });

      const queryTime = performance.now() - startTime;
      this.updatePerformanceMetrics('updateUserInteractions', queryTime);

      logger.info(`Actualizadas ${entities.length} interacciones para usuario ${userId}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtener métricas de rendimiento
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    const avgQueryTime = this.calculateAverageQueryTime();
    const cacheHitRate = this.calculateCacheHitRate();
    const memoryUsage = this.calculateMemoryUsage();
    const connectionPoolUsage = this.calculateConnectionPoolUsage();

    return {
      queryTime: avgQueryTime,
      cacheHitRate,
      memoryUsage,
      connectionPoolUsage,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Crear índices para optimizar consultas
   */
  async createIndexes(): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Neo4j no está conectado');
      return;
    }

    const session = this.driver.session();
    try {
      const indexes = [
        'CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.id)',
        'CREATE INDEX user_username_index IF NOT EXISTS FOR (u:User) ON (u.username)',
        'CREATE INDEX interest_name_index IF NOT EXISTS FOR (i:Interest) ON (i.name)',
        'CREATE INDEX location_name_index IF NOT EXISTS FOR (l:Location) ON (l.name)',
        'CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name)',
      ];

      for (const indexQuery of indexes) {
        await session.run(indexQuery);
      }

      logger.info('✅ Índices de Neo4j creados/verificados');
    } finally {
      await session.close();
    }
  }

  /**
   * Cerrar conexión con Neo4j
   */
  async close(): Promise<void> {
    try {
      if (this.driver) {
        await this.driver.close();
        this.isConnected = false;
        logger.info('✅ Conexión a Neo4j cerrada');
      }
    } catch (error) {
      logger.error('Error cerrando conexión a Neo4j:', error);
    }
  }

  // Métodos privados de ayuda
  private updatePerformanceMetrics(operation: string, queryTime: number): void {
    this.metrics.push({
      operation,
      queryTime,
      timestamp: new Date().toISOString(),
    } as any);

    // Mantener solo las últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private calculateAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.queryTime, 0);
    return sum / this.metrics.length;
  }

  private calculateCacheHitRate(): number {
    const cacheSize = this.cache.size;
    return Math.min(cacheSize / 100, 1.0); // Normalizado a 0-1
  }

  private calculateMemoryUsage(): number {
    return Math.random() * 0.8 + 0.1; // Simulación entre 0.1 y 0.9
  }

  private calculateConnectionPoolUsage(): number {
    return Math.random() * 0.7 + 0.2; // Simulación entre 0.2 y 0.9
  }
}

// Exportar instancia singleton
export const neo4jService = new Neo4jService();
export default Neo4jService;
    const session = this.driver.session();
    try {
      const indexes = [
        'CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.id)',
        'CREATE INDEX user_username_index IF NOT EXISTS FOR (u:User) ON (u.username)',
        'CREATE INDEX user_location_index IF NOT EXISTS FOR (u:User) ON (u.location)',
        'CREATE INDEX interest_name_index IF NOT EXISTS FOR (i:Interest) ON (i.name)',
        'CREATE INDEX relationship_type_index IF NOT EXISTS FOR (rt:RelationshipType) ON (rt.name)',
        'CREATE COMPOSITE INDEX user_interest_composite IF NOT EXISTS FOR (u:User)-[:HAS_INTEREST]->(i:Interest) ON (u.id, i.name)',
        'CREATE COMPOSITE INDEX user_location_composite IF NOT EXISTS FOR (u:User)-[:LOCATED_IN]->(l:Location) ON (u.id, l.name)',
      ];

      for (const indexQuery of indexes) {
        await session.run(indexQuery);
      }

      logger.info('✅ Índices optimizados creados en Neo4j');
    } finally {
      await session.close();
    }
  }

  /**
   * Obtener métricas de rendimiento
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const recentMetrics = this.performanceMetrics.slice(-100); // Últimas 100 consultas
    
    if (recentMetrics.length === 0) {
      return {
        avgQueryTime: 0,
        cacheHitRate: 0,
        connectionPoolUsage: 0,
        indexUsage: {},
        slowQueries: [],
      };
    }

    const avgQueryTime = recentMetrics.reduce((sum, m) => sum + m.avgQueryTime, 0) / recentMetrics.length;
    const cacheHitRate = this.queryCache.size / (recentMetrics.length + this.queryCache.size);
    
    const slowQueries = recentMetrics
      .filter(m => m.avgQueryTime > 200)
      .map(m => m.queryName)
      .slice(-10);

    return {
      avgQueryTime,
      cacheHitRate,
      connectionPoolUsage: 0.75, // Placeholder
      indexUsage: {}, // Implementar seguimiento de índices
      slowQueries,
    };
  }

  /**
   * Limpiar cache y métricas antiguas
   */
  async cleanup(): Promise<void> {
    this.queryCache.clear();
    this.performanceMetrics = this.performanceMetrics.slice(-1000);
    logger.info('🧹 Cache y métricas antiguas limpiadas');
  }

  /**
   * Cerrar conexión con Neo4j
   */
  async close(): Promise<void> {
    await this.driver.close();
    logger.info('🔌 Conexión con Neo4j cerrada');
  }

  /**
   * Actualizar métricas de rendimiento
   */
  private updatePerformanceMetrics(queryName: string, queryTime: number): void {
    this.performanceMetrics.push({
      queryName,
      avgQueryTime: queryTime,
      cacheHitRate: 0,
      connectionPoolUsage: 0,
      indexUsage: {},
      slowQueries: [],
    });

    // Mantener solo últimas 1000 métricas
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }
}

export const neo4jService = new Neo4jService();
export default Neo4jService;
