/**
 * Ronda 12, stream D: brechas Supabase del análisis 2026-11-25.
 *
 * - D1: `friendships` se insertaba sin ordenar el par (violación del
 *   CHECK user_id_a < user_id_b en ~50 % de los aceptes) y el
 *   `respondFriendRequest` marcaba la solicitud como "accepted"
 *   ANTES del insert, sin rollback. Ahora el par se ordena
 *   (`sortFriendshipPair`) y la amistad se crea PRIMERO: si el
 *   insert falla, la solicitud sigue "pending".
 * - D2: RPC `start_staking` sin DDL + RPC `check_identity_retained`
 *   nueva + endurecimiento de políticas de `club_events` /
 *   `club_discounts`: sin base viva aquí, se verifican por contenido
 *   del archivo de migración 20261124050004 (la SQL NO se ejecutó
 *   contra una BD en esta ronda).
 * - D3: `retained_identities` estaba muerta (cero llamadas a
 *   `retainIdentityAfterBan`): ahora `createPermanentBan` retiene
 *   la identidad (best-effort) y el registro real la consulta vía
 *   `checkIdentityRetained` (fail-open si la RPC falta).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Estado del mock de Supabase, compartido entre la factoría de
// `vi.mock` (hoisted) y los tests. Misma convención que
// r10-stream-c: el cliente real no se puede importar en vitest.
const mocks = vi.hoisted(() => ({
  requestRow: {
    requester_id: "11111111-1111-1111-1111-111111111111",
    addressee_id: "22222222-2222-2222-2222-222222222222",
    kind: "friendship",
  } as Record<string, string> | null,
  requestError: null as { message: string } | null,
  friendshipError: null as { message: string } | null,
  updateError: null as { message: string } | null,
  friendshipInserts: [] as Array<Record<string, unknown>>,
  requestUpdates: [] as Array<Record<string, unknown>>,
  retainedInserts: [] as Array<Record<string, unknown>>,
  retainedError: null as { message: string } | null,
  rpcCalls: [] as Array<{ name: string; args: unknown }>,
  rpcResult: { data: true, error: null } as {
    data: unknown;
    error: { message: string } | null;
  },
  // Filas de profiles, clave `${columna}=${valor}`.
  profileRows: {} as Record<string, Record<string, unknown> | null>,
  banInsertError: null as { message: string } | null,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "friend_requests") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mocks.requestRow,
                  error: mocks.requestError,
                }),
            }),
          }),
          update: (patch: Record<string, unknown>) => {
            mocks.requestUpdates.push(patch);
            return {
              eq: () =>
                Promise.resolve({ error: mocks.updateError }),
            };
          },
        };
      }
      if (table === "friendships") {
        return {
          insert: (payload: Record<string, unknown>) => {
            mocks.friendshipInserts.push(payload);
            return Promise.resolve({ error: mocks.friendshipError });
          },
        };
      }
      if (table === "retained_identities") {
        return {
          insert: (payload: Record<string, unknown>) => {
            mocks.retainedInserts.push(payload);
            return Promise.resolve({ error: mocks.retainedError });
          },
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: mocks.profileRows[`${col}=${val}`] ?? null,
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "permanent_bans") {
        return {
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: "ban-1" },
                  error: mocks.banInsertError,
                }),
            }),
          }),
        };
      }
      throw new Error(`tabla no mockeada en r12-stream-d: ${table}`);
    },
    rpc: (name: string, args: unknown) => {
      mocks.rpcCalls.push({ name, args });
      return Promise.resolve(mocks.rpcResult);
    },
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: true,
  isDemoMode: false,
}));

// La huella digital usa canvas: no corre en happy-dom.
vi.mock("@/services/auth/digitalFingerprint", () => ({
  generateDigitalFingerprint: () =>
    Promise.resolve({
      canvasHash: "canvas-test",
      canvasData: "data-test",
      browserFingerprint: "browser-test",
      combinedHash: "combined-test",
    }),
  checkFingerprintBanned: () => Promise.resolve(false),
}));

import {
  respondFriendRequest,
  sortFriendshipPair,
} from "@/lib/friends";
import {
  checkIdentityRetained,
  isIdentityRetainedDemo,
  retainIdentityAfterBan,
} from "@/lib/reportBlock";
import {
  createPermanentBan,
  retainIdentityAfterPermanentBan,
} from "@/services/auth/permanentBan";

const REQUESTER = "11111111-1111-1111-1111-111111111111";
const ADDRESSEE = "22222222-2222-2222-2222-222222222222";

// Rutas resueltas desde la raíz del repo (cwd de vitest): `import.meta.url`
// no es file:// bajo la transformación de vitest.
const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20261124050004_ronda12_rpc_staking_retained_clubs.sql",
);
const TYPES_PATH = join(process.cwd(), "src/types/supabase-generated.ts");

beforeEach(() => {
  window.localStorage.clear();
  mocks.requestRow = {
    requester_id: REQUESTER,
    addressee_id: ADDRESSEE,
    kind: "friendship",
  };
  mocks.requestError = null;
  mocks.friendshipError = null;
  mocks.updateError = null;
  mocks.friendshipInserts = [];
  mocks.requestUpdates = [];
  mocks.retainedInserts = [];
  mocks.retainedError = null;
  mocks.rpcCalls = [];
  mocks.rpcResult = { data: true, error: null };
  mocks.profileRows = {};
  mocks.banInsertError = null;
});

describe("D1: par de friendships ordenado (CHECK user_id_a < user_id_b)", () => {
  it("sortFriendshipPair ordena en ambos sentidos", () => {
    expect(sortFriendshipPair(REQUESTER, ADDRESSEE)).toEqual([
      REQUESTER,
      ADDRESSEE,
    ]);
    expect(sortFriendshipPair(ADDRESSEE, REQUESTER)).toEqual([
      REQUESTER,
      ADDRESSEE,
    ]);
    expect(sortFriendshipPair(REQUESTER, REQUESTER)).toEqual([
      REQUESTER,
      REQUESTER,
    ]);
  });

  it("aceptar con requester < addressee inserta el par tal cual", async () => {
    const result = await respondFriendRequest("req-1", "accepted", false);
    expect(result.ok).toBe(true);
    expect(mocks.friendshipInserts).toHaveLength(1);
    expect(mocks.friendshipInserts[0]).toEqual({
      user_id_a: REQUESTER,
      user_id_b: ADDRESSEE,
    });
    expect(mocks.requestUpdates).toEqual([{ status: "accepted" }]);
  });

  it("aceptar con requester > addressee inserta el par ORDENADO (min, max)", async () => {
    mocks.requestRow = {
      requester_id: ADDRESSEE,
      addressee_id: REQUESTER,
      kind: "friendship",
    };
    const result = await respondFriendRequest("req-1", "accepted", false);
    expect(result.ok).toBe(true);
    expect(mocks.friendshipInserts).toHaveLength(1);
    // Sin ordenar, este insert violaba el CHECK el ~50 % de las veces.
    expect(mocks.friendshipInserts[0]).toEqual({
      user_id_a: REQUESTER,
      user_id_b: ADDRESSEE,
    });
    expect(mocks.requestUpdates).toEqual([{ status: "accepted" }]);
  });

  it("si el insert de la amistad falla, la solicitud NO queda 'accepted'", async () => {
    mocks.friendshipError = { message: "check constraint violated" };
    const result = await respondFriendRequest("req-1", "accepted", false);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("check constraint violated");
    expect(mocks.friendshipInserts).toHaveLength(1);
    // Antes el update corría primero y la solicitud quedaba aceptada
    // sin amistad; ahora el update no se ejecuta.
    expect(mocks.requestUpdates).toHaveLength(0);
  });

  it("declinar no crea amistad y solo actualiza el estado", async () => {
    const result = await respondFriendRequest("req-1", "declined", false);
    expect(result.ok).toBe(true);
    expect(mocks.friendshipInserts).toHaveLength(0);
    expect(mocks.requestUpdates).toEqual([{ status: "declined" }]);
  });
});

describe("D2: migración 20261124050004 (contenido SQL, sin BD viva)", () => {
  const sql = () => readFileSync(MIGRATION_PATH, "utf8");

  it("start_staking existe, es SECURITY DEFINER con search_path vacío y verifica auth.uid()", () => {
    const text = sql();
    expect(text).toContain(
      "create or replace function public.start_staking(",
    );
    expect(text).toContain("security definer");
    expect(text).toContain("set search_path = ''");
    expect(text).toContain("auth.uid()");
    // Firma igual a la llamada del cliente (useTokens.ts): 4 args.
    expect(text).toContain("user_id_param uuid");
    expect(text).toContain("amount_param integer");
    expect(text).toContain("duration_days integer");
    expect(text).toContain("token_type_param text");
    // Límites del StakingSchema del cliente.
    expect(text).toContain("amount_param < 10 or amount_param > 10000");
    expect(text).toContain("duration_days < 1 or duration_days > 365");
    expect(text).toContain("not in ('cmpx', 'gtk')");
    // Solo autenticados: anon no ejecuta staking.
    expect(text).toContain(
      "grant execute on function public.start_staking(uuid, integer, integer, text) to authenticated;",
    );
    expect(text).not.toContain(
      "grant execute on function public.start_staking(uuid, integer, integer, text) to anon",
    );
    // Corrección por verificación en vivo 2026-11-25: producción YA
    // tiene start_staking de 3 args (uuid, integer, integer),
    // security_definer false, sin token_type_param. CREATE OR
    // REPLACE de la versión de 4 args no la sustituiría (sobrecarga)
    // y la insegura seguiría viva: la migración la elimina antes.
    expect(text).toContain(
      "drop function if exists public.start_staking(uuid, integer, integer);",
    );
  });

  it("check_identity_retained existe y es ejecutable por anon (registro sin sesión)", () => {
    const text = sql();
    expect(text).toContain(
      "create or replace function public.check_identity_retained(p_email text, p_username text)",
    );
    expect(text).toContain("security definer");
    expect(text).toContain("from public.retained_identities");
    expect(text).toContain(
      "grant execute on function public.check_identity_retained(text, text) to anon, authenticated;",
    );
  });

  it("políticas de club: solo dueño (created_by = auth.uid()) o admin (profiles.is_admin)", () => {
    const text = sql();
    expect(text).toContain(
      "create or replace function public.is_club_owner_or_admin(p_club_id uuid)",
    );
    expect(text).toContain("c.created_by = auth.uid()");
    expect(text).toContain("p.is_admin = true");
    for (const table of ["club_events", "club_discounts"]) {
      for (const cmd of ["insert", "update", "delete"]) {
        expect(text).toContain(
          `drop policy if exists ${table}_${cmd}_policy on public.${table};`,
        );
        expect(text).toContain(`${table}_${cmd}_policy`);
      }
      expect(text).toContain(
        `public.is_club_owner_or_admin(club_id)`,
      );
    }
    // Las SELECT no se tocan: las filas activas siguen legibles.
    expect(text).not.toContain("drop policy if exists club_events_select_policy");
    expect(text).not.toContain(
      "drop policy if exists club_discounts_select_policy",
    );
  });

  it("los tipos generados tipan las RPC nuevas y la firma real de start_staking", () => {
    const types = readFileSync(TYPES_PATH, "utf8");
    expect(types).toContain("check_identity_retained: {");
    expect(types).toContain("is_club_owner_or_admin: {");
    // start_staking ya existía con firma vieja (sin token_type_param,
    // duration_days opcional); ahora coincide con la RPC y el cliente.
    const start = types.slice(types.indexOf("start_staking: {"));
    expect(start).toContain("token_type_param: string");
    expect(start).not.toContain("duration_days?: number");
  });
});

describe("D3: retained_identities deja de estar muerta", () => {
  it("checkIdentityRetained llama a la RPC y respeta su veredicto", async () => {
    mocks.rpcResult = { data: true, error: null };
    await expect(
      checkIdentityRetained("baneado@x.com", "baneado"),
    ).resolves.toEqual({ retained: true, checked: true });
    expect(mocks.rpcCalls).toEqual([
      {
        name: "check_identity_retained",
        args: { p_email: "baneado@x.com", p_username: "baneado" },
      },
    ]);
  });

  it("checkIdentityRetained hace fail-open si la RPC falta (migración sin aplicar)", async () => {
    mocks.rpcResult = {
      data: null,
      error: { message: "function does not exist" },
    };
    await expect(
      checkIdentityRetained("normal@x.com", "normal"),
    ).resolves.toEqual({ retained: false, checked: false });
  });

  it("retainIdentityAfterBan inserta con el correo en minúsculas y banned_by NULL si no se resuelve", async () => {
    const result = await retainIdentityAfterBan({
      email: "Baneado@X.com",
      username: "baneado",
      userId: "user-1",
      reason: "spam",
    });
    expect(result.ok).toBe(true);
    expect(mocks.retainedInserts).toHaveLength(1);
    expect(mocks.retainedInserts[0]).toMatchObject({
      email: "baneado@x.com",
      username: "baneado",
      user_id: "user-1",
      ban_reason: "spam",
      banned_by: null,
    });
  });

  it("retainIdentityAfterPermanentBan retiene tras el baneo sin romperlo si el perfil no existe", async () => {
    // Sin fila en profiles: la retención se omite con warning y el
    // baneo ya quedó creado (el helper no lanza).
    await expect(
      retainIdentityAfterPermanentBan(
        { userId: "auth-uid-1", banReason: "spam", severity: "high" },
        "mod-auth-uid",
      ),
    ).resolves.toBeUndefined();
    expect(mocks.retainedInserts).toHaveLength(0);
  });

  it("createPermanentBan retiene la identidad del baneado (perfil + moderador resolvibles)", async () => {
    mocks.profileRows["user_id=auth-uid-1"] = {
      email: "Baneado@X.com",
      nickname: "baneado",
      display_name: "Baneado",
    };
    mocks.profileRows["user_id=mod-auth-uid"] = { id: "profile-mod-1" };
    const banId = await createPermanentBan(
      {
        userId: "auth-uid-1",
        banReason: "spam",
        severity: "high",
        evidence: { report_id: "rep-9" },
      },
      "mod-auth-uid",
    );
    expect(banId).toBe("ban-1");
    expect(mocks.retainedInserts).toHaveLength(1);
    expect(mocks.retainedInserts[0]).toMatchObject({
      email: "baneado@x.com",
      username: "baneado",
      user_id: "auth-uid-1",
      ban_reason: "spam",
      report_id: "rep-9",
      banned_by: "profile-mod-1",
    });
  });

  it("el espejo demo sigue funcionando (isIdentityRetainedDemo consultable)", () => {
    expect(isIdentityRetainedDemo("nadie@demo.local")).toBe(false);
  });
});
