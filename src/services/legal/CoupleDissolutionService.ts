/**
 * CoupleDissolutionService.ts - Protocolo de Disolución "Cuenta Regresiva"
 * 
 * Propósito: Gestionar disolución de parejas con congelamiento y timer de 72h
 * Autor: Lead Architect & Legal Engineer
 * Versión: v3.7.2 - Dissolution Protocol Implementation
 * Fecha: 21 Noviembre 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Database, Json } from '@/types/supabase';

type CoupleDisputesTable = Database['public']['Tables']['couple_disputes'];
type CoupleDisputeRow = CoupleDisputesTable['Row'];
type CoupleDisputeInsert = CoupleDisputesTable['Insert'];
type CoupleDisputeUpdate = CoupleDisputesTable['Update'];

type TokensInDisputePayload = Record<string, unknown>;

const asObjectRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

export interface DisputeStatus {
  id: string;
  coupleId: string;
  initiatedBy: string;
  status: 'PENDING_AGREEMENT' | 'RESOLVED_TRANSFERRED' | 'EXPIRED_FORFEITED';
  deadlineAt: string;
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  };
  frozenAssetsSnapshot: any;
  proposedWinnerId?: string;
  finalWinnerId?: string;
}

export interface AssetSnapshot {
  partner_1: {
    user_id: string;
    assets: {
      cmpx_balance: number;
      gtk_balance: number;
      nfts_count: number;
    };
  };
  partner_2: {
    user_id: string;
    assets: {
      cmpx_balance: number;
      gtk_balance: number;
      nfts_count: number;
    };
  };
  frozen_at: string;
  total_value_estimate: number;
}

export class CoupleDissolutionService {
  /**
   * Congelar cuenta e iniciar proceso de disolución
   */
  static async freezeAccount(coupleId: string, initiatedBy: string): Promise<DisputeStatus> {
    try {
      // Crear snapshot de activos
      const { data: snapshotData, error: snapshotError } = await supabase!
        .rpc('create_assets_snapshot', { p_couple_id: coupleId });

      if (snapshotError) {
        logger.error('Error creando snapshot de activos', { snapshotError });
        throw snapshotError;
      }

      const { data: agreement, error: agreementError } = await supabase!
        .from('couple_agreements')
        .select('id')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (agreementError || !agreement) {
        logger.error('Error obteniendo acuerdo de pareja', { agreementError, coupleId });
        throw agreementError || new Error('Acuerdo de pareja no encontrado');
      }

      // Crear disputa con timer de 72h
      const { data: dispute, error: disputeError } = await supabase!
        .from('couple_disputes')
        .insert({
          couple_id: coupleId,
          couple_agreement_id: agreement.id,
          initiated_by: initiatedBy,
          dispute_reason: 'COUPLE_DISSOLUTION',
          status: 'PENDING_AGREEMENT',
          deadline_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          tokens_in_dispute: {
            frozen_assets_snapshot: snapshotData,
          } as unknown as Json,
        } satisfies CoupleDisputeInsert)
        .select('id')
        .single();

      if (disputeError) {
        logger.error('Error creando disputa', { disputeError });
        throw disputeError;
      }

      logger.info('Cuenta congelada exitosamente', {
        disputeId: dispute.id,
        coupleId,
        initiatedBy
      });

      return await this.getDisputeStatus(dispute.id);

    } catch (error) {
      logger.error('Error en freezeAccount', { error, coupleId, initiatedBy });
      throw error;
    }
  }

  /**
   * Proponer ganador de activos
   */
  static async proposeWinner(disputeId: string, winnerId: string, proposedBy: string): Promise<DisputeStatus> {
    try {
      const { data: current, error: currentError } = await supabase!
        .from('couple_disputes')
        .select('tokens_in_dispute')
        .eq('id', disputeId)
        .single();

      if (currentError) {
        logger.error('Error obteniendo disputa para propuesta', { currentError, disputeId });
        throw currentError;
      }

      const nextTokens: TokensInDisputePayload = {
        ...asObjectRecord(current?.tokens_in_dispute),
        proposed_winner_id: winnerId,
        proposed_at: new Date().toISOString(),
        proposed_by: proposedBy,
      };

      const { data: _data, error } = await supabase!
        .from('couple_disputes')
        .update({
          tokens_in_dispute: nextTokens as unknown as Json,
        } satisfies CoupleDisputeUpdate)
        .eq('id', disputeId)
        .eq('status', 'PENDING_AGREEMENT')
        .select('id')
        .single();

      if (error) {
        logger.error('Error proponiendo ganador', { error });
        throw error;
      }

      logger.info('Ganador propuesto', { disputeId, winnerId, proposedBy });

      return await this.getDisputeStatus(disputeId);

    } catch (error) {
      logger.error('Error en proposeWinner', { error });
      throw error;
    }
  }

  /**
   * Aceptar propuesta y procesar acuerdo
   */
  static async acceptProposal(disputeId: string, acceptedBy: string): Promise<DisputeStatus> {
    try {
      const { data: current, error: currentError } = await supabase!
        .from('couple_disputes')
        .select('tokens_in_dispute')
        .eq('id', disputeId)
        .single();

      if (currentError) {
        logger.error('Error obteniendo disputa para aceptación', { currentError, disputeId });
        throw currentError;
      }

      const nextTokens: TokensInDisputePayload = {
        ...asObjectRecord(current?.tokens_in_dispute),
        winner_accepted_by: acceptedBy,
        accepted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase!
        .from('couple_disputes')
        .update({
          tokens_in_dispute: nextTokens as unknown as Json,
        } satisfies CoupleDisputeUpdate)
        .eq('id', disputeId)
        .eq('status', 'PENDING_AGREEMENT')
        .select('tokens_in_dispute')
        .single();

      if (error) {
        logger.error('Error aceptando propuesta', { error });
        throw error;
      }

      // Si hay propuesta y aceptación, procesar transferencia
      const tokens = asObjectRecord(data?.tokens_in_dispute);
      const proposedWinnerId = typeof tokens.proposed_winner_id === 'string' ? tokens.proposed_winner_id : null;
      const winnerAcceptedBy = typeof tokens.winner_accepted_by === 'string' ? tokens.winner_accepted_by : null;
      if (proposedWinnerId && winnerAcceptedBy) {
        await this.processAgreement(disputeId);
      }

      logger.info('Propuesta aceptada', { disputeId, acceptedBy });

      return await this.getDisputeStatus(disputeId);

    } catch (error) {
      logger.error('Error en acceptProposal', { error });
      throw error;
    }
  }

  /**
   * Procesar acuerdo y transferir activos
   */
  static async processAgreement(disputeId: string): Promise<void> {
    try {
      // Obtener datos de la disputa
      const { data: dispute, error: disputeError } = await supabase!
        .from('couple_disputes')
        .select('*, couple_profiles(*)')
        .eq('id', disputeId)
        .single();

      if (disputeError || !dispute) {
        throw new Error('Disputa no encontrada');
      }

      const tokens = asObjectRecord(dispute.tokens_in_dispute);
      const winnerId = typeof tokens.proposed_winner_id === 'string' ? tokens.proposed_winner_id : null;
      if (!winnerId) {
        throw new Error('No hay ganador propuesto');
      }

      if (!dispute.couple_profiles) {
        throw new Error('Perfil de pareja no encontrado');
      }

      const partner1Id = dispute.couple_profiles.partner_1_id;
      const partner2Id = dispute.couple_profiles.partner_2_id;
      if (!partner1Id || !partner2Id) {
        throw new Error('Partners de pareja inválidos');
      }

      const loserId = partner1Id === winnerId ? partner2Id : partner1Id;

      // Transferir todos los activos al ganador
      await this.transferAllAssets(winnerId, loserId);

      // Descongelar wallet del ganador
      await supabase!
        .from('user_wallets')
        .update({ is_frozen: false })
        .eq('user_id', winnerId);

      // Marcar pareja como disuelta
      await supabase!
        .from('couple_profiles')
        .update({ status: 'DISSOLVED' })
        .eq('id', String(dispute.couple_id ?? ''));

      const finalTokens: TokensInDisputePayload = {
        ...tokens,
        final_winner_id: winnerId,
        assets_transferred_at: new Date().toISOString(),
      };

      // Actualizar disputa como resuelta
      await supabase!
        .from('couple_disputes')
        .update({
          status: 'RESOLVED_TRANSFERRED',
          resolution_type: 'TRANSFERRED',
          resolved_at: new Date().toISOString(),
          resolved_by: winnerId,
          tokens_in_dispute: finalTokens as unknown as Json,
        } satisfies CoupleDisputeUpdate)
        .eq('id', disputeId);

      logger.info('Acuerdo procesado exitosamente', { disputeId, winnerId, loserId });

    } catch (error) {
      logger.error('Error procesando acuerdo', { error });
      throw error;
    }
  }

  /**
   * Procesar disputas expiradas (cron job)
   */
  static async cronCheckExpirations(): Promise<void> {
    try {
      const { data: expiredDisputes, error } = await supabase!
        .rpc('get_expired_disputes');

      if (error) {
        logger.error('Error obteniendo disputas expiradas', { error });
        return;
      }

      for (const dispute of expiredDisputes || []) {
        await this.executeForfeiture(dispute.dispute_id);
      }

      logger.info('Procesamiento de expiraciones completado', {
        processedCount: expiredDisputes?.length || 0
      });

    } catch (error) {
      logger.error('Error en cronCheckExpirations', { error });
    }
  }

  /**
   * Ejecutar confiscación por expiración
   */
  private static async executeForfeiture(disputeId: string): Promise<void> {
    try {
      // Obtener disputa
      const { data: dispute, error: disputeError } = await supabase!
        .from('couple_disputes')
        .select('*, couple_profiles(*)')
        .eq('id', disputeId)
        .single();

      if (disputeError || !dispute) {
        logger.error('Disputa no encontrada para confiscación', { disputeId });
        return;
      }

      if (!dispute.couple_profiles) {
        logger.error('Perfil de pareja no encontrado para confiscación', { disputeId });
        return;
      }

      const partner1Id = dispute.couple_profiles.partner_1_id;
      const partner2Id = dispute.couple_profiles.partner_2_id;
      if (!partner1Id || !partner2Id) {
        logger.error('Partners de pareja inválidos para confiscación', { disputeId });
        return;
      }

      // Confiscar activos (transferir a cuenta de la plataforma)
      await this.confiscateAssets(partner1Id, partner2Id);

      const nextTokens: TokensInDisputePayload = {
        ...asObjectRecord(dispute.tokens_in_dispute),
        forfeited_to_platform_at: new Date().toISOString(),
        resolution_notes: 'Activos confiscados por expiración de plazo (72h)',
      };

      // Marcar disputa como confiscada
      await supabase!
        .from('couple_disputes')
        .update({
          status: 'EXPIRED_FORFEITED',
          resolution_type: 'FORFEITED',
          resolved_at: new Date().toISOString(),
          resolved_by: 'PLATFORM',
          tokens_in_dispute: nextTokens as unknown as Json,
        } satisfies CoupleDisputeUpdate)
        .eq('id', disputeId);

      // Marcar pareja como disuelta
      await supabase!
        .from('couple_profiles')
        .update({ status: 'DISSOLVED' })
        .eq('id', String(dispute.couple_id ?? ''));

      logger.info('Confiscación ejecutada', { disputeId });

    } catch (error) {
      logger.error('Error ejecutando confiscación', { error, disputeId });
    }
  }

  /**
   * Obtener estado actual de una disputa
   */
  static async getDisputeStatus(disputeId: string): Promise<DisputeStatus> {
    try {
      const { data: dispute, error } = await supabase!
        .from('couple_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (error || !dispute) {
        throw new Error('Disputa no encontrada');
      }

      const tokens = asObjectRecord((dispute as CoupleDisputeRow).tokens_in_dispute);
      const proposedWinnerId = typeof tokens.proposed_winner_id === 'string' ? tokens.proposed_winner_id : undefined;
      const finalWinnerId = typeof tokens.final_winner_id === 'string' ? tokens.final_winner_id : undefined;
      const frozenAssetsSnapshot = tokens.frozen_assets_snapshot;

      // Obtener tiempo restante
      const { data: timeData, error: _timeError } = await supabase!
        .rpc('get_dispute_time_remaining', { p_dispute_id: disputeId });

      const timeRemaining = timeData?.[0] || {
        hours_remaining: 0,
        minutes_remaining: 0,
        seconds_remaining: 0,
        is_expired: true
      };

      return {
        id: dispute.id,
        coupleId: String(dispute.couple_id ?? ''),
        initiatedBy: dispute.initiated_by,
        status: (dispute.status ?? 'PENDING_AGREEMENT') as DisputeStatus['status'],
        deadlineAt: dispute.deadline_at ?? new Date(0).toISOString(),
        timeRemaining: {
          hours: timeRemaining.hours_remaining,
          minutes: timeRemaining.minutes_remaining,
          seconds: timeRemaining.seconds_remaining,
          isExpired: timeRemaining.is_expired
        },
        frozenAssetsSnapshot,
        proposedWinnerId,
        finalWinnerId
      };

    } catch (error) {
      logger.error('Error obteniendo estado de disputa', { error });
      throw error;
    }
  }

  /**
   * Transferir todos los activos de perdedor a ganador
   */
  private static async transferAllAssets(winnerId: string, loserId: string): Promise<void> {
    try {
      // Obtener balances del perdedor (user_token_balances, no user_wallets)
      const { data: loserTokens } = await supabase!
        .from('user_token_balances')
        .select('cmpx_balance, gtk_balance')
        .eq('user_id', loserId)
        .single();

      if (loserTokens) {
        // Transferir tokens CMPX y GTK
        await supabase!
          .from('user_token_balances')
          .update({
            cmpx_balance: 0,
            gtk_balance: 0
          })
          .eq('user_id', loserId);

        // Agregar tokens al ganador
        await supabase!
          .from('user_token_balances')
          .update({
            cmpx_balance: (loserTokens.cmpx_balance || 0),
            gtk_balance: (loserTokens.gtk_balance || 0)
          })
          .eq('user_id', winnerId);
      }

      // Congelar wallet del perdedor
      await supabase!
        .from('user_wallets')
        .update({ is_frozen: true })
        .eq('user_id', loserId);

      // Transferir NFTs (cambiar owner_address, no user_id)
      await supabase!
        .from('user_nfts')
        .update({ owner_address: winnerId })
        .eq('owner_address', loserId);

      logger.info('Activos transferidos', { winnerId, loserId });

    } catch (error) {
      logger.error('Error transfiriendo activos', { error });
      throw error;
    }
  }

  /**
   * Confiscar activos a favor de la plataforma
   */
  private static async confiscateAssets(partner1Id: string, partner2Id: string): Promise<void> {
    try {
      // Resetear token balances de ambos partners
      await supabase!
        .from('user_token_balances')
        .update({
          cmpx_balance: 0,
          gtk_balance: 0
        })
        .in('user_id', [partner1Id, partner2Id]);

      // Congelar wallets de ambos partners
      await supabase!
        .from('user_wallets')
        .update({ is_frozen: true })
        .in('user_id', [partner1Id, partner2Id]);

      // Marcar NFTs como confiscados (actualizar metadata, no is_active)
      await supabase!
        .from('user_nfts')
        .update({ 
          attributes: { 
            confiscated_at: new Date().toISOString(), 
            reason: 'couple_dissolution_timeout',
            is_confiscated: true
          }
        })
        .in('owner_address', [partner1Id, partner2Id]);

      logger.info('Activos confiscados', { partner1Id, partner2Id });

    } catch (error) {
      logger.error('Error confiscando activos', { error });
      throw error;
    }
  }
}

export default CoupleDissolutionService;
