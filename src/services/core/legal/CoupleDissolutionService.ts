/**
 * CoupleDissolutionService.ts - Protocolo de Disolución "Cuenta Regresiva"
 * 
 * Propósito: Gestionar disolución de parejas con congelamiento y timer de 72h
 * Autor: Lead Architect & Legal Engineer
 * Versión: v3.7.2 - Dissolution Protocol Implementation
 * Fecha: 21 Noviembre 2025
 */

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const sb = supabase as any;

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
      const { data: snapshotData, error: snapshotError } = await sb
        .rpc('create_assets_snapshot', { p_couple_id: coupleId });

      if (snapshotError) {
        logger.error('Error creando snapshot de activos', { snapshotError });
        throw snapshotError;
      }

      // Crear disputa con timer de 72h
      const { data: dispute, error: disputeError } = await sb
        .from('couple_disputes')
        .insert({
          couple_id: coupleId,
          initiated_by: initiatedBy,
          frozen_assets_snapshot: snapshotData,
          deadline_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        })
        .select()
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

  static async proposeWinner(disputeId: string, winnerId: string, proposedBy?: string): Promise<DisputeStatus> {
    const { error } = await sb
      .from('couple_disputes')
      .update({ proposed_winner_id: winnerId })
      .eq('id', disputeId);
    
    if (error) throw error;
    
    if (proposedBy) {
        logger.info('Winner proposed', { disputeId, winnerId, proposedBy });
    }

    return await this.getDisputeStatus(disputeId);
  }

  static async acceptProposal(disputeId: string, acceptedBy?: string): Promise<DisputeStatus> {
    const { error } = await sb
      .from('couple_disputes')
      .update({ status: 'RESOLVED_TRANSFERRED', final_winner_id: sb.raw('proposed_winner_id') })
      .eq('id', disputeId);
      
    if (error) throw error;

    if (acceptedBy) {
        logger.info('Proposal accepted', { disputeId, acceptedBy });
    }

    return await this.getDisputeStatus(disputeId);
  }

  /**
   * Obtener estado de la disputa y tiempo restante
   */
  static async getDisputeStatus(disputeId: string): Promise<DisputeStatus> {
    try {
      const { data, error } = await sb
        .from('couple_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (error) throw error;

      const now = new Date().getTime();
      const deadline = new Date(data.deadline_at).getTime();
      const diff = deadline - now;

      const isExpired = diff <= 0;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        id: data.id,
        coupleId: data.couple_id,
        initiatedBy: data.initiated_by,
        status: data.status,
        deadlineAt: data.deadline_at,
        timeRemaining: {
          hours: isExpired ? 0 : hours,
          minutes: isExpired ? 0 : minutes,
          seconds: isExpired ? 0 : seconds,
          isExpired
        },
        frozenAssetsSnapshot: data.frozen_assets_snapshot,
        proposedWinnerId: data.proposed_winner_id,
        finalWinnerId: data.final_winner_id
      };

    } catch (error) {
      logger.error('Error getting dispute status', { error });
      throw error;
    }
  }

  /**
   * Resolver disputa (transferir todo a uno de los dos)
   */
  static async resolveDispute(disputeId: string, winnerId: string): Promise<boolean> {
    try {
      // Verificar si hay acuerdo mutuo o si expiró el tiempo
      // Esta lógica estaría en un RPC más complejo o backend function
      
      const { error } = await sb
        .rpc('resolve_couple_dispute', { 
          p_dispute_id: disputeId,
          p_winner_id: winnerId
        });

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error resolving dispute', { error });
      return false;
    }
  }
}

export default CoupleDissolutionService;
