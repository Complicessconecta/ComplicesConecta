/**
 * Neo4jService - Servicio para gestión de grafo social con Neo4j
 * 
 * Implementa:
 * - Creación de nodos de usuario
 * - Relaciones sociales (matches, likes, follows)
 * - Queries de grafo (amigos mutuos, friends of friends)
 * - Análisis de red social
 * 
 * Arquitectura Híbrida:
 * - PostgreSQL: Datos principales (users, profiles, messages)
 * - Neo4j: Grafo social (relaciones, conexiones, recomendaciones)
 * 
 * @version 3.5.0
 */

import neo4j, { Driver } from 'neo4j-driver';
import { logger } from '../../lib/logger';
import { getViteEnv } from '../../lib/env-utils';

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database?: string;
}

/**
 * Metadatos de nodo de usuario
 */
export interface NodeMetadata {
  age?: number;
  location?: string;
  gender?: string;
  [key: string]: unknown;
}

export interface UserNode {
  id: string;
  name?: string;
  email?: string;
  createdAt?: string;
  metadata?: NodeMetadata;
}

/**
 * Propiedades de relación
 */
export interface RelationshipProperties {
  created_at?: string;
  match_id?: string;
  score?: number;
  [key: string]: unknown;
}

export interface Relationship {
  type: 'MATCHED_WITH' | 'LIKED' | 'FOLLOWS' | 'FRIENDS_WITH' | 'BLOCKED';
  properties?: RelationshipProperties;
}

export interface MutualConnection {
  userId: string;
  mutualCount: number;
  mutualFriends: string[];
}

export interface FriendOfFriend {
  userId: string;
  mutualCount: number;
  path: string[];
}

class Neo4jService {
  private driver: Driver | null = null;
  private config: Neo4jConfig;
  private isEnabled: boolean;
  private initialized: boolean = false;

  constructor() {
    // 🔒 SEGURIDAD CRÍTICA: Validar que NEO4J_PASSWORD esté configurado
    const neo4jUri = getViteEnv('NEO4J_URI');
    const neo4jUser = getViteEnv('NEO4J_USER');
    const neo4jPassword = getViteEnv('NEO4J_PASSWORD');
    const neo4jDatabase = getViteEnv('NEO4J_DATABASE');

    // En desarrollo, permitir valores por defecto (excepto contraseña)
    if (import.meta.env.DEV) {
      if (!neo4jPassword) {
        logger.warn('⚠️ NEO4J_PASSWORD no configurado. Neo4j estará deshabilitado en desarrollo.');
      }
    } else {
      // En producción, REQUERIR todas las variables
      if (!neo4jUri || !neo4jUser || !neo4jPassword || !neo4jDatabase) {
        throw new Error(
          '❌ CRÍTICO: Configuración de Neo4j incompleta en producción. ' +
          'Requerido: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE'
        );
      }
    }

    this.config = {
      uri: neo4jUri || 'bolt://localhost:7687',
      user: neo4jUser || 'neo4j',
      password: neo4jPassword || '',
      database: neo4jDatabase || 'neo4j',
    };

    this.isEnabled = getViteEnv('NEO4J_ENABLED') === 'true' && !!neo4jPassword;

    // Solo inicializar si las variables están disponibles (contexto Vite)
    // En scripts Node.js, se llamará reinitialize() después de cargar .env
    if (this.isEnabled && (typeof import.meta !== 'undefined' && import.meta.env)) {
      this.initializeDriver();
    }
  }

  /**
   * Reinicializa el servicio con nuevas variables de entorno
   * Útil para scripts Node.js que cargan .env después de la importación
   * 
   * 🔒 SEGURIDAD: Valida que NEO4J_PASSWORD esté configurado
   */
  reinitialize(): void {
    // Cerrar driver existente de forma síncrona si es posible
    if (this.driver) {
      this.driver.close().catch(() => {
        // Ignorar errores al cerrar
      });
      this.driver = null;
    }

    // Intentar obtener valores de múltiples fuentes
    const uri = getViteEnv('NEO4J_URI') 
      || process.env.VITE_NEO4J_URI 
      || process.env.NEO4J_URI 
      || 'bolt://localhost:7687';
    
    const user = getViteEnv('NEO4J_USER') 
      || process.env.VITE_NEO4J_USER 
      || process.env.NEO4J_USER 
      || 'neo4j';
    
    // 🔒 CRÍTICO: NO usar valor por defecto para contraseña
    const password = getViteEnv('NEO4J_PASSWORD') 
      || process.env.VITE_NEO4J_PASSWORD 
      || process.env.NEO4J_PASSWORD 
      || '';
    
    const database = getViteEnv('NEO4J_DATABASE') 
      || process.env.VITE_NEO4J_DATABASE 
      || process.env.NEO4J_DATABASE 
      || 'neo4j';

    this.config = { uri, user, password, database };

    // Verificar si está habilitado desde múltiples fuentes
    const enabledVite = getViteEnv('NEO4J_ENABLED');
    const enabledProcess = process.env.VITE_NEO4J_ENABLED || process.env.NEO4J_ENABLED;
    
    this.isEnabled = (enabledVite === 'true' 
      || enabledProcess === 'true'
      || enabledProcess === '1') && !!password;

    if (this.isEnabled) {
      this.initializeDriver();
      this.initialized = true;
    } else {
      if (!password) {
        logger.warn('⚠️ NEO4J_PASSWORD no configurado. Neo4j está deshabilitado.');
      } else {
        logger.warn('Neo4j está deshabilitado. Set VITE_NEO4J_ENABLED=true para habilitar.');
      }
      this.initialized = false;
    }
  }

  /**
   * Inicializa el driver de Neo4j
   */
  private initializeDriver(): void {
    try {
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.user, this.config.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 horas
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutos
        }
      );

      logger.info('✅ Neo4j driver inicializado', {
        uri: this.config.uri.replace(/:[^:]*@/, ':****@'),
        database: this.config.database,
      });
    } catch (error) {
      logger.error('❌ Error inicializando Neo4j driver:', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.isEnabled = false;
    }
  }

  /**
   * Verifica la conexión con Neo4j
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.driver) {
      return false;
    }

    try {
      const session = this.driver.session({ database: this.config.database });
      const result = await session.run('RETURN 1 as test');
      await session.close();
      return result.records.length > 0;
    } catch (error) {
      logger.error('❌ Error verificando conexión Neo4j:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Crea o actualiza un nodo de usuario
   * 
   * @deprecated Usar webhook de Supabase → Edge Function en su lugar
   * 
   * IMPORTANTE: Este método SOLO debe guardar datos mínimos:
   * ✅ PERMITIDO: userId, gender, age, location
   * ❌ PROHIBIDO: bio, fotos, nombres, emails
   * 
   * Los datos pesados ahora son responsabilidad de la Edge Function sync-neo4j
   * que se dispara automáticamente cuando se actualiza un perfil en Supabase.
   * 
   * Patrón Persistencia Políglota:
   * - Supabase: Fuente de verdad para datos de usuario (bio, fotos, nombres)
   * - Neo4j: Fuente de verdad para relaciones sociales (matches, likes, follows)
   */
  async createUser(userId: string, metadata: Partial<UserNode> = {}): Promise<void> {
    if (!this.isEnabled || !this.driver) {
      logger.warn('⚠️ Neo4j deshabilitado. No se creó usuario:', { userId });
      return;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      // Aplanar metadata para Neo4j (no soporta objetos anidados)
      const flatMetadata: Record<string, unknown> = {
        id: userId,
      };
      
      // ✅ PERMITIDO: Datos mínimos
      if (metadata.createdAt) flatMetadata.created_at = metadata.createdAt;
      if (metadata.metadata) {
        // Aplanar metadata anidado - SOLO datos mínimos
        if (metadata.metadata.age !== undefined) flatMetadata.age = metadata.metadata.age;
        if (metadata.metadata.location) flatMetadata.location = metadata.metadata.location;
        if (metadata.metadata.gender) flatMetadata.gender = metadata.metadata.gender;
      }
      
      // ❌ PROHIBIDO: Datos pesados (ahora responsabilidad del webhook)
      // if (metadata.name) flatMetadata.name = metadata.name;  // Usar Supabase
      // if (metadata.email) flatMetadata.email = metadata.email;  // Usar Supabase

      await session.run(
        `
        MERGE (u:User {id: $userId})
        ON CREATE SET u.created_at = datetime(),
                     u += $metadata
        ON MATCH SET u += $metadata,
                     u.updated_at = datetime()
        `,
        {
          userId,
          metadata: flatMetadata,
        }
      );

      logger.info('✅ Usuario creado/actualizado en Neo4j', {
        userId: userId.substring(0, 8) + '***',
      });
    } catch (error) {
      logger.error('❌ Error creando usuario en Neo4j:', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Crea una relación de match entre dos usuarios
   */
  async createMatch(user1Id: string, user2Id: string, metadata: RelationshipProperties = {}): Promise<void> {
    if (!this.isEnabled || !this.driver) {
      logger.warn('⚠️ Neo4j deshabilitado. No se creó match:', { user1Id, user2Id });
      return;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      await session.run(
        `
        MATCH (u1:User {id: $user1Id})
        MATCH (u2:User {id: $user2Id})
        MERGE (u1)-[r:MATCHED_WITH]-(u2)
        SET r.created_at = datetime(),
            r += $metadata
        `,
        {
          user1Id,
          user2Id,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString(),
          },
        }
      );

      logger.info('✅ Match creado en Neo4j', {
        user1Id: user1Id.substring(0, 8) + '***',
        user2Id: user2Id.substring(0, 8) + '***',
      });
    } catch (error) {
      logger.error('❌ Error creando match en Neo4j:', {
        user1Id,
        user2Id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Crea una relación de like
   */
  async createLike(likerId: string, likedId: string, metadata: RelationshipProperties = {}): Promise<void> {
    if (!this.isEnabled || !this.driver) {
      return;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      await session.run(
        `
        MATCH (liker:User {id: $likerId})
        MATCH (liked:User {id: $likedId})
        MERGE (liker)-[r:LIKED]->(liked)
        SET r.created_at = datetime(),
            r += $metadata
        `,
        {
          likerId,
          likedId,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString(),
          },
        }
      );

      logger.info('✅ Like creado en Neo4j', {
        likerId: likerId.substring(0, 8) + '***',
        likedId: likedId.substring(0, 8) + '***',
      });
    } catch (error) {
      logger.error('❌ Error creando like en Neo4j:', {
        likerId,
        likedId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene amigos mutuos entre dos usuarios
   */
  async getMutualFriends(user1Id: string, user2Id: string): Promise<string[]> {
    if (!this.isEnabled || !this.driver) {
      return [];
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const result = await session.run(
        `
        MATCH (u1:User {id: $user1Id})-[:FRIENDS_WITH]-(mutual)-[:FRIENDS_WITH]-(u2:User {id: $user2Id})
        WHERE u1 <> u2 AND mutual <> u1 AND mutual <> u2
        RETURN DISTINCT mutual.id AS friendId
        `,
        { user1Id, user2Id }
      );

      const mutualFriends = result.records.map((record) => record.get('friendId') as string);

      logger.info('✅ Amigos mutuos obtenidos', {
        user1Id: user1Id.substring(0, 8) + '***',
        user2Id: user2Id.substring(0, 8) + '***',
        count: mutualFriends.length,
      });

      return mutualFriends;
    } catch (error) {
      logger.error('❌ Error obteniendo amigos mutuos:', {
        user1Id,
        user2Id,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene recomendaciones "amigos de amigos" para un usuario
   */
  async getFriendsOfFriends(userId: string, limit: number = 10, excludeMatched: boolean = true): Promise<FriendOfFriend[]> {
    if (!this.isEnabled || !this.driver) {
      return [];
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const excludeClause = excludeMatched
        ? 'AND NOT (u)-[:MATCHED_WITH]-(fof)'
        : '';

      const result = await session.run(
        `
        MATCH path = (u:User {id: $userId})-[:FRIENDS_WITH*2]-(fof:User)
        WHERE u <> fof
        ${excludeClause}
        WITH fof, count(DISTINCT path) AS mutualCount
        RETURN fof.id AS userId, mutualCount
        ORDER BY mutualCount DESC
        LIMIT $limit
        `,
        { userId, limit }
      );

      const friendsOfFriends = result.records.map((record) => ({
        userId: record.get('userId') as string,
        mutualCount: Number(record.get('mutualCount')),
        path: [], // TODO: Extraer path completo si es necesario
      }));

      logger.info('✅ Friends of friends obtenidos', {
        userId: userId.substring(0, 8) + '***',
        count: friendsOfFriends.length,
      });

      return friendsOfFriends;
    } catch (error) {
      logger.error('❌ Error obteniendo friends of friends:', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene el camino más corto entre dos usuarios
   */
  async getShortestPath(user1Id: string, user2Id: string): Promise<string[] | null> {
    if (!this.isEnabled || !this.driver) {
      return null;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const result = await session.run(
        `
        MATCH path = shortestPath((u1:User {id: $user1Id})-[*]-(u2:User {id: $user2Id}))
        WHERE length(path) > 0
        RETURN [n IN nodes(path) | n.id] AS path
        LIMIT 1
        `,
        { user1Id, user2Id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const path = result.records[0].get('path') as string[];
      return path;
    } catch (error) {
      logger.error('❌ Error obteniendo shortest path:', {
        user1Id,
        user2Id,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Sincroniza un usuario desde PostgreSQL a Neo4j
   */
  async syncUserFromPostgres(userId: string, profileData: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    created_at?: string;
    age?: number;
    location?: string;
    gender?: string;
    [key: string]: unknown;
  }): Promise<void> {
    // Usar name si existe, sino usar first_name + last_name
    const displayName = profileData.name || 
      (profileData.first_name && profileData.last_name 
        ? `${profileData.first_name} ${profileData.last_name}` 
        : profileData.first_name || profileData.last_name || null);
    
    await this.createUser(userId, {
      name: displayName || undefined,
      email: profileData.email || undefined, // email puede no existir en la tabla
      createdAt: profileData.created_at,
      metadata: {
        age: profileData.age,
        location: profileData.location,
        gender: profileData.gender,
      },
    });
  }

  /**
   * Sincroniza un match desde PostgreSQL a Neo4j
   */
  async syncMatchFromPostgres(user1Id: string, user2Id: string, matchData: {
    id?: string;
    created_at?: string;
    score?: number;
    [key: string]: unknown;
  }): Promise<void> {
    await this.createMatch(user1Id, user2Id, {
      match_id: matchData.id,
      created_at: matchData.created_at,
      score: matchData.score,
    });
  }

  /**
   * Cierra la conexión con Neo4j
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      logger.info('✅ Conexión Neo4j cerrada');
    }
  }

  /**
   * Obtiene estadísticas del grafo
   */
  async getGraphStats(): Promise<{
    userCount: number;
    matchCount: number;
    likeCount: number;
    friendCount: number;
  }> {
    if (!this.isEnabled || !this.driver) {
      return {
        userCount: 0,
        matchCount: 0,
        likeCount: 0,
        friendCount: 0,
      };
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      // Query optimizado para obtener estadísticas
      const result = await session.run(
        `
        MATCH (u:User)
        WITH count(DISTINCT u) AS userCount
        MATCH ()-[r1:MATCHED_WITH]-()
        WITH userCount, count(DISTINCT r1) / 2 AS matchCount
        MATCH ()-[r2:LIKED]->()
        WITH userCount, matchCount, count(DISTINCT r2) AS likeCount
        MATCH ()-[r3:FRIENDS_WITH]-()
        RETURN 
          userCount,
          matchCount,
          likeCount,
          count(DISTINCT r3) / 2 AS friendCount
        `
      );

      if (result.records.length === 0) {
        return {
          userCount: 0,
          matchCount: 0,
          likeCount: 0,
          friendCount: 0,
        };
      }

      const record = result.records[0];
      return {
        userCount: Number(record.get('userCount')),
        matchCount: Number(record.get('matchCount')),
        likeCount: Number(record.get('likeCount')),
        friendCount: Number(record.get('friendCount')),
      };
    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas del grafo:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        userCount: 0,
        matchCount: 0,
        likeCount: 0,
        friendCount: 0,
      };
    } finally {
      await session.close();
    }
  }
}

// Exportar instancia singleton
export const neo4jService = new Neo4jService();

// Exportar clase para testing
export default Neo4jService;




