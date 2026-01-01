/**
 * =====================================================
 * USER IDENTIFICATION SERVICE
 * =====================================================
 * Sistema de IDs únicos para usuarios Single y Pareja
 * Features: Generación, validación, búsqueda
 * Fecha: 19 Nov 2025
 * Versión: v3.6.5
 * =====================================================
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Json } from '@/integrations/supabase/types';

export type ProfileType = 'single' | 'couple';

export interface UserIdentifier {
  uniqueId: string;          // ID único generado
  userId: string;            // UUID de Supabase
  profileType: ProfileType;  // Tipo de perfil
  prefix: string;            // Prefijo (SNG- o CPL-)
  numericId: number;         // Número secuencial
  createdAt: Date;
  metadata?: {
    name?: string;
    email?: string;
    verificationLevel?: number;
    [key: string]: unknown;
  };
}

export class UserIdentificationService {
  private static instance: UserIdentificationService;
  private readonly SINGLE_PREFIX = 'SNG';
  private readonly COUPLE_PREFIX = 'CPL';
  private readonly ID_LENGTH = 8; // Longitud del número (ej: 00000001)

  private constructor() {}

  public static getInstance(): UserIdentificationService {
    if (!UserIdentificationService.instance) {
      UserIdentificationService.instance = new UserIdentificationService();
    }
    return UserIdentificationService.instance;
  }

  /**
   * Generar ID único para usuario
   */
  async generateUniqueId(
    userId: string,
    profileType: ProfileType,
    metadata?: UserIdentifier['metadata']
  ): Promise<UserIdentifier> {
    try {
      logger.info('[UserIdentification] Generating unique ID', { userId, profileType });

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Verificar si ya existe un identificador para este usuario y tipo
      const existing = await this.findByUserId(userId);
      if (existing && existing.profileType === profileType) {
        logger.info('[UserIdentification] User already has an ID', { uniqueId: existing.uniqueId });
        return existing;
      }

      // Obtener el siguiente número secuencial
      const numericId = await this.getNextSequentialNumber(profileType);

      // Generar ID con formato: PREFIX-NNNNNNNN
      const prefix = profileType === 'single' ? this.SINGLE_PREFIX : this.COUPLE_PREFIX;
      const paddedNumber = String(numericId).padStart(this.ID_LENGTH, '0');
      const uniqueId = `${prefix}-${paddedNumber}`;

      const identifier: UserIdentifier = {
        uniqueId,
        userId,
        profileType,
        prefix,
        numericId,
        createdAt: new Date(),
        metadata
      };

      // Guardar en base de datos
      await this.saveIdentifier(identifier);

      logger.info('[UserIdentification] Unique ID generated', { uniqueId });

      return identifier;
    } catch (error) {
      logger.error('[UserIdentification] Error generating ID:', { error });
      throw error;
    }
  }

  /**
   * Obtener siguiente número secuencial
   */
  private async getNextSequentialNumber(profileType: ProfileType): Promise<number> {
    try {
      // Obtener el máximo numeric_id actual para el tipo de perfil
      const { data, error } = await supabase
        .from('user_identifiers')
        .select('numeric_id')
        .eq('profile_type', profileType)
        .order('numeric_id', { ascending: false })
        .limit(1);

      if (error) {
        logger.error('[UserIdentification] Error fetching max numeric_id:', error);
        // Si hay error (ej: tabla vacía o no existe), intentamos fallback o empezamos en 1
        return 1;
      }

      const lastId = data && data.length > 0 ? data[0].numeric_id : 0;
      return (lastId || 0) + 1;
    } catch (error) {
      logger.error('[UserIdentification] Error getting sequential number:', { error });
      return 1;
    }
  }

  /**
   * Guardar identificador en BD
   */
  private async saveIdentifier(identifier: UserIdentifier): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_identifiers')
        .insert({
          unique_id: identifier.uniqueId,
          user_id: identifier.userId,
          profile_type: identifier.profileType,
          prefix: identifier.prefix,
          numeric_id: identifier.numericId,
          metadata: identifier.metadata as Json,
          created_at: identifier.createdAt.toISOString()
        });

      if (error) {
        throw error;
      }

      logger.info('[UserIdentification] Identifier saved', { uniqueId: identifier.uniqueId });
    } catch (error) {
      logger.error('[UserIdentification] Error saving identifier:', { error });
      throw error;
    }
  }

  /**
   * Buscar usuario por ID único
   */
  async findByUniqueId(uniqueId: string): Promise<UserIdentifier | null> {
    try {
      logger.info('[UserIdentification] Searching by unique ID', { uniqueId });

      const { data, error } = await supabase
        .from('user_identifiers')
        .select('*')
        .eq('unique_id', uniqueId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No results
        logger.error('[UserIdentification] Error finding by unique ID:', error);
        return null;
      }

      return this.mapToUserIdentifier(data);
    } catch (error) {
      logger.error('[UserIdentification] Error finding by unique ID:', { error });
      return null;
    }
  }

  /**
   * Buscar usuario por UUID
   */
  async findByUserId(userId: string): Promise<UserIdentifier | null> {
    try {
      const { data, error } = await supabase
        .from('user_identifiers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No results
        return null;
      }

      return this.mapToUserIdentifier(data);
    } catch (error) {
      logger.error('[UserIdentification] Error finding by user ID:', { error });
      return null;
    }
  }

  private mapToUserIdentifier(data: any): UserIdentifier {
    return {
      uniqueId: data.unique_id,
      userId: data.user_id,
      profileType: data.profile_type as ProfileType,
      prefix: data.prefix || (data.profile_type === 'single' ? this.SINGLE_PREFIX : this.COUPLE_PREFIX),
      numericId: data.numeric_id || 0,
      createdAt: new Date(data.created_at || Date.now()),
      metadata: typeof data.metadata === 'object' ? data.metadata : undefined
    };
  }

  /**
   * Validar formato de ID único
   */
  validateUniqueId(uniqueId: string): boolean {
    const pattern = /^(SNG|CPL)-\d{8}$/;
    return pattern.test(uniqueId);
  }

  /**
   * Extraer información de ID único
   */
  parseUniqueId(uniqueId: string): { profileType: ProfileType; numericId: number } | null {
    if (!this.validateUniqueId(uniqueId)) {
      return null;
    }

    const [prefix, numericPart] = uniqueId.split('-');
    const profileType: ProfileType = prefix === this.SINGLE_PREFIX ? 'single' : 'couple';
    const numericId = parseInt(numericPart, 10);

    return { profileType, numericId };
  }

  /**
   * Listar todos los usuarios de un tipo
   */
  async listByProfileType(profileType: ProfileType): Promise<UserIdentifier[]> {
    try {
      const { data, error } = await supabase
        .from('user_identifiers')
        .select('*')
        .eq('profile_type', profileType);

      if (error) {
        logger.error('[UserIdentification] Error listing by type:', error);
        return [];
      }

      return (data || []).map(item => this.mapToUserIdentifier(item));
    } catch (error) {
      logger.error('[UserIdentification] Error listing by type:', { error });
      return [];
    }
  }

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<{ singles: number; couples: number; total: number }> {
    try {
      // Usar count exacto para mejor rendimiento si hay muchos registros
      const { count: singlesCount, error: singlesError } = await supabase
        .from('user_identifiers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_type', 'single');

      const { count: couplesCount, error: couplesError } = await supabase
        .from('user_identifiers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_type', 'couple');

      if (singlesError || couplesError) {
        logger.error('[UserIdentification] Error getting stats:', { singlesError, couplesError });
        return { singles: 0, couples: 0, total: 0 };
      }

      const singles = singlesCount || 0;
      const couples = couplesCount || 0;

      return {
        singles,
        couples,
        total: singles + couples
      };
    } catch (error) {
      logger.error('[UserIdentification] Error getting stats:', { error });
      return { singles: 0, couples: 0, total: 0 };
    }
  }
}

export const userIdentificationService = UserIdentificationService.getInstance();

