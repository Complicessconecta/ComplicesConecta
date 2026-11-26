/**
 * Ronda 15, stream A: regresión de las solicitudes de fotos
 * SEMBRADAS (test dirigido + humo del PR #74, 2026-11-26 02:27–02:44
 * CST, navegador del teléfono de Wacko, 886 px, solo cuentas demo;
 * veredicto DO NOT MERGE).
 *
 * Síntomas en vivo:
 * 1. Al aprobar una solicitud SEMBRADA (María García, Carlos López)
 *    en la bandeja "Solicitudes de Acceso" de Sofía solo se ve la
 *    píldora "Acceso concedido", SIN contador HH:MM:SS (búsqueda de
 *    "00:" sin resultados).
 * 2. La aprobación de María se PIERDE al navegar fuera y volver
 *    (vuelve a "2 pendientes" con "Aprobar") y también tras
 *    logout/re-login.
 * 3. En cambio la solicitud creada desde el chat (pareja → Sofía)
 *    SÍ muestra el contador en vivo (23:59:58…) y persiste tras
 *    navegar y tras logout.
 *
 * Causa raíz (leída en código, no adivinada):
 * - `PrivateImageRequestsManager.tsx` (antes del fix) construía las
 *   2 semillas como objetos hardcodeados con `isLocal` ausente, fuera
 *   de `friend_requests_demo`. `handleApprove` solo las tocaba por el
 *   camino simulado (`setState` + toast, sin escribir nada).
 * - La concesión viva ES una fila `photo_access` con status
 *   `accepted` y `respondedAt` en ese almacén: `respondFriendRequest`
 *   (`friends.ts`) la escribe y `getAnonymousPhotoAccessRemainingMs`
 *   (`friends.ts`) la lee para la cuenta atrás de 24 h. Sin fila no
 *   hay nada que contar (síntoma 1: solo la píldora) y al remontar
 *   `loadRequests` re-sembraba las mock como pendientes (síntoma 2).
 * - La solicitud del chat sí pasa por `sendPhotoAccessRequest` →
 *   almacén real → `respondFriendRequest` (síntoma 3: funciona).
 * - El fix (ronda 14, stream A, 1 línea en `Chat.tsx`) solo arregló
 *   que la solicitud del chat LLEGARA a la bandeja; no tocó el
 *   camino sembrado.
 *
 * Fix: `ensureSeededPhotoAccessRequests` (`friends.ts`) siembra las
 * 2 semillas en el MISMO almacén que una solicitud real (idempotente,
 * una por dueño) y el gestor las lee de ahí; aprobar/denegar pasa por
 * el mismo `respondFriendRequest` que el camino del chat. El camino
 * simulado de aprobar/denegar se eliminó.
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
  ensureSeededPhotoAccessRequests,
  getAnonymousPhotoAccessRemainingMs,
  listIncomingRequestsSync,
  type SeededPhotoAccessRequest,
} from "@/lib/friends";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrivateImageRequestsManager } from "@/components/profiles/shared/PrivateImageRequestsManager";

const SOFIA_ID = generateDemoUserUUID("single@outlook.es");
const MARIA_ID = "user-123";
const CARLOS_ID = "user-456";
/** Semillas tal como las siembra el gestor (mismos fromId). */
const SEEDS: SeededPhotoAccessRequest[] = [
  {
    fromId: MARIA_ID,
    message: "Hola, me gustaría ver tus fotos privadas para conocerte mejor.",
    createdMinutesAgo: 60,
  },
  {
    fromId: CARLOS_ID,
    message: "Me interesa tu perfil, ¿podrías compartir tus fotos?",
    createdMinutesAgo: 120,
  },
];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

async function renderSofiaInbox() {
  const utils = render(
    <PrivateImageRequestsManager profileId={SOFIA_ID} profileName="Sofía" />,
  );
  // La carga simulada (500 ms) + las 2 semillas.
  expect(await screen.findByText("María García")).toBeInTheDocument();
  expect(screen.getByText("Carlos López")).toBeTruthy();
  return utils;
}

/** Clica "Aprobar" en la tarjeta de la primera pendiente. */
function approveFirstPending(): void {
  const approveButtons = screen.getAllByRole("button", { name: /Aprobar/ });
  expect(approveButtons.length).toBeGreaterThan(0);
  fireEvent.click(approveButtons[0] as HTMLElement);
}

async function expectGrantedWithCountdown(): Promise<void> {
  expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
  const countdown = await screen.findByTestId("live-countdown");
  expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
}

describe("1. La siembra escribe las solicitudes en el mismo almacén que las reales", () => {
  it("sembrar dos veces no duplica: sigue habiendo exactamente 2 filas", () => {
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    const inbox = listIncomingRequestsSync(SOFIA_ID, "photo_access", {
      includeDecided: true,
    });
    expect(inbox).toHaveLength(2);
    expect(inbox.map((r) => r.status)).toEqual(["pending", "pending"]);
  });

  it("montar el gestor dos veces no duplica las semillas", async () => {
    const first = await renderSofiaInbox();
    first.unmount();
    await renderSofiaInbox();
    expect(
      listIncomingRequestsSync(SOFIA_ID, "photo_access", {
        includeDecided: true,
      }),
    ).toHaveLength(2);
    expect(screen.getByText("2 pendientes")).toBeTruthy();
  });

  it("una semilla aceptada y ya expirada (24 h) vuelve a sembrarse como pendiente", () => {
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    // Envejecer la concesión de María 25 h en el almacén.
    const raw = window.localStorage.getItem("friend_requests_demo");
    const rows = JSON.parse(raw as string) as Array<Record<string, unknown>>;
    const maria = rows.find((r) => r.fromId === MARIA_ID);
    expect(maria).toBeTruthy();
    (maria as Record<string, unknown>).status = "accepted";
    (maria as Record<string, unknown>).respondedAt = new Date(
      Date.now() - 25 * 60 * 60 * 1000,
    ).toISOString();
    window.localStorage.setItem("friend_requests_demo", JSON.stringify(rows));
    // Sin concesión viva: la cuenta atrás ya no existe.
    expect(getAnonymousPhotoAccessRemainingMs(MARIA_ID, SOFIA_ID)).toBeNull();
    // Re-sembrar: María vuelve a pendiente (puede concederse de
    // nuevo); Carlos sigue pendiente y no se duplica nada.
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    const inbox = listIncomingRequestsSync(SOFIA_ID, "photo_access", {
      includeDecided: true,
    });
    expect(inbox).toHaveLength(2);
    expect(inbox.map((r) => r.status)).toEqual(["pending", "pending"]);
  });
});

describe("2. Al aprobar una solicitud SEMBRADA, la otorgante ve la cuenta atrás HH:MM:SS", () => {
  it("aprobar a María García muestra 'Acceso concedido' CON cuenta atrás en vivo", async () => {
    await renderSofiaInbox();
    approveFirstPending();
    await expectGrantedWithCountdown();
    // La concesión es la MISMA que la del camino del chat: fila
    // `photo_access` aceptada con `respondedAt`, 24 h de vigencia.
    expect(
      getAnonymousPhotoAccessRemainingMs(MARIA_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);
    // Carlos sigue sin concesión y pendiente.
    expect(getAnonymousPhotoAccessRemainingMs(CARLOS_ID, SOFIA_ID)).toBeNull();
    expect(screen.getByText("1 pendientes")).toBeTruthy();
  });

  it("control: denegar a Carlos persiste como denegada y no vuelve a pendiente al remontar", async () => {
    const first = await renderSofiaInbox();
    const denyButtons = screen.getAllByRole("button", { name: /Denegar/ });
    expect(denyButtons.length).toBe(2);
    fireEvent.click(denyButtons[1] as HTMLElement);
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
    first.unmount();
    await renderSofiaInbox();
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
    expect(screen.getByText("Carlos López")).toBeTruthy();
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    expect(getAnonymousPhotoAccessRemainingMs(CARLOS_ID, SOFIA_ID)).toBeNull();
  });
});

describe("3. La aprobación de una sembrada persiste al navegar y tras logout/re-login", () => {
  function setSofiaSession(): void {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(
      "demo_user",
      JSON.stringify({ id: SOFIA_ID, email: "single@outlook.es" }),
    );
  }

  it("tras remontar (navegar fuera y volver) la aprobada sigue con su cuenta atrás", async () => {
    const first = await renderSofiaInbox();
    approveFirstPending();
    await expectGrantedWithCountdown();
    // Simula navegar fuera de /profile y volver: desmontar y montar.
    first.unmount();
    await renderSofiaInbox();
    await expectGrantedWithCountdown();
    // María ya no está pendiente; Carlos sigue pendiente.
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    expect(
      getAnonymousPhotoAccessRemainingMs(MARIA_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);
    // El almacén trae la aceptada (round-trip): bandeja y galería
    // coinciden, como en el camino del chat (ronda 14).
    expect(
      listIncomingRequestsSync(SOFIA_ID, "photo_access", {
        includeDecided: true,
      }).find((r) => r.fromId === MARIA_ID)?.status,
    ).toBe("accepted");
  });

  it("tras logout/re-login (solo se limpia la sesión) la aprobada sigue con su cuenta atrás", async () => {
    setSofiaSession();
    const first = await renderSofiaInbox();
    approveFirstPending();
    await expectGrantedWithCountdown();
    first.unmount();
    // Logout: solo las claves de sesión; el almacén de solicitudes
    // (`friend_requests_demo`) NO se borra al cerrar sesión (solo se
    // purga al ELIMINAR la cuenta).
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("demo_user");
    window.localStorage.removeItem("userType");
    // Re-login: la sesión vuelve con la misma cuenta.
    setSofiaSession();
    await renderSofiaInbox();
    await expectGrantedWithCountdown();
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    expect(
      listIncomingRequestsSync(SOFIA_ID, "photo_access", {
        includeDecided: true,
      }).find((r) => r.fromId === MARIA_ID)?.status,
    ).toBe("accepted");
  });
});
