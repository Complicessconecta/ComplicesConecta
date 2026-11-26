/**
 * Ronda 14, stream B: los 3 puntos del test completo de la ronda 13
 * (2026-11-25 23:30–23:58, preview a 886 px).
 *
 * 1. /demo: la sesión demo activa (Single/Pareja canónica) no tenía
 *    ninguna UI de gestión: `handleDemoAuth`/`useAuth.signIn` solo
 *    escriben las claves de SESIÓN (`demo_authenticated`, `demo_user`,
 *    `userType`) y nunca entran en el registro
 *    `cc_local_demo_accounts_v1`, así que la sección "Tus cuentas demo
 *    en este navegador" (que solo lista el registro) nunca las muestra
 *    y su Eliminar no existe en /demo. Ahora /demo muestra la sección
 *    "Cuenta demo activa" mientras haya sesión que no se pueda
 *    gestionar desde la lista (la canónica; la registrada no canónica
 *    ya tiene Entrar + Eliminar en su fila y no se duplica), con
 *    Entrar y Eliminar (diálogo en la app).
 * 2. /clubs: buscar "Eden" dejaba visible la tarjeta Club Demo: esa
 *    tarjeta se renderizaba incondicional (`{!slug && ...}`), fuera de
 *    `filteredClubs`. Ahora pasa por el mismo predicado de búsqueda.
 * 3. /clubs/eden-noir: con el cliente stub de Supabase (preview sin
 *    variables) las consultas de `fetchSingle` RECHAZAN y el `catch`
 *    se saltaba el respaldo del catálogo PUBLIC_CLUBS, así que el
 *    detalle nunca resolvía por esa vía. Ahora el slug del catálogo
 *    se resuelve síncrono en el efecto, antes de tocar Supabase.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const supabaseBehavior = vi.hoisted(() => ({
  mode: "reject" as "reject" | "empty" | "hang",
}));

// Cliente Supabase simulado con los modos del mundo real:
// - "reject": el stub del preview sin variables (fetch rechaza).
// - "empty": BD configurada pero sin filas (single → PGRST116).
// - "hang": la carga de la lista nunca se resuelve (red colgada) y
//   las consultas sueltas rechazan: el detalle de un slug de catálogo
//   no debe depender de que la lista termine de cargar.
vi.mock("@/integrations/supabase/client", () => {
  const stubError = () =>
    Promise.reject(
      new Error("Supabase not configured - using stub client"),
    );
  const makeQuery = (): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.order = () => q;
    q.insert = () => q;
    q.update = () => q;
    q.single = () =>
      supabaseBehavior.mode === "empty"
        ? Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          })
        : stubError();
    q.maybeSingle = () =>
      supabaseBehavior.mode === "empty"
        ? Promise.resolve({ data: null, error: null })
        : stubError();
    // La cadena es thenable (como PostgREST): loadClubs la espera.
    // En modo "hang" no se resuelve nunca.
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      (supabaseBehavior.mode === "hang"
        ? new Promise(() => {})
        : supabaseBehavior.mode === "reject"
          ? stubError()
          : Promise.resolve({ data: [], error: null })).then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    return q;
  };
  return {
    supabase: {
      from: () => makeQuery(),
      rpc: () =>
        supabaseBehavior.mode === "reject"
          ? stubError()
          : Promise.resolve({ data: null, error: null }),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    signIn: mockSignIn,
    isAuthenticated: () => false,
    isAdmin: () => false,
    isDemo: () => false,
    isDemoMode: () => false,
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/services/clubs/clubContentService", () => ({
  loadClubEvents: vi.fn().mockResolvedValue({ items: [] }),
  loadClubDiscounts: vi.fn().mockResolvedValue({ items: [] }),
}));

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DemoSelector from "@/components/auth/DemoSelector";
import { Clubs, clubMatchesSearch } from "@/pages/Clubs";
import {
  createLocalDemoAccount,
  deleteActiveDemoSession,
  getActiveDemoSession,
  listLocalDemoAccounts,
} from "@/lib/demo-registration";
import { generateDemoUserUUID } from "@/lib/demo-uuid";

function seedCanonicalSession(
  email: "single@outlook.es" | "pareja@outlook.es",
): void {
  const firstName = email === "single@outlook.es" ? "Sofía" : "Carmen & Roberto";
  const type = email === "single@outlook.es" ? "single" : "couple";
  window.localStorage.setItem("demo_authenticated", "true");
  window.localStorage.setItem("userType", type);
  window.localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: generateDemoUserUUID(email),
      email,
      role: "user",
      accountType: type,
      first_name: firstName,
      is_demo: true,
      created_at: new Date().toISOString(),
    }),
  );
}

function renderDemoSelector() {
  return render(
    <MemoryRouter initialEntries={["/demo"]}>
      <DemoSelector />
    </MemoryRouter>,
  );
}

function renderClubs(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:slug" element={<Clubs />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("1. Sesión demo activa en /demo (Single/Pareja canónica)", () => {
  it("getActiveDemoSession: null sin sesión", () => {
    expect(getActiveDemoSession()).toBeNull();
  });

  it("getActiveDemoSession: resuelve la sesión canónica Single (Sofía)", () => {
    seedCanonicalSession("single@outlook.es");
    const session = getActiveDemoSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe("single@outlook.es");
    expect(session?.nickname).toBe("Sofía");
    expect(session?.type).toBe("single");
    expect(session?.isCanonical).toBe(true);
  });

  it("getActiveDemoSession: resuelve la sesión canónica Pareja", () => {
    seedCanonicalSession("pareja@outlook.es");
    const session = getActiveDemoSession();
    expect(session?.nickname).toBe("Carmen & Roberto");
    expect(session?.type).toBe("couple");
    expect(session?.isCanonical).toBe(true);
  });

  it("deleteActiveDemoSession: la canónica cierra la sesión (no borra el fixture)", () => {
    seedCanonicalSession("single@outlook.es");
    expect(deleteActiveDemoSession()).toEqual({ deleted: true });
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    expect(getActiveDemoSession()).toBeNull();
  });

  it("deleteActiveDemoSession: la registrada no canónica se borra del registro y cierra sesión", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr14@demo.local",
      nickname: "TestR14",
      accountType: "single",
    });
    expect(getActiveDemoSession()?.nickname).toBe("TestR14");
    expect(deleteActiveDemoSession()).toEqual({ deleted: true });
    expect(listLocalDemoAccounts()).toHaveLength(0);
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(getActiveDemoSession()).toBeNull();
    expect(deleteActiveDemoSession().deleted).toBe(false);
    void userId;
  });

  it("/demo muestra 'Cuenta demo activa' con Sofía y su Eliminar", () => {
    seedCanonicalSession("single@outlook.es");
    renderDemoSelector();
    expect(screen.getByText("Cuenta demo activa")).toBeTruthy();
    expect(screen.getByText("Sofía")).toBeTruthy();
    expect(
      screen.getByLabelText("Eliminar la sesión demo de Sofía"),
    ).toBeTruthy();
  });

  it("Eliminar de la sesión activa canónica pide confirmación y cierra la sesión", async () => {
    seedCanonicalSession("single@outlook.es");
    renderDemoSelector();
    fireEvent.click(
      screen.getByLabelText("Eliminar la sesión demo de Sofía"),
    );
    expect(screen.getByText("¿Eliminar la sesión demo activa?")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText("Sí, eliminar"));
    });
    await waitFor(() =>
      expect(screen.queryByText("Cuenta demo activa")).toBeNull(),
    );
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(getActiveDemoSession()).toBeNull();
  });

  it("Entrar de la sesión activa navega al perfil Single", () => {
    seedCanonicalSession("single@outlook.es");
    renderDemoSelector();
    fireEvent.click(
      screen.getByRole("button", { name: /Entrar como Sofía/ }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/profile-single");
  });

  it("sin sesión demo no hay sección 'Cuenta demo activa'", () => {
    renderDemoSelector();
    expect(screen.queryByText("Cuenta demo activa")).toBeNull();
  });

  it("la sesión activa registrada NO duplica la sección: se gestiona desde su fila de la lista", async () => {
    createLocalDemoAccount({
      email: "testr14b@demo.local",
      nickname: "TestR14b",
      accountType: "single",
    });
    renderDemoSelector();
    // Sin sección "Cuenta demo activa" (la cuenta ya tiene Entrar +
    // Eliminar en "Tus cuentas demo en este navegador").
    expect(screen.queryByText("Cuenta demo activa")).toBeNull();
    expect(screen.getByText("TestR14b")).toBeTruthy();
    fireEvent.click(
      screen.getByLabelText("Eliminar la cuenta demo TestR14b"),
    );
    expect(screen.getByText("¿Eliminar cuenta demo?")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText("Sí, eliminar"));
    });
    await waitFor(() => expect(screen.queryByText("TestR14b")).toBeNull());
    expect(listLocalDemoAccounts()).toHaveLength(0);
    expect(getActiveDemoSession()).toBeNull();
  });
});

describe("2. Búsqueda en /clubs filtra también la tarjeta Club Demo", () => {
  it("clubMatchesSearch: 'Eden' casa con Eden Noir y no con Club Demo", () => {
    expect(
      clubMatchesSearch("Eden Noir Club", "CDMX", "Eden", "all"),
    ).toBe(true);
    expect(
      clubMatchesSearch("Club Demo CómplicesConecta", "CDMX", "Eden", "all"),
    ).toBe(false);
  });

  it("clubMatchesSearch: vacía casa con todo; ciudad filtra; insensible a mayúsculas", () => {
    expect(clubMatchesSearch("Club Demo CómplicesConecta", "CDMX", "", "all")).toBe(
      true,
    );
    expect(
      clubMatchesSearch("Club Demo CómplicesConecta", "CDMX", "", "Guadalajara"),
    ).toBe(false);
    expect(
      clubMatchesSearch("Luna Roja", "Guadalajara", "luna", "all"),
    ).toBe(true);
    expect(
      clubMatchesSearch("Luna Roja", "Guadalajara", "", "Guadalajara"),
    ).toBe(true);
    expect(
      clubMatchesSearch("Eden Noir Club", "CDMX", "guadalajara", "all"),
    ).toBe(false);
  });

  it("escribir 'Eden' en /clubs deja solo Eden Noir (Club Demo desaparece)", async () => {
    supabaseBehavior.mode = "empty";
    renderClubs("/clubs");
    await screen.findByText("Eden Noir Club", {}, { timeout: 5000 });
    // Dos tarjetas "Club Demo": la fija (Admin, /clubs/demo) y la del
    // catálogo. Ambas deben desaparecer con la búsqueda.
    expect(screen.queryAllByText("Club Demo CómplicesConecta").length).toBe(
      2,
    );
    fireEvent.change(
      screen.getByPlaceholderText("Buscar clubs por nombre o ciudad..."),
      { target: { value: "Eden" } },
    );
    await waitFor(() =>
      expect(screen.queryAllByText("Club Demo CómplicesConecta")).toHaveLength(
        0,
      ),
    );
    expect(screen.getByText("Eden Noir Club")).toBeTruthy();
  });
});

describe("3. /clubs/eden-noir muestra el detalle", () => {
  it("con el stub de Supabase (consultas rechazan) el detalle Eden Noir resuelve", async () => {
    supabaseBehavior.mode = "reject";
    renderClubs("/clubs/eden-noir");
    // Detalle: cabecera "Galería" + botón "Volver"; la lista (hero y
    // búsqueda) ya no está.
    expect(
      await screen.findByText("Galería", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Volver")).toBeTruthy();
    expect(
      screen.queryByPlaceholderText("Buscar clubs por nombre o ciudad..."),
    ).toBeNull();
    expect(screen.getByText("Eden Noir Club")).toBeTruthy();
  });

  it("con BD vacía (single → PGRST116) el detalle Eden Noir también resuelve", async () => {
    supabaseBehavior.mode = "empty";
    renderClubs("/clubs/eden-noir");
    expect(
      await screen.findByText("Galería", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Eden Noir Club")).toBeTruthy();
  });

  it("si la carga de la lista nunca termina, el detalle resuelve igual (no depende de loadClubs)", async () => {
    supabaseBehavior.mode = "hang";
    renderClubs("/clubs/eden-noir");
    expect(
      await screen.findByText("Galería", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText("Eden Noir Club")).toBeTruthy();
  });
});
