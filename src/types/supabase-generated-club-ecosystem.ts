// Tipos TypeScript generados manualmente para tablas del ecosistema de clubes
// Estos tipos complementan los tipos generados por Supabase

export interface WalletBalance {
  id: string;
  user_id: string;
  cmpx_balance: number;
  gtk_balance: number;
  cmpx_locked: number;
  gtk_locked: number;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  club_id: string;
  user_id: string;
  qr_hash: string;
  amount: number;
  currency: 'usd' | 'cmpx' | 'gtk';
  payment_method: 'stripe' | 'cmpx' | 'gtk';
  status: 'pending' | 'paid' | 'used' | 'expired' | 'cancelled';
  access_type: 'general' | 'vip';
  commission_amount: number;
  commission_paid: boolean;
  stripe_payment_intent_id?: string;
  check_in_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earn' | 'spend' | 'transfer' | 'stake' | 'unstake' | 'reward';
  amount: number;
  token_type: 'cmpx' | 'gtk';
  balance_after: number;
  description?: string;
  metadata?: Record<string, unknown>;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface ClubRating {
  id: string;
  club_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface TrustContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}
