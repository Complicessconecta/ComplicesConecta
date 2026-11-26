/**
 * Ronda 12, stream C — /profile/<id> en frío, gate, chat bloqueado,
 * y listas de amistades sin UUIDs crudos.
 *
 * Hechos del test de verificación ronda 11 (2026-11-25 19:35–20:00
 * CST, preview qvwf2i9hr, commit d033ae4):
 *
 * 1a. "Solicitar ver perfil" y "Chat bloqueado: envía solicitud de
 *     amistad" NO aparecieron nunca: las combinaciones probadas no
 *     creaban las condiciones (Sofía ↔ pareja son amigos semilla y
 *     públicos; el anónimo se hizo amigo por la bandeja antes de
 *     abrirse su ficha). El gate existe y funciona (ver r8-stream-d),
 *     pero tenía dos agujeros: el dueño que abría su propio perfil
 *     desde su tarjeta de Discover NO se reconocía como dueño (su
 *     id de sesión ≠ id de tarjeta) y, en privado, el gate le
 *     cerraba su propio perfil; y el chat bloqueado se comprobaba
 *     con el id de SALA ("3") en vez del id de perfil.
 * 1b. Primera carga en frío de la pareja
 *     (/profile/20e31658-1f0b-41f0-ab00-0001f0bd29f5, id de tarjeta
 *     del roster) mostró "Perfil no encontrado" y solo cargó tras
 *     recargar: la primera pintura montaba el interno sin perfil
 *     (`resolving` nacía en false) y un intento fallido no se podía
 *     reintentar (`attemptedRef` lo bloqueaba).
 * 2.  La lista de amistades de la pareja seguía mostrando a
 *     anonr8test (BORRADO en el test ronda 11) con su UUID crudo
 *     "5bac1c86-1b5a-41b5-aa00-0001b5ac7c9d", también como espectador
 *     en "Acceso a tu galería limitada": `deleteLocalDemoAccount`
 *     no purgaba sus filas sociales y los resolutores de nombres
 *     devolvían el id tal cual cuando nada lo resolvía.
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

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { generateDemoUUID } from "@/lib/demo-uuid";
import { generateRandomProfiles } from "@/utils/discover/generateRandomProfiles";
import ProfileDetail, {
  resolveProfileSync,
} from "@/pages/profiles/shared/ProfileDetail";
import {
  createLocalDemoAccount,
  deleteLocalDemoAccount,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import {
  areFriendsSync,
  listAnonymousPhotoAccessGrantedBy,
  listFriendsSync,
  resolveDemoDisplayName,
  respondFriendRequest,
  sendFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import { writeVisibilityLocal } from "@/lib/profileVisibility";
import { getAvatarInitials } from "@/lib/avatarFallback";

const COUPLE_ROSTER_ID = "20e31658-1f0b-41f0-ab00-0001f0bd29f5";
const COUPLE_ID = "48bb1f12-ff99-4ff9-a900-0000ff99c6cb";
const SOFIA_ID = "609dcb3b-23f7-423f-a700-00023f74b708";
const ANA_ID = "20e3165d-1e83-41e8-a300-0001e834eeda";
const DELETED_ANON_ID = "5bac1c86-1b5a-41b5-aa00-0001b5ac7c9d";
const UNKNOWN_UUID = "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee";
const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const renderProfileRoute = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/profile/${id}`]}>
      <Routes>
        <Route path="/profile/:id" element={<ProfileDetail />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  window.localStorage.clear();
});

function seedCoupleAndAnon() {
  const couple = createLocalDemoAccount({
    email: "pareja@outlook.es",
    nickname: "Carmen & Roberto",
    accountType: "couple",
    firstName: "Carmen",
    partnerFirstName: "Roberto",
  });
  const anon = createLocalDemoAccount({
    email: "anonr11test@demo.local",
    nickname: "anonr11test",
    accountType: "single",
    isAnonymous: true,
  });
  return { couple, anon };
}

describe("1b: resolución síncrona en frío (resolveProfileSync)", () => {
  it("el id de tarjeta del roster de la pareja (test ronda 11) resuelve en frío", () => {
    expect(generateDemoUUID("demo-profile-6")).toBe(COUPLE_ROSTER_ID);
    const resolved = resolveProfileSync(COUPLE_ROSTER_ID);
    expect(resolved?.name).toBe("Carmen & Roberto");
    expect(resolved?.id).toBe(COUPLE_ROSTER_ID);
  });

  it("Ana (primera del roster) y las cuentas canónicas resuelven en frío", () => {
    expect(resolveProfileSync(ANA_ID)?.name).toBe("Ana");
    expect(resolveProfileSync(SOFIA_ID)?.name).toBe("Sofía");
    expect(resolveProfileSync(COUPLE_ID)?.name).toBe("Carmen & Roberto");
    expect(resolveProfileSync("demo-couple-456")?.name).toBe(
      "Carmen & Roberto",
    );
  });

  it("un id de la lista aleatoria de Discover (discover-profile-N) resuelve en frío", () => {
    const random = generateRandomProfiles();
    expect(random.length).toBeGreaterThan(0);
    const first = random[0]!;
    const resolved = resolveProfileSync(first.id);
    expect(resolved?.name).toBe(first.name);
  });

  it("una cuenta anónima local resuelve en frío con su marca is_anonymous", () => {
    const { anon } = seedCoupleAndAnon();
    const resolved = resolveProfileSync(anon.userId);
    expect(resolved?.name).toBe("anonr11test");
    expect(resolved?.is_anonymous).toBe(true);
  });

  it("un uuid desconocido no resuelve en síncrono (cae a Supabase, no inventa)", () => {
    expect(resolveProfileSync(UNKNOWN_UUID)).toBeNull();
    expect(resolveProfileSync("")).toBeNull();
  });
});

describe("1b: el wrapper en frío no muestra 'Perfil no encontrado'", () => {
  it("la pareja por id de tarjeta carga a la primera, sin 'Perfil no encontrado'", async () => {
    renderProfileRoute(COUPLE_ROSTER_ID);
    expect(
      await screen.findByText(
        "Carmen & Roberto",
        { selector: "h1" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Perfil no encontrado")).toBeNull();
  });

  it("un uuid desconocido muestra 'Perfil no encontrado' CON Reintentar, y reintentar no rompe", async () => {
    renderProfileRoute("11111111-2222-4333-8444-555555555555");
    expect(
      await screen.findByText("Perfil no encontrado", {}, { timeout: 5000 }),
    ).toBeTruthy();
    const retry = await screen.findByText("Reintentar", {}, { timeout: 5000 });
    fireEvent.click(retry);
    expect(
      await screen.findByText("Perfil no encontrado", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});

describe("1a: el gate 'Solicitar ver perfil' aparece cuando toca", () => {
  it("un espectador no amigo ve el gate en Ana (privada por semilla)", async () => {
    createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    renderProfileRoute(ANA_ID);
    expect(
      await screen.findByText("Ana tiene el perfil privado", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Solicitar ver perfil")).toBeTruthy();
  });

  it("el dueño NO se ve el gate en su propio perfil aunque esté en privado (id de tarjeta ≠ id de sesión)", async () => {
    const { couple } = seedCoupleAndAnon();
    // La sesión queda en el anónimo (último creado): devolverla a
    // la pareja, que es el espectador de este caso. La pareja se
    // pone en privado y abre SU tarjeta de Discover (id de roster).
    restoreLocalDemoSession(couple.profile);
    writeVisibilityLocal(couple.userId, "private");
    renderProfileRoute(COUPLE_ROSTER_ID);
    expect(
      await screen.findByText(
        "Carmen & Roberto",
        { selector: "h1" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Solicitar ver perfil")).toBeNull();
    expect(screen.queryByText("tiene el perfil privado")).toBeNull();
  });
});

describe("1a: 'Chat bloqueado' aparece cuando toca (y se levanta al aceptar)", () => {
  it("un espectador anónimo no amigo ve 'Chat bloqueado' en un perfil público", async () => {
    // Sesión = anónimo (única cuenta anónima); Carlos es público.
    seedCoupleAndAnon();
    const carlosId = generateDemoUUID("demo-profile-4");
    renderProfileRoute(carlosId);
    expect(
      await screen.findByText(
        "Chat bloqueado: envía solicitud de amistad",
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Enviar mensaje")).toBeNull();
  });

  it("tras aceptar la amistad, el mismo perfil muestra 'Enviar mensaje'", async () => {
    const { anon } = seedCoupleAndAnon();
    const carlosId = generateDemoUUID("demo-profile-4");
    const sent = await sendFriendRequest(anon.userId, carlosId, undefined, true);
    expect(sent.ok).toBe(true);
    const pending = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ id: string }>;
    await respondFriendRequest(pending[0]!.id, "accepted", true);
    expect(areFriendsSync(anon.userId, carlosId)).toBe(true);
    renderProfileRoute(carlosId);
    expect(
      await screen.findByText("Enviar mensaje", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(
      screen.queryByText("Chat bloqueado: envía solicitud de amistad"),
    ).toBeNull();
  });

  it("la amistad aceptada casa por id de PERFIL, no por id de sala '3' (regresión test ronda 11)", async () => {
    const { anon, couple } = seedCoupleAndAnon();
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
    // La trampa: /chat/3 pasa el id de sala; el par está guardado
    // con el id de usuario canónico de la pareja.
    expect(areFriendsSync(anon.userId, "3")).toBe(false);
    expect(areFriendsSync(anon.userId, "demo-couple-456")).toBe(true);
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(true);
    expect(couple.userId).toBe(COUPLE_ID);
  });
});

describe("2: borrar una cuenta demo purga sus filas sociales", () => {
  it("deleteLocalDemoAccount elimina amistades, solicitudes y accesos, y deja lápida", async () => {
    const { couple, anon } = seedCoupleAndAnon();
    // Amistad aceptada anónimo → pareja.
    await sendFriendRequest(anon.userId, "demo-couple-456", undefined, true);
    const pending = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ id: string }>;
    await respondFriendRequest(pending[0]!.id, "accepted", true);
    // Acceso a fotos concedido a un espectador local (TestR7) en la
    // galería del anónimo: solo puede haber un anónimo por
    // dispositivo, así que el espectador es una cuenta normal.
    const viewer = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    await sendPhotoAccessRequest(viewer.userId, anon.userId, undefined, true);
    const photoPending = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ id: string; kind: string; status: string }>;
    const photoReq = photoPending.find((r) => r.kind === "photo_access");
    expect(photoReq).toBeDefined();
    await respondFriendRequest(photoReq!.id, "accepted", true);
    expect(
      listAnonymousPhotoAccessGrantedBy(anon.userId).map((g) => g.viewerName),
    ).toContain("TestR7");

    // Borrar al espectador purga su acceso; borrar al anónimo purga
    // su amistad con la pareja.
    expect(deleteLocalDemoAccount(viewer.userId)).toEqual({ deleted: true });
    expect(listAnonymousPhotoAccessGrantedBy(anon.userId)).toHaveLength(0);
    expect(resolveDemoDisplayName(viewer.userId)).toBe("Cuenta eliminada");

    expect(deleteLocalDemoAccount(anon.userId)).toEqual({ deleted: true });
    const requests = JSON.parse(
      window.localStorage.getItem("friend_requests_demo") ?? "[]",
    ) as Array<{ fromId: string; toId: string }>;
    expect(
      requests.some(
        (r) => r.fromId === anon.userId || r.toId === anon.userId,
      ),
    ).toBe(false);
    const friendships = JSON.parse(
      window.localStorage.getItem("friendships_demo") ?? "[]",
    ) as Array<[string, string]>;
    expect(
      friendships.some(([a, b]) => a === anon.userId || b === anon.userId),
    ).toBe(false);
    const coupleFriends = listFriendsSync(couple.userId);
    expect(coupleFriends.map((f) => f.name)).not.toContain("anonr11test");
    expect(
      coupleFriends.some((f) => UUID_LIKE.test(f.name)),
    ).toBe(false);
    expect(resolveDemoDisplayName(anon.userId)).toBe("Cuenta eliminada");
  });
});

describe("2: ids borrados/desconocidos nunca se enseñan como UUID", () => {
  it("una fila huérfana anterior a esta ronda (sin lápida, caso anonr8test) se etiqueta, no se enseña el UUID", () => {
    const { couple, anon } = seedCoupleAndAnon();
    // Simula el navegador del test ronda 11: anonr8test se borró
    // ANTES de que existieran purga y lápidas, así que sus filas
    // siguen en los almacenes sin forma de saber que fue borrado.
    window.localStorage.setItem(
      "friendships_demo",
      JSON.stringify([[couple.userId, DELETED_ANON_ID]]),
    );
    window.localStorage.setItem(
      "friend_requests_demo",
      JSON.stringify([
        {
          id: "demo-photo-orphan",
          fromId: DELETED_ANON_ID,
          toId: anon.userId,
          kind: "photo_access",
          status: "accepted",
          message: null,
          createdAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
        },
      ]),
    );
    const names = listFriendsSync(couple.userId).map((f) => f.name);
    expect(names).toContain("Cuenta no disponible");
    expect(names).not.toContain(DELETED_ANON_ID);
    expect(names.some((n) => UUID_LIKE.test(n))).toBe(false);

    const granted = listAnonymousPhotoAccessGrantedBy(anon.userId);
    expect(granted).toHaveLength(1);
    expect(granted[0]!.viewerName).toBe("Cuenta no disponible");
    expect(granted[0]!.viewerId).toBe(DELETED_ANON_ID);
  });

  it("resolveDemoDisplayName resuelve los conocidos y etiqueta el resto", () => {
    seedCoupleAndAnon();
    expect(resolveDemoDisplayName(SOFIA_ID)).toBe("Sofía");
    expect(resolveDemoDisplayName(COUPLE_ID)).toBe("Carmen & Roberto");
    expect(resolveDemoDisplayName(COUPLE_ROSTER_ID)).toBe("Carmen & Roberto");
    expect(resolveDemoDisplayName(UNKNOWN_UUID)).toBe("Cuenta no disponible");
    expect(UUID_LIKE.test(resolveDemoDisplayName(UNKNOWN_UUID))).toBe(false);
  });

  it("las etiquetas de sistema no llevan iniciales de avatar (sigue el icono de persona)", () => {
    expect(getAvatarInitials("Cuenta eliminada")).toBeNull();
    expect(getAvatarInitials("Cuenta no disponible")).toBeNull();
    expect(getAvatarInitials("Sofía")).toBe("S");
  });
});
