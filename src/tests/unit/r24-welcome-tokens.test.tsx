/**
 * Ronda 24, stream C — tokens de bienvenida CMPX usables.
 *
 * Verifica con discriminación (el test DEBE fallar contra el código
 * original: sin `WelcomeTokensService` ni los débitos, el crédito no
 * existe, el referido no tiene gate y la galería no cobra):
 *
 * (a) el crédito de bienvenida se acredita una sola vez (demo y real);
 * (b) el referido NO se acredita si el invitado no está verificado,
 *     SÍ cuando lo está, y no se paga dos veces al mismo par;
 * (c) gastar un regalo descuenta 10 CMPX y con saldo insuficiente no
 *     descuenta y reporta el error con ruta de recarga; crear un chat
 *     privado descuenta 25 CMPX (cableado en `ChatRoomService`);
 * (d) el acceso a galería no vuelve a cobrar dentro de 24 h (demo y
 *     real) y sí vuelve a cobrar expirada la ventana.
 *
 * Auditoría de precios pineada aquí (ver reporte del stream):
 * - Galería: `CMPX_COST = 100` CONSERVADO del código (objetivo de la
 *   ronda: 20). El test cobra 100 y lo deja explícito.
 * - Regalo: tarifa plana 10 CMPX por envío (los precios 50/200/100
 *   del catálogo mock son solo display, nunca se cobraron).
 * - Chat privado: 25 CMPX de CREACIÓN (el `tokenCost = 1` por defecto
 *   de `createPrivateRoom` es el costo de acceso por sala y se conserva).
 *
 * El cliente real de Supabase no se puede importar en vitest (misma
 * convención que r10/r13/r14/r15): se usa un fake en memoria con las
 * tablas que tocan el servicio (`user_token_balances`,
 * `token_transactions`, `referral_rewards`, `gallery_unlocks`,
 * `chat_rooms`, `chat_members`).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

type Row = Record<string, unknown>;

const fakeDb = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
}));

function resetFakeDb(): void {
  fakeDb.tables = {};
}

function seedFakeTable(table: string, rows: Row[]): void {
  fakeDb.tables[table] = rows.map((row) => ({ ...row }));
}

function fakeTable(table: string): Row[] {
  return fakeDb.tables[table] ?? [];
}

vi.mock("@/integrations/supabase/client", () => {
  function createFakeClient() {
    const from = (table: string) => {
      const state: {
        op: "select" | "insert" | "update";
        filters: Array<(row: Row) => boolean>;
        orderBy: { col: string; asc: boolean } | null;
        limitN: number | null;
        insertRows: Row[] | null;
        updatePatch: Row | null;
      } = {
        op: "select",
        filters: [],
        orderBy: null,
        limitN: null,
        insertRows: null,
        updatePatch: null,
      };

      const matches = (row: Row): boolean =>
        state.filters.every((f) => f(row));

      const runSelect = (): Row[] => {
        let rows = (fakeDb.tables[table] ?? []).filter(matches);
        if (state.orderBy) {
          const { col, asc } = state.orderBy;
          rows = [...rows].sort((a, b) => {
            const av = a[col];
            const bv = b[col];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return (av < bv ? -1 : 1) * (asc ? 1 : -1);
          });
        }
        if (state.limitN !== null) rows = rows.slice(0, state.limitN);
        return rows;
      };

      const execute = async (): Promise<{
        data: unknown;
        error: unknown;
      }> => {
        if (state.op === "insert") {
          const inserted = (state.insertRows ?? []).map((row) => {
            const created: Row = {
              id: `fake-${Math.random().toString(36).slice(2, 10)}`,
              created_at: new Date().toISOString(),
              ...row,
            };
            if (!fakeDb.tables[table]) fakeDb.tables[table] = [];
            fakeDb.tables[table].push(created);
            return created;
          });
          return {
            data: inserted.length === 1 ? inserted[0] : inserted,
            error: null,
          };
        }
        if (state.op === "update") {
          const rows = (fakeDb.tables[table] ?? []).filter(matches);
          for (const row of rows) {
            Object.assign(row, state.updatePatch, {
              updated_at: new Date().toISOString(),
            });
          }
          return { data: rows, error: null };
        }
        return { data: runSelect(), error: null };
      };

      const api: Record<string, unknown> = {};
      api.select = () => {
        // `insert().select()` en supabase-js sigue siendo un insert
        // que devuelve filas: no pisar la operación.
        if (state.op !== "insert" && state.op !== "update") {
          state.op = "select";
        }
        return api;
      };
      api.insert = (rows: Row | Row[]) => {
        state.op = "insert";
        state.insertRows = Array.isArray(rows) ? rows : [rows];
        return api;
      };
      api.update = (patch: Row) => {
        state.op = "update";
        state.updatePatch = patch;
        return api;
      };
      api.eq = (col: string, val: unknown) => {
        state.filters.push((row) => row[col] === val);
        return api;
      };
      api.order = (col: string, opts?: { ascending?: boolean }) => {
        state.orderBy = { col, asc: opts?.ascending !== false };
        return api;
      };
      api.limit = (n: number) => {
        state.limitN = n;
        return api;
      };
      api.range = () => api;
      api.maybeSingle = async () => {
        const rows = state.op === "select" ? runSelect() : [];
        return { data: rows[0] ?? null, error: null };
      };
      api.single = async () => {
        if (state.op === "insert" || state.op === "update") {
          const res = await execute();
          return { data: res.data, error: res.error };
        }
        const rows = runSelect();
        if (!rows[0]) {
          return {
            data: null,
            error: { code: "PGRST116", message: "no rows" },
          };
        }
        return { data: rows[0], error: null };
      };
      // El builder es awaitable (insert/update/select directos).
      api.then = (
        onFulfilled?: (value: { data: unknown; error: unknown }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => execute().then(onFulfilled, onRejected);
      return api;
    };

    return {
      from,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
        subscribe: () => ({}),
        unsubscribe: () => ({}),
      }),
      functions: {
        invoke: () => Promise.resolve({ data: null, error: null }),
      },
    };
  }

  return {
    supabase: createFakeClient(),
    isSupabaseConfigured: false,
    isDemoMode: true,
  };
});

import { ANONYMOUS_WALLET_BLOCKED_REASON } from "@/lib/anonymous";
import {
  DEMO_WALLET_STORAGE_KEY,
  getDemoWalletBalance,
  recordDemoGalleryUnlock,
} from "@/lib/demo-wallet";
import { ChatRoomService } from "@/services/chat/ChatRoomService";
import {
  GIFT_SEND_COST_CMPX,
  PRIVATE_CHAT_CREATE_COST_CMPX,
  TOP_UP_ROUTE,
  WELCOME_CREDIT_CMPX,
  isGalleryUnlockValid,
  welcomeTokensService,
} from "@/services/payments/WelcomeTokensService";
import { galleryPrivacyService } from "@/services/social/social/GalleryPrivacyService";

const DEMO_USER = "demo-user-1";
const INVITER = "inviter-1";
const INVITEE = "invitee-1";

function seedDemoBalance(cmpx: number): void {
  window.localStorage.setItem(
    DEMO_WALLET_STORAGE_KEY,
    JSON.stringify({
      single: { cmpx, gtk: 850 },
      couple: { cmpx: 2000, gtk: 1500 },
    }),
  );
}

function seedRealBalance(userId: string, cmpx: number): void {
  seedFakeTable("user_token_balances", [
    {
      id: `bal-${userId}`,
      user_id: userId,
      cmpx_balance: cmpx,
      gtk_balance: 0,
      referral_code: `REF${userId.slice(-8).toUpperCase()}`,
      world_id_verified: false,
    },
  ]);
}

describe("r24 — tokens de bienvenida CMPX usables", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetFakeDb();
    // Sin sesión demo: las rutas "reales" usan el fake de Supabase.
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("userType");
  });

  describe("(a) crédito de bienvenida: una sola vez", () => {
    it("demo: acredita 50 CMPX la primera vez y no vuelve a acreditar", async () => {
      const first = await welcomeTokensService.claimWelcomeCredit({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: false,
        isDemo: true,
      });
      // Semilla demo single: 1250 CMPX.
      expect(first.credited).toBe(true);
      expect(first.alreadyClaimed).toBe(false);
      expect(first.balance).toBe(1250 + WELCOME_CREDIT_CMPX);
      expect(getDemoWalletBalance("single").cmpx).toBe(
        1250 + WELCOME_CREDIT_CMPX,
      );

      const second = await welcomeTokensService.claimWelcomeCredit({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: false,
        isDemo: true,
      });
      expect(second.credited).toBe(false);
      expect(second.alreadyClaimed).toBe(true);
      expect(second.balance).toBe(1250 + WELCOME_CREDIT_CMPX);
      expect(getDemoWalletBalance("single").cmpx).toBe(
        1250 + WELCOME_CREDIT_CMPX,
      );
    });

    it("real: acredita 50 CMPX una vez y la segunda ve la transacción previa", async () => {
      seedRealBalance("u1", 10);

      const first = await welcomeTokensService.claimWelcomeCredit({
        userId: "u1",
        accountType: "single",
        isAnonymous: false,
        isDemo: false,
      });
      expect(first.credited).toBe(true);
      expect(first.balance).toBe(60);
      expect(
        fakeTable("token_transactions").filter(
          (tx) => tx.description === "Bono de bienvenida CMPX",
        ),
      ).toHaveLength(1);

      const second = await welcomeTokensService.claimWelcomeCredit({
        userId: "u1",
        accountType: "single",
        isAnonymous: false,
        isDemo: false,
      });
      expect(second.credited).toBe(false);
      expect(second.alreadyClaimed).toBe(true);
      expect(second.balance).toBe(60);
      expect(
        fakeTable("token_transactions").filter(
          (tx) => tx.description === "Bono de bienvenida CMPX",
        ),
      ).toHaveLength(1);
    });

    it("anónimo: no acredita nada", async () => {
      const result = await welcomeTokensService.claimWelcomeCredit({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: true,
        isDemo: true,
      });
      expect(result.credited).toBe(false);
      expect(result.error).toBe(ANONYMOUS_WALLET_BLOCKED_REASON);
      expect(getDemoWalletBalance("single").cmpx).toBe(1250);
    });
  });

  describe("(b) referido: gate de verificación + anti-farm", () => {
    it("demo: sin verificar NO paga; verificado SÍ; el mismo par no cobra dos veces", async () => {
      const notVerified =
        await welcomeTokensService.creditReferralReward({
          inviterId: INVITER,
          inviteeId: INVITEE,
          isInviteeVerified: false,
          isDemo: true,
          inviterAccountType: "single",
        });
      expect(notVerified.credited).toBe(false);
      expect(notVerified.reason).toBe("not_verified");
      expect(getDemoWalletBalance("single").cmpx).toBe(1250);

      const verified = await welcomeTokensService.creditReferralReward({
        inviterId: INVITER,
        inviteeId: INVITEE,
        isInviteeVerified: true,
        isDemo: true,
        inviterAccountType: "single",
      });
      expect(verified.credited).toBe(true);
      expect(verified.reason).toBe("credited");
      expect(getDemoWalletBalance("single").cmpx).toBe(1300);

      const again = await welcomeTokensService.creditReferralReward({
        inviterId: INVITER,
        inviteeId: INVITEE,
        isInviteeVerified: true,
        isDemo: true,
        inviterAccountType: "single",
      });
      expect(again.credited).toBe(false);
      expect(again.reason).toBe("already_rewarded");
      expect(getDemoWalletBalance("single").cmpx).toBe(1300);
    });

    it("real: lee world_id_verified del invitado y registra la recompensa una sola vez", async () => {
      seedFakeTable("user_token_balances", [
        {
          id: "bal-inviter",
          user_id: INVITER,
          cmpx_balance: 0,
          gtk_balance: 0,
          referral_code: "REFINVITER",
          world_id_verified: true,
        },
        {
          id: "bal-invitee",
          user_id: INVITEE,
          cmpx_balance: 0,
          gtk_balance: 0,
          referral_code: "REFINVITEE",
          world_id_verified: false,
        },
      ]);

      const notVerified =
        await welcomeTokensService.creditReferralReward({
          inviterId: INVITER,
          inviteeId: INVITEE,
          isDemo: false,
        });
      expect(notVerified.credited).toBe(false);
      expect(notVerified.reason).toBe("not_verified");
      expect(fakeTable("referral_rewards")).toHaveLength(0);

      // El invitado verifica (World ID/KYC).
      const inviteeRow = fakeTable("user_token_balances").find(
        (row) => row.user_id === INVITEE,
      );
      if (inviteeRow) inviteeRow.world_id_verified = true;

      const verified = await welcomeTokensService.creditReferralReward({
        inviterId: INVITER,
        inviteeId: INVITEE,
        isDemo: false,
      });
      expect(verified.credited).toBe(true);
      expect(verified.reason).toBe("credited");
      expect(fakeTable("referral_rewards")).toHaveLength(1);
      expect(
        fakeTable("user_token_balances").find(
          (row) => row.user_id === INVITER,
        )?.cmpx_balance,
      ).toBe(50);

      const again = await welcomeTokensService.creditReferralReward({
        inviterId: INVITER,
        inviteeId: INVITEE,
        isDemo: false,
      });
      expect(again.credited).toBe(false);
      expect(again.reason).toBe("already_rewarded");
      expect(fakeTable("referral_rewards")).toHaveLength(1);
    });
  });

  describe("(c) gasto: regalo 10 CMPX y chat privado 25 CMPX", () => {
    it("demo: enviar un regalo descuenta 10 CMPX", async () => {
      const result = await welcomeTokensService.spendForGift({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: false,
        isDemo: true,
        giftId: 1,
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1250 - GIFT_SEND_COST_CMPX);
      expect(getDemoWalletBalance("single").cmpx).toBe(
        1250 - GIFT_SEND_COST_CMPX,
      );
    });

    it("demo: con saldo insuficiente no descuenta y reporta recarga", async () => {
      seedDemoBalance(5);

      const result = await welcomeTokensService.spendForGift({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: false,
        isDemo: true,
        giftId: 1,
      });
      expect(result.success).toBe(false);
      expect(result.needsTopUp).toBe(true);
      expect(result.topUpRoute).toBe(TOP_UP_ROUTE);
      expect(result.error).toMatch(/Saldo insuficiente/);
      expect(result.newBalance).toBe(5);
      expect(getDemoWalletBalance("single").cmpx).toBe(5);
    });

    it("demo: crear chat privado descuenta 25 CMPX", async () => {
      const result = await welcomeTokensService.spendForPrivateChat({
        userId: DEMO_USER,
        accountType: "single",
        isAnonymous: false,
        isDemo: true,
      });
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1250 - PRIVATE_CHAT_CREATE_COST_CMPX);
    });

    it("real: crear sala privada cobra 25 CMPX al creador y conserva token_cost", async () => {
      seedRealBalance("u1", 100);

      const room = await ChatRoomService.createPrivateRoom(
        "Sala test",
        "desc",
        1,
        100,
        "u1",
      );
      expect(room).not.toBeNull();
      expect(room?.token_cost).toBe(1);
      expect(
        fakeTable("user_token_balances").find((row) => row.user_id === "u1")
          ?.cmpx_balance,
      ).toBe(100 - PRIVATE_CHAT_CREATE_COST_CMPX);
    });

    it("real: crear sala privada sin saldo NO crea la sala ni descuenta", async () => {
      seedRealBalance("u2", 10);

      const room = await ChatRoomService.createPrivateRoom(
        "Sala test",
        "desc",
        1,
        100,
        "u2",
      );
      expect(room).toBeNull();
      expect(fakeTable("chat_rooms")).toHaveLength(0);
      expect(
        fakeTable("user_token_balances").find((row) => row.user_id === "u2")
          ?.cmpx_balance,
      ).toBe(10);
    });
  });

  describe("(d) galería privada: sin doble cobro dentro de 24 h", () => {
    beforeEach(() => {
      // Rama demo de GalleryPrivacyService.
      window.localStorage.setItem("demo_authenticated", "true");
      window.localStorage.setItem("userType", "single");
    });

    it("el precio conservado del código es 100 CMPX (no 20)", () => {
      expect(galleryPrivacyService.getCMPCost()).toBe(100);
    });

    it("demo: primer desbloqueo cobra 100, el segundo dentro de 24 h no cobra", async () => {
      const first = await galleryPrivacyService.unlockGallery(
        DEMO_USER,
        "profile-1",
        "creator-1",
      );
      expect(first.success).toBe(true);
      expect(getDemoWalletBalance("single").cmpx).toBe(1250 - 100);

      const second = await galleryPrivacyService.unlockGallery(
        DEMO_USER,
        "profile-1",
        "creator-1",
      );
      expect(second.success).toBe(true);
      expect(getDemoWalletBalance("single").cmpx).toBe(1250 - 100);
      expect(
        await galleryPrivacyService.hasGalleryAccess(DEMO_USER, "profile-1"),
      ).toBe(true);
    });

    it("demo: expirada la ventana (25 h) vuelve a cobrar", async () => {
      await galleryPrivacyService.unlockGallery(
        DEMO_USER,
        "profile-1",
        "creator-1",
      );
      expect(getDemoWalletBalance("single").cmpx).toBe(1150);

      // Envejecer el desbloqueo 25 h.
      recordDemoGalleryUnlock(
        DEMO_USER,
        "profile-1",
        new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      );
      expect(
        await galleryPrivacyService.hasGalleryAccess(DEMO_USER, "profile-1"),
      ).toBe(false);

      const again = await galleryPrivacyService.unlockGallery(
        DEMO_USER,
        "profile-1",
        "creator-1",
      );
      expect(again.success).toBe(true);
      expect(getDemoWalletBalance("single").cmpx).toBe(1050);
    });

    it("real: sin doble cobro dentro de 24 h y cobro al expirar", async () => {
      window.localStorage.removeItem("demo_authenticated");
      seedRealBalance("u1", 500);

      const first = await galleryPrivacyService.unlockGallery(
        "u1",
        "profile-1",
        "creator-1",
      );
      expect(first.success).toBe(true);
      expect(
        fakeTable("user_token_balances").find((row) => row.user_id === "u1")
          ?.cmpx_balance,
      ).toBe(400);

      const second = await galleryPrivacyService.unlockGallery(
        "u1",
        "profile-1",
        "creator-1",
      );
      expect(second.success).toBe(true);
      expect(
        fakeTable("user_token_balances").find((row) => row.user_id === "u1")
          ?.cmpx_balance,
      ).toBe(400);
      expect(fakeTable("gallery_unlocks")).toHaveLength(1);

      const unlockRow = fakeTable("gallery_unlocks")[0];
      if (unlockRow) {
        unlockRow.created_at = new Date(
          Date.now() - 25 * 60 * 60 * 1000,
        ).toISOString();
      }
      expect(await galleryPrivacyService.hasGalleryAccess("u1", "profile-1")).toBe(false);

      const again = await galleryPrivacyService.unlockGallery(
        "u1",
        "profile-1",
        "creator-1",
      );
      expect(again.success).toBe(true);
      expect(
        fakeTable("user_token_balances").find((row) => row.user_id === "u1")
          ?.cmpx_balance,
      ).toBe(300);
      expect(fakeTable("gallery_unlocks")).toHaveLength(2);
    });

    it("isGalleryUnlockValid: ventana de 24 h exacta", () => {
      const now = Date.now();
      expect(isGalleryUnlockValid(null, now)).toBe(false);
      expect(isGalleryUnlockValid("no-fecha", now)).toBe(false);
      expect(
        isGalleryUnlockValid(
          new Date(now - 23 * 60 * 60 * 1000).toISOString(),
          now,
        ),
      ).toBe(true);
      expect(
        isGalleryUnlockValid(
          new Date(now - 25 * 60 * 60 * 1000).toISOString(),
          now,
        ),
      ).toBe(false);
    });
  });
});
