/**
 * Ronda 11, stream C — tests de (iii), (iv) y (v).
 *
 * (iii) Visibilidad de FUENTE ÚNICA: el toggle "Modo invisible" y el
 * select "Visibilidad del perfil" leían/escribían almacenes distintos
 * (`single_privacy:`/`couple_privacy:` vs `profile_visibility:`) y la
 * píldora solo leía el primero. Test de verificación ronda 10
 * (2026-11-25 18:02–18:30 CST): la pareja tenía el toggle ON con el
 * select en "Público" y el anónimo el toggle OFF con el select en
 * "Privado", y en ambos casos la píldora decía "Invisible".
 *
 * (iv) CTA de solicitud en el chat: el chat con Carmen & Roberto
 * mostraba "Enviar solicitud de amistad" aunque Sofía ya los tiene de
 * amigos. Causas: Chat pasaba el id de SALA ("3") en vez del id de
 * perfil, y `viewerName` caía al email ("single@outlook.es", porque
 * `user` no trae `first_name`) mientras la semilla trae "Sofía".
 *
 * (v) Amistades: tras aceptar, la lista de la pareja NO incluía a
 * anonr8test y la de anonr8test mostraba a la pareja como el UUID
 * crudo "48bb1f12-ff99-4ff9-a900-0000ff99c6cb".
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Misma convención que el resto de tests unitarios: mock del cliente
// de Supabase (sin backend, como el preview).
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

import { createLocalDemoAccount } from "@/lib/demo-registration";
import {
  areFriendsSync,
  canonicalDemoOwnerId,
  getFriendStatus,
  listFriendsSync,
  respondFriendRequest,
  sendFriendRequest,
} from "@/lib/friends";
import { readVisibilityLocal } from "@/lib/profileVisibility";
import { clearDemoAuth } from "@/lib/app-config";
import {
  readUnifiedInvisible,
  saveUnifiedInvisible,
} from "@/lib/visibility";
import { generateDemoUserUUID } from "@/lib/demo-uuid";

beforeEach(() => {
  window.localStorage.clear();
});

function seedAccounts() {
  const couple = createLocalDemoAccount({
    email: "pareja@outlook.es",
    nickname: "Carmen & Roberto",
    accountType: "couple",
    firstName: "Carmen",
    partnerFirstName: "Roberto",
  });
  const anon = createLocalDemoAccount({
    email: "anonr8test@demo.local",
    nickname: "anonr8test",
    accountType: "single",
    isAnonymous: true,
  });
  const single = createLocalDemoAccount({
    email: "single@outlook.es",
    nickname: "Sofía",
    accountType: "single",
    firstName: "Sofía",
  });
  return { couple, anon, single };
}

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("(iii) visibilidad de fuente única", () => {
  const userId = "11111111-2222-4333-a444-555555555555";

  function writeLegacyDisagreement(
    privacyInvisible: boolean,
    visibility: "public" | "private",
  ): void {
    window.localStorage.setItem(
      `single_privacy:${userId}`,
      JSON.stringify({ invisible: privacyInvisible }),
    );
    window.localStorage.setItem(`profile_visibility:${userId}`, visibility);
  }

  it("toggle ON + select Público (caso pareja, ronda 10) → oculto", () => {
    writeLegacyDisagreement(true, "public");
    expect(readUnifiedInvisible(userId, "single")).toBe(true);
  });

  it("toggle OFF + select Privado (caso anónimo, ronda 10) → oculto", () => {
    writeLegacyDisagreement(false, "private");
    expect(readUnifiedInvisible(userId, "single")).toBe(true);
  });

  it("ambos visibles → visible", () => {
    writeLegacyDisagreement(false, "public");
    expect(readUnifiedInvisible(userId, "single")).toBe(false);
  });

  it("guardar oculto escribe AMBOS almacenes a la vez", () => {
    saveUnifiedInvisible(userId, "single", true);
    const privacy = JSON.parse(
      window.localStorage.getItem(`single_privacy:${userId}`) ?? "{}",
    ) as { invisible?: boolean };
    expect(privacy.invisible).toBe(true);
    expect(readVisibilityLocal(userId)).toBe("private");
    expect(readUnifiedInvisible(userId, "single")).toBe(true);
  });

  it("guardar visible escribe AMBOS almacenes a la vez", () => {
    writeLegacyDisagreement(true, "private");
    saveUnifiedInvisible(userId, "single", false);
    const privacy = JSON.parse(
      window.localStorage.getItem(`single_privacy:${userId}`) ?? "{}",
    ) as { invisible?: boolean };
    expect(privacy.invisible).toBe(false);
    expect(readVisibilityLocal(userId)).toBe("public");
    expect(readUnifiedInvisible(userId, "single")).toBe(false);
  });

  it("el anónimo sin nada guardado nace oculto; el resto, visible", () => {
    expect(readUnifiedInvisible(userId, "single", true)).toBe(true);
    expect(readUnifiedInvisible(userId, "single", false)).toBe(false);
    expect(readUnifiedInvisible(userId, "single")).toBe(false);
  });

  it("una elección explícita visible del anónimo manda sobre el default", () => {
    writeLegacyDisagreement(false, "public");
    expect(readUnifiedInvisible(userId, "single", true)).toBe(false);
  });

  it("la visibilidad unificada sobrevive al logout (ronda 10, C2)", () => {
    saveUnifiedInvisible(userId, "single", true);
    clearDemoAuth();
    expect(readUnifiedInvisible(userId, "single")).toBe(true);
    expect(readVisibilityLocal(userId)).toBe("private");
  });
});

describe("(v) resolución de nombres en Amistades", () => {
  it("la amistad aceptada aparece en AMBAS listas con nombres resueltos", async () => {
    const { couple, anon } = seedAccounts();
    const coupleId = couple.userId;
    expect(coupleId).toBe("48bb1f12-ff99-4ff9-a900-0000ff99c6cb");

    // La UI envía con el id de ficha, como en el test ronda 10.
    const sent = await sendFriendRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    const pending = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ id: string }>;
    expect(pending).toHaveLength(1);
    const accepted = await respondFriendRequest(pending[0]!.id, "accepted", true);
    expect(accepted.ok).toBe(true);

    // Lista de la pareja (llave por NOMBRE, como FriendsSection en demo).
    const coupleFriends = listFriendsSync("Carmen & Roberto", "Carmen & Roberto");
    const coupleNames = coupleFriends.map((f) => f.name);
    expect(coupleNames).toContain("anonr8test");
    expect(coupleNames.some((n) => UUID_LIKE.test(n))).toBe(false);

    // Misma lista por id de sesión de la pareja.
    const coupleById = listFriendsSync(coupleId);
    expect(coupleById.map((f) => f.name)).toContain("anonr8test");

    // Lista del anónimo (por id de sesión): la pareja con nombre,
    // NO con su UUID crudo (fallo del test ronda 10).
    const anonFriends = listFriendsSync(anon.userId);
    const anonNames = anonFriends.map((f) => f.name);
    expect(anonNames).toContain("Carmen & Roberto");
    expect(anonNames).not.toContain(coupleId);
    expect(anonNames.some((n) => UUID_LIKE.test(n))).toBe(false);

    // Misma lista por APODO (llave que usa FriendsSection en demo).
    const anonByNick = listFriendsSync("anonr8test", "anonr8test");
    expect(anonByNick.map((f) => f.name)).toContain("Carmen & Roberto");
  });

  it("canonicalDemoOwnerId resuelve el apodo de una cuenta local a su userId", () => {
    const { anon } = seedAccounts();
    expect(canonicalDemoOwnerId("anonr8test")).toBe(anon.userId);
  });
});

describe("(iv) CTA de solicitud suprimido cuando ya son amigos", () => {
  it("Sofía ↔ pareja (amistad semilla) es 'friends' aunque viewerName sea el email", async () => {
    const { single } = seedAccounts();
    const sofiaId = single.userId;
    expect(sofiaId).toBe(generateDemoUserUUID("single@outlook.es"));
    // Lo que pasaba Chat antes: id de sala + viewerName = email.
    expect(
      await getFriendStatus(
        sofiaId,
        "3",
        true,
        "single@outlook.es",
        "Carmen & Roberto",
      ),
    ).toBe("friends");
    // Con el id de perfil resuelto, también.
    expect(
      await getFriendStatus(
        sofiaId,
        "demo-couple-456",
        true,
        "single@outlook.es",
        "Carmen & Roberto",
      ),
    ).toBe("friends");
    expect(
      areFriendsSync(
        sofiaId,
        "demo-couple-456",
        "single@outlook.es",
        "Carmen & Roberto",
      ),
    ).toBe(true);
  });

  it("una amistad aceptada en demo es 'friends' por el par local", async () => {
    const { anon } = seedAccounts();
    expect(
      await getFriendStatus(
        anon.userId,
        "demo-couple-456",
        true,
        "anonr8test",
        "Carmen & Roberto",
      ),
    ).toBe("none");
    const sent = await sendFriendRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    const pending = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ id: string }>;
    await respondFriendRequest(pending[0]!.id, "accepted", true);
    expect(
      await getFriendStatus(
        anon.userId,
        "demo-couple-456",
        true,
        "anonr8test",
        "Carmen & Roberto",
      ),
    ).toBe("friends");
  });

  it("un extraño sin relación sigue siendo 'none' (control negativo)", async () => {
    seedAccounts();
    const stranger = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    expect(
      await getFriendStatus(
        stranger.userId,
        "demo-couple-456",
        true,
        "TestR7",
        "Carmen & Roberto",
      ),
    ).toBe("none");
  });
});
