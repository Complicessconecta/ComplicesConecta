// ComplicesConecta v3.7.0 - Tipos Blockchain
// Fecha: 13 Nov 2025 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Tipos TypeScript para las tablas blockchain

 import type { SupabaseClient } from "@supabase/supabase-js";
 import type { Database } from "@/types/supabase-generated";

export interface UserWallet {
  id: string;
  user_id: string;
  address: string;
  encrypted_private_key: string;
  network: string;
  created_at: string;
  updated_at: string;
}

export interface TestnetTokenClaim {
  id: string;
  user_id: string;
  amount_claimed: number;
  claimed_at: string;
  transaction_hash?: string;
}

export interface DailyTokenClaim {
  id: string;
  user_id: string;
  amount_claimed: number;
  claim_date: string;
  transaction_hash?: string;
  created_at: string;
}

export interface UserNFT {
  id: string;
  user_id: string;
  token_id: number;
  contract_address: string;
  metadata_uri?: string;
  name?: string;
  description?: string;
  image_url?: string;
  is_couple: boolean;
  partner_user_id?: string;
  network: string;
  minted_at: string;
}

export interface CoupleNFTRequest {
  id: string;
  initiator_address: string;
  partner1_address: string;
  partner2_address: string;
  metadata_uri: string;
  token_id: number;
  expires_at: string;
  status: "pending" | "approved" | "minted" | "cancelled" | "expired" | (string & {});
  blockchain_status?: string | null;
  transaction_hash?: string | null;
  metadata?: Record<string, unknown> | null;
  consent1_timestamp?: string | null;
  consent2_timestamp?: string | null;
  created_at?: string | null;
}

export interface NFTStaking {
  id: string;
  user_id: string;
  nft_id: string;
  staked_at: string;
  unstaked_at?: string;
  rewards_claimed: number;
  is_active: boolean;
  apy_rate: number;
  network: string;
}

export interface TokenStaking {
  id: string;
  user_id: string;
  amount_staked: number;
  staked_at: string;
  unstaked_at?: string;
  rewards_claimed: number;
  is_active: boolean;
  apy_rate: number;
  lock_period_days: number;
  network: string;
}

export interface BlockchainTransaction {
  id: string;
  user_id: string;
  transaction_hash: string;
  transaction_type: string;
  from_address?: string;
  to_address?: string;
  amount?: number;
  gas_used?: number;
  gas_price?: number;
  status: string;
  block_number?: number;
  network: string;
  created_at: string;
  confirmed_at?: string;
}

// Tipos para inserts (sin campos auto-generados)
export type UserWalletInsert = Omit<
  UserWallet,
  "id" | "created_at" | "updated_at"
>;
export type TestnetTokenClaimInsert = Omit<
  TestnetTokenClaim,
  "id" | "claimed_at"
>;
export type DailyTokenClaimInsert = Omit<DailyTokenClaim, "id" | "created_at">;
export type UserNFTInsert = Omit<UserNFT, "id" | "minted_at">;
export type CoupleNFTRequestInsert = Omit<
  CoupleNFTRequest,
  "id" | "created_at" | "updated_at"
>;
export type NFTStakingInsert = Omit<NFTStaking, "id" | "staked_at">;
export type TokenStakingInsert = Omit<TokenStaking, "id" | "staked_at">;
export type BlockchainTransactionInsert = Omit<
  BlockchainTransaction,
  "id" | "created_at"
>;

// Cliente Supabase tipado con schema generado
export type BlockchainSupabaseClient = SupabaseClient<Database>;

// Helper para casting seguro de tipos blockchain
export function safeBlockchainCast<T>(data: unknown): T {
  return data as T;
}

// Helper para acceso seguro a propiedades
export function safeGet<T>(
  obj: unknown,
  key: string,
  defaultValue?: T,
): T | undefined {
  return obj && typeof obj === "object" && key in obj
    ? (obj as Record<string, T>)[key]
    : defaultValue;
}
