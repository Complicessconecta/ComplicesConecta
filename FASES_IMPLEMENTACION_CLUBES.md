# Fases de Implementación - Ecosistema de Clubes y Economía Digital

**Versión del Proyecto:** CómplicesConecta v3.6.6
**Fecha:** 24 de Enero, 2026
**Estado:** Planificación de Implementación

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Fase 1: Fundamentos de Base de Datos](#fase-1-fundamentos-de-base-de-datos)
3. [Fase 2: Módulo de Billetera y Tokens CMPX](#fase-2-módulo-de-billetera-y-tokens-cmpx)
4. [Fase 3: Lógica de Cobro y Comisiones](#fase-3-lógica-de-cobro-y-comisiones)
5. [Fase 4: Componente de Billetera UI](#fase-4-componente-de-billetera-ui)
6. [Fase 5: Sistema de Reservas con QR](#fase-5-sistema-de-reservas-con-qr)
7. [Fase 6: Ranking Bayesiano de Clubes](#fase-6-ranking-bayesiano-de-clubes)
8. [Fase 7: Geolocalización con Privacidad](#fase-7-geolocalización-con-privacidad)
9. [Fase 8: Actualización de ClubProfileAdmin](#fase-8-actualización-de-clubprofileadmin)
10. [Fase 9: Webhooks y Automatización](#fase-9-webhooks-y-automatización)
11. [Fase 10: Testing y Despliegue](#fase-10-testing-y-despliegue)
12. [Fase 11: Club Demo Experience & Sandbox](#fase-11-club-demo-experience--sandbox)

---

## 🎯 Visión General

### Objetivo Principal

Implementar un ecosistema completo de clubes con:
- **Economía dual de tokens** (CMPX para consumo, GTK para blockchain)
- **Monetización híbrida** (Stripe + tokens)
- **Sistema de reservas seguro** con QR
- **Ranking dinámico** basado en calificaciones
- **Geolocalización protegida** con offset de privacidad
- **Dashboard administrativo** para clubes

### Arquitectura de Fases

```
Fase 1-2: Fundamentos (Base de datos + Billetera)
    ↓
Fase 3-4: Pagos y UI (Stripe + Componente billetera)
    ↓
Fase 5-6: Reservas y Ranking (QR + Algoritmo bayesiano)
    ↓
Fase 7-8: Geolocalización y Admin (Offset + Dashboard)
    ↓
Fase 9-10: Webhooks y Testing (Automatización + QA)
```

---

## 🗄️ Fase 1: Fundamentos de Base de Datos

### Objetivos

- Crear tablas necesarias para el ecosistema
- Implementar RLS (Row Level Security)
- Configurar índices y restricciones

### Tablas a Crear

#### 1.1. Tabla de Billeteras

```sql
-- Crear tabla de balances de billetera
CREATE TABLE wallet_balances (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  cmpx_balance DECIMAL(18, 2) DEFAULT 0,
  gtk_balance DECIMAL(18, 2) DEFAULT 0,
  cmpx_locked DECIMAL(18, 2) DEFAULT 0, -- Tokens bloqueados en transacciones
  gtk_locked DECIMAL(18, 2) DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX idx_wallet_balances_cmpx ON wallet_balances(cmpx_balance);
CREATE INDEX idx_wallet_balances_gtk ON wallet_balances(gtk_balance);

-- RLS: Solo el usuario puede ver su propio balance
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallet_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can update wallet"
  ON wallet_balances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

#### 1.2. Tabla de Reservas

```sql
-- Crear tabla de reservas
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_hash TEXT UNIQUE NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT DEFAULT 'usd', -- 'usd', 'cmpx', 'gtk'
  payment_method TEXT DEFAULT 'stripe', -- 'stripe', 'cmpx', 'gtk'
  status TEXT DEFAULT 'pending', -- pending, paid, used, expired, cancelled
  access_type TEXT DEFAULT 'general', -- 'general', 'vip'
  commission_amount DECIMAL(18, 2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_reservations_club_id ON reservations(club_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_qr_hash ON reservations(qr_hash);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clubs can view their reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE id = club_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  WITH CHECK (true);
```

#### 1.3. Actualización de Tabla Clubs

```sql
-- Agregar campos para monetización y ranking
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS bayesian_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_cmpx DECIMAL(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_usd DECIMAL(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS vibe_status TEXT DEFAULT 'unknown' CHECK (vibe_status IN ('unknown', 'hot', 'chill', 'packed', 'quiet')),
  ADD COLUMN IF NOT EXISTS vibe_status_updated_at TIMESTAMP WITH TIME ZONE;

-- Índices para ranking
CREATE INDEX idx_clubs_bayesian_score ON clubs(bayesian_score DESC);
CREATE INDEX idx_clubs_tier ON clubs(membership_tier);
CREATE INDEX idx_clubs_rating ON clubs(average_rating DESC);

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 1.4. Tabla de Transacciones de Tokens

```sql
-- Crear tabla de historial de transacciones
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'transfer', 'stake', 'unstake', 'reward'
  amount DECIMAL(18, 2) NOT NULL,
  token_type TEXT NOT NULL, -- 'cmpx', 'gtk'
  balance_after DECIMAL(18, 2) NOT NULL,
  description TEXT,
  metadata JSONB,
  related_entity_type TEXT, -- 'reservation', 'club', 'referral', etc.
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_token_type ON token_transactions(token_type);

-- RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

#### 1.5. Tabla de Calificaciones de Clubes

```sql
-- Crear tabla de calificaciones
CREATE TABLE club_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Índices
CREATE INDEX idx_club_ratings_club_id ON club_ratings(club_id);
CREATE INDEX idx_club_ratings_user_id ON club_ratings(user_id);
CREATE INDEX idx_club_ratings_rating ON club_ratings(rating);

-- RLS
ALTER TABLE club_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
  ON club_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON club_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON club_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar estadísticas del club
CREATE OR REPLACE FUNCTION update_club_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating FLOAT;
  total_reviews INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = NEW.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = OLD.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = OLD.club_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON club_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_club_rating_stats();
```

### Checklist Fase 1

- [ ] Crear tabla `wallet_balances` con RLS
- [ ] Crear tabla `reservations` con RLS
- [ ] Actualizar tabla `clubs` con nuevos campos
- [ ] Crear tabla `token_transactions` con RLS
- [ ] Crear tabla `club_ratings` con RLS y triggers
- [ ] Crear todos los índices necesarios
- [ ] Verificar RLS funciona correctamente
- [ ] Documentar estructura de base de datos

---

## 💰 Fase 2: Módulo de Billetera y Tokens CMPX

### Objetivos

- Implementar servicio de billetera
- Crear lógica de transacciones de tokens
- Integrar con TokenService existente

### Archivos a Crear

#### 2.1. Servicio de Billetera

**Archivo:** `src/services/wallet/WalletService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface WalletBalance {
  userId: string;
  cmpxBalance: number;
  gtkBalance: number;
  cmpxLocked: number;
  gtkLocked: number;
  lastSync: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  transactionType: 'earn' | 'spend' | 'transfer' | 'stake' | 'unstake' | 'reward';
  amount: number;
  tokenType: 'cmpx' | 'gtk';
  balanceAfter: number;
  description?: string;
  metadata?: Record<string, any>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export class WalletService {
  private static instance: WalletService;

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Obtener balance de billetera del usuario
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        userId: data.user_id,
        cmpxBalance: parseFloat(data.cmpx_balance),
        gtkBalance: parseFloat(data.gtk_balance),
        cmpxLocked: parseFloat(data.cmpx_locked || 0),
        gtkLocked: parseFloat(data.gtk_locked || 0),
        lastSync: data.last_sync,
      };
    } catch (error) {
      logger.error('Error obteniendo balance de billetera:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Crear billetera para usuario nuevo
   */
  async createWallet(userId: string): Promise<WalletBalance> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .insert({
          user_id: userId,
          cmpx_balance: 0,
          gtk_balance: 0,
          cmpx_locked: 0,
          gtk_locked: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        userId: data.user_id,
        cmpxBalance: parseFloat(data.cmpx_balance),
        gtkBalance: parseFloat(data.gtk_balance),
        cmpxLocked: parseFloat(data.cmpx_locked || 0),
        gtkLocked: parseFloat(data.gtk_locked || 0),
        lastSync: data.last_sync,
      };
    } catch (error) {
      logger.error('Error creando billetera:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Añadir tokens a billetera
   */
  async addTokens(
    userId: string,
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    transactionType: 'earn' | 'reward' | 'transfer',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<WalletBalance> {
    try {
      // Obtener balance actual
      const currentBalance = await this.getWalletBalance(userId);
      if (!currentBalance) {
        await this.createWallet(userId);
        return this.addTokens(userId, amount, tokenType, transactionType, description, metadata);
      }

      const balanceField = tokenType === 'cmpx' ? 'cmpx_balance' : 'gtk_balance';
      const currentAmount = tokenType === 'cmpx' ? currentBalance.cmpxBalance : currentBalance.gtkBalance;
      const newAmount = currentAmount + amount;

      // Actualizar balance
      const { data, error } = await supabase
        .from('wallet_balances')
        .update({
          [balanceField]: newAmount,
          last_sync: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Registrar transacción
      await this.recordTransaction(
        userId,
        transactionType,
        amount,
        tokenType,
        newAmount,
        description,
        metadata
      );

      return {
        userId: data.user_id,
        cmpxBalance: parseFloat(data.cmpx_balance),
        gtkBalance: parseFloat(data.gtk_balance),
        cmpxLocked: parseFloat(data.cmpx_locked || 0),
        gtkLocked: parseFloat(data.gtk_locked || 0),
        lastSync: data.last_sync,
      };
    } catch (error) {
      logger.error('Error añadiendo tokens:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        tokenType,
      });
      throw error;
    }
  }

  /**
   * Deducir tokens de billetera
   */
  async deductTokens(
    userId: string,
    amount: number,
    tokenType: 'cmpx' | 'gtk',
    transactionType: 'spend' | 'transfer' | 'stake',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<WalletBalance> {
    try {
      // Obtener balance actual
      const currentBalance = await this.getWalletBalance(userId);
      if (!currentBalance) {
        throw new Error('Wallet not found');
      }

      const balanceField = tokenType === 'cmpx' ? 'cmpxBalance' : 'gtkBalance';
      const currentAmount = tokenType === 'cmpx' ? currentBalance.cmpxBalance : currentBalance.gtkBalance;

      if (currentAmount < amount) {
        throw new Error(`Insufficient ${tokenType.toUpperCase()} balance`);
      }

      const newAmount = currentAmount - amount;

      // Actualizar balance
      const { data, error } = await supabase
        .from('wallet_balances')
        .update({
          [balanceField]: newAmount,
          last_sync: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Registrar transacción
      await this.recordTransaction(
        userId,
        transactionType,
        -amount,
        tokenType,
        newAmount,
        description,
        metadata
      );

      return {
        userId: data.user_id,
        cmpxBalance: parseFloat(data.cmpx_balance),
        gtkBalance: parseFloat(data.gtk_balance),
        cmpxLocked: parseFloat(data.cmpx_locked || 0),
        gtkLocked: parseFloat(data.gtk_locked || 0),
        lastSync: data.last_sync,
      };
    } catch (error) {
      logger.error('Error deduciendo tokens:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        tokenType,
      });
      throw error;
    }
  }

  /**
   * Registrar transacción en historial
   */
  private async recordTransaction(
    userId: string,
    transactionType: string,
    amount: number,
    tokenType: string,
    balanceAfter: number,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('token_transactions').insert({
        user_id: userId,
        transaction_type: transactionType,
        amount: amount,
        token_type: tokenType,
        balance_after: balanceAfter,
        description,
        metadata,
      });
    } catch (error) {
      logger.error('Error registrando transacción:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        transactionType,
      });
      // No lanzar error, es secundario
    }
  }

  /**
   * Obtener historial de transacciones
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TokenTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map((tx) => ({
        id: tx.id,
        userId: tx.user_id,
        transactionType: tx.transaction_type as any,
        amount: parseFloat(tx.amount),
        tokenType: tx.token_type as any,
        balanceAfter: parseFloat(tx.balance_after),
        description: tx.description,
        metadata: tx.metadata as Record<string, any>,
        relatedEntityType: tx.related_entity_type,
        relatedEntityId: tx.related_entity_id,
        createdAt: tx.created_at,
      }));
    } catch (error) {
      logger.error('Error obteniendo historial de transacciones:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}

export const walletService = WalletService.getInstance();
```

#### 2.2. Hook de Billetera

**Archivo:** `src/hooks/useWallet.ts`

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { walletService, WalletBalance } from '@/services/wallet/WalletService';

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const loadBalance = async () => {
      try {
        setLoading(true);
        const walletBalance = await walletService.getWalletBalance(user.id);
        setBalance(walletBalance);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [user]);

  const refreshBalance = async () => {
    if (!user) return;
    const walletBalance = await walletService.getWalletBalance(user.id);
    setBalance(walletBalance);
  };

  return {
    balance,
    loading,
    error,
    refreshBalance,
  };
}
```

### Checklist Fase 2

- [ ] Crear `WalletService.ts` con todos los métodos
- [ ] Crear `useWallet.ts` hook
- [ ] Integrar con `TokenService` existente
- [ ] Probar creación de billetera
- [ ] Probar adición de tokens
- [ ] Probar deducción de tokens
- [ ] Probar historial de transacciones
- [ ] Documentar API del servicio

---

## 💳 Fase 3: Lógica de Cobro y Comisiones

### Objetivos

- Implementar Edge Function de Stripe
- Lógica de comisiones (20% Free, 0% Premium)
- Soporte para pagos con tokens CMPX

### Archivos a Crear

#### 3.1. Edge Function de Stripe

**Archivo:** `supabase/functions/create-reservation-intent/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  try {
    const { clubId, userId, amount, clubTier, currency = 'usd' } = await req.json()

    // Validaciones
    if (!clubId || !userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // LÓGICA DE NEGOCIO: 20% si es Free, 0% si es Premium
    const commissionPercentage = clubTier === 'premium' ? 0 : 0.20;
    const applicationFee = Math.round(amount * commissionPercentage);

    // Obtener cuenta Stripe del club
    const { data: club } = await supabase
      .from('clubs')
      .select('stripe_account_id')
      .eq('id', clubId)
      .single();

    if (!club?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'Club does not have Stripe account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ['card'],
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: club.stripe_account_id,
      },
      metadata: {
        club_id: clubId,
        user_id: userId,
        tier: clubTier,
        type: 'reservation',
        commission_percentage: commissionPercentage,
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        applicationFee,
        commissionPercentage,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 3.2. Servicio de Reservas

**Archivo:** `src/services/reservations/ReservationService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { walletService } from "@/services/wallet/WalletService";
import crypto from 'crypto';

export interface CreateReservationParams {
  clubId: string;
  userId: string;
  amount: number;
  currency: 'usd' | 'cmpx' | 'gtk';
  paymentMethod: 'stripe' | 'cmpx' | 'gtk';
  accessType: 'general' | 'vip';
  stripePaymentIntentId?: string;
}

export interface Reservation {
  id: string;
  clubId: string;
  userId: string;
  qrHash: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  accessType: string;
  commissionAmount: number;
  commissionPaid: boolean;
  stripePaymentIntentId?: string;
  createdAt: string;
  expiresAt: string;
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
   * Crear reserva con QR
   */
  async createReservation(params: CreateReservationParams): Promise<Reservation> {
    try {
      // Obtener información del club
      const { data: club } = await supabase
        .from('clubs')
        .select('membership_tier, name')
        .eq('id', params.clubId)
        .single();

      if (!club) {
        throw new Error('Club not found');
      }

      // Calcular comisión
      const commissionPercentage = club.membership_tier === 'premium' ? 0 : 0.20;
      const commissionAmount = params.amount * commissionPercentage;

      // Generar QR hash único
      const qrHash = this.generateQRHash(params.clubId, params.userId, Date.now());

      // Si pago con tokens, deducir de billetera
      if (params.paymentMethod === 'cmpx' || params.paymentMethod === 'gtk') {
        await walletService.deductTokens(
          params.userId,
          params.amount,
          params.paymentMethod,
          'spend',
          `Reserva en ${club.name}`,
          { clubId: params.clubId, reservationType: 'reservation' }
        );
      }

      // Crear reserva
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          club_id: params.clubId,
          user_id: params.userId,
          qr_hash: qrHash,
          amount: params.amount,
          currency: params.currency,
          payment_method: params.paymentMethod,
          status: 'paid',
          access_type: params.accessType,
          commission_amount: commissionAmount,
          stripe_payment_intent_id: params.stripePaymentIntentId,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Reserva creada exitosamente:', {
        reservationId: data.id,
        clubId: params.clubId,
        userId: params.userId,
        amount: params.amount,
        currency: params.currency,
        commissionAmount,
      });

      return {
        id: data.id,
        clubId: data.club_id,
        userId: data.user_id,
        qrHash: data.qr_hash,
        amount: parseFloat(data.amount),
        currency: data.currency,
        paymentMethod: data.payment_method,
        status: data.status,
        accessType: data.access_type,
        commissionAmount: parseFloat(data.commission_amount),
        commissionPaid: data.commission_paid,
        stripePaymentIntentId: data.stripe_payment_intent_id,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
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
   * Generar hash único para QR
   */
  private generateQRHash(clubId: string, userId: string, timestamp: number): string {
    const data = `${clubId}-${userId}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validar QR y marcar como usado
   */
  async validateQR(qrHash: string): Promise<Reservation | null> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('qr_hash', qrHash)
        .eq('status', 'paid')
        .single();

      if (error || !data) {
        return null;
      }

      // Verificar que no esté expirado
      if (new Date(data.expires_at) < new Date()) {
        await this.updateReservationStatus(data.id, 'expired');
        return null;
      }

      // Marcar como usado
      await this.updateReservationStatus(data.id, 'used');

      return {
        id: data.id,
        clubId: data.club_id,
        userId: data.user_id,
        qrHash: data.qr_hash,
        amount: parseFloat(data.amount),
        currency: data.currency,
        paymentMethod: data.payment_method,
        status: 'used',
        accessType: data.access_type,
        commissionAmount: parseFloat(data.commission_amount),
        commissionPaid: data.commission_paid,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      logger.error('Error validando QR:', {
        error: error instanceof Error ? error.message : String(error),
        qrHash,
      });
      throw error;
    }
  }

  /**
   * Actualizar estado de reserva
   */
  private async updateReservationStatus(
    reservationId: string,
    status: 'pending' | 'paid' | 'used' | 'expired' | 'cancelled'
  ): Promise<void> {
    try {
      await supabase
        .from('reservations')
        .update({
          status,
          used_at: status === 'used' ? new Date().toISOString() : null,
        })
        .eq('id', reservationId);
    } catch (error) {
      logger.error('Error actualizando estado de reserva:', {
        error: error instanceof Error ? error.message : String(error),
        reservationId,
        status,
      });
      throw error;
    }
  }
}

export const reservationService = ReservationService.getInstance();
```

### Checklist Fase 3

- [ ] Crear Edge Function `create-reservation-intent`
- [ ] Crear `ReservationService.ts`
- [ ] Implementar lógica de comisiones (20% Free, 0% Premium)
- [ ] Implementar deducción de tokens CMPX/GTK
- [ ] Implementar generación de QR hash
- [ ] Implementar validación de QR
- [ ] Probar flujo completo de reserva
- [ ] Documentar API de reservas

---

## 🎨 Fase 4: Componente de Billetera UI

### Objetivos

- Crear componente visual de billetera
- Mostrar saldos CMPX y GTK
- Mostrar historial de transacciones

### Archivos a Crear

#### 4.1. Componente de Billetera

**Archivo:** `src/components/wallet/WalletCard.tsx`

```typescript
import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';
import { Coins, Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';

export function WalletCard() {
  const { balance, loading, error, refreshBalance } = useWallet();

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 backdrop-blur-xl border-red-500/30">
        <CardContent className="p-6">
          <p className="text-red-300">Error cargando billetera: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <p className="text-white/80">No tienes billetera activa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Mi Billetera
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshBalance}
          className="text-white hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CMPX Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-purple-400" />
              <span className="text-white/90 font-medium">CMPX</span>
            </div>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
              Consumo
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {balance.cmpxBalance.toLocaleString()} CMPX
          </div>
          <div className="text-sm text-white/60">
            ≈ ${(balance.cmpxBalance * 1).toFixed(2)} USD
          </div>
        </div>

        {/* GTK Balance */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-400" />
              <span className="text-white/90 font-medium">GTK</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              Blockchain
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {balance.gtkBalance.toLocaleString()} GTK
          </div>
          <div className="text-sm text-white/60">
            ≈ ${(balance.gtkBalance * 1).toFixed(2)} USD
          </div>
        </div>

        {/* Locked Tokens */}
        {(balance.cmpxLocked > 0 || balance.gtkLocked > 0) && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-2">Tokens Bloqueados:</p>
            <div className="flex gap-4">
              {balance.cmpxLocked > 0 && (
                <div className="text-sm">
                  <span className="text-purple-300">{balance.cmpxLocked} CMPX</span>
                </div>
              )}
              {balance.gtkLocked > 0 && (
                <div className="text-sm">
                  <span className="text-blue-300">{balance.gtkLocked} GTK</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4.2. Historial de Transacciones

**Archivo:** `src/components/wallet/TransactionHistory.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { walletService, TokenTransaction } from '@/services/wallet/WalletService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Clock, Loader2 } from 'lucide-react';

export function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadTransactions = async () => {
      try {
        const history = await walletService.getTransactionHistory(user.id, 20);
        setTransactions(history);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <p className="text-white/80 text-center">No tienes transacciones aún</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Historial de Transacciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {tx.amount > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">{tx.description || tx.transactionType}</p>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="h-3 w-3" />
                  {new Date(tx.createdAt).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                tx.amount > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.tokenType.toUpperCase()}
              </p>
              <Badge variant="outline" className="text-xs">
                {tx.transactionType}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Checklist Fase 4

- [ ] Crear `WalletCard.tsx`
- [ ] Crear `TransactionHistory.tsx`
- [ ] Probar carga de balance
- [ ] Probar historial de transacciones
- [ ] Probar refresco de balance
- [ ] Verificar diseño responsive
- [ ] Documentar componentes

---

## 🎫 Fase 5: Sistema de Reservas con QR

### Objetivos

- Crear componente de generación de QR
- Implementar escaneo de QR
- Validar y marcar reservas como usadas

### Archivos a Crear

#### 5.1. Generador de QR

**Archivo:** `src/components/reservations/QRCodeGenerator.tsx`

```typescript
import React from 'react';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
  qrHash: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ qrHash, size = 200, className }: QRCodeGeneratorProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-xl">
        <QRCode
          value={qrHash}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  );
}
```

#### 5.2. Escáner de QR

**Archivo:** `src/components/reservations/QRScanner.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { reservationService } from '@/services/reservations/ReservationService';
import { logger } from '@/lib/logger';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    reservation?: any;
  } | null>(null);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    try {
      setScanning(false);

      logger.info('QR escaneado:', { qrHash: decodedText });

      const reservation = await reservationService.validateQR(decodedText);

      if (reservation) {
        setResult({
          success: true,
          message: 'Reserva validada exitosamente',
          reservation,
        });
      } else {
        setResult({
          success: false,
          message: 'QR inválido, expirado o ya usado',
        });
      }
    } catch (error) {
      logger.error('Error validando QR:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setResult({
        success: false,
        message: 'Error al validar QR',
      });
    }
  }, []);

  const startScanning = () => {
    setScanning(true);
    setResult(null);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardContent className="p-6">
        <h3 className="text-white text-xl font-bold mb-4">Escáner de Reservas</h3>

        {!scanning && !result && (
          <Button onClick={startScanning} className="w-full">
            Iniciar Escaneo
          </Button>
        )}

        {scanning && (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full" />
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <p className={`font-bold ${
                result.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {result.message}
              </p>
            </div>

            {result.reservation && (
              <div className="mt-4 space-y-2 text-sm text-white/80">
                <p><strong>ID:</strong> {result.reservation.id}</p>
                <p><strong>Club:</strong> {result.reservation.clubId}</p>
                <p><strong>Usuario:</strong> {result.reservation.userId}</p>
                <p><strong>Monto:</strong> {result.reservation.amount} {result.reservation.currency}</p>
                <p><strong>Tipo:</strong> {result.reservation.accessType}</p>
              </div>
            )}

            <Button
              onClick={startScanning}
              className="mt-4 w-full"
              variant="outline"
            >
              Escanear Otro QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Checklist Fase 5

- [ ] Instalar dependencias `qrcode.react` y `html5-qrcode`
- [ ] Crear `QRCodeGenerator.tsx`
- [ ] Crear `QRScanner.tsx`
- [ ] Probar generación de QR
- [ ] Probar escaneo de QR
- [ ] Probar validación de QR
- [ ] Probar expiración de QR
- [ ] Documentar flujo de reservas

---

## 📊 Fase 6: Ranking Bayesiano de Clubes

### Objetivos

- Implementar algoritmo bayesiano
- Crear Cron Job para recálculo diario
- Actualizar rankings en tiempo real

### Archivos a Crear

#### 6.1. Servicio de Ranking

**Archivo:** `src/services/ranking/ClubRankingService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ClubRanking {
  clubId: string;
  bayesianScore: number;
  totalReviews: number;
  averageRating: number;
  rank: number;
}

export class ClubRankingService {
  private static instance: ClubRankingService;

  private constructor() {}

  static getInstance(): ClubRankingService {
    if (!ClubRankingService.instance) {
      ClubRankingService.instance = new ClubRankingService();
    }
    return ClubRankingService.instance;
  }

  /**
   * Calcular ranking bayesiano para un club
   * Fórmula: (v * R + m * C) / (v + m)
   * donde:
   * v = número de votos (reseñas)
   * R = promedio del club
   * m = peso mínimo (ej: 10 reseñas)
   * C = promedio global (ej: 3.5)
   */
  async calculateBayesianScore(clubId: string): Promise<number> {
    try {
      // Obtener estadísticas del club
      const { data: club } = await supabase
        .from('clubs')
        .select('total_reviews, average_rating')
        .eq('id', clubId)
        .single();

      if (!club) {
        throw new Error('Club not found');
      }

      // Obtener promedio global
      const { data: globalStats } = await supabase
        .from('clubs')
        .select('average_rating')
        .gt('total_reviews', 0);

      const globalAverage = globalStats && globalStats.length > 0
        ? globalStats.reduce((sum, c) => sum + (c.average_rating || 0), 0) / globalStats.length
        : 3.5;

      // Parámetros
      const v = club.total_reviews || 0;
      const R = club.average_rating || 0;
      const m = 10; // Peso mínimo
      const C = globalAverage;

      // Calcular score bayesiano
      const bayesianScore = (v * R + m * C) / (v + m);

      // Actualizar score del club
      await supabase
        .from('clubs')
        .update({ bayesian_score: bayesianScore })
        .eq('id', clubId);

      logger.info('Score bayesiano calculado:', {
        clubId,
        bayesianScore,
        totalReviews: v,
        averageRating: R,
      });

      return bayesianScore;
    } catch (error) {
      logger.error('Error calculando score bayesiano:', {
        error: error instanceof Error ? error.message : String(error),
        clubId,
      });
      throw error;
    }
  }

  /**
   * Recalcular ranking de todos los clubes
   */
  async recalculateAllRankings(): Promise<void> {
    try {
      logger.info('Iniciando recalculo de rankings de clubes...');

      // Obtener todos los clubes con reseñas
      const { data: clubs } = await supabase
        .from('clubs')
        .select('id, total_reviews, average_rating')
        .gt('total_reviews', 0);

      if (!clubs || clubs.length === 0) {
        logger.info('No hay clubes con reseñas para recalcular');
        return;
      }

      // Calcular score para cada club
      const rankings = await Promise.all(
        clubs.map(async (club) => {
          const score = await this.calculateBayesianScore(club.id);
          return { clubId: club.id, score };
        })
      );

      // Ordenar por score descendente y asignar ranks
      rankings.sort((a, b) => b.score - a.score);

      // Actualizar ranks en base de datos
      await Promise.all(
        rankings.map((ranking, index) =>
          supabase
            .from('clubs')
            .update({ bayesian_score: ranking.score })
            .eq('id', ranking.clubId)
        )
      );

      logger.info(`Rankings recalculados para ${clubs.length} clubes`);
    } catch (error) {
      logger.error('Error recalculando rankings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener ranking de clubes destacados
   */
  async getTopClubs(limit: number = 10): Promise<ClubRanking[]> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, bayesian_score, total_reviews, average_rating')
        .gt('total_reviews', 0)
        .order('bayesian_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((club, index) => ({
        clubId: club.id,
        bayesianScore: club.bayesian_score || 0,
        totalReviews: club.total_reviews || 0,
        averageRating: club.average_rating || 0,
        rank: index + 1,
      }));
    } catch (error) {
      logger.error('Error obteniendo top clubes:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const clubRankingService = ClubRankingService.getInstance();
```

#### 6.2. Cron Job para Recálculo Diario

**Archivo:** `supabase/functions/recalculate-rankings/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { clubRankingService } from './ClubRankingService.ts'

serve(async (req) => {
  try {
    // Verificar autenticación (opcional para cron jobs)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Recalcular rankings
    await clubRankingService.recalculateAllRankings();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rankings recalculated successfully',
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ranking recalculation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Checklist Fase 6

- [ ] Crear `ClubRankingService.ts`
- [ ] Implementar algoritmo bayesiano
- [ ] Crear Edge Function `recalculate-rankings`
- [ ] Configurar Cron Job en Supabase
- [ ] Probar recálculo de rankings
- [ ] Probar obtención de top clubes
- [ ] Documentar algoritmo y configuración

---

## 🗺️ Fase 7: Geolocalización con Privacidad

### Objetivos

- Implementar offset de 1km para privacidad
- Crear heatmaps de check-ins
- Configurar radio de búsqueda (10-50km)

### Archivos a Crear

#### 7.1. Servicio de Geolocalización

**Archivo:** `src/services/geolocation/GeolocationService.ts`

```typescript
import { logger } from "@/lib/logger";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrivacyProtectedLocation {
  latitude: number;
  longitude: number;
  originalLatitude?: number;
  originalLongitude?: number;
  offsetDistance: number; // en metros
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Aplicar offset de 1km para privacidad
   */
  applyPrivacyOffset(
    coordinates: Coordinates,
    offsetDistance: number = 1000 // 1km por defecto
  ): PrivacyProtectedLocation {
    // Generar offset aleatorio en dirección aleatoria
    const angle = Math.random() * 2 * Math.PI;
    const offsetKm = offsetDistance / 1000; // Convertir a km

    // 1 grado de latitud ≈ 111 km
    // 1 grado de longitud ≈ 111 km * cos(latitud)
    const latOffset = (offsetKm / 111) * Math.cos(angle);
    const lonOffset = (offsetKm / 111) * Math.sin(angle);

    return {
      latitude: coordinates.latitude + latOffset,
      longitude: coordinates.longitude + lonOffset,
      originalLatitude: coordinates.latitude,
      originalLongitude: coordinates.longitude,
      offsetDistance,
    };
  }

  /**
   * Calcular distancia entre dos puntos (Haversine formula)
   */
  calculateDistance(
    coords1: Coordinates,
    coords2: Coordinates
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coords1.latitude)) *
        Math.cos(this.toRad(coords2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en km

    return distance;
  }

  /**
   * Obtener clubes dentro de un radio
   */
  async getClubsWithinRadius(
    userLocation: Coordinates,
    radiusKm: number = 10
  ): Promise<any[]> {
    try {
      // Aplicar offset de privacidad a la ubicación del usuario
      const protectedLocation = this.applyPrivacyOffset(userLocation);

      // Bounding box para búsqueda eficiente
      const latDelta = radiusKm / 111;
      const lonDelta = radiusKm / (111 * Math.cos(this.toRad(protectedLocation.latitude)));

      const minLat = protectedLocation.latitude - latDelta;
      const maxLat = protectedLocation.latitude + latDelta;
      const minLon = protectedLocation.longitude - lonDelta;
      const maxLon = protectedLocation.longitude + lonDelta;

      // Buscar clubes en bounding box
      const clubs = await this.searchClubsInBoundingBox(
        minLat,
        maxLat,
        minLon,
        maxLon
      );

      // Filtrar por distancia exacta
      const clubsWithinRadius = clubs.filter((club) => {
        const distance = this.calculateDistance(protectedLocation, {
          latitude: club.latitude,
          longitude: club.longitude,
        });
        return distance <= radiusKm;
      });

      logger.info('Clubes encontrados en radio:', {
        radius: radiusKm,
        count: clubsWithinRadius.length,
      });

      return clubsWithinRadius;
    } catch (error) {
      logger.error('Error buscando clubes en radio:', {
        error: error instanceof Error ? error.message : String(error),
        radius: radiusKm,
      });
      throw error;
    }
  }

  /**
   * Buscar clubes en bounding box (implementación placeholder)
   */
  private async searchClubsInBoundingBox(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<any[]> {
    // Implementación con Supabase
    // Placeholder - implementar con consulta real
    return [];
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const geolocationService = GeolocationService.getInstance();
```

#### 7.2. Componente de Mapa con Heatmap

**Archivo:** `src/components/clubs/ClubMap.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { geolocationService } from '@/services/geolocation/GeolocationService';
import { Card, CardContent } from '@/components/ui/cards/Card';

export function ClubMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [radius, setRadius] = useState(10); // 10km por defecto

  useEffect(() => {
    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    // Buscar clubes en radio
    geolocationService
      .getClubsWithinRadius(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        radius
      )
      .then(setClubs)
      .catch(console.error);
  }, [userLocation, radius]);

  if (!userLocation) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-6">
          <p className="text-white/80 text-center">
            Obteniendo tu ubicación...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardContent className="p-6">
        <div className="mb-4">
          <label className="text-white font-medium mb-2 block">
            Radio de búsqueda: {radius} km
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={12}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ubicación del usuario con offset de privacidad */}
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={200}
            fillColor="#8b5cf6"
            color="#8b5cf6"
            weight={2}
            fillOpacity={0.3}
          >
            <Popup>Tu ubicación (aproximada)</Popup>
          </CircleMarker>

          {/* Clubes */}
          {clubs.map((club) => (
            <CircleMarker
              key={club.id}
              center={[club.latitude, club.longitude]}
              radius={100}
              fillColor="#10b981"
              color="#10b981"
              weight={2}
              fillOpacity={0.5}
            >
              <Popup>
                <div>
                  <strong>{club.name}</strong>
                  <br />
                  Calificación: {club.average_rating}/5
                  <br />
                  Reseñas: {club.total_reviews}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
```

### Checklist Fase 7

- [ ] Crear `GeolocationService.ts`
- [ ] Implementar offset de 1km
- [ ] Implementar cálculo de distancia
- [ ] Crear `ClubMap.tsx`
- [ ] Probar offset de privacidad
- [ ] Probar búsqueda en radio
- [ ] Probar visualización en mapa
- [ ] Documentar servicio de geolocalización

---

## 📋 Fase 8: Actualización de ClubProfileAdmin

### Objetivos

- Agregar pestañas de Vibe Status
- Agregar interfaz de NFT Minting
- Agregar sección Legal

### Archivos a Modificar

#### 8.1. Actualización de ClubProfileAdmin.tsx

**Archivo:** `src/components/clubs/ClubProfileAdmin.tsx`

```typescript
// Agregar nuevas pestañas al componente existente

// ... imports existentes ...

export function ClubProfileAdmin() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Tabs de navegación */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Resumen
        </Button>
        <Button
          variant={activeTab === 'vibe' ? 'default' : 'outline'}
          onClick={() => setActiveTab('vibe')}
        >
          Vibe Status
        </Button>
        <Button
          variant={activeTab === 'nft' ? 'default' : 'outline'}
          onClick={() => setActiveTab('nft')}
        >
          NFT Minting
        </Button>
        <Button
          variant={activeTab === 'legal' ? 'default' : 'outline'}
          onClick={() => setActiveTab('legal')}
        >
          Legal
        </Button>
        <Button
          variant={activeTab === 'stats' ? 'default' : 'outline'}
          onClick={() => setActiveTab('stats')}
        >
          Estadísticas
        </Button>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'vibe' && <VibeStatusTab />}
      {activeTab === 'nft' && <NFTMintingTab />}
      {activeTab === 'legal' && <LegalTab />}
      {activeTab === 'stats' && <StatisticsTab />}

      {/* ... contenido existente ... */}
    </div>
  );
}

// Componente Vibe Status
function VibeStatusTab() {
  const [vibeStatus, setVibeStatus] = useState('unknown');

  const vibeOptions = [
    { value: 'unknown', label: 'Desconocido', emoji: '❓' },
    { value: 'hot', label: '🔥 Pista Llena', emoji: '🔥' },
    { value: 'chill', label: '🍸 Chill', emoji: '🍸' },
    { value: 'packed', label: '🎉 Packed', emoji: '🎉' },
    { value: 'quiet', label: '🤫 Tranquilo', emoji: '🤫' },
  ];

  const updateVibeStatus = async (status: string) => {
    try {
      // Implementar actualización en Supabase
      setVibeStatus(status);
    } catch (error) {
      console.error('Error updating vibe status:', error);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Estado en Vivo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-white/80">
            Actualiza el estado actual de tu club para que los usuarios sepan qué esperar.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {vibeOptions.map((option) => (
              <Button
                key={option.value}
                variant={vibeStatus === option.value ? 'default' : 'outline'}
                onClick={() => updateVibeStatus(option.value)}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente NFT Minting
function NFTMintingTab() {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Pases VIP NFT</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-white/80">
            Crea pases VIP coleccionables en Polygon para tus eventos más exclusivos.
          </p>
          <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <p className="text-purple-300 font-medium mb-2">
              🚀 Próximamente
            </p>
            <p className="text-white/70 text-sm">
              El minting de NFTs estará disponible en la versión de producción con integración de Polygon.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente Legal
function LegalTab() {
  const [accepted, setAccepted] = useState(false);

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Aceptación Legal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <p className="text-yellow-300 font-medium mb-2">
              ⚠️ Importante
            </p>
            <p className="text-white/70 text-sm">
              CómplicesConecta actúa como tercero facilitador. No somos responsables de eventos, servicios o productos ofrecidos por los clubes.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-white/80 text-sm">
                Acepto que CómplicesConecta es solo un facilitador y no es responsable de los servicios ofrecidos por los clubes.
              </span>
            </label>
          </div>

          {!accepted && (
            <p className="text-red-400 text-sm">
              Debes aceptar el deslinde de responsabilidad para continuar operando tu club.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente Estadísticas
function StatisticsTab() {
  const [stats, setStats] = useState({
    totalRevenueCmpx: 0,
    totalRevenueUsd: 0,
    totalReservations: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    // Cargar estadísticas del club
    // Implementar con Supabase
  }, []);

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Estadísticas Financieras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-900/30 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Ingresos Totales (CMPX)</p>
            <p className="text-2xl font-bold text-white">
              {stats.totalRevenueCmpx.toLocaleString()} CMPX
            </p>
          </div>
          <div className="p-4 bg-blue-900/30 rounded-lg">
            <p className="text-blue-300 text-sm mb-1">Ingresos Totales (USD)</p>
            <p className="text-2xl font-bold text-white">
              ${stats.totalRevenueUsd.toLocaleString()} USD
            </p>
          </div>
          <div className="p-4 bg-green-900/30 rounded-lg">
            <p className="text-green-300 text-sm mb-1">Total Reservas</p>
            <p className="text-2xl font-bold text-white">
              {stats.totalReservations.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-yellow-900/30 rounded-lg">
            <p className="text-yellow-300 text-sm mb-1">Calificación Promedio</p>
            <p className="text-2xl font-bold text-white">
              {stats.averageRating.toFixed(1)} / 5
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Checklist Fase 8

- [ ] Actualizar `ClubProfileAdmin.tsx`
- [ ] Crear componente `VibeStatusTab`
- [ ] Crear componente `NFTMintingTab`
- [ ] Crear componente `LegalTab`
- [ ] Crear componente `StatisticsTab`
- [ ] Probar navegación de pestañas
- [ ] Probar actualización de vibe status
- [ ] Probar aceptación legal
- [ ] Probar estadísticas financieras

---

## 🔔 Fase 9: Webhooks y Automatización

### Objetivos

- Implementar webhooks de Stripe
- Automatizar generación de QR
- Configurar notificaciones

### Archivos a Crear

#### 9.1. Webhook de Stripe

**Archivo:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Stripe webhook received:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { club_id, user_id, tier, type } = paymentIntent.metadata

        if (type === 'reservation') {
          // Generar QR y crear reserva
          const qrHash = crypto.randomUUID()

          await supabase.from('reservations').insert({
            club_id,
            user_id,
            qr_hash: qrHash,
            amount: paymentIntent.amount / 100,
            currency: 'usd',
            payment_method: 'stripe',
            status: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })

          console.log('Reservation created:', { club_id, user_id, qrHash })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Checklist Fase 9

- [ ] Crear Edge Function `stripe-webhook`
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Implementar manejo de eventos
- [ ] Probar flujo de payment_intent.succeeded
- [ ] Probar flujo de payment_intent.payment_failed
- [ ] Configurar notificaciones
- [ ] Documentar webhooks

---

## ✅ Fase 10: Testing y Despliegue

### Objetivos

- Crear tests unitarios
- Crear tests de integración
- Probar flujo completo
- Documentar deployment

### Tests a Crear

#### 10.1. Tests de WalletService

**Archivo:** `src/tests/services/WalletService.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from '@/services/wallet/WalletService';

describe('WalletService', () => {
  let walletService: WalletService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    walletService = WalletService.getInstance();
    vi.clearAllMocks();
  });

  describe('getWalletBalance', () => {
    it('should return user balance', async () => {
      const balance = await walletService.getWalletBalance(mockUserId);
      expect(balance).toBeDefined();
      expect(balance?.userId).toBe(mockUserId);
    });
  });

  describe('addTokens', () => {
    it('should add tokens to wallet', async () => {
      const initialBalance = await walletService.getWalletBalance(mockUserId);
      const amountToAdd = 100;

      const newBalance = await walletService.addTokens(
        mockUserId,
        amountToAdd,
        'cmpx',
        'earn',
        'Test transaction'
      );

      expect(newBalance.cmpxBalance).toBe(initialBalance?.cmpxBalance + amountToAdd);
    });
  });

  describe('deductTokens', () => {
    it('should deduct tokens from wallet', async () => {
      const amountToDeduct = 50;

      const newBalance = await walletService.deductTokens(
        mockUserId,
        amountToDeduct,
        'cmpx',
        'spend',
        'Test transaction'
      );

      expect(newBalance.cmpxBalance).toBeLessThan(1000000);
    });

    it('should throw error if insufficient balance', async () => {
      await expect(
        walletService.deductTokens(mockUserId, 999999999, 'cmpx', 'spend')
      ).rejects.toThrow('Insufficient CMPX balance');
    });
  });
});
```

#### 10.2. Tests de ReservationService

**Archivo:** `src/tests/services/ReservationService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationService } from '@/services/reservations/ReservationService';

describe('ReservationService', () => {
  let reservationService: ReservationService;
  const mockClubId = 'test-club-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    reservationService = ReservationService.getInstance();
  });

  describe('createReservation', () => {
    it('should create reservation with QR', async () => {
      const reservation = await reservationService.createReservation({
        clubId: mockClubId,
        userId: mockUserId,
        amount: 100,
        currency: 'usd',
        paymentMethod: 'stripe',
        accessType: 'general',
      });

      expect(reservation).toBeDefined();
      expect(reservation.qrHash).toBeDefined();
      expect(reservation.status).toBe('paid');
    });
  });

  describe('validateQR', () => {
    it('should validate QR and mark as used', async () => {
      const reservation = await reservationService.createReservation({
        clubId: mockClubId,
        userId: mockUserId,
        amount: 100,
        currency: 'usd',
        paymentMethod: 'stripe',
        accessType: 'general',
      });

      const validated = await reservationService.validateQR(reservation.qrHash);

      expect(validated).toBeDefined();
      expect(validated?.status).toBe('used');
    });

    it('should return null for invalid QR', async () => {
      const validated = await reservationService.validateQR('invalid-qr-hash');
      expect(validated).toBeNull();
    });
  });
});
```

### Checklist de Testing

- [ ] Crear tests de WalletService
- [ ] Crear tests de ReservationService
- [ ] Crear tests de ClubRankingService
- [ ] Crear tests de GeolocationService
- [ ] Crear tests de componentes UI
- [ ] Ejecutar todos los tests
- [ ] Corregir errores encontrados
- [ ] Verificar cobertura de código (>80%)

### Deployment Checklist

- [ ] Configurar variables de entorno en Supabase
- [ ] Desplegar Edge Functions
- [ ] Configurar webhooks de Stripe
- [ ] Configurar Cron Jobs
- [ ] Probar en ambiente de staging
- [ ] Probar en ambiente de producción
- [ ] Monitorear logs y errores
- [ ] Documentar proceso de deployment

---

## 📝 Documentación Final

### Guías de Usuario

- [ ] Guía para usuarios de billetera
- [ ] Guía para dueños de clubes
- [ ] Guía de reservas con QR
- [ ] Guía de pagos y comisiones

### Documentación Técnica

- [ ] API Reference completa
- [ ] Diagramas de arquitectura
- [ ] Guía de troubleshooting
- [ ] Guía de seguridad

### Documentación Legal

- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Deslinde de responsabilidad
- [ ] Política de reembolsos

---

## 🎯 Resumen de Fases

| Fase | Descripción | Prioridad | Tiempo Estimado |
|------|-------------|-----------|-----------------|
| 1 | Fundamentos de Base de Datos | Alta | 2-3 días |
| 2 | Módulo de Billetera y Tokens CMPX | Alta | 2-3 días |
| 3 | Lógica de Cobro y Comisiones | Alta | 2-3 días |
| 4 | Componente de Billetera UI | Media | 1-2 días |
| 5 | Sistema de Reservas con QR | Media | 2-3 días |
| 6 | Ranking Bayesiano de Clubes | Media | 1-2 días |
| 7 | Geolocalización con Privacidad | Media | 1-2 días |
| 8 | Actualización de ClubProfileAdmin | Media | 2-3 días |
| 9 | Webhooks y Automatización | Alta | 1-2 días |
| 10 | Testing y Despliegue | Alta | 3-4 días |

**Tiempo Total Estimado:** 17-27 días

---

## 🚀 Próximos Pasos

1. **Iniciar con Fase 1:** Crear tablas de base de datos
2. **Configurar Supabase:** Verificar acceso y permisos
3. **Instalar dependencias:** `npm install qrcode.react html5-qrcode react-leaflet`
4. **Configurar Stripe:** Crear cuenta y obtener API keys
5. **Documentar proceso:** Crear guías de usuario y técnicas

---

**Estado del Documento:** Completo
**Última Actualización:** 24 de Enero, 2026
**Versión:** 1.0

---

## 🎮 Fase 11: Club Demo Experience & Sandbox

### Objetivos

- Crear componente interactivo "ClubInteractiveDemo.tsx" como sandbox
- Implementar vista dual (Usuario y Administrador)
- Crear simulador de reservas con QR
- Implementar escáner QR con Safe Arrival
- Crear dashboard de demo para prospectos

### Archivos a Crear

#### 11.1. Componente ClubInteractiveDemo.tsx

**Archivo:** `src/components/clubs/ClubInteractiveDemo.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/badge';
import { Coins, Wallet, ShieldCheck, ArrowUpRight, CheckCircle, XCircle, Loader2, Flame, Martini, Lock } from 'lucide-react';
import { TokenWallet } from './TokenWallet';

export function ClubInteractiveDemo() {
  const [activeView, setActiveView] = useState<'user' | 'admin'>('user');
  const [vibeStatus, setVibeStatus] = useState<'unknown' | 'hot' | 'chill' | 'packed' | 'quiet'>('unknown');
  const [commissionMode, setCommissionMode] = useState<'free' | 'premium'>('free');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [reservationMade, setReservationMade] = useState(false);

  // Lógica para el Simulador de Ranking y Comisiones
  const calculateDemoRevenue = (price: number, tier: 'free' | 'premium') => {
    const fee = tier === 'free' ? 0.20 : 0;
    const platformTake = price * fee;
    const clubTake = price - platformTake;
    return { platformTake, clubTake };
  };

  const handleReservation = () => {
    setReservationMade(true);
    setQrGenerated(true);
  };

  const handleQRScan = () => {
    setQrScanned(true);
    setTimeout(() => setQrScanned(false), 3000);
  };

  const vibeColors = {
    unknown: 'from-gray-600 to-gray-800',
    hot: 'from-red-600 to-orange-600',
    chill: 'from-blue-600 to-cyan-600',
    packed: 'from-purple-600 to-pink-600',
    quiet: 'from-green-600 to-emerald-600',
  };

  const vibeEmojis = {
    unknown: '❓',
    hot: '🔥',
    chill: '🍸',
    packed: '🎉',
    quiet: '🤫',
  };

  return (
    <div className="space-y-6">
      {/* Selector de Vista */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'user' ? 'default' : 'outline'}
          onClick={() => setActiveView('user')}
          className="flex-1"
        >
          👤 Vista Usuario
        </Button>
        <Button
          variant={activeView === 'admin' ? 'default' : 'outline'}
          onClick={() => setActiveView('admin')}
          className="flex-1"
        >
          👨‍💼 Vista Admin
        </Button>
      </div>

      {/* Vista del Usuario */}
      {activeView === 'user' && (
        <div className="space-y-6">
          {/* Perfil del Club */}
          <Card className={`bg-gradient-to-br ${vibeColors[vibeStatus]} backdrop-blur-xl border-white/20 shadow-2xl`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-2xl">Club Demo Experience</CardTitle>
                <Badge className="bg-white/20 text-white border-white/30">
                  ✅ Check CC
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vibe en Tiempo Real */}
              <div className={`p-4 rounded-xl bg-white/10 border border-white/20`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{vibeEmojis[vibeStatus]}</span>
                  <div>
                    <p className="text-white font-bold">Estado en Vivo</p>
                    <p className="text-white/70 text-sm">
                      {vibeStatus === 'hot' && '🔥 Pista Llena'}
                      {vibeStatus === 'chill' && '🍸 Ambiente Relajado'}
                      {vibeStatus === 'packed' && '🎉 Lleno de Gente'}
                      {vibeStatus === 'quiet' && '🤫 Tranquilo'}
                      {vibeStatus === 'unknown' && '❓ Desconocido'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Galería de Fotos */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-white/20 rounded-lg animate-pulse" />
                ))}
              </div>

              {/* Lista de Eventos */}
              <div className="space-y-2">
                <p className="text-white font-bold">Eventos Próximos</p>
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-white font-medium">Noche de Fiesta</p>
                  <p className="text-white/60 text-sm">Viernes 22:00</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-white font-medium">Happy Hour</p>
                  <p className="text-white/60 text-sm">Sábado 18:00</p>
                </div>
              </div>

              {/* Simulador de Reserva */}
              <div className="space-y-3">
                <p className="text-white font-bold">Reservar Entrada</p>
                <Button onClick={handleReservation} className="w-full" disabled={reservationMade}>
                  {reservationMade ? '✅ Reserva Confirmada' : '💰 Reservar con CMPX/Stripe'}
                </Button>

                {qrGenerated && (
                  <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                    <p className="text-white font-bold mb-2">🎫 Tu Código QR</p>
                    <div className="bg-white p-4 rounded-lg w-32 h-32 mx-auto flex items-center justify-center">
                      <div className="text-black font-mono text-xs">
                        QR-DEMO-12345
                      </div>
                    </div>
                    <p className="text-white/60 text-sm text-center mt-2">
                      Presenta este código en la entrada
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billetera Demo */}
          <TokenWallet cmpxBalance={500} gtkBalance={100} />
        </div>
      )}

      {/* Vista del Administrador */}
      {activeView === 'admin' && (
        <div className="space-y-6">
          {/* Simulador Admin */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white">🎛️ Panel de Control Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle de Comisiones */}
              <div className="space-y-3">
                <p className="text-white font-bold">💰 Modo de Comisiones</p>
                <div className="flex gap-2">
                  <Button
                    variant={commissionMode === 'free' ? 'default' : 'outline'}
                    onClick={() => setCommissionMode('free')}
                    className="flex-1"
                  >
                    🆓 Free (20% fee)
                  </Button>
                  <Button
                    variant={commissionMode === 'premium' ? 'default' : 'outline'}
                    onClick={() => setCommissionMode('premium')}
                    className="flex-1"
                  >
                    ⭐ Premium (0% fee)
                  </Button>
                </div>

                {/* Calculadora de ROI */}
                <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <p className="text-purple-300 font-bold mb-2">📊 Calculadora de ROI</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white">
                      <span>Precio de entrada:</span>
                      <span className="font-bold">$100 USD</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Comisión plataforma:</span>
                      <span className="font-bold">
                        {commissionMode === 'free' ? '$20 (20%)' : '$0 (0%)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Ganancia neta:</span>
                      <span className="font-bold text-green-400">
                        ${commissionMode === 'free' ? '$80' : '$100'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actualizador de Vibe */}
              <div className="space-y-3">
                <p className="text-white font-bold">🎭 Estado en Vivo</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(vibeEmojis).map(([key, emoji]) => (
                    <Button
                      key={key}
                      variant={vibeStatus === key ? 'default' : 'outline'}
                      onClick={() => setVibeStatus(key as any)}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs">
                        {key === 'hot' && 'Llena'}
                        {key === 'chill' && 'Chill'}
                        {key === 'packed' && 'Packed'}
                        {key === 'quiet' && 'Tranquilo'}
                        {key === 'unknown' && 'Desconocido'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Escáner QR Mock */}
              <div className="space-y-3">
                <p className="text-white font-bold">📷 Escáner QR (Demo)</p>
                <div className="p-4 bg-black/30 rounded-lg border border-white/20">
                  <div className="flex items-center justify-center gap-4">
                    {qrScanned ? (
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-2" />
                        <p className="text-green-400 font-bold">✅ Acceso Concedido</p>
                        <p className="text-white/60 text-sm">Usuario Verificado</p>
                        <div className="mt-2 p-2 bg-green-500/20 rounded-lg">
                          <p className="text-green-300 text-xs">
                            📱 Notificación enviada: "Llegó seguro al club"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Loader2 className="h-16 w-16 text-white animate-spin mx-auto mb-2" />
                        <p className="text-white/60">Escaneando QR...</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleQRScan}
                    className="w-full mt-4"
                    disabled={qrScanned}
                  >
                    {qrScanned ? '✅ Escaneado' : '📷 Simular Escaneo'}
                  </Button>
                </div>
              </div>

              {/* Wallet Admin */}
              <div className="space-y-3">
                <p className="text-white font-bold">💰 Tokens Acumulados</p>
                <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <Coins className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-yellow-300 font-bold text-2xl">250 CMPX</p>
                      <p className="text-white/60 text-sm">Propinas digitales recibidas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deslinde Legal */}
              <div className="space-y-3">
                <p className="text-white font-bold">⚖️ Aceptación Legal</p>
                <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1" defaultChecked />
                    <span className="text-white/80 text-xs">
                      <strong>Cláusula de Responsabilidad Limitada:</strong> CómplicesConecta actúa exclusivamente como Tercero Facilitador. NO es responsable de incidentes, quejas o demandas dentro de las instalaciones del club.
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Banner Preview */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-xl shadow-lg animate-pulse">
            <p className="text-white font-bold text-center">
              ✨ Tu Evento Aquí (Exclusivo Premium) ✨
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 11.2. Componente TokenWallet

**Archivo:** `src/components/clubs/TokenWallet.tsx`

```typescript
import React from 'react';
import { Wallet, Coins, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TokenWalletProps {
  cmpxBalance: number;
  gtkBalance: number;
  address?: string;
}

export function TokenWallet({ cmpxBalance, gtkBalance, address }: TokenWalletProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-purple-400" /> Mi Billetera
        </h3>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <ShieldCheck className="h-3 w-3 mr-1" /> Cuenta Segura
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Token Interno CMPX */}
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/60 text-xs font-medium">SALDO INTERNO</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{cmpxBalance}</span>
            <span className="text-purple-400 text-xs font-bold">CMPX</span>
          </div>
        </div>

        {/* Token Web3 GTK */}
        <div className="bg-gradient-to-br from-fuchsia-600/20 to-orange-600/20 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/60 text-xs font-medium">BLOCKCHAIN WALLET</span>
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{gtkBalance}</span>
            <span className="text-orange-400 text-xs font-bold">GTK</span>
          </div>
        </div>
      </div>

      {address && (
        <p className="mt-4 text-[10px] text-white/30 truncate font-mono">
          Wallet: {address}
        </p>
      )}
    </div>
  );
}
```

#### 11.3. Componente ClubDemoEcosystem.tsx

**Archivo:** `src/components/clubs/ClubDemoEcosystem.tsx`

```typescript
import React, { useState } from 'react';
import { ClubInteractiveDemo } from './ClubInteractiveDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Play, RotateCcw, Info } from 'lucide-react';

export function ClubDemoEcosystem() {
  const [demoStarted, setDemoStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const startDemo = () => {
    setDemoStarted(true);
  };

  const resetDemo = () => {
    setResetKey(prev => prev + 1);
    setDemoStarted(false);
  };

  if (!demoStarted) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">🎮 Club Demo Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-1" />
              <div className="text-sm text-white/80">
                <p className="font-bold text-blue-300 mb-1">¿Qué es este Demo?</p>
                <p>
                  Este es un entorno seguro (Sandbox) donde puedes probar todas las funciones Premium antes de registrar tu club.
                  Simula reservas, pagos, escaneo de QR y más sin riesgos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white font-bold mb-2">Funciones Disponibles:</p>
            <ul className="text-white/70 text-sm space-y-1">
              <li>✅ Vista dual (Usuario y Administrador)</li>
              <li>✅ Simulador de reservas con QR</li>
              <li>✅ Sistema de comisiones (Free vs Premium)</li>
              <li>✅ Vibe en tiempo real</li>
              <li>✅ Escáner QR con Safe Arrival</li>
              <li>✅ Billetera de tokens CMPX/GTK</li>
              <li>✅ Dashboard de analytics</li>
            </ul>
          </div>

          <Button onClick={startDemo} className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Iniciar Demo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">🎮 Club Demo Sandbox</h2>
        <Button onClick={resetDemo} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar Demo
        </Button>
      </div>

      <ClubInteractiveDemo key={resetKey} />
    </div>
  );
}
```

#### 11.4. Servicio de Safe Arrival

**Archivo:** `src/services/safety/SafeArrivalService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface TrustContact {
  name: string;
  phone: string;
  email?: string;
}

export class SafeArrivalService {
  private static instance: SafeArrivalService;

  private constructor() {}

  static getInstance(): SafeArrivalService {
    if (!SafeArrivalService.instance) {
      SafeArrivalService.instance = new SafeArrivalService();
    }
    return SafeArrivalService.instance;
  }

  /**
   * Notificar a los contactos de confianza que el usuario llegó seguro
   */
  async notifyTrustContacts(userId: string, clubName: string): Promise<void> {
    try {
      // Obtener contactos de confianza del usuario
      const { data: contacts, error } = await supabase
        .from('trust_contacts')
        .select('name, phone, email')
        .eq('user_id', userId);

      if (error) throw error;

      if (!contacts || contacts.length === 0) {
        logger.info('No hay contactos de confianza configurados', { userId });
        return;
      }

      // Enviar notificaciones (simulado en demo, real en producción)
      for (const contact of contacts) {
        await this.sendNotification(contact as TrustContact, clubName);
      }

      logger.info('Notificaciones enviadas a contactos de confianza', {
        userId,
        clubName,
        contactsCount: contacts.length,
      });
    } catch (error) {
      logger.error('Error notificando contactos de confianza:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Enviar notificación a un contacto (SMS/Email)
   */
  private async sendNotification(contact: TrustContact, clubName: string): Promise<void> {
    // En producción, integrar con servicio de SMS (Twilio) o Email (SendGrid)
    logger.info('Enviando notificación Safe Arrival:', {
      contact: contact.name,
      clubName,
    });

    // Simulación para demo
    console.log(`📱 SMS enviado a ${contact.phone}: "Llegó seguro a ${clubName}"`);
  }

  /**
   * Obtener contactos de confianza del usuario
   */
  async getTrustContacts(userId: string): Promise<TrustContact[]> {
    try {
      const { data, error } = await supabase
        .from('trust_contacts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map((contact) => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      }));
    } catch (error) {
      logger.error('Error obteniendo contactos de confianza:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }
}

export const safeArrivalService = SafeArrivalService.getInstance();
```

#### 11.5. Lógica de Validación QR con Safe Arrival

**Archivo:** `src/services/reservations/QRValidationService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { safeArrivalService } from "@/services/safety/SafeArrivalService";

export interface QRValidationResult {
  success: boolean;
  message: string;
  userName?: string;
  reservationId?: string;
}

export class QRValidationService {
  private static instance: QRValidationService;

  private constructor() {}

  static getInstance(): QRValidationService {
    if (!QRValidationService.instance) {
      QRValidationService.instance = new QRValidationService();
    }
    return QRValidationService.instance;
  }

  /**
   * Validar QR y marcar check-in
   */
  async validateQR(qrHash: string): Promise<QRValidationResult> {
    try {
      logger.info('Validando QR:', { qrHash });

      // Consultar la tabla reservations
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users!inner (
            name,
            trust_contacts
          ),
          clubs!inner (
            name
          )
        `)
        .eq('qr_hash', qrHash)
        .single();

      if (error || !reservation) {
        logger.warn('QR inválido o no encontrado', { qrHash });
        return {
          success: false,
          message: 'QR Inválido o no encontrado',
        };
      }

      // Verificar estado
      if (reservation.status === 'used') {
        logger.warn('QR ya utilizado', { reservationId: reservation.id });
        return {
          success: false,
          message: 'Código ya utilizado',
        };
      }

      if (reservation.status === 'expired') {
        logger.warn('QR expirado', { reservationId: reservation.id });
        return {
          success: false,
          message: 'Fecha incorrecta (expirado)',
        };
      }

      if (reservation.status !== 'paid') {
        logger.warn('QR no pagado', { reservationId: reservation.id });
        return {
          success: false,
          message: 'Reserva no completada',
        };
      }

      // Marcar como usado
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'used',
          check_in_at: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // Notificar Safe Arrival
      await safeArrivalService.notifyTrustContacts(
        reservation.user_id,
        reservation.clubs.name
      );

      logger.info('QR validado exitosamente:', {
        reservationId: reservation.id,
        userName: reservation.users.name,
      });

      return {
        success: true,
        message: `Bienvenido/a ${reservation.users.name}`,
        userName: reservation.users.name,
        reservationId: reservation.id,
      };
    } catch (error) {
      logger.error('Error validando QR:', {
        error: error instanceof Error ? error.message : String(error),
        qrHash,
      });
      return {
        success: false,
        message: 'Error al validar QR',
      };
    }
  }
}

export const qrValidationService = QRValidationService.getInstance();
```

### Checklist Fase 11

- [ ] Crear `ClubInteractiveDemo.tsx`
- [ ] Crear `TokenWallet.tsx`
- [ ] Crear `ClubDemoEcosystem.tsx`
- [ ] Crear `SafeArrivalService.ts`
- [ ] Crear `QRValidationService.ts`
- [ ] Implementar vista dual (Usuario/Admin)
- [ ] Implementar simulador de reservas
- [ ] Implementar escáner QR mock
- [ ] Implementar toggle de comisiones
- [ ] Implementar actualizador de vibe
- [ ] Implementar Safe Arrival notifications
- [ ] Agregar deslinde legal
- [ ] Probar flujo completo del demo
- [ ] Probar cambio de vibe en tiempo real
- [ ] Probar validación de QR
- [ ] Probar notificaciones Safe Arrival
- [ ] Documentar demo experience

---

### 🎯 Especificaciones Técnicas Detalladas

#### Estado Local del Demo (useDemoStore)

**Archivo:** `src/hooks/useDemoStore.ts`

```typescript
import { create } from 'zustand';

interface DemoState {
  // Configuración del Club
  clubTier: 'free' | 'premium';
  entryPrice: number;
  vibeStatus: 'unknown' | 'hot' | 'chill' | 'packed' | 'quiet';

  // Estado de Reservas
  reservationMade: boolean;
  qrGenerated: boolean;
  qrHash: string;

  // Estado de Escaneo
  qrScanned: boolean;
  scanResult: {
    success: boolean;
    message: string;
    userName?: string;
    membershipLevel?: string;
  } | null;

  // Tokens
  cmpxBalance: number;
  gtkBalance: number;
  digitalTipsReceived: number;

  // Legal
  legalDisclaimerAccepted: boolean;

  // Acciones
  setClubTier: (tier: 'free' | 'premium') => void;
  setEntryPrice: (price: number) => void;
  setVibeStatus: (status: string) => void;
  makeReservation: () => void;
  scanQR: () => void;
  acceptLegalDisclaimer: () => void;
  resetDemo: () => void;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  // Estado inicial
  clubTier: 'free',
  entryPrice: 100,
  vibeStatus: 'unknown',
  reservationMade: false,
  qrGenerated: false,
  qrHash: '',
  qrScanned: false,
  scanResult: null,
  cmpxBalance: 500,
  gtkBalance: 100,
  digitalTipsReceived: 250,
  legalDisclaimerAccepted: false,

  // Acciones
  setClubTier: (tier) => set({ clubTier: tier }),

  setEntryPrice: (price) => set({ entryPrice: price }),

  setVibeStatus: (status) => set({ vibeStatus: status }),

  makeReservation: () => {
    const state = get();
    const qrHash = `QR-DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set({
      reservationMade: true,
      qrGenerated: true,
      qrHash,
    });
  },

  scanQR: () => {
    const state = get();
    if (!state.qrGenerated) {
      set({
        scanResult: {
          success: false,
          message: 'No hay QR generado para escanear',
        },
      });
      return;
    }

    // Simular validación del QR
    const isValid = Math.random() > 0.1; // 90% de probabilidad de éxito

    if (isValid) {
      set({
        qrScanned: true,
        scanResult: {
          success: true,
          message: '✅ Acceso Concedido',
          userName: 'Usuario Demo',
          membershipLevel: 'VIP',
        },
      });

      // Resetear después de 3 segundos
      setTimeout(() => {
        set({ qrScanned: false });
      }, 3000);
    } else {
      set({
        qrScanned: true,
        scanResult: {
          success: false,
          message: '❌ QR Inválido o Expirado',
        },
      });
    }
  },

  acceptLegalDisclaimer: () => set({ legalDisclaimerAccepted: true }),

  resetDemo: () => set({
    clubTier: 'free',
    entryPrice: 100,
    vibeStatus: 'unknown',
    reservationMade: false,
    qrGenerated: false,
    qrHash: '',
    qrScanned: false,
    scanResult: null,
    legalDisclaimerAccepted: false,
  }),
}));
```

#### Componente de QR Generator con qrcode.react

**Archivo:** `src/components/clubs/DemoQRGenerator.tsx`

```typescript
import React from 'react';
import QRCode from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/cards/Card';

interface DemoQRGeneratorProps {
  qrHash: string;
  size?: number;
}

export function DemoQRGenerator({ qrHash, size = 200 }: DemoQRGeneratorProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardContent className="p-6">
        <p className="text-white font-bold mb-4">🎫 Tu Código QR</p>
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-2xl">
            <QRCode
              value={qrHash}
              size={size}
              level="H"
              includeMargin={true}
              renderAs="svg"
              imageSettings={{
                src: '/assets/icons/cmpx-token.svg',
                x: null,
                y: null,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/80 text-sm">Presenta este código en la entrada</p>
            <p className="text-white/60 text-xs">Válido por 24 horas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Componente de Escáner QR con Ficha del Cliente

**Archivo:** `src/components/clubs/DemoQRScanner.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { CheckCircle, XCircle, Loader2, User, Crown, Star, Smartphone } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';

export function DemoQRScanner() {
  const { qrGenerated, scanQR, qrScanned, scanResult } = useDemoStore();
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (qrGenerated && !qrScanned) {
      setScanning(true);
      const timer = setTimeout(() => {
        scanQR();
        setScanning(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [qrGenerated, qrScanned, scanQR]);

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-white">📷 Escáner QR (Validación en Puerta)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock de Cámara */}
        <div className="relative bg-black/30 rounded-lg border-2 border-dashed border-white/20 p-8">
          {scanning ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-16 w-16 text-white animate-spin" />
              <p className="text-white/60">Escaneando QR...</p>
              <div className="w-48 h-48 border-4 border-white/30 rounded-lg animate-pulse" />
            </div>
          ) : qrScanned && scanResult ? (
            <div className="space-y-4">
              {scanResult.success ? (
                <>
                  {/* Ficha del Cliente */}
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                      <div>
                        <p className="text-green-400 font-bold text-xl">✅ Acceso Concedido</p>
                        <p className="text-white/60 text-sm">Usuario Verificado</p>
                      </div>
                    </div>

                    {/* Información del Cliente */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white font-medium">{scanResult.userName}</span>
                      </div>
                      {scanResult.membershipLevel && (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-300 font-medium">{scanResult.membershipLevel}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white/60">Nivel 5 - Visitas Frecuentes</span>
                      </div>
                    </div>
                  </div>

                  {/* Notificación Safe Arrival */}
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-400" />
                      <p className="text-blue-300 text-xs">
                        📱 Notificación enviada a los contactos de seguridad: "Ha ingresado al club"
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-12 w-12 text-red-400" />
                    <div>
                      <p className="text-red-400 font-bold text-xl">❌ Acceso Denegado</p>
                      <p className="text-white/60 text-sm">{scanResult.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/60">Esperando QR para escanear...</p>
            </div>
          )}
        </div>

        {/* Botón de Simulación */}
        {qrGenerated && !qrScanned && (
          <Button onClick={scanQR} className="w-full" disabled={scanning}>
            {scanning ? 'Escaneando...' : '📷 Simular Escaneo'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Componente de Badge de Verificación

**Archivo:** `src/components/clubs/ClubVerificationBadge.tsx`

```typescript
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ClubVerificationBadgeProps {
  verified: boolean;
}

export function ClubVerificationBadge({ verified }: ClubVerificationBadgeProps) {
  if (!verified) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-full">
      <CheckCircle className="h-4 w-4 text-yellow-400 animate-pulse" />
      <span className="text-yellow-300 text-xs font-bold">✅ Check CC</span>
    </div>
  );
}
```

#### Componente de Completación del Demo

**Archivo:** `src/components/clubs/DemoCompletion.tsx`

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';

export function DemoCompletion() {
  const { digitalTipsReceived, acceptLegalDisclaimer } = useDemoStore();

  const potentialRevenue = digitalTipsReceived * 2; // Estimado mensual

  return (
    <Card className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-xl border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
          ¡Felicidades! Has Completado el Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-white/80">
            Tu club tiene un potencial de ingresos estimado de:
          </p>
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <span className="text-3xl font-bold text-white">
                {potentialRevenue} CMPX
              </span>
            </div>
            <p className="text-white/60 text-sm mt-2">Mensuales (estimado)</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white font-bold text-center">Beneficios del Plan Premium:</p>
          <ul className="text-white/70 text-sm space-y-2">
            <li>✅ 0% de comisión sobre ventas</li>
            <li>✅ Banners destacados en el feed</li>
            <li>✅ Prioridad en el ranking</li>
            <li>✅ Soporte prioritario</li>
            <li>✅ Analytics avanzados</li>
          </ul>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            acceptLegalDisclaimer();
            // Navegar a registro real
            window.location.href = '/clubs/register';
          }}
        >
          Registrar mi Club Real
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### Actualización de ClubDemoEcosystem.tsx

```typescript
// Agregar al componente existente:
import { DemoQRGenerator } from './DemoQRGenerator';
import { DemoQRScanner } from './DemoQRScanner';
import { ClubVerificationBadge } from './ClubVerificationBadge';
import { DemoCompletion } from './DemoCompletion';
import { useDemoStore } from '@/hooks/useDemoStore';

export function ClubDemoEcosystem() {
  const {
    demoStarted,
    reservationMade,
    qrGenerated,
    qrScanned,
    legalDisclaimerAccepted,
    startDemo,
    resetDemo
  } = useDemoStore();

  // Mostrar pantalla de completación cuando se cumplan las condiciones
  const showCompletion = reservationMade && qrScanned && legalDisclaimerAccepted;

  if (showCompletion) {
    return <DemoCompletion />;
  }

  // ... resto del componente existente ...
}
```

### Checklist Adicional - Especificaciones Técnicas

- [ ] Crear `useDemoStore.ts` con Zustand
- [ ] Crear `DemoQRGenerator.tsx` con qrcode.react
- [ ] Crear `DemoQRScanner.tsx` con ficha del cliente
- [ ] Crear `ClubVerificationBadge.tsx` con efecto dorado
- [ ] Crear `DemoCompletion.tsx` con cálculo de potencial
- [ ] Integrar Safe Arrival notifications en escáner
- [ ] Implementar cambio de color según vibe status
- [ ] Agregar sonido de éxito en validación QR
- [ ] Mostrar nivel de membresía del cliente
- [ ] Calcular potencial de ingresos mensuales
- [ ] Agregar botón de registro real al completar demo
- [ ] Probar flujo completo del demo mejorado

---

## 🎯 Resumen de Fases (Actualizado)

| Fase | Descripción | Prioridad | Tiempo Estimado |
|------|-------------|-----------|-----------------|
| 1 | Fundamentos de Base de Datos | Alta | 2-3 días |
| 2 | Módulo de Billetera y Tokens CMPX | Alta | 2-3 días |
| 3 | Lógica de Cobro y Comisiones | Alta | 2-3 días |
| 4 | Componente de Billetera UI | Media | 1-2 días |
| 5 | Sistema de Reservas con QR | Media | 2-3 días |
| 6 | Ranking Bayesiano de Clubes | Media | 1-2 días |
| 7 | Geolocalización con Privacidad | Media | 1-2 días |
| 8 | Actualización de ClubProfileAdmin | Media | 2-3 días |
| 9 | Webhooks y Automatización | Alta | 1-2 días |
| 10 | Testing y Despliegue | Alta | 3-4 días |
| 11 | Club Demo Experience & Sandbox | Alta | 2-3 días |

**Tiempo Total Estimado:** 19-30 días
