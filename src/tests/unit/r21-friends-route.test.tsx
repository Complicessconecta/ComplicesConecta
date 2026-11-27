/**
 * Ronda 21, stream A — FAIL 1, 2, 3 y 5.
 *
 * 1. /friends existe y renderiza la lista sin caer en NotFound
 *    (FAIL 1): estado vacío y lista semilla demo.
 * 2. ImperativeLazyRoute (FAIL 2a y 5): el chunk resuelve sin
 *    Suspense, el tope corta un chunk colgado y muestra el panel con
 *    Reintentar, y Reintentar re-carga el chunk.
 * 3. Admin en demo (FAIL 2b): el panel carga con datos demo/respaldo
 *    y el aviso visible, sin toast de «Acceso Denegado», sin navegar
 *    a /discover y sin llamadas a Supabase; el gate real (no demo,
 *    no admin) sigue rebotando a /discover.
 * 4. /moderators «Dashboard Demo» (FAIL 3): navega a
 *    /moderators/dashboard, no a /moderator-dashboard.
 *
 * Relojes REALES (con fake timers el scheduler de React 19 no corre
 * en happy-dom, ver r9-stream-c). Topes acortados por prop en las
 * pruebas del wrapper; el valor de producción (15 s) es el mismo
 * que el de ProfileDetailRoute.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: "r21-user", email: "demo@demo.local" } as unknown,
  profile: {
    id: "r21-user",
    display_name: "Usuario Prueba",
  } as unknown,
  isDemo: () => true,
  isAdmin: () => false,
  isAuthenticated: () => true,
  getProfileType: () => "single",
  isDemoMode: () => true,
  shouldUseRealSupabase: () => false,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  loadProfile: vi.fn(),
  shouldUseProductionAdmin: () => false,
  appMode: "production" as const,
  session: null,
}));
const mockToast = vi.hoisted(() => vi.fn());
const sbCalls = vi.hoisted(() => ({ from: 0 }));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => {
  const makeQuery = (): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.or = () => q;
    q.gte = () => q;
    q.in = () => q;
    q.order = () => q;
    q.limit = () => q;
    q.insert = () => Promise.resolve({ data: null, error: null });
    q.update = () => q;
    q.single = () => Promise.resolve({ data: null, error: null });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve({ data: [], error: null, count: 0 }).then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    return q;
  };
  return {
    supabase: {
      from: () => {
        sbCalls.from++;
        return makeQuery();
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
            data: { user: { id: "r21-user" } },
            error: null,
          }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { createElement, type ComponentType } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Friends from "@/pages/Friends";
import { ImperativeLazyRoute } from "@/pages/ImperativeLazyRoute";
import { Admin } from "@/pages/admin/Admin";
import Moderators from "@/pages/Moderators";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  window.localStorage.clear();
  authState.user = { id: "r21-user", email: "demo@demo.local" };
  authState.profile = { id: "r21-user", display_name: "Usuario Prueba" };
  authState.isDemo = () => true;
  authState.isAdmin = () => false;
  authState.isAuthenticated = () => true;
  mockToast.mockClear();
  sbCalls.from = 0;
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/* ------------------------------------------------------------------ */
/* FAIL 1 — /friends                                                   */
/* ------------------------------------------------------------------ */
describe("FAIL 1 — /friends renderiza la lista sin caer en NotFound", () => {
  function renderFriendsRoute() {
    return render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/friends"] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/friends",
            element: createElement(Friends),
          }),
          createElement(Route, {
            path: "*",
            element: createElement("div", null, "NOT-FOUND"),
          }),
        ),
      ),
    );
  }

  it("usuario sin amigos: estado vacío, sin 404", async () => {
    renderFriendsRoute();
    expect(
      await screen.findByRole("heading", { name: /Amigos/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no tienes amigos agregados."),
    ).toBeInTheDocument();
    expect(screen.queryByText("NOT-FOUND")).not.toBeInTheDocument();
    expect(screen.queryByText("404")).not.toBeInTheDocument();
  });

  it("usuario demo semilla (Sofía): lista con en línea, bandera y Eliminar", async () => {
    authState.profile = { id: "r21-user", display_name: "Sofía" };
    renderFriendsRoute();
    // Amigos semilla de Sofía (src/demo/socialDemoData.ts).
    for (const name of ["Ana", "Carlos", "Carmen & Roberto", "Lucía"]) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
    // En línea (varios amigos semilla están en línea).
    expect(screen.getAllByText("En línea").length).toBeGreaterThan(0);
    // Bandera de país (MX en la semilla).
    expect(screen.getAllByText("🇲🇽").length).toBeGreaterThan(0);
    // «Eliminar» solo en perfil propio: la página es el perfil
    // propio, así que cada amigo tiene su botón.
    expect(screen.getAllByTitle("Eliminar de amigos").length).toBe(4);
    expect(screen.queryByText("NOT-FOUND")).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* FAIL 2a / 5 — ImperativeLazyRoute                                   */
/* ------------------------------------------------------------------ */
describe("ImperativeLazyRoute — carga imperativa con tope y Reintentar", () => {
  const StubPage = () => createElement("div", null, "Página cargada");

  it("el chunk resuelve sin Suspense: loader y luego la página", async () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => Promise.resolve({ default: StubPage }),
          chunkName: "pages-test",
        }),
      ),
    );
    expect(
      await screen.findByText("Página cargada"),
    ).toBeInTheDocument();
  });

  it("resuelve un módulo sin default (export nombrado, como Admin)", async () => {
    const NamedOnly = () => createElement("div", null, "Panel nombrado");
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () =>
            Promise.resolve({ Admin: NamedOnly } as unknown as {
              default: ComponentType<unknown>;
            }),
          chunkName: "pages-admin",
        }),
      ),
    );
    expect(await screen.findByText("Panel nombrado")).toBeInTheDocument();
  });

  it("chunk colgado: el tope muestra el panel con Reintentar", async () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => new Promise(() => {}),
          chunkName: "pages-colgado",
          chunkTimeoutMs: 50,
          errorTitle: "No se pudo cargar el documento",
        }),
      ),
    );
    expect(
      await screen.findByText("No se pudo cargar el documento"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "La descarga tardó demasiado. Revisa tu conexión e inténtalo de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  it("chunk que rechaza con error de descarga: panel; Reintentar re-carga", async () => {
    let importer: () => Promise<unknown> = () =>
      Promise.reject(new Error("Failed to fetch dynamically imported module"));
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => importer(),
          chunkName: "pages-roto",
          chunkTimeoutMs: 500,
          errorTitle: "No se pudo cargar la página",
        }),
      ),
    );
    expect(
      await screen.findByText("No se pudo cargar la página"),
    ).toBeInTheDocument();
    // El reintento se engancha a la descarga (ahora resuelve).
    importer = () => Promise.resolve({ default: StubPage });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Página cargada")).toBeInTheDocument();
  });

  it("el tope de producción es 15 s", async () => {
    const mod = await import("@/pages/ImperativeLazyRoute");
    expect(mod.IMPERATIVE_LAZY_CHUNK_TIMEOUT_MS).toBe(15_000);
  });
});

/* ------------------------------------------------------------------ */
/* FAIL 2b — Admin en demo                                             */
/* ------------------------------------------------------------------ */
describe("FAIL 2b — /admin/dashboard en demo: panel demo, sin rebote", () => {
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

  it("demo: panel con aviso, sin toast de denegado, sin navegar, sin Supabase", async () => {
    renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Panel de Administracin" }),
    ).toBeInTheDocument();
    // Stats en 0 (respaldo demo) y perfiles demo locales.
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.queryByText("Discover stub")).not.toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Acceso Denegado" }),
    );
    // Sin llamadas a Supabase que cuelguen: todo es local.
    await sleep(100);
    expect(sbCalls.from).toBe(0);
  });

  it("no demo y no admin: el gate real sigue rebotando a /discover", async () => {
    authState.isDemo = () => false;
    renderAdminAt("/admin/dashboard");
    expect(await screen.findByText("Discover stub")).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Acceso Denegado" }),
    );
  });
});

/* ------------------------------------------------------------------ */
/* FAIL 3 — /moderators «Dashboard Demo»                               */
/* ------------------------------------------------------------------ */
describe("FAIL 3 — /moderators «Dashboard Demo» va a /moderators/dashboard", () => {
  it("el botón navega a la ruta real, no a /moderator-dashboard", async () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/moderators"] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/moderators",
            element: createElement(Moderators),
          }),
          createElement(Route, {
            path: "/moderators/dashboard",
            element: createElement("div", null, "ModeratorDashboard stub"),
          }),
          createElement(Route, {
            path: "*",
            element: createElement("div", null, "NOT-FOUND"),
          }),
        ),
      ),
    );
    const button = await screen.findByRole("button", {
      name: /Dashboard Demo/,
    });
    fireEvent.click(button);
    expect(
      await screen.findByText("ModeratorDashboard stub"),
    ).toBeInTheDocument();
    expect(screen.queryByText("NOT-FOUND")).not.toBeInTheDocument();
  });
});
