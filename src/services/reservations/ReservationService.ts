// Servicio de gestión de reservas con QR y comisiones
// Fase 3: Lógica de Cobro y Comisiones

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase-generated";

export interface CreateReservationParams {
  clubId: string;
  userId: string;
  amount: number;
  currency?: 'usd' | 'cmpx' | 'gtk';
  paymentMethod?: 'stripe' | 'cmpx' | 'gtk';
  accessType?: 'general' | 'vip';
  reservedAt?: string;
}

export interface Reservation {
  id: string;
  clubId: string;
  userId: string;
  qrHash: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'used' | 'expired' | 'cancelled';
  accessType: string;
  commissionAmount: number;
  commissionPaid: boolean;
  stripePaymentIntentId?: string;
  checkInAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ReservationsRow = Database['public']['Tables']['reservations']['Row'];

function mapReservationRow(row: ReservationsRow): Reservation {
  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    qrHash: row.qr_hash,
    amount: row.amount,
    currency: row.currency ?? 'usd',
    paymentMethod: row.payment_method ?? 'stripe',
    status: (row.status ?? 'pending') as Reservation['status'],
    accessType: row.access_type ?? 'general',
    commissionAmount: row.commission_amount ?? 0,
    commissionPaid: row.commission_paid ?? false,
    ...(row.stripe_payment_intent_id
      ? { stripePaymentIntentId: row.stripe_payment_intent_id }
      : {}),
    ...(row.check_in_at ? { checkInAt: row.check_in_at } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export class ReservationService {
  private static instance: ReservationService;

  private constructor() {}

  static getInstance(): ReservationService {
    if (!ReservationService.instance) {
      ReservationService.instance = new ReservationService();
    }
    return ReservationService.instance;
  }

  /**
   * Generar hash único para QR
   */
  private generateQRHash(): string {
    return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calcular comisión según tier del club
   */
  private calculateCommission(amount: number, tier: 'free' | 'premium'): number {
    return tier === 'free' ? amount * 0.20 : 0;
  }

  /**
   * Crear una reserva nueva (usando Edge Function segura)
   */
  async createReservation(params: CreateReservationParams): Promise<Reservation> {
    try {
      const { data, error } = await supabase.functions.invoke('create-reservation', {
        body: {
          clubId: params.clubId,
          userId: params.userId,
          amount: params.amount,
          currency: params.currency || 'usd',
          paymentMethod: params.paymentMethod || 'stripe',
          accessType: params.accessType || 'general',
          reservedAt: params.reservedAt || null,
        },
      });

      if (error) {
        logger.error('Error creando reserva via Edge Function:', {
          error: error.message,
          params,
        });
        throw new Error(error.message || 'Error creating reservation');
      }

      const reservation = data as any;

      logger.info('Reserva creada exitosamente:', {
        reservationId: reservation.id,
        clubId: params.clubId,
        userId: params.userId,
        amount: params.amount,
        commissionAmount: reservation.commission_amount,
      });

      return {
        id: reservation.id,
        clubId: reservation.club_id,
        userId: reservation.user_id,
        qrHash: reservation.qr_hash,
        amount: reservation.amount,
        currency: reservation.currency ?? 'usd',
        paymentMethod: reservation.payment_method ?? 'stripe',
        status: (reservation.status ?? 'pending') as Reservation['status'],
        accessType: reservation.access_type ?? 'general',
        commissionAmount: reservation.commission_amount ?? 0,
        commissionPaid: reservation.commission_paid ?? false,
        ...(reservation.stripe_payment_intent_id ? { stripePaymentIntentId: reservation.stripe_payment_intent_id } : {}),
        ...(reservation.check_in_at ? { checkInAt: reservation.check_in_at } : {}),
        ...(reservation.expires_at ? { expiresAt: reservation.expires_at } : {}),
        ...(reservation.reserved_at ? { reservedAt: reservation.reserved_at } : {}),
        createdAt: reservation.created_at ?? new Date().toISOString(),
        updatedAt: reservation.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error creando reserva:', {
        error: error instanceof Error ? error.message : String(error),
        params,
      });
      throw error;
    }
  }

  /**
   * Obtener reserva por QR hash
   */
  async getReservationByQR(qrHash: string): Promise<Reservation | null> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('qr_hash', qrHash)
        .single();

      if (error) throw error;

      if (!data) return null;
      const row = data as ReservationsRow;
      return {
        id: row.id,
        clubId: row.club_id,
        userId: row.user_id,
        qrHash: row.qr_hash,
        amount: row.amount,
        currency: row.currency ?? 'usd',
        paymentMethod: row.payment_method ?? 'stripe',
        status: (row.status ?? 'pending') as Reservation['status'],
        accessType: row.access_type ?? 'general',
        commissionAmount: row.commission_amount ?? 0,
        commissionPaid: row.commission_paid ?? false,
        ...(row.stripe_payment_intent_id ? { stripePaymentIntentId: row.stripe_payment_intent_id } : {}),
        ...(row.check_in_at ? { checkInAt: row.check_in_at } : {}),
        ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error obteniendo reserva por QR:', {
        error: error instanceof Error ? error.message : String(error),
        qrHash,
      });
      throw error;
    }
  }

  /**
   * Actualizar estado de reserva
   */
  async updateReservationStatus(
    reservationId: string,
    status: 'pending' | 'paid' | 'used' | 'expired' | 'cancelled'
  ): Promise<Reservation> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Estado de reserva actualizado:', {
        reservationId,
        status,
      });

      const row = data as ReservationsRow;
      return {
        id: row.id,
        clubId: row.club_id,
        userId: row.user_id,
        qrHash: row.qr_hash,
        amount: row.amount,
        currency: row.currency ?? 'usd',
        paymentMethod: row.payment_method ?? 'stripe',
        status: (row.status ?? 'pending') as Reservation['status'],
        accessType: row.access_type ?? 'general',
        commissionAmount: row.commission_amount ?? 0,
        commissionPaid: row.commission_paid ?? false,
        ...(row.stripe_payment_intent_id ? { stripePaymentIntentId: row.stripe_payment_intent_id } : {}),
        ...(row.check_in_at ? { checkInAt: row.check_in_at } : {}),
        ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error actualizando estado de reserva:', {
        error: error instanceof Error ? error.message : String(error),
        reservationId,
        status,
      });
      throw error;
    }
  }

  /**
   * Marcar reserva como usada (check-in)
   */
  async markReservationAsUsed(reservationId: string): Promise<Reservation> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'used',
          check_in_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Reserva marcada como usada:', { reservationId });

      const row = data as ReservationsRow;
      return {
        id: row.id,
        clubId: row.club_id,
        userId: row.user_id,
        qrHash: row.qr_hash,
        amount: row.amount,
        currency: row.currency ?? 'usd',
        paymentMethod: row.payment_method ?? 'stripe',
        status: (row.status ?? 'pending') as Reservation['status'],
        accessType: row.access_type ?? 'general',
        commissionAmount: row.commission_amount ?? 0,
        commissionPaid: row.commission_paid ?? false,
        ...(row.stripe_payment_intent_id ? { stripePaymentIntentId: row.stripe_payment_intent_id } : {}),
        ...(row.check_in_at ? { checkInAt: row.check_in_at } : {}),
        ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error marcando reserva como usada:', {
        error: error instanceof Error ? error.message : String(error),
        reservationId,
      });
      throw error;
    }
  }

  /**
   * Obtener reservas de un club
   */
  async getClubReservations(
    clubId: string,
    limit: number = 50
  ): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((r) => mapReservationRow(r as ReservationsRow));
    } catch (error) {
      logger.error('Error obteniendo reservas del club:', {
        error: error instanceof Error ? error.message : String(error),
        clubId,
      });
      throw error;
    }
  }

  /**
   * Obtener reservas de un usuario
   */
  async getUserReservations(
    userId: string,
    limit: number = 50
  ): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((r) => mapReservationRow(r as ReservationsRow));
    } catch (error) {
      logger.error('Error obteniendo reservas del usuario:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Validar si un QR es válido para check-in
   */
  async validateQRForCheckIn(qrHash: string): Promise<{
    valid: boolean;
    message: string;
    reservation?: Reservation;
  }> {
    try {
      const reservation = await this.getReservationByQR(qrHash);

      if (!reservation) {
        return {
          valid: false,
          message: 'QR no encontrado',
        };
      }

      if (reservation.status === 'used') {
        return {
          valid: false,
          message: 'Código ya utilizado',
          reservation,
        };
      }

      if (reservation.status === 'expired') {
        return {
          valid: false,
          message: 'Código expirado',
          reservation,
        };
      }

      if (reservation.status !== 'paid') {
        return {
          valid: false,
          message: 'Reserva no completada',
          reservation,
        };
      }

      // Verificar si ha expirado
      if (reservation.expiresAt && new Date(reservation.expiresAt) < new Date()) {
        await this.updateReservationStatus(reservation.id, 'expired');
        return {
          valid: false,
          message: 'Código expirado',
          reservation,
        };
      }

      return {
        valid: true,
        message: 'Código válido',
        reservation,
      };
    } catch (error) {
      logger.error('Error validando QR:', {
        error: error instanceof Error ? error.message : String(error),
        qrHash,
      });
      return {
        valid: false,
        message: 'Error al validar QR',
      };
    }
  }
}

export const reservationService = ReservationService.getInstance();
