/**
 * Ronda 14, stream C — tres puntos del test de verificación ronda 13
 * (2026-11-25 23:30–23:58 CST, preview, 886 px):
 *
 * C1. /profile/<id> público usa su propio estilo oscuro aunque el tema
 *     sea claro: la vista debe seguir el tema activo (fondo claro y
 *     texto oscuro en claro, como el resto de la app).
 * C2. Las edades de las tarjetas de Discover varían entre cargas
 *     (Ana 29→26): las edades demo deben ser estables — mismo nombre,
 *     misma edad, en cada carga y en cada superficie demo.
 * C3. Centro de notificaciones: los toasts funcionan, pero no había
 *     campana/centro visible. NotificationBell no está montado en
 *     ningún sitio (ni header, ni nav, ni dock): la campana debe ser
 *     alcanzable desde el layout.
 *
 * Convención de mocks: misma que r13-stream-c (Supabase mockeado, sin
 * backend) + useAuth mockeado con estado hoisted, como
 * r11-stream-b-light-theme.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));

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

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: authState.profile,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: () => Boolean(authState.user),
    isDemo: () => Boolean((authState.user as { is_demo?: boolean } | null)?.is_demo),
    isDemoMode: () => Boolean((authState.user as { is_demo?: boolean } | null)?.is_demo),
    getProfileType: () => "single",
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  // Toaster (montado por MainLayout) lee `toasts`: sin él, `toasts.map`
  // rompe el render del layout en el test.
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { generateDemoUUID } from "@/lib/demo-uuid";
import ProfileDetail from "@/pages/profiles/shared/ProfileDetail";
import { createLocalDemoAccount } from "@/lib/demo-registration";
import { generateDemoProfiles } from "@/demo/demoData";
import {
  generateRandomProfiles,
  ageForDemoName,
} from "@/utils/discover/generateRandomProfiles";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MainLayout } from "@/components/layout/MainLayout";

const CARLOS_ID = generateDemoUUID("demo-profile-4");
const ANA_ID = generateDemoUUID("demo-profile-1");

const renderProfileRoute = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/profile/${id}`]}>
      <Routes>
        <Route path="/profile/:id" element={<ProfileDetail />} />
      </Routes>
    </MemoryRouter>,
  );

/** Raíz de la vista (min-h-screen): la que llevaba el degradado oscuro. */
const pageRoot = (heading: string) =>
  screen.getByText(heading).closest(".min-h-screen") as HTMLElement | null;

beforeEach(() => {
  window.localStorage.clear();
  authState.user = null;
  authState.profile = null;
});

describe("C1: /profile/<id> sigue el tema activo (claro = claro)", () => {
  it("la vista completa (Carlos) tiene fondo claro y texto oscuro en claro", async () => {
    renderProfileRoute(CARLOS_ID);
    const h1 = await screen.findByText("Carlos", { selector: "h1" }, { timeout: 5000 });
    expect(h1.className).toContain("text-slate-900");
    expect(h1.className).toContain("dark:text-white");
    const root = pageRoot("Carlos");
    expect(root).not.toBeNull();
    expect(root!.className).toContain("bg-white");
    // Sin degradado oscuro incondicional: solo su variante dark:.
    expect(root!.className).not.toMatch(/(?<!dark:)from-purple-900/);
    expect(root!.className).not.toMatch(/(?<!dark:)via-fuchsia-900/);
    // La tarjeta del encabezado también sigue el tema.
    const card = h1.closest(".bg-white, .dark\\:bg-white\\/10") as HTMLElement | null;
    expect(card).not.toBeNull();
  });

  it("la pantalla de perfil privado (Ana) sigue el tema", async () => {
    createLocalDemoAccount({
      email: "testr14@demo.local",
      nickname: "TestR14",
      accountType: "single",
    });
    renderProfileRoute(ANA_ID);
    expect(
      await screen.findByText("Ana tiene el perfil privado", {}, { timeout: 5000 }),
    ).toBeTruthy();
    const root = screen
      .getByText("Ana tiene el perfil privado")
      .closest(".min-h-screen") as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(root!.className).toContain("bg-white");
    expect(root!.className).not.toMatch(/(?<!dark:)from-purple-900/);
  });

  it("la pantalla 'Perfil no encontrado' sigue el tema", async () => {
    renderProfileRoute("11111111-2222-4333-8444-555555555555");
    expect(
      await screen.findByText("Perfil no encontrado", {}, { timeout: 5000 }),
    ).toBeTruthy();
    const root = pageRoot("Perfil no encontrado");
    expect(root).not.toBeNull();
    expect(root!.className).toContain("bg-white");
    expect(root!.className).not.toMatch(/(?<!dark:)from-purple-900/);
  });
});

describe("C2: edades demo estables — mismo nombre, misma edad, siempre", () => {
  it("generateRandomProfiles es idéntica entre llamadas", () => {
    expect(generateRandomProfiles()).toEqual(generateRandomProfiles());
  });

  it("dentro de la lista, un mismo nombre nunca tiene dos edades", () => {
    const list = generateRandomProfiles();
    const ageByName = new Map<string, number>();
    for (const p of list) {
      expect(p.age).toBeGreaterThanOrEqual(22);
      expect(p.age).toBeLessThanOrEqual(45);
      const seen = ageByName.get(p.name);
      if (seen === undefined) ageByName.set(p.name, p.age);
      else expect(p.age).toBe(seen);
    }
  });

  it("la edad de un nombre coincide con la del roster canónico (Ana 26)", () => {
    const roster = generateDemoProfiles(20);
    const rosterAge = new Map(roster.map((p) => [p.name, p.age]));
    expect(rosterAge.get("Ana")).toBe(26);
    expect(ageForDemoName("Ana")).toBe(26);
    for (const p of generateRandomProfiles()) {
      const canonical = rosterAge.get(p.name);
      if (canonical !== undefined) expect(p.age).toBe(canonical);
    }
  });

  it("la edad depende del nombre, no de la posición: es estable entre cargas", () => {
    const first = generateRandomProfiles();
    const second = generateRandomProfiles();
    for (let i = 0; i < first.length; i++) {
      expect(second[i]!.age).toBe(first[i]!.age);
      expect(first[i]!.age).toBe(ageForDemoName(first[i]!.name));
    }
  });
});

describe("C3: la campana de notificaciones es alcanzable y abre el centro", () => {
  const DEMO_USER = {
    id: "demo-user-1",
    email: "single@outlook.es",
    is_demo: true,
  };

  beforeEach(() => {
    authState.user = DEMO_USER as unknown;
  });

  it("NotificationBell muestra el distintivo con las 2 demo y abre el panel", async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    // Distintivo de no leídas: el botón de la campana lleva el "2".
    const bellButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "2");
    expect(bellButton).toBeTruthy();
    fireEvent.click(bellButton!);
    expect(
      await screen.findByText("Nueva solicitud de conexión", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Nuevo mensaje")).toBeTruthy();
    expect(screen.getByText(/No leídas \(2\)/)).toBeTruthy();
  });

  it("MainLayout monta la campana en la fila superior (Discover, logueado)", async () => {
    render(
      <MemoryRouter initialEntries={["/discover"]}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/discover" element={<div>Contenido Discover</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Contenido Discover", {}, { timeout: 5000 }),
    ).toBeTruthy();
    // La campana vive en la fila superior en flujo: mismo distintivo "2".
    const bellButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "2");
    expect(bellButton).toBeTruthy();
    fireEvent.click(bellButton!);
    expect(
      await screen.findByText("Nueva solicitud de conexión", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});
