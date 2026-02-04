// src/entities/user.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  reset_token_hash?: string;
  token_expiry?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
}
