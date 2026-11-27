/**
 * Ronda 22, stream A — regresión FAIL 7 (test dirigido PR #81,
 * 00:47–01:08 CST 27 nov) + /moderators/dashboard (tema claro y
 * carga imperativa).
 *
 * FAIL 7 — /admin/dashboard PIERDE SUS DATOS tras el primer render:
 * primera carga con stats reales (12 / 1247 / 8 / 3) y al recargar
 * el panel quedó en ceros sin las secciones inferiores (3 intentos).
 *
 * Causa raíz verificada en código (Admin.tsx + useAuth.ts):
 * 1. El efecto de carga NO esperaba a que la sesión se restaurara.
 *    Esta instancia de useAuth arranca con session/user en null y
 *    la sesión real se hidrata en async (getSession). Con flags demo
 *    obsoletos en el dispositivo, isDemo() valía true en ese primer
 *    render (sesión aún null) y se tomaba la rama demo — stats en 0
 *    + invitaciones/faq vacíos POR DISEÑO — y demoLoadedRef la
 *    dejaba clavada ahí. En navegación SPA la sesión ya estaba
 *    restaurada y salían los datos reales: primera carga bien,
 *    recarga en ceros.
 * 2. La ruta REAL no tenía guardián (la demo sí: demoLoadedRef).
 *    useAuth no memoiza su retorno (objeto literal nuevo en cada
 *    render, useAuth.ts:974), así que las identidades de
 *    isAuthenticated/isAdmin cambian en cada render y el efecto
 *    re-corría y re-disparaba loadAdminData() en cada render:
 *    setLoading(true) devolvía el panel a «Cargando...» y las
 *    cargas solapadas resolvían en cualquier orden (cada
 *    sub-cargador apagaba `loading` en su propio finally).
 *
 * El fix: esperar a `authLoading` antes de decidir rama alguna, y
 * guardián adminLoadedRef para la ruta real; solo el finally de
 * loadAdminData apaga la carga.
 *
 * /moderators/dashboard:
 * a) Títulos en blanco sobre fondo claro en tema claro: la página
 *    forzaba texto blanco con `bg-hero-gradient`, clase MUERTA
 *    (Tailwind v4 ignora tailwind.config.ts y @theme no define
 *    --background-image-*): sin fondo, el texto blanco caía sobre
 *    el fondo claro del body. Ahora el texto es por tema
 *    (slate-900 / white en oscuro); botones y badges con fondo de
 *    color sólido conservan el blanco, y el diálogo de baneo
 *    (superficie bg-gray-900 por diseño) también.
 * b) Primera carga >15 s: la ruta era un `lazy` pelado bajo el
 *    Suspense (mismo patrón del FAIL 2 ronda 21) — ahora va por
 *    ImperativeLazyRoute con tope de 15 s y Reintentar.
 *
 * Relojes REALES (ver r21-friends-route.test.tsx: con fake timers
 * el scheduler de React 19 no corre en happy-dom).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: "r22-admin", email: "admin@complicesconecta.mx" } as unknown,
  profile: { id: "r22-admin", display_name: "Admin" } as unknown,
  session: { user: { id: "r22-admin" } } as unknown,
  loading: false,
  isDemo: false,
  isAdmin: true,
  isAuthenticated: true,
  getProfileType: () => "single",
  isDemoMode: () => false,
  shouldUseRealSupabase: () => true,
  signIn: vi.fn(),
  signOut: vi.fn(),
  loadProfile: vi.fn(),
  shouldUseProductionAdmin: () => false,
  appMode: "production" as const,
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

/**
 * Supabase encadenable con resultados por tabla. Los conteos del
 * test dirigido en vivo eran 12 / 1247 / 8 / 3; aquí se usan valores
 * distintos por tarjeta (1247 / 312 / 48 / 93) para que cada número
 * sea único en el DOM y la aserción no colisione con fechas u otros
 * textos.
 */
vi.mock("@/integrations/supabase/client", () => {
  const COUNT_BY_TABLE: Record<string, number> = {
    profiles: 1247,
    matches: 93,
    clubs: 2,
    worldid_verifications: 5,
    club_applications: 1,
  };
  const DATA_BY_TABLE: Record<string, unknown[]> = {
    profiles: [
      {
        id: "p-ana",
        email: "ana@demo.local",
        first_name: "Ana",
        last_name: "",
        display_name: "Ana",
        bio: "Demo",
        avatar_url: "",
        is_verified: true,
        is_premium: true,
        created_at: "2026-11-01T10:00:00.000Z",
        last_seen: "2026-11-26T10:00:00.000Z",
      },
      {
        id: "p-carlos",
        email: "carlos@demo.local",
        first_name: "Carlos",
        last_name: "R.",
        display_name: "Carlos R.",
        bio: "Demo",
        avatar_url: "",
        is_verified: false,
        is_premium: false,
        created_at: "2026-11-02T10:00:00.000Z",
        last_seen: "2026-11-25T10:00:00.000Z",
      },
    ],
    invitations: [
      {
        id: "inv-1",
        from_profile: "p-carlos",
        to_profile: "p-ana",
        type: "profile",
        message: "Hola",
        status: "pending",
        created_at: "2026-11-26T09:00:00.000Z",
      },
    ],
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
    q.eq = (col: string, val: unknown) => {
      if (table === "profiles" && col === "is_premium") q._count = 48;
      if (table === "worldid_verifications" && col === "is_active")
        q._count = 5;
      if (table === "club_applications" && col === "status") q._count = 1;
      void val;
      return q;
    };
    q.gte = () => {
      if (table === "profiles") q._count = 312;
      return q;
    };
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
            data: { user: { id: "r22-admin" } },
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

// Como el hook real, useAuth devuelve un objeto NUEVO con funciones
// NUEVAS en cada llamada (sin memoizar): es lo que hace que el
// efecto de Admin re-corra en cada render en producción.
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
import { ImperativeLazyRoute } from "@/pages/ImperativeLazyRoute";
import ModeratorDashboard from "@/pages/moderators/ModeratorDashboard";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function setRealAdmin() {
  authState.loading = false;
  authState.isDemo = false;
  authState.isAdmin = true;
  authState.isAuthenticated = true;
  authState.session = { user: { id: "r22-admin" } } as unknown;
}

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  setRealAdmin();
  mockToast.mockClear();
  sbCalls.from = 0;
  sbCalls.then = 0;
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/* ------------------------------------------------------------------ */
/* FAIL 7 — /admin/dashboard conserva sus datos tras recargar         */
/* ------------------------------------------------------------------ */
describe("FAIL 7 — recarga: no se decide con la sesión sin restaurar", () => {
  it("con auth aún cargando (flags demo obsoletos + sesión null) no carga demo ni navega; al asentarse la sesión real carga datos reales", async () => {
    // Instante de la recarga: useAuth todavía restaura la sesión.
    // Los flags demo obsoletos harían isDemo() === true si se
    // decidiera ahora (la rama demo pone stats en 0 por diseño).
    authState.loading = true;
    authState.isDemo = true;
    authState.isAdmin = false;
    authState.isAuthenticated = false;
    authState.session = null;

    const utils = renderAdminAt("/admin/dashboard");
    // Sin decisión: sigue en «Cargando...», sin panel demo, sin
    // rebote a /auth y sin tocar Supabase.
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(
      screen.queryByText("Panel demo — datos de respaldo"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Auth stub")).not.toBeInTheDocument();
    expect(screen.queryByText("Discover stub")).not.toBeInTheDocument();
    expect(sbCalls.from).toBe(0);
    expect(sbCalls.then).toBe(0);

    // La sesión real se asienta: isDemo() ya vale false (la sesión
    // real tiene prioridad sobre los flags demo obsoletos).
    setRealAdmin();
    utils.rerender(
      createElement(
        MemoryRouter,
        { initialEntries: ["/admin/dashboard"] },
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

    // Datos REALES de Supabase, no ceros demo.
    expect(await screen.findByText("1247")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("93")).toBeInTheDocument();
    expect(
      screen.queryByText("Panel demo — datos de respaldo"),
    ).not.toBeInTheDocument();
    expect(sbCalls.then).toBe(10);
  });

  it("los re-corridos del efecto (identidades frescas de useAuth) no re-disparan la carga: stats y conteos estables", async () => {
    const utils = renderAdminAt("/admin/dashboard");
    expect(await screen.findByText("1247")).toBeInTheDocument();
    expect(sbCalls.then).toBe(10);
    const fromAfterLoad = sbCalls.from;

    // Cada re-render trae funciones nuevas de useAuth y el efecto
    // re-corre; con el guardián son no-op.
    const adminElement = createElement(
      MemoryRouter,
      { initialEntries: ["/admin/dashboard"] },
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
    );
    utils.rerender(adminElement);
    utils.rerender(adminElement);
    utils.rerender(adminElement);
    await sleep(150);

    expect(sbCalls.then).toBe(10);
    expect(sbCalls.from).toBe(fromAfterLoad);
    expect(screen.getByText("1247")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("93")).toBeInTheDocument();
    expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
  });

  it("demo: remontar vuelve a cargar los 20 perfiles demo, sin Supabase", async () => {
    authState.isDemo = true;
    authState.isAdmin = false;
    authState.session = null;

    const first = renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    // Pestaña Usuarios: la tanda demo es determinista (roster fijo).
    // Radix Tabs activa en mouseDown (no en click): con fireEvent
    // .click el tab queda en aria-selected=false y el contenido no
    // se monta.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Usuarios" }));
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(sbCalls.from).toBe(0);
    first.unmount();

    renderAdminAt("/admin/dashboard");
    expect(
      await screen.findByText("Panel demo — datos de respaldo"),
    ).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Usuarios" }));
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(sbCalls.from).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* /moderators/dashboard — títulos por tema + carga imperativa         */
/* ------------------------------------------------------------------ */
describe("/moderators/dashboard — títulos por tema en tema claro", () => {
  function renderModeratorDashboard() {
    return render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/moderators/dashboard"] },
        createElement(ModeratorDashboard),
      ),
    );
  }

  it("el loader, el título y las etiquetas son por tema (no blanco pelado) y la raíz ya no usa la clase muerta bg-hero-gradient", async () => {
    renderModeratorDashboard();
    // Loader: texto y spinner por tema desde el primer render.
    const loadingText = screen.getByText("Cargando panel de moderación...");
    expect(loadingText.className).toContain("text-slate-900");
    expect(loadingText.className).toContain("dark:text-white");

    const heading = await screen.findByRole("heading", {
      name: /Panel de Moderación/,
    });
    const headingClasses = heading.className.split(" ");
    expect(headingClasses).toContain("text-slate-900");
    expect(headingClasses).toContain("dark:text-white");
    expect(headingClasses).not.toContain("text-white");

    // Etiquetas de las tarjetas de stats: secundario por tema.
    const statLabel = screen.getByText("Reportes Pendientes");
    expect(statLabel.className).toContain("text-slate-600");
    expect(statLabel.className).toContain("dark:text-white/80");

    // La raíz usa fondo por tema, no la clase muerta.
    const root = document.querySelector(".min-h-screen");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("bg-background");
    expect(root?.className).not.toContain("bg-hero-gradient");
    expect(document.body.innerHTML).not.toContain("bg-hero-gradient");
  });

  it("el chunk real carga por la vía imperativa (tope + Reintentar) y pinta el panel", async () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => import("@/pages/moderators/ModeratorDashboard"),
          chunkName: "pages-moderators-dashboard",
          errorTitle: "No se pudo cargar el panel de moderación",
          fallbackPath: "/moderators",
          fallbackLabel: "Volver a moderadores",
        }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Panel de Moderación/ }),
    ).toBeInTheDocument();
    // Estado vacío sin reportes: el panel llegó a pintar datos.
    expect(
      screen.getByText("No hay reportes pendientes"),
    ).toBeInTheDocument();
  });
});
