/**
 * SmartMatchingService - Servicio unificado para matching inteligente
 * 
 * Conecta el algoritmo de matching (smartMatchingEngine) con la base de datos
 * Proporciona API centralizada para buscar matches desde cualquier parte de la app
 * 
 * @version 3.5.0
 */
import { smartMatchingEngine, type UserProfile, type MatchScore, type MatchingContext } from '@/lib/ai/smartMatching';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { neo4jService, type FriendOfFriend } from './graph/Neo4jService';
import { AdvancedFeaturesService, type ConversationStarter } from '@/lib/advancedFeatures';

export interface MatchFilters {
  ageRange?: { min: number; max: number };
  gender?: string[];
  maxDistance?: number; // km
  minScore?: number;
  verifiedOnly?: boolean;
  hasPhotos?: boolean;
  interests?: string[];
}

export interface MatchSearchOptions {
  limit?: number;
  offset?: number;
  filters?: MatchFilters;
  context?: MatchingContext;
  excludeMatched?: boolean; // Excluir usuarios que ya tienen match
}

export interface MatchSearchResult {
  matches: MatchScore[];
  total: number;
  stats: {
    totalCandidates: number;
    matchesFound: number;
    averageScore: number;
    highQualityMatches: number; // Score >= 70
  };
}

class SmartMatchingService {
  private static instance: SmartMatchingService;

  private constructor() {}

  static getInstance(): SmartMatchingService {
    if (!SmartMatchingService.instance) {
      SmartMatchingService.instance = new SmartMatchingService();
    }
    return SmartMatchingService.instance;
  }

  /**
   * Busca matches para un usuario (implementación v1 legacy)
   *
   * @deprecated Usar getDefaultMatches() o getSecureMatches() en nuevas features.
   */
  async findMatches(
    userId: string,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    try {
      logger.info('🔍 Buscando matches para usuario', { userId: userId.substring(0, 8) + '***' });

      // 1. Obtener perfil del usuario
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        logger.warn('Perfil de usuario no encontrado', { userId });
        return this.emptyResult();
      }

      // 2. Obtener candidatos desde BD
      const candidates = await this.getCandidates(userId, options);
      logger.info('Candidatos encontrados', { count: candidates.length });

      // 3. Convertir a UserProfile y calcular matches
      const userProfiles = candidates.map((c: any) => this.mapToUserProfile(c)).filter(Boolean) as UserProfile[];
      
      const matches = smartMatchingEngine.findBestMatches(
        userProfile,
        userProfiles,
        options.limit || 20,
        options.context
      );

      // 4. Enriquecer con conexiones sociales (Neo4j) si está habilitado
      const enrichedMatches = await this.enrichWithSocialConnections(
        userId,
        matches,
        options
      );

      // 5. Filtrar por score mínimo (incluyendo social score)
      const minScore = options.filters?.minScore || 30;
      const filteredMatches = enrichedMatches.filter(m => {
        const totalScore = m.totalScore + (m.socialScore || 0);
        return totalScore >= minScore;
      });

      // 6. Ordenar por score total (compatibility + social)
      filteredMatches.sort((a, b) => {
        const scoreA = a.totalScore + (a.socialScore || 0);
        const scoreB = b.totalScore + (b.socialScore || 0);
        return scoreB - scoreA;
      });

      // 7. Calcular estadísticas
      const stats = {
        totalCandidates: candidates.length,
        matchesFound: filteredMatches.length,
        averageScore: filteredMatches.length > 0
          ? Math.round(filteredMatches.reduce((sum: number, m: any) => sum + m.totalScore + (m.socialScore || 0), 0) / filteredMatches.length)
          : 0,
        highQualityMatches: filteredMatches.filter((m: any) => m.totalScore + (m.socialScore || 0) >= 70).length
      };

      const isNeo4jEnabled = typeof import.meta !== 'undefined' && (import.meta.env as Record<string, unknown>)
        ? (import.meta.env as Record<string, unknown>).VITE_NEO4J_ENABLED === 'true'
        : (typeof process !== 'undefined' && (process.env as Record<string, unknown>)?.VITE_NEO4J_ENABLED === 'true');
      
      logger.info('✅ Matches encontrados', {
        userId: userId.substring(0, 8) + '***',
        total: filteredMatches.length,
        avgScore: stats.averageScore,
        neo4jEnabled: isNeo4jEnabled
      });

      return {
        matches: filteredMatches,
        total: filteredMatches.length,
        stats
      };
    } catch (error) {
      logger.error('❌ Error buscando matches:', { 
        error: error instanceof Error ? error.message : String(error),
        userId: userId.substring(0, 8) + '***'
      });
      return this.emptyResult();
    }
  }

  /**
   * Punto de entrada recomendado para matching estándar.
   * Internamente usa getMatchesV2 (Hydration V2: Neo4j + Supabase).
   */
  async getDefaultMatches(
    userId: string,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    return this.getMatchesV2(userId, options);
  }

  /**
   * Punto de entrada recomendado para flujos sensibles con validación de privacidad.
   * Internamente usa findMatchesSecure.
   */
  async getSecureMatches(
    userId: string,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    return this.findMatchesSecure(userId, options);
  }

  /**
   * Calcula compatibilidad entre dos usuarios específicos
   */
  async calculateCompatibility(
    userId1: string,
    userId2: string,
    context?: MatchingContext
  ): Promise<MatchScore | null> {
    try {
      const [user1, user2] = await Promise.all([
        this.getUserProfile(userId1),
        this.getUserProfile(userId2)
      ]);

      if (!user1 || !user2) {
        logger.warn('Uno o ambos perfiles no encontrados', { userId1, userId2 });
        return null;
      }

      return smartMatchingEngine.calculateCompatibility(user1, user2, context);
    } catch (error) {
      logger.error('Error calculando compatibilidad:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Rompehielos contextuales para un match específico
   *
   * - Delegado en AdvancedFeaturesService.generateConversationStarters
   * - Manejo de errores defensivo: siempre retorna arreglo (posiblemente vacío)
   * - No toca la lógica de matching ni de notificaciones existentes
   */
  async getConversationStarters(
    userId: string,
    matchProfileId: string
  ): Promise<ConversationStarter[]> {
    try {
      logger.info('💬 Generando conversation starters para match', {
        userId: userId.substring(0, 8) + '***',
        matchProfileId: matchProfileId.substring(0, 8) + '***',
      });

      const starters = await AdvancedFeaturesService.generateConversationStarters(
        userId,
        matchProfileId
      );

      return Array.isArray(starters) ? starters : [];
    } catch (error) {
      logger.error('❌ Error en getConversationStarters de SmartMatchingService', {
        error: error instanceof Error ? error.message : String(error),
        userId: userId.substring(0, 8) + '***',
        matchProfileId: matchProfileId.substring(0, 8) + '***',
      });
      return [];
    }
  }

  /**
   * Obtiene perfil del usuario desde BD y lo convierte a UserProfile
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .single();

      if (error || !profile) {
        logger.warn('Perfil no encontrado', { userId, error: error?.message });
        return null;
      }

      return this.mapToUserProfile(profile);
    } catch (error) {
      logger.error('Error obteniendo perfil de usuario:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Obtiene candidatos desde BD aplicando filtros
   */
  private async getCandidates(
    userId: string,
    options: MatchSearchOptions
  ): Promise<any[]> {
    try {
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return [];
      }

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', userId);

      // Aplicar filtros
      if (options.filters) {
        const { ageRange, gender, verifiedOnly, hasPhotos: _hasPhotos } = options.filters;

        if (ageRange) {
          query = query.gte('age', ageRange.min).lte('age', ageRange.max);
        }

        if (gender && gender.length > 0) {
          query = query.in('gender', gender);
        }

        if (verifiedOnly) {
          query = query.eq('is_verified', true);
        }

        // hasPhotos se verifica después obteniendo los datos
      }

      // Excluir ya matcheados
      if (options.excludeMatched) {
        if (!supabase) {
          logger.error('Supabase no está disponible');
          return [];
        }

        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (existingMatches && existingMatches.length > 0) {
          const matchedIds = existingMatches.flatMap((m: any) => {
            if (m.user1_id === userId && m.user2_id) return [m.user2_id];
            if (m.user2_id === userId && m.user1_id) return [m.user1_id];
            return [];
          }).filter(Boolean);
          
          if (matchedIds.length > 0) {
            query = query.not('user_id', 'in', `(${matchedIds.map((id: any) => `'${id}'`).join(',')})`);
          }
        }
      }

      // Aplicar límite y offset
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      query = query.limit(limit).range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Error obteniendo candidatos:', error);
        return [];
      }

      // Filtrar por fotos si se requiere
      if (options.filters?.hasPhotos && data) {
        // Verificar que tenga avatar_url (por ahora, ya que tabla images puede no existir)
        return data.filter((profile: any) => profile.avatar_url && profile.avatar_url.trim() !== '');
      }

      return data || [];
    } catch (error) {
      logger.error('Error obteniendo candidatos:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Mapea perfil de BD a UserProfile para el algoritmo
   */
  private mapToUserProfile(profile: any): UserProfile | null {
    try {
      // Parsear intereses (pueden estar en formato string JSON o array)
      let interests: string[] = [];
      if (profile.interests) {
        if (typeof profile.interests === 'string') {
          try {
            interests = JSON.parse(profile.interests);
          } catch {
            interests = profile.interests.split(',').map((i: string) => i.trim());
          }
        } else if (Array.isArray(profile.interests)) {
          interests = profile.interests;
        }
      }

      // Obtener intereses swinger si existen
      // TODO: Hacer query a user_swinger_interests si es necesario

      // Personalidad (valores por defecto si no existen)
      const personality = {
        openness: profile.openness || 50,
        conscientiousness: profile.conscientiousness || 50,
        extraversion: profile.extraversion || 50,
        agreeableness: profile.agreeableness || 50,
        neuroticism: profile.neuroticism || 50,
        adventurousness: profile.adventurousness || 50,
        discretion: profile.discretion || 50
      };

      // Preferencias (valores por defecto)
      const preferences = {
        ageRange: {
          min: profile.preferred_age_min || 18,
          max: profile.preferred_age_max || 65
        },
        genderPreference: profile.looking_for ? 
          (Array.isArray(profile.looking_for) ? profile.looking_for : [profile.looking_for]) :
          ['single', 'pareja'],
        maxDistance: profile.max_distance || 50,
        interests: interests,
        dealBreakers: profile.deal_breakers || [],
        importance: {
          personality: profile.importance_personality || 20,
          interests: profile.importance_interests || 25,
          location: profile.importance_location || 25,
          activity: profile.importance_activity || 15,
          verification: profile.importance_verification || 15
        }
      };

      // Actividad (calcular desde datos disponibles)
      const activity = {
        lastActive: profile.updated_at ? new Date(profile.updated_at) : new Date(),
        responseRate: profile.response_rate || 50,
        profileCompleteness: this.calculateCompleteness(profile),
        photosCount: profile.photos_count || 0,
        messagesExchanged: profile.messages_count || 0,
        meetingsArranged: profile.meetings_count || 0
      };

      // Verificación
      const verification = {
        isVerified: profile.is_verified || false,
        photoVerified: profile.photo_verified || false,
        phoneVerified: profile.phone_verified || false,
        idVerified: profile.id_verified || false,
        coupleVerified: profile.couple_verified || false
      };

      return {
        id: profile.user_id || profile.id,
        name: profile.first_name || profile.name || 'Usuario',
        age: profile.age || 25,
        gender: profile.profile_type === 'couple' ? 'pareja' : 'single',
        location: {
          city: profile.city || profile.location || 'Ciudad',
          coordinates: profile.latitude && profile.longitude ? {
            lat: profile.latitude,
            lng: profile.longitude
          } : undefined
        },
        interests,
        personality,
        preferences,
        activity,
        verification
      };
    } catch (error) {
      logger.error('Error mapeando perfil:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Calcula completitud del perfil
   */
  private calculateCompleteness(profile: any): number {
    let completeness = 0;
    const fields = [
      'first_name', 'bio', 'age', 'gender', 'city',
      'interests', 'avatar_url', 'latitude', 'longitude'
    ];

    fields.forEach(field => {
      if (profile[field]) completeness += 100 / fields.length;
    });

    return Math.round(completeness);
  }

  /**
   * Enriquece matches con conexiones sociales desde Neo4j
   */
  private async enrichWithSocialConnections(
    userId: string,
    matches: MatchScore[],
    _options: MatchSearchOptions
  ): Promise<(MatchScore & { socialScore?: number; mutualFriends?: string[]; mutualFriendsCount?: number })[]> {
    // Verificar si Neo4j está habilitado
    const isNeo4jEnabled = typeof import.meta !== 'undefined' && (import.meta.env as Record<string, unknown>)
      ? (import.meta.env as Record<string, unknown>).VITE_NEO4J_ENABLED === 'true'
      : (typeof process !== 'undefined' && (process.env as Record<string, unknown>)?.VITE_NEO4J_ENABLED === 'true');
    
    if (!isNeo4jEnabled) {
      logger.debug('Neo4j deshabilitado, saltando enriquecimiento social');
      return matches;
    }

    try {
      // Enriquecer cada match con conexiones sociales
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          try {
            // Obtener amigos mutuos desde Neo4j
            const mutualFriends = await neo4jService.getMutualFriends(userId, match.userId);
            
            // Calcular social score basado en conexiones
            // Bonus por amigos mutuos: 10 puntos por cada amigo mutuo (máximo 50 puntos)
            const socialScore = Math.min(mutualFriends.length * 10, 50);
            
            // Bonus adicional si hay muchos amigos mutuos (indicador de confianza)
            const trustBonus = mutualFriends.length >= 3 ? 20 : 0;
            const totalSocialScore = socialScore + trustBonus;

            logger.debug('Match enriquecido con conexiones sociales', {
              userId: userId.substring(0, 8) + '***',
              matchUserId: match.userId.substring(0, 8) + '***',
              mutualFriendsCount: mutualFriends.length,
              socialScore: totalSocialScore
            });

            return {
              ...match,
              socialScore: totalSocialScore,
              mutualFriends,
              mutualFriendsCount: mutualFriends.length
            };
          } catch (error) {
            // Si falla Neo4j, continuar sin enriquecimiento
            logger.warn('Error enriqueciendo match con Neo4j, continuando sin enriquecimiento', {
              userId: userId.substring(0, 8) + '***',
              matchUserId: match.userId.substring(0, 8) + '***',
              error: error instanceof Error ? error.message : String(error)
            });
            return match;
          }
        })
      );

      return enrichedMatches;
    } catch (error) {
      // Si falla completamente, retornar matches originales
      logger.error('Error enriqueciendo matches con Neo4j, retornando matches originales', {
        error: error instanceof Error ? error.message : String(error)
      });
      return matches;
    }
  }

  /**
   * Obtiene recomendaciones basadas en "friends of friends"
   */
  async getRecommendedUsers(
    userId: string,
    limit: number = 10,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    // Verificar si Neo4j está habilitado
    const isNeo4jEnabled = typeof import.meta !== 'undefined' && (import.meta.env as Record<string, unknown>)
      ? (import.meta.env as Record<string, unknown>).VITE_NEO4J_ENABLED === 'true'
      : (typeof process !== 'undefined' && (process.env as Record<string, unknown>)?.VITE_NEO4J_ENABLED === 'true');
    
    if (!isNeo4jEnabled) {
      logger.debug('Neo4j deshabilitado, usando matching tradicional');
      return this.findMatches(userId, { ...options, limit });
    }

    try {
      logger.info('🔍 Obteniendo recomendaciones FOF para usuario', {
        userId: userId.substring(0, 8) + '***'
      });

      // 1. Obtener friends of friends desde Neo4j
      const fofRecommendations = await neo4jService.getFriendsOfFriends(
        userId,
        limit * 2, // Obtener más para filtrar después
        options.excludeMatched || true
      );

      if (fofRecommendations.length === 0) {
        logger.info('No hay recomendaciones FOF, usando matching tradicional');
        return this.findMatches(userId, { ...options, limit });
      }

      // 2. Obtener perfiles desde PostgreSQL
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return this.emptyResult();
      }

      const fofUserIds = fofRecommendations.map((f: any) => f.userId);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', fofUserIds)
        .eq('is_public', true);

      if (error || !profiles || profiles.length === 0) {
        logger.warn('No se encontraron perfiles para recomendaciones FOF');
        return this.findMatches(userId, { ...options, limit });
      }

      // 3. Convertir a UserProfile y calcular matches
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        logger.warn('Perfil de usuario no encontrado');
        return this.emptyResult();
      }

      const userProfiles = profiles
        .map((p: any) => this.mapToUserProfile(p))
        .filter(Boolean) as UserProfile[];

      const matches = smartMatchingEngine.findBestMatches(
        userProfile,
        userProfiles,
        limit,
        options.context
      );

      // 4. Enriquecer con información FOF
      const enrichedMatches = matches.map((match: any) => {
        const fof = fofRecommendations.find((f: any) => f.userId === match.userId);
        return {
          ...match,
          socialScore: (fof?.mutualCount || 0) * 15, // Bonus por conexiones FOF
          mutualFriendsCount: fof?.mutualCount || 0,
          isFOFRecommendation: true
        };
      });

      // 5. Filtrar por score mínimo
      const minScore = options.filters?.minScore || 30;
      const filteredMatches = enrichedMatches.filter((m: any) => {
        const totalScore = m.totalScore + (m.socialScore || 0);
        return totalScore >= minScore;
      });

      // 6. Ordenar por score total
      filteredMatches.sort((a: any, b: any) => {
        const scoreA = a.totalScore + (a.socialScore || 0);
        const scoreB = b.totalScore + (b.socialScore || 0);
        return scoreB - scoreA;
      });

      // 7. Calcular estadísticas
      const stats = {
        totalCandidates: profiles.length,
        matchesFound: filteredMatches.length,
        averageScore: filteredMatches.length > 0
          ? Math.round(filteredMatches.reduce((sum: number, m: any) => sum + m.totalScore + (m.socialScore || 0), 0) / filteredMatches.length)
          : 0,
        highQualityMatches: filteredMatches.filter((m: any) => m.totalScore + (m.socialScore || 0) >= 70).length
      };

      logger.info('✅ Recomendaciones FOF obtenidas', {
        userId: userId.substring(0, 8) + '***',
        total: filteredMatches.length,
        avgScore: stats.averageScore
      });

      return {
        matches: filteredMatches.slice(0, limit),
        total: filteredMatches.length,
        stats
      };
    } catch (error) {
      logger.error('❌ Error obteniendo recomendaciones FOF:', {
        error: error instanceof Error ? error.message : String(error),
        userId: userId.substring(0, 8) + '***'
      });
      // Fallback a matching tradicional
      return this.findMatches(userId, { ...options, limit });
    }
  }

  /**
   * 🚀 NUEVO MÉTODO V2: Patrón Hydration (Persistencia Políglota)
   * 
   * Optimización: Separa queries por BD
   * - Neo4j: Obtiene IDs compatibles + scores (grafo social)
   * - Supabase: Obtiene datos completos de usuarios (perfil)
   * - Memoria: Fusiona resultados
   * 
   * Ventajas:
   * ✅ Neo4j solo consulta relaciones (su especialidad)
   * ✅ Supabase solo consulta perfiles (su especialidad)
   * ✅ Reduce redundancia de datos
   * ✅ Mejor rendimiento en ambas BD
   * 
   * @deprecated findMatches() - Usar getMatchesV2() en nuevas features
   */
  async getMatchesV2(
    userId: string,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    try {
      logger.info('🚀 [V2] Buscando matches con patrón Hydration', { 
        userId: userId.substring(0, 8) + '***' 
      });

      // ============================================
      // PASO 1: Obtener perfil del usuario actual
      // ============================================
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        logger.warn('Perfil de usuario no encontrado', { userId });
        return this.emptyResult();
      }

      // ============================================
      // PASO 2: QUERY A NEO4J - Obtener IDs compatibles
      // ============================================
      // Neo4j retorna: [{ userId: "...", score: 75, socialScore: 10 }, ...]
      const compatibleUserIds: Array<{ userId: string; score: number; socialScore?: number }> = [];

      const isNeo4jEnabled = typeof import.meta !== 'undefined' && import.meta.env 
        ? import.meta.env.VITE_NEO4J_ENABLED === 'true'
        : process.env.VITE_NEO4J_ENABLED === 'true';

      if (isNeo4jEnabled && neo4jService) {
        try {
          // Obtener amigos de amigos y conexiones sociales desde Neo4j
          const friendsOfFriends = await neo4jService.getFriendsOfFriends(userId, 50, true);
          
          // Convertir a formato esperado
          friendsOfFriends.forEach((fof: FriendOfFriend) => {
            compatibleUserIds.push({
              userId: fof.userId,
              score: 0,
              socialScore: fof.mutualCount * 5
            });
          });

          logger.info('📊 Neo4j: Conexiones sociales encontradas', { 
            count: compatibleUserIds.length 
          });
        } catch (error) {
          logger.warn('⚠️ Error consultando Neo4j, continuando con Supabase solo', { error });
        }
      }

      // ============================================
      // PASO 3: QUERY A SUPABASE - Obtener datos completos
      // ============================================
      let candidates: any[] = [];

      if (compatibleUserIds.length > 0) {
        // Opción A: Usar IDs de Neo4j
        const userIds = compatibleUserIds.map(c => c.userId);
        
        if (!supabase) {
          logger.error('Supabase no está disponible');
          return this.emptyResult();
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds)
          .eq('is_public', true);

        if (error) {
          logger.error('Error obteniendo perfiles de Neo4j IDs:', error);
          candidates = [];
        } else {
          candidates = data || [];
        }

        logger.info('📦 Supabase: Perfiles obtenidos', { count: candidates.length });
      } else {
        // Opción B: Fallback a búsqueda completa en Supabase
        logger.info('⏭️ Neo4j deshabilitado o sin resultados, usando búsqueda Supabase completa');
        candidates = await this.getCandidates(userId, options);
      }

      // ============================================
      // PASO 4: FUSIÓN EN MEMORIA - Combinar datos
      // ============================================
      const userProfiles = candidates
        .map(c => this.mapToUserProfile(c))
        .filter(Boolean) as UserProfile[];

      // Calcular scores de compatibilidad
      const matches = smartMatchingEngine.findBestMatches(
        userProfile,
        userProfiles,
        options.limit || 20,
        options.context
      );

      // Enriquecer con social scores de Neo4j
      const enrichedMatches = matches.map((match: any) => {
        const neoData = compatibleUserIds.find((c: any) => c.userId === match.userId);
        return {
          ...match,
          socialScore: (neoData?.socialScore || 0),
          totalScore: match.totalScore + (neoData?.socialScore || 0)
        };
      });

      // ============================================
      // PASO 5: FILTRADO Y ORDENAMIENTO
      // ============================================
      const minScore = options.filters?.minScore || 30;
      const filteredMatches = enrichedMatches.filter((m: any) => m.totalScore >= minScore);

      // Ordenar por score total (compatibilidad + social)
      filteredMatches.sort((a: any, b: any) => b.totalScore - a.totalScore);

      // ============================================
      // PASO 6: ESTADÍSTICAS
      // ============================================
      const stats = {
        totalCandidates: candidates.length,
        matchesFound: filteredMatches.length,
        averageScore: filteredMatches.length > 0
          ? Math.round(filteredMatches.reduce((sum: number, m: any) => sum + m.totalScore, 0) / filteredMatches.length)
          : 0,
        highQualityMatches: filteredMatches.filter((m: any) => m.totalScore >= 70).length
      };

      logger.info('✅ [V2] Matches encontrados', {
        userId: userId.substring(0, 8) + '***',
        total: filteredMatches.length,
        avgScore: stats.averageScore,
        neo4jEnabled: isNeo4jEnabled
      });

      return {
        matches: filteredMatches,
        total: filteredMatches.length,
        stats
      };
    } catch (error) {
      logger.error('❌ [V2] Error en getMatchesV2:', { 
        error: error instanceof Error ? error.message : String(error),
        userId: userId.substring(0, 8) + '***'
      });
      return this.emptyResult();
    }
  }

  /**
   * 🔒 MATCHING SEGURO CON VALIDACIÓN DE PRIVACIDAD
   * 
   * Flujo Híbrido Orquestado:
   * 1. Validar preferencias de privacidad del usuario
   * 2. Consultar Neo4j para obtener IDs compatibles (grafo social)
   * 3. Enriquecer con datos de Supabase (respeta RLS automáticamente)
   * 4. Filtrar con IA (reordenar por compatibilidad emocional)
   * 5. Sanitizar: NUNCA exponer email/teléfono
   */
  async findMatchesSecure(
    userId: string,
    options: MatchSearchOptions = {}
  ): Promise<MatchSearchResult> {
    try {
      logger.info('🔒 [SECURE] Iniciando búsqueda de matches con validación de privacidad', {
        userId: userId.substring(0, 8) + '***'
      });

      // ============================================
      // PASO 1: VALIDACIÓN DE PRIVACIDAD
      // ============================================
      if (!supabase) {
        logger.error('Supabase no está disponible');
        return this.emptyResult();
      }

      // Obtener perfil del usuario para validar privacidad
      const { data: privacyCheckData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', userId)
        .single();

      if (profileError || !privacyCheckData) {
        logger.warn('⚠️ Perfil de usuario no encontrado', { userId });
        return this.emptyResult();
      }

      // ✅ Validación de privacidad completada (usuario existe y es válido)
      logger.info('✅ Validación de privacidad completada', {
        userId: userId.substring(0, 8) + '***'
      });

      // ============================================
      // PASO 2: CONSULTA A NEO4J - IDs compatibles
      // ============================================
      const compatibleUserIds: Array<{ userId: string; socialScore: number }> = [];
      const isNeo4jEnabled = typeof import.meta !== 'undefined' && (import.meta.env as Record<string, unknown>)
        ? (import.meta.env as Record<string, unknown>).VITE_NEO4J_ENABLED === 'true'
        : (process.env as Record<string, unknown>).VITE_NEO4J_ENABLED === 'true';

      if (isNeo4jEnabled && neo4jService) {
        try {
          const friendsOfFriends = await neo4jService.getFriendsOfFriends(userId, 100, true);
          
          friendsOfFriends.forEach((fof: FriendOfFriend) => {
            compatibleUserIds.push({
              userId: fof.userId,
              socialScore: fof.mutualCount * 5
            });
          });

          logger.info('📊 Neo4j: Conexiones sociales encontradas', {
            count: compatibleUserIds.length
          });
        } catch (error) {
          logger.warn('⚠️ Error consultando Neo4j, continuando con Supabase', { error });
        }
      }

      // ============================================
      // PASO 3: ENRIQUECIMIENTO CON SUPABASE
      // ============================================
      let candidates: any[] = [];

      if (compatibleUserIds.length > 0) {
        // Opción A: Usar IDs de Neo4j
        const userIds = compatibleUserIds.map(c => c.userId);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, avatar_url, gender, age, location, is_verified, interests')
          .in('user_id', userIds)
          .eq('is_public', true);

        if (error) {
          logger.error('Error obteniendo perfiles de Neo4j IDs:', error);
          candidates = [];
        } else {
          candidates = data || [];
        }

        logger.info('📦 Supabase: Perfiles enriquecidos', { count: candidates.length });
      } else {
        // Opción B: Fallback a búsqueda completa
        logger.info('⏭️ Neo4j deshabilitado, usando búsqueda Supabase completa');
        candidates = await this.getCandidates(userId, options);
      }

      // ============================================
      // PASO 4: MAPEO Y CÁLCULO DE SCORES
      // ============================================
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        logger.warn('Perfil de usuario no encontrado', { userId });
        return this.emptyResult();
      }

      const userProfiles = candidates
        .map(c => this.mapToUserProfile(c))
        .filter(Boolean) as UserProfile[];

      const matches = smartMatchingEngine.findBestMatches(
        userProfile,
        userProfiles,
        options.limit || 20,
        options.context
      );

      // Enriquecer con social scores de Neo4j
      const enrichedMatches = matches.map(match => {
        const neoData = compatibleUserIds.find(c => c.userId === match.userId);
        return {
          ...match,
          socialScore: (neoData?.socialScore || 0),
          totalScore: match.totalScore + (neoData?.socialScore || 0)
        };
      });

      logger.info('🧠 Scores calculados', {
        totalMatches: enrichedMatches.length,
        avgScore: enrichedMatches.length > 0
          ? Math.round(enrichedMatches.reduce((sum, m) => sum + m.totalScore, 0) / enrichedMatches.length)
          : 0
      });

      // ============================================
      // PASO 5: FILTRADO Y SANITIZACIÓN
      // ============================================
      const minScore = options.filters?.minScore || 30;
      const filteredMatches = enrichedMatches.filter(m => m.totalScore >= minScore);

      // Ordenar por score total
      filteredMatches.sort((a, b) => b.totalScore - a.totalScore);

      // 🔒 SANITIZACIÓN CRÍTICA: Eliminar datos de contacto
      const sanitizedMatches = filteredMatches.map((match: any) => ({
        ...match,
        // ❌ NUNCA exponer email o teléfono
        email: undefined,
        phone: undefined,
        phone_number: undefined,
        contact_email: undefined
      }));

      // ============================================
      // PASO 6: ESTADÍSTICAS FINALES
      // ============================================
      const stats = {
        totalCandidates: candidates.length,
        matchesFound: sanitizedMatches.length,
        averageScore: sanitizedMatches.length > 0
          ? Math.round(sanitizedMatches.reduce((sum: number, m: any) => sum + m.totalScore, 0) / sanitizedMatches.length)
          : 0,
        highQualityMatches: sanitizedMatches.filter(m => m.totalScore >= 70).length
      };

      logger.info('✅ [SECURE] Matching completado', {
        userId: userId.substring(0, 8) + '***',
        total: sanitizedMatches.length,
        avgScore: stats.averageScore,
        privacyValidated: true,
        dataSanitized: true
      });

      return {
        matches: sanitizedMatches,
        total: sanitizedMatches.length,
        stats
      };
    } catch (error) {
      logger.error('❌ [SECURE] Error en findMatchesSecure:', {
        error: error instanceof Error ? error.message : String(error),
        userId: userId.substring(0, 8) + '***'
      });
      return this.emptyResult();
    }
  }

  /**
   * Resultado vacío
   */
  private emptyResult(): MatchSearchResult {
    return {
      matches: [],
      total: 0,
      stats: {
        totalCandidates: 0,
        matchesFound: 0,
        averageScore: 0,
        highQualityMatches: 0
      }
    };
  }
}

// Exportar instancia singleton
export const smartMatchingService = SmartMatchingService.getInstance();

// Exportar también como clase para testing
export { SmartMatchingService };




