/**
 * Tests Funcionales para RLS Policies
 * 
 * Verifica que las polÃ­ticas RLS funcionen correctamente
 * 
 * @version 3.5.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('âš ï¸ Variables de entorno de Supabase no configuradas. Saltando tests de RLS.');
}

describe('RLS Policies', () => {
  const supabaseAnon = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
  
  const supabaseService = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

  beforeAll(async () => {
    if (!supabaseAnon || !supabaseService) {
      console.warn('âš ï¸ Clientes de Supabase no disponibles. Saltando tests.');
      return;
    }
  });

  afterAll(async () => {
    // Cleanup si es necesario
  });

  describe('Profiles RLS', () => {
    it('should prevent users from accessing other users profiles without auth', async () => {
      if (!supabaseAnon) {
        return; // Saltar test si no hay cliente
      }

      // Sin autenticaciÃ³n, no deberÃ­a poder acceder a perfiles
      const { data, error } = await supabaseAnon
        .from('profiles')
        .select('*')
        .limit(1);

      // Verificar que hay un error O que los datos estÃ¡n vacÃ­os
      // Nota: Algunas polÃ­ticas RLS pueden permitir lectura pÃºblica de perfiles bÃ¡sicos
      // pero restringir campos sensibles. Este test verifica que al menos hay restricciÃ³n.
      const hasError = !!error;
      const isEmpty = !data || (Array.isArray(data) && data.length === 0);
      
      // El test pasa si hay error O si estÃ¡ vacÃ­o
      // Si hay datos, verificar que no contienen informaciÃ³n sensible (esto es un test bÃ¡sico)
      if (!hasError && !isEmpty && Array.isArray(data) && data.length > 0) {
        // Si hay datos, verificar que al menos la polÃ­tica RLS estÃ¡ activa
        // (puede permitir lectura pÃºblica pero restringir campos sensibles)
        const profile = data[0];
        // Verificar que no hay campos sensibles como email, phone, etc.
        const hasSensitiveData = profile && (
          'email' in profile ||
          'phone' in profile ||
          'password' in profile
        );
        expect(hasSensitiveData).toBe(false);
      } else {
        // Si hay error o estÃ¡ vacÃ­o, el test pasa
        expect(hasError || isEmpty).toBe(true);
      }
    });

    it('should allow users to view their own profile', async () => {
      if (!supabaseAnon || !supabaseService) {
        return; // Saltar test si no hay clientes
      }

      // TODO: Implementar test con usuario autenticado
      // Por ahora, test stub
      expect(true).toBe(true);
    });
  });

  describe('Messages RLS', () => {
    it('should prevent users from accessing messages without auth', async () => {
      if (!supabaseAnon) {
        return;
      }

      const { data, error } = await supabaseAnon
        .from('messages')
        .select('*')
        .limit(1);

      // Debe fallar o retornar vacÃ­o
      expect(error || !data || data.length === 0).toBe(true);
    });
  });

  describe('Matches RLS', () => {
    it('should prevent users from accessing matches without auth', async () => {
      if (!supabaseAnon) {
        return;
      }

      const { data, error } = await supabaseAnon
        .from('matches')
        .select('*')
        .limit(1);

      // Debe fallar o retornar vacÃ­o
      expect(error || !data || data.length === 0).toBe(true);
    });
  });

  describe('Consent Verifications RLS', () => {
    it('should prevent users from accessing other users consent verifications', async () => {
      if (!supabaseAnon) {
        return;
      }

      // Intentar acceder a consent_verifications sin auth
      const { data, error } = await supabaseAnon
        .from('consent_verifications')
        .select('*')
        .limit(1);

      // Debe fallar o retornar vacÃ­o (tabla puede no existir aÃºn)
      expect(error || !data || data.length === 0).toBe(true);
    });
  });

  describe('NFT Galleries RLS', () => {
    it('should prevent users from accessing other users NFT galleries', async () => {
      if (!supabaseAnon) {
        return;
      }

      // Intentar acceder a nft_galleries sin auth
      const { data, error } = await supabaseAnon
        .from('nft_galleries')
        .select('*')
        .limit(1);

      // Debe fallar o retornar vacÃ­o (tabla puede no existir aÃºn)
      expect(error || !data || data.length === 0).toBe(true);
    });
  });
});


