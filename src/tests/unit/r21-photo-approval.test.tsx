/**
 * Ronda 21, stream B: regresión FAIL 7 — aprobar una solicitud de
 * fotos SEMBRADA necesitaba 2 clics (auditoría full test producción
 * 2026-11-26: toast "Solicitud aprobada" en el 1er clic, pero la
 * fila seguía en Pendientes hasta el 2º).
 *
 * Causa raíz verificada en código (dos capas, ambas cubiertas aquí):
 * 1. Fila DUPLICADA para el mismo solicitante: la siembra
 *    (`ensureSeededPhotoAccessRequests`) ya era idempotente al
 *    CREAR, pero no colapsaba duplicados PREEXISTENTES en el
 *    almacén (navegador con sesiones viejas: una fila sembrada
 *    pre-canonización + una real). El 1er clic aprobaba una fila
 *    (toast) y la otra seguía en Pendientes; el 2º aprobaba la
 *    duplicada. El fix colapsa por (fromId, toId) canonizado antes
 *    de sembrar, conservando la decisión más reciente.
 * 2. Estado optimista sin confirmar: `handleApprove`/`handleDeny`
 *    solo hacían `setRequests` + toast. Ahora re-leen del almacén
 *    (única fuente de verdad) y el toast solo sale si la re-lectura
 *    confirma el estado.
 * 3. Expiración blindada: la rama "aceptada expirada vuelve a
 *    pendiente" solo resetea si `respondedAt` existe y tiene >24 h;
 *    una aceptación fresca NUNCA se lee como expirada (antes
 *    `isPhotoAccessExpired` usaba `respondedAt ?? createdAt`).
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
  respondFriendRequest,
  sendPhotoAccessRequest,
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

/** Filas del almacén para un solicitante (con decididas). */
function storeRowsFor(fromId: string) {
  return listIncomingRequestsSync(SOFIA_ID, "photo_access", {
    includeDecided: true,
  }).filter((r) => r.fromId === fromId);
}

/**
 * Clica "Aprobar" en la tarjeta de Carlos López (2ª pendiente: las
 * semillas se ordenan María, Carlos). Devuelve tras el clic.
 */
function approveCarlos(): void {
  const approveButtons = screen.getAllByRole("button", { name: /Aprobar/ });
  expect(approveButtons).toHaveLength(2);
  fireEvent.click(approveButtons[1] as HTMLElement);
}

describe("1. Aprobar la semilla de Carlos López UNA vez basta", () => {
  it("1 clic → en Aprobadas con cuenta atrás 23:59:59 y ninguna fila suya en Pendientes (ni duplicada)", async () => {
    await renderSofiaInbox();
    approveCarlos();

    // Aprobadas: Carlos con su cuenta atrás en vivo (24 h desde la
    // aceptación: 23:59:59 al momento de aprobar).
    expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
    const countdown = await screen.findByTestId("live-countdown");
    expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(countdown.textContent).toMatch(/^23:59:5\d$/);
    expect(
      getAnonymousPhotoAccessRemainingMs(CARLOS_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);

    // Pendientes: solo queda María; Carlos no tiene NINGUNA fila
    // pendiente (ni la aprobada ni una duplicada).
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    const inbox = listIncomingRequestsSync(SOFIA_ID, "photo_access", {
      includeDecided: true,
    });
    expect(inbox).toHaveLength(2);
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(1);
    expect(storeRowsFor(CARLOS_ID)[0]?.status).toBe("accepted");

    // La fila aprobada es la de Carlos y NO está en la sección de
    // pendientes: solo hay una tarjeta de pendiente (María).
    expect(screen.getAllByRole("button", { name: /Aprobar/ })).toHaveLength(
      1,
    );
  });

  it("tras remontar (navegar fuera y volver) la aprobada sigue con su cuenta atrás y sin duplicado", async () => {
    const first = await renderSofiaInbox();
    approveCarlos();
    await screen.findByTestId("live-countdown");
    first.unmount();

    await renderSofiaInbox();
    expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
    const countdown = await screen.findByTestId("live-countdown");
    expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    // La re-siembra NO reseteó la aceptación fresca a pendiente ni
    // duplicó la fila de Carlos.
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(1);
    expect(storeRowsFor(CARLOS_ID)[0]?.status).toBe("accepted");
    expect(
      getAnonymousPhotoAccessRemainingMs(CARLOS_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});

describe("2. Duplicados preexistentes para el mismo par se colapsan al sembrar", () => {
  it("declinada sembrada + pendiente real del mismo Carlos → una sola fila (la pendiente) y 1 clic basta", async () => {
    // Sembrar y denegar a Carlos por el camino real: queda una fila
    // declinada con id de semilla.
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    const seeded = storeRowsFor(CARLOS_ID)[0];
    expect(seeded).toBeTruthy();
    expect(await respondFriendRequest(seeded!.id, "declined", true)).toEqual({
      ok: true,
    });
    // Carlos vuelve a pedir por el camino real (chat): como la
    // declinada no es pendiente, se crea una SEGUNDA fila para el
    // mismo par (la que en un navegador viejo ya existía).
    expect(
      await sendPhotoAccessRequest(CARLOS_ID, SOFIA_ID, undefined, true),
    ).toEqual({ ok: true });
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(2);

    // Al montar el gestor, la siembra colapsa el par a UNA fila (la
    // decisión más reciente: la pendiente nueva).
    await renderSofiaInbox();
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(1);
    expect(storeRowsFor(CARLOS_ID)[0]?.status).toBe("pending");
    expect(screen.getByText("2 pendientes")).toBeTruthy();

    // Y un solo clic en Aprobar deja a Carlos en Aprobadas.
    approveCarlos();
    expect(await screen.findByText("Acceso concedido")).toBeInTheDocument();
    expect(screen.getByText("1 pendientes")).toBeTruthy();
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(1);
    expect(storeRowsFor(CARLOS_ID)[0]?.status).toBe("accepted");
  });

  it("control: una aceptación fresca NO se resetea a pendiente al re-sembrar (respondedAt < 24 h)", async () => {
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    const carlos = storeRowsFor(CARLOS_ID)[0];
    expect(carlos).toBeTruthy();
    expect(await respondFriendRequest(carlos!.id, "accepted", true)).toEqual({
      ok: true,
    });
    // Re-sembrar (lo que hace cada montaje del gestor): la fila
    // aceptada hace segundos sigue aceptada, no vuelve a pendiente.
    ensureSeededPhotoAccessRequests(SOFIA_ID, SEEDS);
    expect(storeRowsFor(CARLOS_ID)).toHaveLength(1);
    expect(storeRowsFor(CARLOS_ID)[0]?.status).toBe("accepted");
    expect(
      getAnonymousPhotoAccessRemainingMs(CARLOS_ID, SOFIA_ID),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});
