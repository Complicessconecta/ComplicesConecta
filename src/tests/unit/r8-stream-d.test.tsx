/**
 * Ronda 8, stream D: enlaces compartidos /profile/<uuid> en frío
 * (punto 6) y por qué el 404 (punto 13).
 *
 * Hechos que este test fija (ids del test de verificación ronda 7,
 * preview c3d3d42, 2026-11-25 01:33–02:02 CST):
 *
 * - Sofía 609dcb3b-23f7-423f-a700-00023f74b708 NO es un id del roster de
 *   Discover: es generateDemoUserUUID("single@outlook.es"), el id de la
 *   cuenta demo canónica. El wrapper de /profile/:id solo lo resolvía
 *   desde demo_user en localStorage, así que en frío (otro navegador,
 *   destinatario del enlace) daba "Perfil no encontrado".
 * - Ana 20e3165d-1e83-41e8-a300-0001e834eeda SÍ es del roster
 *   (generateDemoUUID("demo-profile-1"), primera del roster) y el
 *   wrapper ya la resolvía por URL.
 * - Pareja demo 48bb1f12-ff99-4ff9-a900-0000ff99c6cb es
 *   generateDemoUserUUID("pareja@outlook.es") (Carmen & Roberto).
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

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { generateDemoUUID, generateDemoUserUUID } from "@/lib/demo-uuid";
import { generateDemoProfiles } from "@/demo/demoData";
import ProfileDetail from "@/pages/profiles/shared/ProfileDetail";

const SOFIA_ID = "609dcb3b-23f7-423f-a700-00023f74b708";
const COUPLE_ID = "48bb1f12-ff99-4ff9-a900-0000ff99c6cb";
const ANA_ID = "20e3165d-1e83-41e8-a300-0001e834eeda";

const renderProfileRoute = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/profile/${id}`]}>
      <Routes>
        <Route path="/profile/:id" element={<ProfileDetail />} />
      </Routes>
    </MemoryRouter>,
  );

describe("r8 stream D: /profile/:id en frío", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("Sofía es la cuenta demo canónica, no un id del roster", () => {
    expect(generateDemoUserUUID("single@outlook.es")).toBe(SOFIA_ID);
    expect(
      generateDemoProfiles(20).some((p) => p.id === SOFIA_ID),
    ).toBe(false);
  });

  it("la pareja demo canónica es Carmen & Roberto", () => {
    expect(generateDemoUserUUID("pareja@outlook.es")).toBe(COUPLE_ID);
  });

  it("Ana es la primera del roster de Discover", () => {
    const roster = generateDemoProfiles(20);
    expect(roster[0]?.id).toBe(ANA_ID);
    expect(roster[0]?.name).toBe("Ana");
    expect(generateDemoUUID("demo-profile-1")).toBe(ANA_ID);
  });

  it("resuelve /profile/<id de Sofía> en frío, sin demo_user", async () => {
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    renderProfileRoute(SOFIA_ID);
    expect(await screen.findByText("Sofía", {}, { timeout: 5000 })).toBeTruthy();
  });

  it("resuelve /profile/<id de Ana> en frío, sin demo_user: muestra el gate de perfil privado (Ana es privada por semilla, el espectador no es amigo)", async () => {
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    renderProfileRoute(ANA_ID);
    // Ronda 8 punto 11 (coordinador, integración): Ana es privada por
    // semilla y el espectador ("demo-viewer") no es amigo, así que la
    // URL resuelve al gate de solicitud, no al perfil completo.
    expect(
      await screen.findByText("Ana tiene el perfil privado", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Solicitar ver perfil")).toBeTruthy();
  });

  it("un uuid desconocido muestra 'Perfil no encontrado', no rompe", async () => {
    renderProfileRoute("11111111-2222-4333-8444-555555555555");
    expect(
      await screen.findByText("Perfil no encontrado", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});
