/**
 * Ronda 12, stream A: las 3 regresiones del test de verificación de
 * la ronda 11 (19:35–20:00, veredicto NO fusionar).
 *
 * 1. Gate de chat del anónimo: la solicitud de amistad a la pareja se
 *    aceptaba ("Ahora son amigos") pero enviar en /chat/3 fallaba con
 *    "Sin permisos: Las cuentas anónimas solo pueden chatear con
 *    amigos aceptados…". Causa: el gate comparaba la amistad con el
 *    id de SALA ("3"), no con el id del PERFIL del interlocutor; el
 *    par aceptado se guarda con ids canónicos de perfil.
 * 2. Solicitud de ver fotos aceptada por la pareja "revertía" a
 *    "Pendiente" en la bandeja tras logout/re-login mientras la
 *    cuenta atrás de la concesión seguía viva. Causa doble: la
 *    bandeja se reconstruía SOLO con pendientes (la aceptada
 *    desaparecía al recargar) y el botón de solicitud permitía volver
 *    a pedir con la concesión viva, creando una pendiente duplicada
 *    que el "último manda" leía como pendiente.
 * 3. Cuenta atrás de 24 h: (a) la propia pestaña "Ver Galería" del
 *    anónimo no mostraba ninguna (solo la lista de accesos que ÉL
 *    concedió, vacía cuando el acceso lo tiene ÉL como espectador);
 *    (b) el lado espectador no reflejaba la concesión: el botón
 *    volvía a "Solicitar ver fotos" al recargar y se quedaba en
 *    "Solicitud de fotos enviada" tras aceptar.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
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

import { canAnonymousChat } from "@/lib/anonymous";
import { canSendMessageTo } from "@/lib/chatLimits";
import { createLocalDemoAccount } from "@/lib/demo-registration";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import {
  areFriendsSync,
  getAnonymousPhotoAccessRemainingMs,
  getPhotoAccessStatusSync,
  hasPhotoAccess,
  listIncomingRequestsSync,
  listPhotoAccessGrantedTo,
  listSentRequestsSync,
  respondFriendRequest,
  sendFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import { render, screen } from "@testing-library/react";
import { PhotoAccessRequestButton } from "@/components/profiles/shared/PhotoAccessRequestButton";
import {
  AnonymousOwnGalleryAccess,
  MyGrantedGalleryAccessList,
} from "@/components/profiles/shared/PhotoAccessCountdown";

const NOW = new Date("2026-11-25T12:00:00.000Z").getTime();
const HOUR_MS = 60 * 60 * 1000;
const SOFIA_ID = generateDemoUserUUID("single@outlook.es");
const COUPLE_ID = generateDemoUserUUID("pareja@outlook.es");
/** Id de ficha de la pareja; en Chat es CHAT_ROOM_PROFILE_IDS["3"]. */
const COUPLE_CARD_ID = "demo-couple-456";

function seedRequests(requests: Array<Record<string, unknown>>): void {
  window.localStorage.setItem(
    "friend_requests_demo",
    JSON.stringify(requests),
  );
}

function photoRequest(
  fromId: string,
  toId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: `demo-photo-${fromId.slice(0, 8)}-${toId.slice(0, 8)}`,
    fromId,
    toId,
    kind: "photo_access",
    status: "pending",
    message: null,
    createdAt: new Date(NOW - HOUR_MS).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("1. Gate de chat: la amistad aceptada levanta el gate (id de perfil, no de sala)", () => {
  it("el par aceptado se guarda con ids canónicos de perfil y sobrevive en el almacén", async () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    await sendFriendRequest(anonId, COUPLE_CARD_ID, undefined, true);
    const reqId = listSentRequestsSync(anonId, "friendship")[0]?.id;
    expect(reqId).toBeTruthy();
    await respondFriendRequest(reqId as string, "accepted", true);
    // El par vive en localStorage (no solo en memoria): sobrevive a
    // recargar / cerrar y abrir sesión.
    const stored = JSON.parse(
      window.localStorage.getItem("friendships_demo") ?? "[]",
    ) as Array<[string, string]>;
    expect(stored).toContainEqual(
      [anonId, COUPLE_ID].sort() as [string, string],
    );
    expect(areFriendsSync(anonId, COUPLE_CARD_ID)).toBe(true);
  });

  it("con el id de SALA ('3') la amistad NO se ve: esa era la entrada del gate", async () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    await sendFriendRequest(anonId, COUPLE_CARD_ID, undefined, true);
    const reqId = listSentRequestsSync(anonId, "friendship")[0]?.id;
    await respondFriendRequest(reqId as string, "accepted", true);
    // La entrada que usaba el gate de Chat (selectedChat.id = "3").
    expect(areFriendsSync(anonId, "3")).toBe(false);
    // La entrada que DEBE usar: el id de perfil resuelto
    // (resolveChatPartnerProfileId("3") = "demo-couple-456").
    expect(
      areFriendsSync(anonId, COUPLE_CARD_ID, undefined, "Carmen & Roberto"),
    ).toBe(true);
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: false,
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: true,
      }).allowed,
    ).toBe(true);
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: false,
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: false,
      }).reason,
    ).toContain("solo pueden chatear con amigos aceptados");
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: true,
      }).allowed,
    ).toBe(true);
  });
});

describe("2. La solicitud de ver fotos aceptada queda en la bandeja tras recargar", () => {
  async function seedAcceptedPhotoGrant(): Promise<void> {
    await sendPhotoAccessRequest(SOFIA_ID, COUPLE_CARD_ID, undefined, true);
    const reqId = listSentRequestsSync(SOFIA_ID, "photo_access")[0]?.id;
    await respondFriendRequest(reqId as string, "accepted", true);
  }

  it("la bandeja de Recibidas conserva la aceptada con su estado real", async () => {
    await seedAcceptedPhotoGrant();
    // El listado por defecto (solo pendientes) es el que usan los
    // botones de responder: sigue sin traer la aceptada.
    expect(
      listIncomingRequestsSync(COUPLE_ID, "photo_access"),
    ).toHaveLength(0);
    // La bandeja (/requests y el gestor del perfil) la trae con
    // includeDecided: el estado del almacén, no "Pendiente".
    const inbox = listIncomingRequestsSync(COUPLE_ID, "photo_access", {
      includeDecided: true,
    });
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.status).toBe("accepted");
    // Y el lado Enviadas de Sofía también la ve aceptada.
    expect(listSentRequestsSync(SOFIA_ID, "photo_access")[0]?.status).toBe(
      "accepted",
    );
  });

  it("tras 'recargar' (round-trip del almacén) la bandeja y la galería coinciden", async () => {
    await seedAcceptedPhotoGrant();
    // Simula restaurar la sesión: mismo localStorage, nuevo contexto.
    const raw = window.localStorage.getItem("friend_requests_demo");
    window.localStorage.setItem("friend_requests_demo", JSON.stringify(JSON.parse(raw as string)));
    expect(getPhotoAccessStatusSync(SOFIA_ID, COUPLE_CARD_ID)).toBe(
      "accepted",
    );
    expect(
      listIncomingRequestsSync(COUPLE_ID, "photo_access", {
        includeDecided: true,
      })[0]?.status,
    ).toBe("accepted");
    expect(getAnonymousPhotoAccessRemainingMs(SOFIA_ID, COUPLE_CARD_ID)).toBeGreaterThan(0);
    expect(await hasPhotoAccess(SOFIA_ID, COUPLE_CARD_ID, true)).toBe(true);
  });

  it("con la concesión viva no se crea una pendiente duplicada", async () => {
    await seedAcceptedPhotoGrant();
    const again = await sendPhotoAccessRequest(
      SOFIA_ID,
      COUPLE_CARD_ID,
      undefined,
      true,
    );
    expect(again.ok).toBe(false);
    expect(
      listSentRequestsSync(SOFIA_ID, "photo_access"),
    ).toHaveLength(1);
  });

  it("una pendiente duplicada posterior no tapa la concesión viva", async () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    // Concesión aceptada hace 2 h (22 h restantes) + pendiente
    // duplicada posterior (el estado que dejaba la ronda 11).
    seedRequests([
      photoRequest(anonId, COUPLE_ID, {
        id: "demo-photo-grant",
        status: "accepted",
        createdAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
      }),
      photoRequest(anonId, COUPLE_ID, {
        id: "demo-photo-dup",
        status: "pending",
        createdAt: new Date(NOW - HOUR_MS).toISOString(),
      }),
    ]);
    expect(getPhotoAccessStatusSync(anonId, COUPLE_ID)).toBe("accepted");
    expect(await hasPhotoAccess(anonId, COUPLE_ID, true)).toBe(true);
    expect(getAnonymousPhotoAccessRemainingMs(anonId, COUPLE_ID)).toBeGreaterThan(0);
  });
});

describe("3a. La propia 'Ver Galería' del anónimo muestra sus cuentas atrás", () => {
  it("lista los accesos que LE concedieron, con ms restantes", () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    seedRequests([
      photoRequest(anonId, COUPLE_ID, {
        status: "accepted",
        createdAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
      }),
    ]);
    const held = listPhotoAccessGrantedTo(anonId, NOW);
    expect(held).toHaveLength(1);
    expect(held[0]?.ownerId).toBe(COUPLE_ID);
    expect(held[0]?.ownerName).toBe("Carmen & Roberto");
    expect(held[0]?.remainingMs).toBe(22 * HOUR_MS);
  });

  it("la pestaña propia muestra en vivo los accesos dados y los recibidos", () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    seedRequests([
      // La pareja le concedió acceso al anónimo (hace 2 h).
      photoRequest(anonId, COUPLE_ID, {
        id: "demo-photo-held",
        status: "accepted",
        createdAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
      }),
      // El anónimo le concedió acceso a Sofía (hace 1 h).
      photoRequest(SOFIA_ID, anonId, {
        id: "demo-photo-given",
        status: "accepted",
        createdAt: new Date(NOW - HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - HOUR_MS).toISOString(),
      }),
    ]);
    render(
      <AnonymousOwnGalleryAccess ownerId={anonId} viewerId={anonId} />,
    );
    // Dos cuentas atrás en vivo (HH:MM:SS), una por acceso.
    const countdowns = screen.getAllByTestId("live-countdown");
    expect(countdowns).toHaveLength(2);
    expect(countdowns[0]?.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(countdowns[1]?.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(screen.getByText("Acceso a tu galería limitada")).toBeTruthy();
    expect(screen.getByText("Accesos que te concedieron")).toBeTruthy();
  });

  it("sin ningún acceso vigente la pestaña lo dice explícito (no hueco vacío)", () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    render(
      <AnonymousOwnGalleryAccess ownerId={anonId} viewerId={anonId} />,
    );
    expect(screen.queryByTestId("live-countdown")).toBeNull();
    expect(
      screen.getByText(/Aún no hay accesos a la galería concedidos/),
    ).toBeTruthy();
  });

  it("MyGrantedGalleryAccessList no muestra accesos expirados", () => {
    const { userId: anonId } = createLocalDemoAccount({
      email: "anonr12@demo.local",
      nickname: "anonr12",
      accountType: "single",
      isAnonymous: true,
    });
    seedRequests([
      photoRequest(anonId, COUPLE_ID, {
        status: "accepted",
        createdAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
      }),
    ]);
    expect(listPhotoAccessGrantedTo(anonId, NOW)).toHaveLength(0);
    render(<MyGrantedGalleryAccessList viewerId={anonId} />);
    expect(screen.queryByTestId("live-countdown")).toBeNull();
  });
});

describe("3b. El lado espectador refleja la concesión (botón con estado guardado)", () => {
  function renderViewerButton() {
    return render(
      <PhotoAccessRequestButton
        profileId={COUPLE_CARD_ID}
        profileName="Carmen & Roberto"
        viewerId={SOFIA_ID}
        isOwnProfile={false}
        isDemo
      />,
    );
  }

  it("sin solicitud muestra 'Solicitar ver fotos'", () => {
    renderViewerButton();
    expect(
      screen.getByRole("button", { name: /Solicitar ver fotos/ }),
    ).toBeTruthy();
  });

  it("con una pendiente guardada muestra 'Solicitud de fotos enviada' al montar", () => {
    seedRequests([photoRequest(SOFIA_ID, COUPLE_ID)]);
    renderViewerButton();
    expect(screen.getByText("Solicitud de fotos enviada")).toBeTruthy();
    expect(screen.queryByText("Solicitar ver fotos")).toBeNull();
  });

  it("con la concesión viva el botón desaparece (el padre muestra la cuenta atrás)", () => {
    seedRequests([
      photoRequest(SOFIA_ID, COUPLE_ID, {
        status: "accepted",
        createdAt: new Date(NOW - HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - HOUR_MS).toISOString(),
      }),
    ]);
    const { container } = renderViewerButton();
    expect(container).toBeEmptyDOMElement();
  });

  it("con la concesión viva el espectador tiene acceso y cuenta atrás", async () => {
    seedRequests([
      photoRequest(SOFIA_ID, COUPLE_ID, {
        status: "accepted",
        createdAt: new Date(NOW - HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - HOUR_MS).toISOString(),
      }),
    ]);
    expect(getPhotoAccessStatusSync(SOFIA_ID, COUPLE_CARD_ID)).toBe(
      "accepted",
    );
    expect(
      getAnonymousPhotoAccessRemainingMs(SOFIA_ID, COUPLE_CARD_ID),
    ).toBe(23 * HOUR_MS);
    expect(await hasPhotoAccess(SOFIA_ID, COUPLE_CARD_ID, true)).toBe(true);
  });
});
