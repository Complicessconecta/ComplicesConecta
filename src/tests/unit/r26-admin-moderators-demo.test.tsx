/**
 * Ronda 26 (stream B) — /admin/moderators en demo no toca Supabase.
 *
 * Diagnóstico (test dirigido PR #87, 2026-11-28 01:11–01:20 CST):
 * la página resolvía en ~20–25 s CON el banner «No se pudieron
 * cargar los datos de moderadores», 0 Moderadores, sin datos. La
 * ronda 24 pasó este mismo ítem sin que nadie tocara la página
 * después: el fallo es ambiental/intermitente, no una regresión de
 * la ronda 25. Causa estructural: AdminModerators era la única
 * página del área admin SIN rama demo — en demo no hay sesión real
 * de Supabase (auth demo = solo localStorage) y las dos consultas
 * iban a PostgREST como `anon`; la de `moderators` es la frágil
 * (su política SELECT llama a public.is_admin(), con EXECUTE solo
 * para `authenticated` → 42501 para anon; la de
 * `moderator_requests` devuelve vacía sin error). Los topes de 15 s
 * de la ronda 24 sí funcionaban (la página resolvía, no se colgaba
 * 60 s+); lo que estaba mal era convertir cualquier fallo en banner
 * bloqueante en demo, donde los datos de Supabase no significan
 * nada. El fix: en demo, datos demo/respaldo locales, cero llamadas
 * a Supabase, sin banner, resolución en <1 s (mismo patrón que
 * loadDemoAdminData() de Admin.tsx, ronda 21).
 *
 * Relojes REALES (ver r24-admin-timeouts.test.tsx: con fake timers
 * el scheduler de React 19 no corre en happy-dom). Los tests demo
 * no esperan topes: si el código viejo (ronda 25) corriera aquí,
 * el test 1 tardaría ~15 s y fallaría por el banner (discriminación
 * verificada con git stash, ver reporte de la ronda).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sbControl = vi.hoisted(() => ({
  hangQueries: false,
  moderatorsError: null as string | null,
  requestsError: null as string | null,
  moderatorsRows: [] as Array<Record<string, unknown>>,
  requestsRows: [] as Array<Record<string, unknown>>,
  fromCalls: [] as string[],
}));

const authMock = vi.hoisted(() => {
  const flags = { isDemo: false };
  const fns = {
    isAdmin: () => false,
    isDemo: () => flags.isDemo,
    isAuthenticated: () => !flags.isDemo,
    getProfileType: () => "single",
    isDemoMode: () => flags.isDemo,
    shouldUseProductionAdmin: () => false,
    shouldUseRealSupabase: () => !flags.isDemo,
  };
  return { flags, fns };
});

const mockToast = vi.hoisted(() => vi.fn());

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => {
  const never = (): Promise<never> => new Promise(() => {});
  const makeQuery = (table: string): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.order = () => q;
    q.insert = () => Promise.resolve({ data: null, error: null });
    q.update = () => q;
    q.then = (onFulfilled: unknown, onRejected: unknown) => {
      if (sbControl.hangQueries) {
        return never().then(
          onFulfilled as (v: never) => unknown,
          onRejected as (e: never) => unknown,
        );
      }
      const isModerators = table === "moderators";
      const errorMessage = isModerators
        ? sbControl.moderatorsError
        : sbControl.requestsError;
      const rows = isModerators
        ? sbControl.moderatorsRows
        : sbControl.requestsRows;
      return Promise.resolve({
        data: rows,
        error: errorMessage ? { message: errorMessage } : null,
      }).then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    };
    return q;
  };
  return {
    supabase: {
      from: (table: string) => {
        sbControl.fromCalls.push(table);
        return makeQuery(table);
      },
      rpc: () => Promise.resolve({ data: false, error: null }),
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    isSupabaseConfigured: true,
    isDemoMode: false,
  };
});

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAdmin: authMock.fns.isAdmin,
    isDemo: authMock.fns.isDemo,
    isAuthenticated: authMock.fns.isAuthenticated,
    getProfileType: authMock.fns.getProfileType,
    loadProfile: vi.fn(),
    shouldUseProductionAdmin: authMock.fns.shouldUseProductionAdmin,
    isDemoMode: authMock.fns.isDemoMode,
    shouldUseRealSupabase: authMock.fns.shouldUseRealSupabase,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminModerators from "@/pages/admin/AdminModerators";

function renderModerators() {
  return render(
    createElement(MemoryRouter, { initialEntries: ["/admin/moderators"] },
      createElement(AdminModerators)),
  );
}

const REAL_MODERATOR = {
  id: "mod-real-1",
  email: "mod-real@ejemplo.com",
  full_name: "Moderador Real",
  status: "active",
  created_at: "2026-11-01T10:00:00.000Z",
  reports_handled: 5,
  suspensions_applied: 1,
};

const REAL_REQUEST = {
  id: "req-real-1",
  full_name: "Solicitante Real",
  email: "solicitante@ejemplo.com",
  motivation: "Quiero moderar.",
  status: "pending",
  created_at: "2026-11-20T10:00:00.000Z",
};

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  sbControl.hangQueries = false;
  sbControl.moderatorsError = null;
  sbControl.requestsError = null;
  sbControl.moderatorsRows = [];
  sbControl.requestsRows = [];
  sbControl.fromCalls = [];
  authMock.flags.isDemo = false;
  mockToast.mockClear();
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* Demo: cero Supabase, datos demo, sin banner, rápido                 */
/* ------------------------------------------------------------------ */
describe("r26: AdminModerators en demo no toca Supabase", () => {
  it(
    "con Supabase colgado, resuelve en <5 s con datos demo, 0 llamadas y sin banner",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isDemo = true;
      sbControl.hangQueries = true;
      const startedAt = Date.now();
      renderModerators();
      // Datos demo del roster (Ana / Francisco / Carlos moderadores,
      // 2 solicitudes pendientes): sin esperar ningún tope de 15 s.
      expect(await screen.findByText("Ana", {}, { timeout: 5_000 }))
        .toBeInTheDocument();
      expect(Date.now() - startedAt).toBeLessThan(5_000);
      expect(screen.getByText("3 Moderadores")).toBeInTheDocument();
      expect(screen.getByText(/Solicitudes \(2\)/)).toBeInTheDocument();
      expect(
        screen.getByText("Panel demo — datos de respaldo"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los datos de moderadores/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Cargando moderadores..."),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual([]);
    },
  );

  it(
    "con Supabase sano, tampoco llama a Supabase (la rama demo es local siempre)",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isDemo = true;
      sbControl.moderatorsRows = [REAL_MODERATOR];
      sbControl.requestsRows = [REAL_REQUEST];
      renderModerators();
      // Se ven los demo (Ana), NO la fila «real» del mock.
      expect(await screen.findByText("Ana", {}, { timeout: 5_000 }))
        .toBeInTheDocument();
      expect(screen.queryByText("Moderador Real")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los datos de moderadores/),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual([]);
    },
  );
});

/* ------------------------------------------------------------------ */
/* Real: la rama Supabase sigue funcionando (sin aviso demo)           */
/* ------------------------------------------------------------------ */
describe("r26: AdminModerators real sigue usando Supabase", () => {
  it(
    "con filas, las muestra, sin aviso demo y sin banner",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isDemo = false;
      sbControl.moderatorsRows = [REAL_MODERATOR];
      sbControl.requestsRows = [REAL_REQUEST];
      renderModerators();
      expect(
        await screen.findByText("Moderador Real", {}, { timeout: 5_000 }),
      ).toBeInTheDocument();
      expect(screen.getByText("1 Moderadores")).toBeInTheDocument();
      expect(screen.getByText(/Solicitudes \(1\)/)).toBeInTheDocument();
      expect(
        screen.queryByText("Panel demo — datos de respaldo"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los datos de moderadores/),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual([
        "moderators",
        "moderator_requests",
      ]);
    },
  );

  it(
    "error solo en moderators (42501 is_admin): banner visible, pero las solicitudes sí se muestran",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isDemo = false;
      sbControl.moderatorsError =
        "permission denied for function public.is_admin()";
      sbControl.requestsRows = [REAL_REQUEST];
      renderModerators();
      expect(
        await screen.findByText(
          /No se pudieron cargar los datos de moderadores/,
          {},
          { timeout: 5_000 },
        ),
      ).toBeInTheDocument();
      // La consulta buena no se pierde por la mala.
      expect(screen.getByText(/Solicitudes \(1\)/)).toBeInTheDocument();
      expect(
        screen.queryByText("Panel demo — datos de respaldo"),
      ).not.toBeInTheDocument();
    },
  );

  it(
    "con las consultas colgadas, a los ~15 s muestra el error visible y sale de 'Cargando moderadores...' (tope ronda 24 intacto)",
    { timeout: 30_000 },
    async () => {
      authMock.flags.isDemo = false;
      sbControl.hangQueries = true;
      renderModerators();
      expect(screen.getByText("Cargando moderadores...")).toBeInTheDocument();
      expect(
        await screen.findByText(
          /No se pudieron cargar los datos de moderadores/,
          {},
          { timeout: 20_000 },
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Cargando moderadores..."),
      ).not.toBeInTheDocument();
    },
  );
});
