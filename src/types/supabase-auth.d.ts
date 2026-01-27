/**
 * Tipos para configuración de autenticación de Supabase
 * Definiciones estrictas para evitar uso de 'any'
 */

import type { AuthFlowType } from "@supabase/supabase-js";

export interface SupabaseAuthConfig {
  persistSession: boolean;
  autoRefreshToken: boolean;
  detectSessionInUrl: boolean;
  flowType: AuthFlowType;
  debug: boolean;
}

export interface SupabaseGlobalConfig {
  headers: Record<string, string>;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface SupabaseClientConfig {
  auth: SupabaseAuthConfig;
  global: SupabaseGlobalConfig;
  realtime?: {
    params: {
      eventsPerSecond: number;
    };
  };
}
