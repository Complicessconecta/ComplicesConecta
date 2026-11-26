/**
 * Ronda 9, stream E — regresión del fallo de arranque sin variables.
 *
 * Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, `AppConfig.supabase.url`
 * es `undefined` y `normalizeSupabaseUrl` hacía `url.replace(...)` en el
 * top-level de `src/integrations/supabase/client.ts`. Ese módulo lo evalúa
 * al arrancar el chunk pages-chat (importado estáticamente por el bundle
 * principal), así que el `TypeError: Cannot read properties of undefined
 * (reading 'replace')` dejaba la app en blanco en TODAS las rutas
 * (reproducido en build de producción local servido con vite preview:
 * #root vacío, sin render).
 *
 * El comportamiento esperado sin variables es el stub documentado en el
 * propio módulo: `isSupabaseConfigured === false` y cliente stub cuya
 * fetch rechaza con "Supabase not configured - using stub client".
 * El fetch del stub NO se aserta aquí: `src/tests/setup.ts` mockea
 * `@supabase/supabase-js` globalmente, así que en vitest `createClient`
 * es un mock con respuestas vacías; el comportamiento del stub real se
 * verificó con el arranque del build de producción (ver reporte r9-e).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("supabase client sin variables de entorno (r9 stream E)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  });

  it("importar el módulo no truena y reporta Supabase no configurado", async () => {
    let mod: typeof import("@/integrations/supabase/client") | undefined;
    await expect(
      (async () => {
        mod = await import("@/integrations/supabase/client");
      })(),
    ).resolves.toBeUndefined();
    expect(mod).toBeDefined();
    expect(mod!.isSupabaseConfigured).toBe(false);
  });
});
