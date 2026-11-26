/**
 * Ronda 14, stream A: regresión del acceso a fotos (test de
 * verificación de la ronda 13, 2026-11-25 23:30–23:58 CST, preview
 * 886 px, veredicto: la concesión de acceso a fotos se rompió).
 *
 * Síntomas en vivo:
 * 1. Al aprobar una solicitud de fotos solo se ve la píldora
 *    "Acceso concedido", SIN cuenta atrás HH:MM:SS en el lado del
 *    otorgante.
 * 2. La aprobación DESAPARECE al navegar fuera de /profile y volver:
 *    vuelve "2 pendientes" (las 2 mock).
 * 3. Una solicitud de fotos enviada desde el chat de la pareja a
 *    Sofía NUNCA llega a la bandeja "Solicitudes de Acceso" de Sofía.
 *
 * En la ronda 12 esto funcionaba en los 3 lados y persistía tras
 * logout/re-login. Causa (verificada por diff, no adivinada):
 * - Los síntomas 1 y 2 son la consecuencia visible del 3 en el flujo
 *   del test: si la solicitud REAL nunca llega a la bandeja, lo único
 *   aprobable son las 2 mock (María García / Carlos López), y aprobar
 *   una mock es solo estado local — no escribe en el almacén, así que
 *   no hay concesión que contar (sin HH:MM:SS) y al remontar las mock
 *   vuelven a "pendiente".
 * - La causa raíz del 3 es `CHAT_ROOM_PROFILE_IDS` en `Chat.tsx`:
 *   solo mapea la sala "3" → "demo-couple-456". La pareja chatea con
 *   Sofía en la sala privada "2", así que
 *   `resolveChatPartnerProfileId("2")` devolvía "2" y la solicitud se
 *   guardaba con toId = "2": el remitente la veía como enviada, pero
 *   la bandeja de Sofía (que lee con su UUID canónico) nunca la
 *   encontraba. El mismo fallo latente que la ronda 7/10 corrigió
 *   para la sala 3, sin cubrir la sala 2 (Sofía sí tiene ficha,
 *   "demo-single-1", a diferencia de las salas 1 y 4).
 * - NO es un cambio de código de la ronda 13: el mapa incompleto
 *   existe idéntico en f7e7174 (cabeza de la ronda 12) y 2e60aed, y
 *   el diff f7e7174..b6524ec no toca `friends.ts`, `anonymous.ts`,
 *   `Chat.tsx` ni `Requests.tsx`. Lo que cambió en la ronda 13 fue
 *   el test: por primera vez se ejerció la dirección pareja → Sofía
 *   por chat (la ronda 12 solo cubrió anónimo → pareja por la sala 3,
 *   ya mapeada, y Sofía → pareja por ficha).
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

import { generateDemoUserUUID } from "@/lib/demo-uuid";
import {
  getAnonymousPhotoAccessRemainingMs,
  listIncomingRequestsSync,
  listSentRequestsSync,
  respondFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import { resolveChatPartnerProfileId } from "@/pages/Chat";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrivateImageRequestsManager } from "@/components/profiles/shared/PrivateImageRequestsManager";

const SOFIA_ID = generateDemoUserUUID("single@outlook.es");
const COUPLE_ID = generateDemoUserUUID("pareja@outlook.es");
/** Id de ficha de Sofía; en Chat es CHAT_ROOM_PROFILE_IDS["2"]. */
const SOFIA_CARD_ID = "demo-single-1";
/** Id de ficha de la pareja; en Chat es CHAT_ROOM_PROFILE_IDS["3"]. */
const COUPLE_CARD_ID = "demo-couple-456";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("1. La solicitud de fotos del chat pareja → Sofía llega a su bandeja", () => {
  it("la sala 2 del chat (Sofia) resuelve a la ficha de Sofía", () => {
    expect(resolveChatPartnerProfileId("2")).toBe(SOFIA_CARD_ID);
  });

  it("control: la sala 3 sigue resolviendo a la ficha de la pareja", () => {
    expect(resolveChatPartnerProfileId("3")).toBe(COUPLE_CARD_ID);
  });

  it("la solicitud enviada con el id que usa el chat (sala 2) aparece en la bandeja de Sofía", async () => {
    const partnerId = resolveChatPartnerProfileId("2");
    const result = await sendPhotoAccessRequest(
      COUPLE_ID,
      partnerId,
      undefined,
      true,
    );
    expect(result.ok).toBe(true);
    // La bandeja de Sofía (el gestor de /profile lee con
    // includeDecided: true) trae la solicitud pendiente.
    const inbox = listIncomingRequestsSync(SOFIA_ID, "photo_access", {
      includeDecided: true,
    });
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.status).toBe("pending");
    expect(inbox[0]?.fromId).toBe(COUPLE_ID);
    // Y el lado Enviadas de la pareja también la ve.
    expect(listSentRequestsSync(COUPLE_ID, "photo_access")).toHaveLength(1);
  });

  it("control: con la ficha de Sofía la solicitud sí llega (el almacén y la bandeja funcionan)", async () => {
    const result = await sendPhotoAccessRequest(
      COUPLE_ID,
      SOFIA_CARD_ID,
      undefined,
      true,
    );
    expect(result.ok).toBe(true);
    expect(
      listIncomingRequestsSync(SOFIA_ID, "photo_access", {
        includeDecided: true,
      }),
    ).toHaveLength(1);
  });
});

describe("2. Al aprobar una solicitud REAL, el otorgante ve la cuenta atrás HH:MM:SS", () => {
  async function seedPendingCoupleToSofia(): Promise<string> {
    await sendPhotoAccessRequest(COUPLE_ID, SOFIA_CARD_ID, undefined, true);
    const reqId = listSentRequestsSync(COUPLE_ID, "photo_access")[0]?.id;
    expect(reqId).toBeTruthy();
    return reqId as string;
  }

  async function renderSofiaInbox() {
    const utils = render(
      <PrivateImageRequestsManager profileId={SOFIA_ID} profileName="Sofía" />,
    );
    // La carga simulada (500 ms) + las 2 mock y la real.
    expect(await screen.findByText("Carmen & Roberto")).toBeInTheDocument();
    expect(screen.getByText("María García")).toBeTruthy();
    return utils;
  }

  it("aprobar la solicitud real muestra 'Acceso concedido' CON cuenta atrás HH:MM:SS", async () => {
    await seedPendingCoupleToSofia();
    await renderSofiaInbox();
    // Las mock se pintan primero y la real se añade después: el
    // último "Aprobar" es el de la solicitud real (Carmen & Roberto).
    const approveButtons = screen.getAllByRole("button", {
      name: /Aprobar/,
    });
    expect(approveButtons.length).toBe(3);
    fireEvent.click(approveButtons[approveButtons.length - 1] as HTMLElement);
    expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
    const countdown = await screen.findByTestId("live-countdown");
    expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    // La concesión vive 24 h desde la aceptación.
    expect(
      getAnonymousPhotoAccessRemainingMs(COUPLE_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});

describe("3. La aprobación persiste al navegar fuera y volver, y tras logout/re-login", () => {
  async function approveRealRequest(): Promise<void> {
    await sendPhotoAccessRequest(COUPLE_ID, SOFIA_CARD_ID, undefined, true);
    const reqId = listSentRequestsSync(COUPLE_ID, "photo_access")[0]?.id;
    await respondFriendRequest(reqId as string, "accepted", true);
  }

  function renderSofiaInbox() {
    return render(
      <PrivateImageRequestsManager profileId={SOFIA_ID} profileName="Sofía" />,
    );
  }

  async function expectGrantedWithCountdown(): Promise<void> {
    expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
    const countdown = await screen.findByTestId("live-countdown");
    expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(screen.getByText("Carmen & Roberto")).toBeTruthy();
  }

  it("tras remontar (navegar fuera y volver) la aprobada sigue con su cuenta atrás", async () => {
    await approveRealRequest();
    const first = renderSofiaInbox();
    await expectGrantedWithCountdown();
    // Simula navegar fuera de /profile y volver: desmontar y montar.
    first.unmount();
    renderSofiaInbox();
    await expectGrantedWithCountdown();
    // Las 2 mock siguen pendientes; la aprobada NO vuelve a pendientes.
    expect(screen.getByText("2 pendientes")).toBeTruthy();
  });

  it("tras logout/re-login (solo se limpia la sesión) la aprobada sigue con su cuenta atrás", async () => {
    await approveRealRequest();
    // Sesión activa de Sofía (lo que el logout limpia).
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(
      "demo_user",
      JSON.stringify({ id: SOFIA_ID, email: "single@outlook.es" }),
    );
    const first = renderSofiaInbox();
    await expectGrantedWithCountdown();
    first.unmount();
    // Logout: solo las claves de sesión; el almacén de solicitudes
    // (`friend_requests_demo`) NO se borra al cerrar sesión (solo se
    // purga al ELIMINAR la cuenta).
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("demo_user");
    window.localStorage.removeItem("userType");
    // Re-login: la sesión vuelve con la misma cuenta.
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(
      "demo_user",
      JSON.stringify({ id: SOFIA_ID, email: "single@outlook.es" }),
    );
    renderSofiaInbox();
    await expectGrantedWithCountdown();
    // El almacén sigue trayendo la aceptada (round-trip, como en la
    // ronda 12): bandeja y galería coinciden.
    expect(
      listIncomingRequestsSync(SOFIA_ID, "photo_access", {
        includeDecided: true,
      })[0]?.status,
    ).toBe("accepted");
  });
});
