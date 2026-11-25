/**
 * Ronda 8, stream C: Chat Íntimo (punto 5), visibilidad de pareja en
 * Discover (punto 9), pestaña Notificaciones del Dashboard (punto 10)
 * y gate de perfil privado (punto 11).
 *
 * Punto 9/11: el filtro de Discover y el gate de perfil privado
 * buscaban los ajustes del dueño con el id de la TARJETA demo, que
 * nadie escribe: la pareja invisible seguía en Discover y su perfil
 * privado nunca se cerraba. El puente `resolveDemoOwnerIdentity`
 * resuelve el id del usuario demo antes de leer.
 *
 * Punto 5: el dock pagaba en frío la descarga del chunk `pages-chat`
 * sin cota de espera. `loadChatModule` ahora rechaza a los 6 s para
 * que el boundary ofrezca Reintentar / página completa.
 *
 * Punto 10: los action_url de logro/conexión apuntaban a rutas que no
 * existen (/achievements, /connections) y el clic aterrizaba en 404.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// El cliente real de Supabase no se puede importar en vitest:
// `AppConfig.supabase.url` es undefined y `normalizeSupabaseUrl`
// revienta al importar el módulo. Misma convención que
// r7-stream-a.test.ts: mock del cliente (aquí, sin backend, como el
// preview: `isSupabaseConfigured` en false). El `insert` captura la
// fila para verificar los action_url del punto 10.
const insertedRows: Array<Record<string, unknown>> = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: (row: Record<string, unknown>) => {
        insertedRows.push(row);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      },
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

import { generateDemoUserUUID } from "@/lib/demo-uuid";
import {
  CHAT_LOAD_TIMEOUT_MS,
  loadChatModule,
} from "@/lib/intimateChat";
import {
  readDemoProfilePrivacySettings,
  resolveDemoOwnerIdentity,
  shouldShowInDiscover,
} from "@/lib/visibility";
import {
  isProfileGated,
  readVisibilityLocalOrNull,
  resolveProfileVisibility,
} from "@/lib/profileVisibility";
import { NotificationService } from "@/lib/notifications";

const COUPLE_USER_ID = generateDemoUserUUID("pareja@outlook.es");
const SINGLE_USER_ID = generateDemoUserUUID("single@outlook.es");

beforeEach(() => {
  window.localStorage.clear();
  insertedRows.length = 0;
  vi.useRealTimers();
});

describe("punto 9: visibilidad de la pareja en Discover", () => {
  it("el puente resuelve la tarjeta 6 (Carmen & Roberto) a la cuenta demo pareja", () => {
    const owner = resolveDemoOwnerIdentity(
      "cualquier-id-de-tarjeta",
      "Carmen & Roberto",
    );
    expect(owner).toEqual({ userId: COUPLE_USER_ID, type: "couple" });
  });

  it("el puente resuelve la ficha demo-couple-456 y el id de usuario tal cual", () => {
    expect(resolveDemoOwnerIdentity("demo-couple-456")).toEqual({
      userId: COUPLE_USER_ID,
      type: "couple",
    });
    expect(resolveDemoOwnerIdentity(COUPLE_USER_ID)).toEqual({
      userId: COUPLE_USER_ID,
      type: "couple",
    });
    expect(resolveDemoOwnerIdentity("demo-single-1")).toEqual({
      userId: SINGLE_USER_ID,
      type: "single",
    });
  });

  it("sin dueño canónico no hay puente (el resto de tarjetas no cambia)", () => {
    expect(resolveDemoOwnerIdentity("otro-uuid", "Ana")).toBeNull();
    expect(resolveDemoOwnerIdentity("", null)).toBeNull();
  });

  it("pareja invisible: su tarjeta ya NO pasa el filtro de Discover", () => {
    window.localStorage.setItem(
      `couple_privacy:${COUPLE_USER_ID}`,
      JSON.stringify({ invisible: true }),
    );
    const settings = readDemoProfilePrivacySettings(
      "id-tarjeta-demo-profile-6",
      "couple",
      "Carmen & Roberto",
    );
    expect(settings.invisible).toBe(true);
    expect(
      shouldShowInDiscover(
        {
          id: "id-tarjeta-demo-profile-6",
          isVerified: true,
          privacySettings: settings,
        },
        null,
      ),
    ).toBe(false);
  });

  it("pareja visible: su tarjeta SÍ pasa el filtro (sin regresión)", () => {
    const settings = readDemoProfilePrivacySettings(
      "id-tarjeta-demo-profile-6",
      "couple",
      "Carmen & Roberto",
    );
    expect(settings.invisible).toBe(false);
    expect(
      shouldShowInDiscover(
        {
          id: "id-tarjeta-demo-profile-6",
          isVerified: true,
          privacySettings: settings,
        },
        null,
      ),
    ).toBe(true);
  });
});

describe("punto 11: gate de perfil privado para no-amigos", () => {
  it("la visibilidad guardada por la pareja se lee con su id de usuario", () => {
    window.localStorage.setItem(
      `profile_visibility:${COUPLE_USER_ID}`,
      "private",
    );
    const ownerId =
      resolveDemoOwnerIdentity("demo-couple-456", "Carmen & Roberto")
        ?.userId ?? "demo-couple-456";
    expect(readVisibilityLocalOrNull(ownerId)).toBe("private");
    expect(
      resolveProfileVisibility({
        dbVisibility: null,
        storedVisibility: readVisibilityLocalOrNull(ownerId),
        seedVisibility: "public",
      }),
    ).toBe("private");
  });

  it("perfil privado + no amigo => gate; amigo o dueño => sin gate", () => {
    const gated = { visibility: "private" as const, isFriend: false, isOwner: false };
    expect(isProfileGated(gated)).toBe(true);
    expect(
      isProfileGated({ ...gated, isFriend: true }),
    ).toBe(false);
    expect(
      isProfileGated({ ...gated, isOwner: true }),
    ).toBe(false);
    expect(
      isProfileGated({
        visibility: "public",
        isFriend: false,
        isOwner: false,
      }),
    ).toBe(false);
  });
});

describe("punto 5: carga del Chat Íntimo acotada", () => {
  it("el timeout (6 s) está por debajo de los 8 s del test de verificación", () => {
    expect(CHAT_LOAD_TIMEOUT_MS).toBe(6000);
    expect(CHAT_LOAD_TIMEOUT_MS).toBeLessThan(8000);
  });

  it("un chunk que nunca resuelve rechaza en vez de dejar el spinner eterno", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.doMock("@/pages/Chat", () => new Promise(() => {}));
    const { loadChatModule: loadStalled } =
      await import("@/lib/intimateChat");
    const pending = loadStalled();
    const assertion = expect(pending).rejects.toThrow(/timeout/i);
    await vi.advanceTimersByTimeAsync(CHAT_LOAD_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();
    vi.resetModules();
    vi.doUnmock("@/pages/Chat");
  });

  it("un chunk rápido resuelve sin tocar el timeout", async () => {
    vi.resetModules();
    vi.doMock("@/pages/Chat", () => ({
      default: () => null,
    }));
    const { loadChatModule: loadFast } = await import("@/lib/intimateChat");
    const mod = await loadFast();
    expect(typeof mod.default).toBe("function");
    vi.resetModules();
    vi.doUnmock("@/pages/Chat");
  });

  // El import estático de arriba ya cargó el módulo real de
  // intimateChat; este test solo documenta que la función exportada
  // es la misma que usa el dock y la página.
  it("loadChatModule es una función", () => {
    expect(typeof loadChatModule).toBe("function");
  });
});

describe("punto 10: action_url de notificaciones apuntan a rutas reales", () => {
  it("logro => /dashboard (ahí vive la pestaña Logros)", async () => {
    await NotificationService.notifyAchievement(
      "u1",
      "Primer paso",
      "Descripción",
    );
    expect(insertedRows).toHaveLength(1);
    const data = insertedRows[0]!.data as Record<string, unknown>;
    expect(data.action_url).toBe("/dashboard");
  });

  it("solicitud de conexión => /requests (ahí viven las solicitudes)", async () => {
    await NotificationService.notifyConnectionRequest(
      "u1",
      "u2",
      "Alguien",
    );
    expect(insertedRows).toHaveLength(1);
    const data = insertedRows[0]!.data as Record<string, unknown>;
    expect(data.action_url).toBe("/requests");
  });
});
