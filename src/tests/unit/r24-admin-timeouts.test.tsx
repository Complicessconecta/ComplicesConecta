/**
 * Ronda 24 (stream A) — regresión: /admin/dashboard se cuelga en
 * producción (humo post-merge PR #83, 22:15–22:27 CST 27 nov:
 * "Cargando..." 60–125 s y luego rebote a /discover, 5 intentos).
 *
 * Causa raíz (diagnóstico
 * ~/workspace/r23-patches/postmerge-admin-hang-diagnosis.md): la
 * ronda 22 añadió el guardián `if (authLoading) return;` en
 * Admin.tsx y quitó los `finally { setLoading(false) }`, pero
 * NINGÚN await de autenticación o Supabase tenía tope: si
 * `getSession()` / `loadProfile()` / una consulta se colgaban en
 * red, `authLoading` quedaba en true para siempre y el efecto —que
 * se re-corría en cada render sin guardián para el rebote— disparaba
 * `navigate("/discover")` al asentarse la sesión real (`isDemo()`
 * pasa a false).
 *
 * El fix pone tope en cada eslabón de la cadena (mismo patrón
 * `Promise.race` que EditProfileSingle, 8 s, y ProfileDetail,
 * 10 s): init de useAuth (getSession 8 s, loadProfile 10 s),
 * guardián `authLoading` propio de Admin (12 s), carga real de
 * Admin (15 s), consultas de moderadores (15 s) y el fetch único de
 * Supabase `createSecureFetch` (15 s); además `decisionRef` /
 * `grantedRef` protegen la concesión del rebote tardío.
 *
 * Relojes REALES (ver r23-admin-demo-stats.test.tsx: con fake
 * timers el scheduler de React 19 no corre en happy-dom), salvo el
 * test de `createSecureFetch`, que es una función pura sin React y
 * sí puede usar fake timers. Los topes se escriben en LITERAL
 * (8_000 / 10_000 / 12_000 / 15_000) y NO se importan las
 * constantes nuevas: el archivo debe cargar también contra el
 * código ORIGINAL para la prueba de discriminación.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sbControl = vi.hoisted(() => ({
  hangGetSession: false,
  hangQueries: false,
  sessionUser: null as { id: string; email: string } | null,
  fromCalls: 0,
}));

const authMock = vi.hoisted(() => {
  const flags = {
    useReal: true,
    loading: true,
    isDemo: false,
    isAdmin: false,
    isAuthenticated: false,
  };
  const fns = {
    isAdmin: () => flags.isAdmin,
    isDemo: () => flags.isDemo,
    isAuthenticated: () => flags.isAuthenticated,
    getProfileType: () => "single",
    isDemoMode: () => flags.isDemo,
    shouldUseProductionAdmin: () => false,
    shouldUseRealSupabase: () => true,
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
  const makeQuery = (): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.gte = () => q;
    q.or = () => q;
    q.in = () => q;
    q.order = () => q;
    q.limit = () => q;
    q.insert = () => Promise.resolve({ data: null, error: null });
    q.update = () => q;
    q.single = () =>
      sbControl.hangQueries
        ? never()
        : Promise.resolve({ data: null, error: null });
    q.maybeSingle = () =>
      sbControl.hangQueries
        ? never()
        : Promise.resolve({ data: null, error: null });
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      sbControl.hangQueries
        ? never().then(
            onFulfilled as (v: never) => unknown,
            onRejected as (e: never) => unknown,
          )
        : Promise.resolve({ data: [], error: null, count: 0 }).then(
            onFulfilled as (v: unknown) => unknown,
            onRejected as (e: unknown) => unknown,
          );
    return q;
  };
  return {
    supabase: {
      from: (_table: string) => {
        sbControl.fromCalls++;
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
          sbControl.hangGetSession
            ? never()
            : Promise.resolve({
                data: {
                  session: sbControl.sessionUser
                    ? { user: sbControl.sessionUser }
                    : null,
                },
                error: null,
              }),
        getUser: () =>
          Promise.resolve({
            data: { user: sbControl.sessionUser },
            error: null,
          }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    isSupabaseConfigured: true,
    isDemoMode: false,
  };
});

// useAuth REAL para (a) y FALSO para (b)/(c): el falso devuelve
// `loading: true` para siempre, que es justo el estado que el
// código original no sabía resolver. Sin el interruptor, (b) no
// podría distinguir el tope propio de Admin del tope de useAuth.
vi.mock("@/features/auth/useAuth", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/features/auth/useAuth")>();
  return {
    useAuth: () =>
      authMock.flags.useReal
        ? real.useAuth()
        : {
            user: null,
            session: null,
            profile: null,
            loading: authMock.flags.loading,
            signIn: vi.fn(),
            signOut: vi.fn(),
            isAdmin: authMock.fns.isAdmin,
            isDemo: authMock.fns.isDemo,
            isAuthenticated: authMock.fns.isAuthenticated,
            getProfileType: authMock.fns.getProfileType,
            loadProfile: vi.fn(),
            shouldUseProductionAdmin:
              authMock.fns.shouldUseProductionAdmin,
            isDemoMode: authMock.fns.isDemoMode,
            shouldUseRealSupabase: authMock.fns.shouldUseRealSupabase,
            appMode: "production" as const,
          },
  };
});

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Admin } from "@/pages/admin/Admin";
import AdminModerators from "@/pages/admin/AdminModerators";
import { SecurityHelpers } from "@/integrations/supabase/security-helpers";

function AuthProbe() {
  const { loading } = useAuth();
  return createElement("div", null, loading ? "auth-cargando" : "auth-listo");
}

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

function renderModeratorsAt(path: string) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(AdminModerators),
    ),
  );
}

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  sbControl.hangGetSession = false;
  sbControl.hangQueries = false;
  sbControl.sessionUser = null;
  sbControl.fromCalls = 0;
  authMock.flags.useReal = true;
  authMock.flags.loading = true;
  authMock.flags.isDemo = false;
  authMock.flags.isAdmin = false;
  authMock.flags.isAuthenticated = false;
  mockToast.mockClear();
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* (a) El init de auth resuelve aunque getSession/loadProfile se       */
/*     cuelguen (fail-closed a "sin sesión", nunca colgado)            */
/* ------------------------------------------------------------------ */
describe("r24: el init de useAuth no se cuelga", () => {
  it(
    "getSession colgada: loading pasa a false en ~8 s (tope de sesión)",
    { timeout: 20_000 },
    async () => {
      sbControl.hangGetSession = true;
      render(createElement(AuthProbe));
      expect(screen.getByText("auth-cargando")).toBeInTheDocument();
      expect(
        await screen.findByText("auth-listo", {}, { timeout: 15_000 }),
      ).toBeInTheDocument();
    },
  );

  it(
    "loadProfile colgado (sesión real sin perfil): loading pasa a false en ~10 s (tope de perfil)",
    { timeout: 20_000 },
    async () => {
      sbControl.sessionUser = { id: "real-user-1", email: "user@test.local" };
      sbControl.hangQueries = true;
      render(createElement(AuthProbe));
      expect(screen.getByText("auth-cargando")).toBeInTheDocument();
      expect(
        await screen.findByText("auth-listo", {}, { timeout: 15_000 }),
      ).toBeInTheDocument();
    },
  );
});

/* ------------------------------------------------------------------ */
/* (b) Admin decide sin esperar indefinidamente a authLoading          */
/* ------------------------------------------------------------------ */
describe("r24: Admin no espera indefinidamente a authLoading", () => {
  it(
    "con authLoading colgado en true, a los ~12 s decide con el estado disponible y navega a /auth (sin sesión)",
    { timeout: 30_000 },
    async () => {
      authMock.flags.useReal = false;
      authMock.flags.loading = true;
      authMock.flags.isDemo = false;
      authMock.flags.isAuthenticated = false;
      authMock.flags.isAdmin = false;
      renderAdminAt("/admin/dashboard");
      // Antes del tope sigue en "Cargando..." (no decide a ciegas).
      expect(screen.getByText("Cargando...")).toBeInTheDocument();
      expect(
        await screen.findByText("Auth stub", {}, { timeout: 20_000 }),
      ).toBeInTheDocument();
    },
  );
});

/* ------------------------------------------------------------------ */
/* (c) AdminModerators resuelve con error visible en vez de colgarse   */
/* ------------------------------------------------------------------ */
describe("r24: AdminModerators no se cuelga", () => {
  it(
    "con las consultas colgadas, a los ~15 s muestra el error visible y sale de 'Cargando moderadores...'",
    { timeout: 30_000 },
    async () => {
      authMock.flags.useReal = false;
      sbControl.hangQueries = true;
      renderModeratorsAt("/admin/moderators");
      expect(screen.getByText("Cargando moderadores...")).toBeInTheDocument();
      expect(
        await screen.findByText(/No se pudieron cargar los datos de moderadores/, {}, { timeout: 20_000 }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Cargando moderadores..."),
      ).not.toBeInTheDocument();
    },
  );
});

/* ------------------------------------------------------------------ */
/* (d) createSecureFetch aborta a los 15 s aunque el fetch se cuelgue  */
/*     (función pura: aquí SÍ valen fake timers)                       */
/* ------------------------------------------------------------------ */
describe("r24: createSecureFetch tiene tope", () => {
  it("aborta el fetch colgado a los 15 s y pasa la señal al fetch", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    try {
      const secureFetch = SecurityHelpers.createSecureFetch("test-anon-key");
      const pending = secureFetch(
        "https://example.supabase.co/rest/v1/profiles",
        {},
      );
      const expectation = expect(pending).rejects.toThrow(/abort/i);
      await vi.advanceTimersByTimeAsync(15_000);
      await expectation;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]?.signal).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});
