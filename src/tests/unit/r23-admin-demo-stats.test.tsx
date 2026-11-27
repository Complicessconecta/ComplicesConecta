/**
 * Ronda 23 — regresión: /admin/dashboard en demo muestra las stats
 * en CEROS tras recargar (test dirigido PR #82, 03:01–03:09 CST
 * 27 nov; 7/8 PASS + regresión PASS).
 *
 * El panel ya cargaba rápido, no redirigía y conservaba sus
 * secciones (rondas 21–22), pero TODAS las estadísticas quedaban en
 * 0 pese a que la pestaña «Usuarios» listaba 20 usuarios reales.
 *
 * Causa raíz (Admin.tsx, `loadDemoAdminData`): la rama demo ponía
 * las stats en 0 «por diseño» desde la ronda 21, mientras la lista
 * de perfiles sí se generaba con `generateDemoProfiles(20)`. El
 * panel era internamente inconsistente: 20 usuarios listados, 0 en
 * todas las tarjetas.
 *
 * El fix: las stats demo se COMPUTAN del roster demo — totalUsers es
 * la tanda generada (20), activos son los de lastActive dentro de 30
 * días (el generador solo produce «Hace N min», 5–54 min), premium y
 * verificados se cuentan del propio roster, y matches viene del
 * módulo demo compartido (`demoMatches`). Sin fuente demo para
 * descargas/visitas/recompensas/tokens — igual que la rama real, que
 * también los deja en 0.
 *
 * También cubre el typo del subtítulo de moderadores («mantn» →
 * «mantén») y que las pestañas del admin ya no se solapan en móvil
 * (flex con scroll horizontal; rejilla de 5 columnas desde sm).
 *
 * Relojes REALES (ver r21-friends-route.test.tsx: con fake timers
 * el scheduler de React 19 no corre en happy-dom).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: "r23-demo", email: "sofia@demo.local" } as unknown,
  profile: { id: "r23-demo", display_name: "Sofía" } as unknown,
  session: null as unknown,
  loading: false,
  isDemo: true,
  isAdmin: false,
  isAuthenticated: true,
  getProfileType: () => "single",
  isDemoMode: () => true,
  shouldUseRealSupabase: () => false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  loadProfile: vi.fn(),
  shouldUseProductionAdmin: () => false,
  appMode: "demo" as const,
}));
const mockToast = vi.hoisted(() => vi.fn());
const sbCalls = vi.hoisted(() => ({ from: 0, then: 0 }));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mismo Supabase encadenable de r22-stream-a: la rama demo no debe
// tocarlo (sbCalls.from === 0); la rama real no se prueba aquí.
vi.mock("@/integrations/supabase/client", () => {
  const COUNT_BY_TABLE: Record<string, number> = {
    profiles: 1247,
    matches: 93,
    clubs: 2,
    worldid_verifications: 5,
    club_applications: 1,
  };
  const DATA_BY_TABLE: Record<string, unknown[]> = {
    profiles: [],
    invitations: [],
    wallet_balances: [],
    reports: [],
    moderation_logs: [],
    user_suspensions: [],
    permanent_bans: [],
    club_applications: [],
    clubs: [],
  };
  const makeQuery = (table: string): Record<string, unknown> => {
    const q: Record<string, unknown> = {
      _count: null as number | null,
      _data: [] as unknown[],
    };
    q.select = (_cols: string, opts?: { count?: string }) => {
      if (opts?.count === "exact") {
        q._count = COUNT_BY_TABLE[table] ?? 0;
        q._data = [];
      } else {
        q._count = null;
        q._data = DATA_BY_TABLE[table] ?? [];
      }
      return q;
    };
    q.eq = () => q;
    q.gte = () => q;
    q.or = () => q;
    q.in = () => q;
    q.order = () => q;
    q.limit = () => q;
    q.insert = () => Promise.resolve({ data: null, error: null });
    q.update = () => q;
    q.single = () => Promise.resolve({ data: null, error: null });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.then = (onFulfilled: unknown, onRejected: unknown) => {
      sbCalls.then++;
      const result =
        q._count !== null
          ? { data: null, error: null, count: q._count }
          : { data: q._data, error: null, count: null };
      return Promise.resolve(result).then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    };
    return q;
  };
  return {
    supabase: {
      from: (table: string) => {
        sbCalls.from++;
        return makeQuery(table);
      },
      rpc: () => Promise.resolve({ data: false, error: null }),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "r23-demo" } },
            error: null,
          }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: true,
  };
});

// Como el hook real, useAuth devuelve un objeto NUEVO con funciones
// NUEVAS en cada llamada (sin memoizar).
vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    signIn: authState.signIn,
    signOut: authState.signOut,
    isAdmin: () => authState.isAdmin,
    isDemo: () => authState.isDemo,
    isAuthenticated: () => authState.isAuthenticated,
    getProfileType: () => authState.getProfileType(),
    loadProfile: authState.loadProfile,
    shouldUseProductionAdmin: () => authState.shouldUseProductionAdmin(),
    isDemoMode: () => authState.isDemoMode(),
    shouldUseRealSupabase: () => authState.shouldUseRealSupabase(),
    appMode: authState.appMode,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { createElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Admin } from "@/pages/admin/Admin";
import ModeratorDashboard from "@/pages/moderators/ModeratorDashboard";

function renderAdminAt(path: string) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/admin/dashboard",
          element: createElement(Admin),
        }),
        createElement(Route, {
          path: "/discover",
          element: createElement("div", null, "Discover stub"),
        }),
        createElement(Route, {
          path: "/auth",
          element: createElement("div", null, "Auth stub"),
        }),
      ),
    ),
  );
}

/** Valores de las 4 tarjetas del Resumen, en orden de render. */
function overviewValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("p.text-2xl")).map(
    (el) => el.textContent ?? "",
  );
}

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  authState.loading = false;
  authState.isDemo = true;
  authState.isAdmin = false;
  authState.isAuthenticated = true;
  authState.session = null;
  mockToast.mockClear();
  sbCalls.from = 0;
  sbCalls.then = 0;
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/* ------------------------------------------------------------------ */
/* Stats demo computadas del roster (no en 0)                          */
/* ------------------------------------------------------------------ */
describe("demo: las stats del admin reflejan el roster demo", () => {
  it("tras recargar (remontar) las tarjetas muestran 20/20/4/2, no ceros, y sin tocar Supabase", async () => {
    const first = renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    // Roster determinista: 20 perfiles; activos = todos «Hace N min»
    // (5–54 min, dentro de 30 días); premium = i % 5 === 0 (4);
    // matches = demoMatches del módulo demo compartido (2).
    expect(overviewValues(first.container)).toEqual(["20", "20", "4", "2"]);
    expect(sbCalls.from).toBe(0);
    first.unmount();

    // Recarga: remontar vuelve a cargar el mismo roster con las
    // mismas stats (antes: todas en 0).
    const second = renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    expect(overviewValues(second.container)).toEqual(["20", "20", "4", "2"]);
    expect(sbCalls.from).toBe(0);
  });

  it("la pestaña Estadísticas muestra los 15 verificados del roster", async () => {
    renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    // Radix Tabs activa en mouseDown (no en click).
    fireEvent.mouseDown(
      screen.getByRole("tab", { name: "Estadísticas" }),
    );
    // Verificados: i % 4 !== 0 → 15 de 20.
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("la barra de pestañas no solapa Invitaciones/Estadísticas en móvil: scroll horizontal + rejilla desde sm", () => {
    renderAdminAt("/admin/dashboard");
    const tablist = document.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    expect(tablist?.className).toContain("overflow-x-auto");
    expect(tablist?.className).toContain("sm:grid");
    expect(tablist?.className).toContain("sm:grid-cols-5");
    const invitations = screen.getByRole("tab", { name: "Invitaciones" });
    expect(invitations.className).toContain("shrink-0");
    // La etiqueta lleva acento (antes «Estadsticas»).
    expect(
      screen.getByRole("tab", { name: "Estadísticas" }),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Moderadores: «mantén» con acento                                    */
/* ------------------------------------------------------------------ */
describe("moderadores: subtítulo con acento", () => {
  it("el subtítulo dice «mantén la comunidad segura» y el encabezado «Panel de Moderación»", async () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/moderators/dashboard"] },
        createElement(ModeratorDashboard),
      ),
    );
    expect(
      await screen.findByText(/mantén la comunidad segura/),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /Panel de Moderación/ }),
    ).toBeInTheDocument();
  });
});
