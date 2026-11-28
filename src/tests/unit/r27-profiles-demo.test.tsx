/**
 * Ronda 27 (stream B) — /profiles en demo no toca Supabase y la rama
 * real ya no se cuelga.
 *
 * Diagnóstico (test dirigido PR #88): /profiles se queda en
 * "Cargando..." más de 10 s. Dos capas con el mismo síntoma:
 *
 * (1) RUTA: /profiles era un `lazyWithDefault` pelado en App.tsx,
 * sin ImperativeLazyRoute ni tope de 15 s — la misma exposición al
 * retry perdido del Suspense que /profile/:id en la ronda 17
 * (arreglado en la ronda 18/19) y /requests en la ronda 22. El
 * chunk puede resolver y el PageLoader quedarse para siempre.
 *
 * (2) DATOS: Profiles.tsx hacía `supabase.from("profiles").select`
 * SIN timeout ni AbortController, y el error se tragaba en
 * loadRealProfiles (devolvía []): un error se veía igual que «0
 * perfiles» y una consulta colgada dejaba «Cargando perfiles...»
 * para siempre. Además la rama demo exigía `demo_authenticated`
 * Y `demo_user`: con el flag puesto pero sin `demo_user` legible,
 * la rama demo se saltaba y se caía a la rama real —
 * `isAuthenticated()` devuelve true con solo el flag
 * (useAuth.ts:917-919) — y la consulta sin tope se colgaba.
 *
 * El fix: ruta con ImperativeLazyRoute (tope 15 s + error con
 * Reintentar); rama demo SOLO por el flag, con el roster canónico
 * local (generateDemoProfiles(20), mismo patrón que
 * loadDemoModeratorsData() de AdminModerators, ronda 26), cero
 * llamadas a Supabase; consulta real con Promise.race a 15 s
 * (patrón ronda 24) y error VISIBLE (banner con Reintentar) en vez
 * de [] silencioso.
 *
 * Relojes REALES (ver r24-admin-timeouts.test.tsx: con fake timers
 * el scheduler de React 19 no corre en happy-dom). Los tests demo
 * no esperan topes: si el código viejo (ronda 26) corriera aquí, el
 * test 1 se iría a /auth (sin demo_user no hay rama demo) y el
 * test 2 mostraría la fila real (discriminación verificada con
 * git stash, ver reporte de la ronda).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sbControl = vi.hoisted(() => ({
  hangQueries: false,
  profilesError: null as string | null,
  profilesRows: [] as Array<Record<string, unknown>>,
  fromCalls: [] as string[],
}));

const REAL_USER = { id: "real-user-1", email: "real@test.local" };
const REAL_PROFILE = {
  id: "real-user-1",
  first_name: "Real",
  last_name: "Usuario",
  display_name: "Real Usuario",
  profile_type: "single",
};

const authMock = vi.hoisted(() => {
  const flags = {
    isAuthenticated: false,
    user: null as Record<string, unknown> | null,
    profile: null as Record<string, unknown> | null,
  };
  // Funciones ESTABLES (identidad fija entre renders). El `useAuth`
  // real memoiza `isAuthenticated` con useCallback (ronda 24,
  // useAuth.ts:913) y el efecto de Profiles depende de esa
  // identidad: si el mock devolviera una arrow nueva en cada llamada
  // a useAuth(), el efecto se re-correría en cada render
  // (initializeProfiles → setState → render → efecto...) hasta
  // agotar el heap del worker (OOM). El mock debe respetar el mismo
  // contrato que producción: solo cambia la identidad cuando cambia
  // el estado de auth, nunca por render.
  const isAuthenticated = () => flags.isAuthenticated;
  const isAdmin = () => false;
  const isDemo = () => false;
  const getProfileType = () => "single";
  const loadProfile = () => {};
  const shouldUseProductionAdmin = () => false;
  const isDemoMode = () => false;
  const shouldUseRealSupabase = () => true;
  return {
    flags,
    isAuthenticated,
    isAdmin,
    isDemo,
    getProfileType,
    loadProfile,
    shouldUseProductionAdmin,
    isDemoMode,
    shouldUseRealSupabase,
  };
});

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
    q.not = () => q;
    q.then = (onFulfilled: unknown, onRejected: unknown) => {
      if (sbControl.hangQueries) {
        return never().then(
          onFulfilled as (v: never) => unknown,
          onRejected as (e: never) => unknown,
        );
      }
      return Promise.resolve({
        data: sbControl.profilesRows,
        error: sbControl.profilesError
          ? { message: sbControl.profilesError }
          : null,
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
    user: authMock.flags.user,
    session: null,
    profile: authMock.flags.profile,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAdmin: authMock.isAdmin,
    isDemo: authMock.isDemo,
    isAuthenticated: authMock.isAuthenticated,
    getProfileType: authMock.getProfileType,
    loadProfile: authMock.loadProfile,
    shouldUseProductionAdmin: authMock.shouldUseProductionAdmin,
    isDemoMode: authMock.isDemoMode,
    shouldUseRealSupabase: authMock.shouldUseRealSupabase,
    appMode: "production" as const,
  }),
}));

import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profiles from "@/pages/profiles/shared/Profiles";

function renderProfilesAt(path = "/profiles") {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/profiles",
          element: createElement(Profiles),
        }),
        createElement(Route, {
          path: "/auth",
          element: createElement("div", null, "Auth stub"),
        }),
      ),
    ),
  );
}

const REAL_PROFILE_ROW = {
  id: "real-1",
  first_name: "Real",
  last_name: "Usuario",
  display_name: "Real Usuario",
  age: 30,
  location: "Guadalajara",
  bio: "Bio real",
  interests: ["Swinger"],
  avatar_url: "https://example.com/avatar.jpg",
  is_verified: true,
  created_at: "2026-11-01T10:00:00.000Z",
  updated_at: "2026-11-01T10:00:00.000Z",
};

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
  sbControl.hangQueries = false;
  sbControl.profilesError = null;
  sbControl.profilesRows = [];
  sbControl.fromCalls = [];
  authMock.flags.isAuthenticated = false;
  authMock.flags.user = null;
  authMock.flags.profile = null;
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* Demo: cero Supabase, roster demo, sin banner, rápido                */
/* ------------------------------------------------------------------ */
describe("r27: Profiles en demo no toca Supabase", () => {
  it(
    "con Supabase colgado, resuelve en <5 s con datos demo, 0 llamadas y sin banner",
    { timeout: 20_000 },
    async () => {
      // Solo el flag (SIN demo_user): la rama demo de la ronda 26
      // exigía demo_user y con solo el flag caía a la rama real.
      window.localStorage.setItem("demo_authenticated", "true");
      authMock.flags.isAuthenticated = true;
      sbControl.hangQueries = true;
      const startedAt = Date.now();
      renderProfilesAt();
      // Roster canónico (Ana es la primera de generateDemoProfiles).
      expect(await screen.findByText("Ana", {}, { timeout: 5_000 }))
        .toBeInTheDocument();
      expect(Date.now() - startedAt).toBeLessThan(5_000);
      expect(screen.getByText("20 perfiles encontrados")).toBeInTheDocument();
      expect(screen.getByText("👤 Modo Demo")).toBeInTheDocument();
      expect(
        screen.queryByText("Cargando perfiles..."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los perfiles/),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual([]);
    },
  );

  it(
    "con Supabase sano, tampoco llama a Supabase (la rama demo es local siempre)",
    { timeout: 20_000 },
    async () => {
      window.localStorage.setItem("demo_authenticated", "true");
      authMock.flags.isAuthenticated = true;
      sbControl.profilesRows = [REAL_PROFILE_ROW];
      renderProfilesAt();
      // Se ven los demo (Ana), NO la fila «real» del mock.
      expect(await screen.findByText("Ana", {}, { timeout: 5_000 }))
        .toBeInTheDocument();
      expect(screen.queryByText("Real Usuario")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los perfiles/),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual([]);
    },
  );
});

/* ------------------------------------------------------------------ */
/* Real: la rama Supabase sigue funcionando (sin badge demo)           */
/* ------------------------------------------------------------------ */
describe("r27: Profiles real sigue usando Supabase", () => {
  it(
    "con filas, las muestra, sin badge demo y sin banner",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isAuthenticated = true;
      authMock.flags.user = REAL_USER;
      authMock.flags.profile = REAL_PROFILE;
      sbControl.profilesRows = [REAL_PROFILE_ROW];
      renderProfilesAt();
      expect(
        await screen.findByText("Real Usuario", {}, { timeout: 5_000 }),
      ).toBeInTheDocument();
      expect(screen.getByText("1 perfiles encontrados")).toBeInTheDocument();
      expect(screen.getByText("✅ Usuario Real")).toBeInTheDocument();
      expect(screen.queryByText("👤 Modo Demo")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No se pudieron cargar los perfiles/),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual(["profiles"]);
    },
  );

  it(
    "con error en la consulta, muestra el banner visible con Reintentar (antes era [] silencioso: «0 perfiles»)",
    { timeout: 20_000 },
    async () => {
      authMock.flags.isAuthenticated = true;
      authMock.flags.user = REAL_USER;
      authMock.flags.profile = REAL_PROFILE;
      sbControl.profilesError = "permission denied for table profiles";
      renderProfilesAt();
      expect(
        await screen.findByText(
          /No se pudieron cargar los perfiles/,
          {},
          { timeout: 5_000 },
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/permission denied for table profiles/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reintentar" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Cargando perfiles..."),
      ).not.toBeInTheDocument();
      expect(sbControl.fromCalls).toEqual(["profiles"]);
    },
  );

  it(
    "con la consulta colgada, a los ~15 s muestra el error visible y sale de 'Cargando perfiles...' (tope ronda 27 intacto)",
    { timeout: 30_000 },
    async () => {
      authMock.flags.isAuthenticated = true;
      authMock.flags.user = REAL_USER;
      authMock.flags.profile = REAL_PROFILE;
      sbControl.hangQueries = true;
      const startedAt = Date.now();
      renderProfilesAt();
      expect(screen.getByText("Cargando perfiles...")).toBeInTheDocument();
      expect(
        await screen.findByText(
          /No se pudieron cargar los perfiles/,
          {},
          { timeout: 20_000 },
        ),
      ).toBeInTheDocument();
      // El tope es de 15 s: el error no puede aparecer antes (~14 s
      // de margen por granularidad del temporizador) ni tardar más
      // de lo que tarda el findByText en resolver.
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(14_000);
      expect(
        screen.getByText(/Tiempo de espera agotado al cargar los perfiles/),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Cargando perfiles..."),
      ).not.toBeInTheDocument();
    },
  );
});
