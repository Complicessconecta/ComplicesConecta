/**
 * Ronda 7, stream A: cuentas demo locales (punto 1) y gate de perfil
 * privado para no-amigo (punto 18).
 *
 * Punto 1: el registro demo de la ronda 6 solo escribía la sesión;
 * al cerrar sesión la cuenta dejaba de existir y el login caía en el
 * stub de Supabase. El registro de cuentas locales debe sobrevivir
 * al logout para que el login resuelva por email o apodo.
 *
 * Punto 18: el gate existe (ProfileDetail -> PrivateProfileGate), pero
 * en demo era inalcanzable (todos los perfiles semilla eran públicos)
 * y la amistad semilla no resolvía (el id numérico/UUID no keyea la
 * semilla, que va por nombre).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// El cliente real de Supabase no se puede importar en vitest:
// `AppConfig.supabase.url` es undefined y `normalizeSupabaseUrl`
// revienta al importar el módulo. Misma convención que el resto de
// tests unitarios: mock del cliente (aquí, sin backend, como el
// preview: `isSupabaseConfigured` en false).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
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

import {
  createLocalDemoAccount,
  findLocalDemoAccount,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import { areFriendsSync } from "@/lib/friends";
import {
  isProfileGated,
  resolveProfileVisibility,
} from "@/lib/profileVisibility";
import { getSocialDemoData } from "@/demo/socialDemoData";
import {
  OPEN_INTIMATE_CHAT_EVENT,
  openIntimateChat,
} from "@/lib/intimateChat";

beforeEach(() => {
  window.localStorage.clear();
});

describe("punto 1: registro de cuentas demo locales", () => {
  it("crea la cuenta y la resuelve por email (insensible a mayúsculas)", () => {
    const { userId, profile } = createLocalDemoAccount({
      email: "pruebar6@demo.local",
      nickname: "PruebaR6",
      accountType: "single",
      firstName: "PruebaR6",
      age: 30,
    });

    expect(profile.email).toBe("pruebar6@demo.local");
    expect(findLocalDemoAccount("pruebar6@demo.local")?.userId).toBe(userId);
    expect(findLocalDemoAccount("PRUEBAR6@DEMO.LOCAL")?.userId).toBe(userId);
    expect(findLocalDemoAccount("  pruebar6@demo.local  ")?.userId).toBe(
      userId,
    );
  });

  it("resuelve por apodo y devuelve null para desconocidos", () => {
    createLocalDemoAccount({
      email: "pruebar6@demo.local",
      nickname: "PruebaR6",
      accountType: "single",
    });

    expect(findLocalDemoAccount("PruebaR6")?.email).toBe(
      "pruebar6@demo.local",
    );
    expect(findLocalDemoAccount("pruebar6")?.email).toBe(
      "pruebar6@demo.local",
    );
    expect(findLocalDemoAccount("nadie@demo.local")).toBeNull();
    expect(findLocalDemoAccount("")).toBeNull();
  });

  it("sobrevive al logout y la sesión se restaura desde el registro", () => {
    const { profile } = createLocalDemoAccount({
      email: "pruebar6@demo.local",
      nickname: "PruebaR6",
      accountType: "single",
    });

    // Simula el logout: clearDemoAuth borra la sesión, no el registro.
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("userType");
    window.localStorage.removeItem("demo_user");

    const found = findLocalDemoAccount("pruebar6@demo.local");
    expect(found).not.toBeNull();
    expect(found?.profile.id).toBe(profile.id);

    restoreLocalDemoSession(found!.profile);
    expect(window.localStorage.getItem("demo_authenticated")).toBe("true");
    expect(window.localStorage.getItem("userType")).toBe("single");
    const restored = JSON.parse(
      window.localStorage.getItem("demo_user") ?? "{}",
    ) as { id: string; nickname: string };
    expect(restored.id).toBe(profile.id);
    expect(restored.nickname).toBe("PruebaR6");
  });

  it("registra parejas con su tipo y no mezcla cuentas", () => {
    createLocalDemoAccount({
      email: "pruebar6@demo.local",
      nickname: "PruebaR6",
      accountType: "single",
    });
    const { profile } = createLocalDemoAccount({
      email: "pareja7@demo.local",
      nickname: "Pareja7",
      accountType: "couple",
      firstName: "Ana",
      partnerFirstName: "Luis",
    });

    expect(findLocalDemoAccount("pareja7@demo.local")?.profile.id).toBe(
      profile.id,
    );
    expect(findLocalDemoAccount("pruebar6@demo.local")?.nickname).toBe(
      "PruebaR6",
    );
    expect(profile.accountType).toBe("couple");
  });
});

describe("punto 18: gate de perfil privado para no-amigo", () => {
  it("Ana es el perfil privado de la demo; Sofía sigue pública", () => {
    expect(getSocialDemoData("Ana").visibility).toBe("private");
    expect(getSocialDemoData("Sofía").visibility).toBe("public");
    expect(
      resolveProfileVisibility({ seedVisibility: "private" }),
    ).toBe("private");
  });

  it("la amistad semilla resuelve por nombre de perfil", () => {
    // Sofía es amiga semilla de Ana (id legacy "3" o UUID del roster
    // no keyean la semilla: sin el nombre, da falso).
    expect(areFriendsSync("viewer-sofia", "3", "Sofía", "Ana")).toBe(true);
    expect(areFriendsSync("viewer-sofia", "3", "Sofía")).toBe(false);
    // Una cuenta nueva no es amiga de Ana por ningún camino.
    expect(areFriendsSync("viewer-nuevo", "3", "PruebaR6", "Ana")).toBe(
      false,
    );
    expect(areFriendsSync("viewer-nuevo", "3", "PruebaR6")).toBe(false);
  });

  it("el gate se muestra solo a no-amigos de un perfil privado", () => {
    const gate = (visibility: "public" | "private", isFriend: boolean) =>
      isProfileGated({ visibility, isOwner: false, isFriend });
    expect(gate("private", false)).toBe(true);
    expect(gate("private", true)).toBe(false);
    expect(gate("public", false)).toBe(false);
    expect(
      isProfileGated({ visibility: "private", isOwner: true, isFriend: false }),
    ).toBe(false);
  });
});

describe("punto 6: evento de apertura del chat íntimo", () => {
  it("openIntimateChat despacha el evento que escucha MainLayout", () => {
    expect(OPEN_INTIMATE_CHAT_EVENT).toBe("complices:open-chat-intimo");
    let received = 0;
    const listener = () => {
      received += 1;
    };
    window.addEventListener(OPEN_INTIMATE_CHAT_EVENT, listener);
    openIntimateChat();
    window.removeEventListener(OPEN_INTIMATE_CHAT_EVENT, listener);
    expect(received).toBe(1);
  });
});
