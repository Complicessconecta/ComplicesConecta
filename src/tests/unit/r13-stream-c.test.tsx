/**
 * Ronda 13, stream C — detalle de perfil (/profile/:id): edad
 * ausente, acciones de visitante en el perfil propio y like con
 * estado.
 *
 * Hechos del test de verificación (2026-11-25, producción, master
 * f7e7174, 886 px):
 *
 * C1. Un perfil público anónimo sin edad mostraba "undefined años"
 *     (insignia del encabezado y "Edad: undefined años" en
 *     "Información rápida").
 * C2. En el perfil público PROPIO aparecían "Me gusta" y "Enviar
 *     mensaje" (acciones de visitante para uno mismo).
 * C3. El botón "Me gusta" del detalle solo enviaba el like (toast
 *     "Like enviado") sin reflejar el estado: en Discover la
 *     tarjeta alterna 12→13→12 con corazón rojo al dar like y lo
 *     retira al volver a tocar.
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
import ProfileDetail from "@/pages/profiles/shared/ProfileDetail";
import {
  createLocalDemoAccount,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";

const COUPLE_ROSTER_ID = "20e31658-1f0b-41f0-ab00-0001f0bd29f5";
const CARLOS_ID = generateDemoUUID("demo-profile-4");

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

describe("C1: perfil sin edad no muestra 'undefined años'", () => {
  it("el perfil anónimo local (sin edad) no pinta 'undefined' ni fila de Edad", async () => {
    const anon = createLocalDemoAccount({
      email: "anonr13test@demo.local",
      nickname: "anonr13test",
      accountType: "single",
      isAnonymous: true,
    });
    // El dueño ve su propio perfil completo (sin gate).
    renderProfileRoute(anon.userId);
    expect(
      await screen.findByText(
        "anonr13test",
        { selector: "h1" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain("undefined");
    expect(screen.queryByText("Edad:")).toBeNull();
    expect(screen.queryByText(/años/)).toBeNull();
  });

  it("un perfil con edad la sigue mostrando (insignia y fila Edad:)", async () => {
    createLocalDemoAccount({
      email: "testr13@demo.local",
      nickname: "TestR13",
      accountType: "single",
    });
    renderProfileRoute(CARLOS_ID);
    expect(
      await screen.findByText(
        "Carlos",
        { selector: "h1" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain("undefined");
    expect(screen.getByText("Edad:")).toBeTruthy();
  });
});

describe("C2: el perfil propio no muestra acciones de visitante", () => {
  it("la pareja en su propio perfil no ve 'Me gusta' ni 'Enviar mensaje'", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    restoreLocalDemoSession(couple.profile);
    renderProfileRoute(COUPLE_ROSTER_ID);
    expect(
      await screen.findByText(
        "Carmen & Roberto",
        { selector: "h1" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Me gusta")).toBeNull();
    expect(screen.queryByText("Te gusta")).toBeNull();
    expect(screen.queryByText("Enviar mensaje")).toBeNull();
    expect(
      screen.queryByText("Chat bloqueado: envía solicitud de amistad"),
    ).toBeNull();
    // Revisión stream C: el botón suelto "Reportar perfil" también es
    // acción de visitante (ReportBlockButtons ya se ocultaba solo).
    expect(screen.queryByText("Reportar perfil")).toBeNull();
  });

  it("control: un visitante no dueño SÍ ve 'Me gusta' en el mismo perfil", async () => {
    createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    createLocalDemoAccount({
      email: "testr13@demo.local",
      nickname: "TestR13",
      accountType: "single",
    });
    renderProfileRoute(CARLOS_ID);
    expect(
      await screen.findByText("Me gusta", {}, { timeout: 5000 }),
    ).toBeTruthy();
    // Control de la revisión stream C: el visitante SÍ ve reportar.
    expect(screen.getByText("Reportar perfil")).toBeTruthy();
  });
});

describe("C3: el like del detalle alterna como la tarjeta de Discover", () => {
  it("tocar 'Me gusta' pasa a 'Te gusta' (corazón lleno) y volver a tocar lo retira", async () => {
    // El espectador necesita datos personales (edad): sin ellos la
    // heurística legado de isAnonymousDemoProfile (demo-registration)
    // clasifica al single @demo.local sin edad/bio/género como
    // anónimo y el gate de like anónimo (ronda 10, A8) bloquea el
    // clic antes de llegar al toggle. El registro single normal
    // siempre pasa edad, así que age: 30 es el espectador real aquí.
    createLocalDemoAccount({
      email: "testr13@demo.local",
      nickname: "TestR13",
      accountType: "single",
      age: 30,
    });
    renderProfileRoute(CARLOS_ID);
    const likeButton = await screen.findByText(
      "Me gusta",
      {},
      { timeout: 5000 },
    );
    expect(likeButton.closest("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(likeButton);
    expect(
      await screen.findByText("Te gusta", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Me gusta")).toBeNull();
    const likedButton = screen.getByText("Te gusta").closest("button");
    expect(likedButton).toHaveAttribute("aria-pressed", "true");
    // Corazón relleno al dar like (como AnimatedProfileCard).
    expect(likedButton?.querySelector("svg")).toHaveClass("fill-current");

    fireEvent.click(screen.getByText("Te gusta"));
    expect(
      await screen.findByText("Me gusta", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Te gusta")).toBeNull();
    expect(screen.getByText("Me gusta").closest("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
