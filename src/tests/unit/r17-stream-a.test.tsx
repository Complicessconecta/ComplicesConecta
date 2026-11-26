/**
 * Ronda 17, stream A — fix GLOBAL de la vista rancia.
 *
 * Síntoma (test dirigido ronda 16, PR #76, DO NOT MERGE): al navegar,
 * la URL cambia al instante pero la vista vieja se queda — sin loader,
 * sin vista nueva — hasta recargar. No era solo dock→Settings: lo
 * mismo en /demo→/profile-single, /demo→/profile-couple,
 * /clubs→/clubs/demo, /discover→/profile/<id> y perfil→/chat/<id>.
 *
 * Causa raíz (ver src/utils/routerConfig.ts): la app usa
 * `BrowserRouter` plano (sin data router) con el valor por defecto de
 * `useTransitions` (`true`), así que CADA navegación va en
 * `React.startTransition` y, con el chunk destino en frío (todas las
 * rutas son lazy), la transición retiene la UI ya visible. El
 * `key={pathname}` de la ronda 16 en el Suspense de MainLayout NO
 * basta: solo hace nuevo el boundary cuando React por fin commitea el
 * render de la transición, no hace el commit síncrono. Y el
 * `flushSync: true` del botón "Enviar mensaje" (ProfileDetail) es un
 * no-op aquí: `useNavigate` va por `history.push` y la única decisión
 * transición/síncrono vive en el listener del router. Solo
 * dock→Settings pasó en el dispositivo porque Navigation precarga el
 * chunk de /settings en idle: sin suspensión no hay retención.
 *
 * El fix es global y vive en un sitio: `App.tsx` pasa
 * `useTransitions={APP_ROUTER_USE_TRANSITIONS}` (`false`) al Router,
 * así que la navegación es urgente y el fallback de MainLayout
 * (`<PageLoader />`) commitea de inmediato. La `key={pathname}` se
 * conserva como segunda red.
 *
 * Cómo prueban estos tests (y qué NO):
 * - Usan el MainLayout REAL, el ProfileLayout REAL, el ProtectedRoute
 *   REAL y el react-router REAL, con el chunk destino colgado a
 *   propósito (lazy que nunca resuelve): eso aísla exactamente el
 *   mecanismo (transición + Suspense), que vive en el router y el
 *   layout, no en las páginas. Las páginas origen son stubs con el
 *   MISMO `navigate()` que el call site real de cada camino.
 * - El click es un `button.click()` real sobre un root de React
 *   montado con `createRoot`, SIN `act()` de Testing Library: `act()`
 *   vacía las transiciones de forma síncrona y ENMASCARA el bug (así
 *   pasó el test de la ronda 16 con la `key`). La aserción es tras
 *   UNA microtarea (`await Promise.resolve()`): con la navegación
 *   urgente el loader ya commiteó; con transición, la vista vieja
 *   sigue ahí (la escalera de tiempos se midió en el scratch de la
 *   ronda: urgente commitea en micro1 siempre; transición sigue
 *   retenida en micro3 y en `sleep(0)`, y solo a veces llega a los
 *   10–50 ms según lo ocupado que esté el hilo — en el teléfono real,
 *   todo lo que tarda el chunk).
 * - El `MemoryRouter` del harness toma `useTransitions` de la
 *   CONSTANTE que usa `App.tsx` (`APP_ROUTER_USE_TRANSITIONS`): si el
 *   fix se revierte (constante a `true`), los 5 tests de caminos
 *   FALLAN (discriminación medida, ver el informe del stream). Los 2
 *   tests de control usan transiciones por defecto a propósito y
 *   documentan el bug: con transición, la vista vieja se retiene
 *   aunque el botón navegue con `flushSync: true`.
 * - Lo que solo un test en dispositivo puede confirmar: la latencia
 *   REAL de descarga del chunk en red móvil. Esto prueba el
 *   mecanismo (nunca vista vieja), no la latencia.
 *
 * Convención de mocks: misma que r16-stream-b (Supabase con rechazo,
 * useAuth con estado hoisted, useToast).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
  isDemo: false,
}));
const mockToast = vi.hoisted(() => vi.fn());
const supabaseBehavior = vi.hoisted(() => ({
  mode: "reject" as "reject" | "empty",
}));

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
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      (supabaseBehavior.mode === "reject"
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
      rpc: () => stubError(),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: authState.profile,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: () => Boolean(authState.user),
    isAdmin: () => false,
    isDemo: () => authState.isDemo,
    isDemoMode: () => authState.isDemo,
    getProfileType: () => "single",
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { type ComponentType, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { act, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import { APP_ROUTER_USE_TRANSITIONS } from "@/utils/routerConfig";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Un camino: página origen (stub con el botón real) + ruta destino. */
interface PathSpec {
  /** Ruta inicial del harness. */
  from: string;
  /** Texto que identifica la vista origen en el DOM. */
  fromMarker: string;
  /** Texto del botón que navega (el mismo que el call site real). */
  buttonLabel: string;
  /** Rutas del harness (anidado como en App.tsx). */
  routes: (Target: ComponentType) => ReactElement;
  /** Contenido de la página destino cuando el chunk resuelve. */
  toMarker: string;
}

/** Botón que navega como el call site real de cada camino. */
function NavButton({
  to,
  label,
  flushSync,
}: {
  to: string;
  label: string;
  flushSync?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to, flushSync ? { flushSync: true } : undefined)}
    >
      {label}
    </button>
  );
}

/** Chunk destino colgado a propósito + su liberador. */
function makeHungTarget() {
  let resolveTarget!: (v: { default: ComponentType }) => void;
  const Target = lazyWithDefault(
    (): Promise<{ default: ComponentType }> =>
      new Promise((resolve) => {
        resolveTarget = resolve;
      }),
  );
  return {
    Target,
    resolve: (v: { default: ComponentType }) => resolveTarget(v),
  };
}

/** Rutas de perfil en App.tsx: ProtectedRoute + ProfileLayout. */
const profileRoute = (Target: ComponentType, path: string) => (
  <Route
    element={
      <ProtectedRoute>
        <ProfileLayout />
      </ProtectedRoute>
    }
  >
    <Route path={path} element={<Target />} />
  </Route>
);

const PATHS: Record<string, PathSpec> = {
  demoSingle: {
    from: "/demo",
    fromMarker: "Selector demo",
    buttonLabel: "Entrar como single",
    routes: (Target) => (
      <>
        <Route
          path="/demo"
          element={
            <div>
              <h1>Selector demo</h1>
              <NavButton to="/profile-single" label="Entrar como single" />
            </div>
          }
        />
        {profileRoute(Target, "/profile-single")}
      </>
    ),
    toMarker: "Perfil single (destino)",
  },
  demoCouple: {
    from: "/demo",
    fromMarker: "Selector demo",
    buttonLabel: "Entrar como pareja",
    routes: (Target) => (
      <>
        <Route
          path="/demo"
          element={
            <div>
              <h1>Selector demo</h1>
              <NavButton to="/profile-couple" label="Entrar como pareja" />
            </div>
          }
        />
        {profileRoute(Target, "/profile-couple")}
      </>
    ),
    toMarker: "Perfil pareja (destino)",
  },
  clubsDemo: {
    from: "/clubs",
    fromMarker: "Directorio de clubs",
    buttonLabel: "Ver Club",
    routes: (Target) => (
      <>
        <Route
          path="/clubs"
          element={
            <div>
              <h1>Directorio de clubs</h1>
              <NavButton to="/clubs/demo" label="Ver Club" />
            </div>
          }
        />
        <Route path="/clubs/demo" element={<Target />} />
      </>
    ),
    toMarker: "Club Demo (destino)",
  },
  discoverProfile: {
    from: "/discover",
    fromMarker: "Descubrir",
    buttonLabel: "Ver perfil de Ana",
    routes: (Target) => (
      <>
        <Route
          path="/discover"
          element={
            <div>
              <h1>Descubrir</h1>
              <NavButton to="/profile/3" label="Ver perfil de Ana" />
            </div>
          }
        />
        {profileRoute(Target, "/profile/:id")}
      </>
    ),
    toMarker: "Perfil de Ana (destino)",
  },
  profileChat: {
    from: "/profile-single",
    fromMarker: "Mi perfil single",
    buttonLabel: "Enviar mensaje",
    routes: (Target) => (
      <>
        {profileRoute(
          () => (
            <div>
              <h1>Mi perfil single</h1>
              {/* Como ProfileDetail.tsx:790 — con flushSync: el fix
                  global lo hace innecesario, pero el botón real lo
                  lleva y el test lo reproduce tal cual. */}
              <NavButton to="/chat/3" label="Enviar mensaje" flushSync />
            </div>
          ),
          "/profile-single",
        )}
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Target />
            </ProtectedRoute>
          }
        />
      </>
    ),
    toMarker: "Chat con Ana (destino)",
  },
};

/** Monta el camino con el valor de `useTransitions` dado. */
async function mountPath(
  spec: PathSpec,
  Target: ComponentType,
  useTransitions: boolean | undefined,
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const routerProps =
    useTransitions === undefined ? {} : { useTransitions };
  root.render(
    <MemoryRouter initialEntries={[spec.from]} {...routerProps}>
      <Routes>
        <Route element={<MainLayout />}>{spec.routes(Target)}</Route>
      </Routes>
    </MemoryRouter>,
  );
  // El root concurrente asienta el montaje inicial con un macrotick.
  await sleep(200);
  return { container, root };
}

function clickButton(container: HTMLElement, label: string) {
  const btn = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement | undefined;
  expect(btn).toBeTruthy();
  btn!.click();
}

/** Tras el click, una microtarea: el punto determinista (ver cabecera). */
async function afterTap() {
  await Promise.resolve();
}

beforeEach(() => {
  window.localStorage.clear();
  authState.user = { id: "r17a-user" };
  authState.profile = null;
  authState.isDemo = true;
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
  document.body.innerHTML = "";
});

/* ------------------------------------------------------------------ */
/* Los 5 caminos con el fix (useTransitions de la app)                  */
/* ------------------------------------------------------------------ */
describe("ronda 17 stream A: ningún camino retiene la vista vieja", () => {
  it.each([
    ["demoSingle", "/demo → /profile-single"],
    ["demoCouple", "/demo → /profile-couple"],
    ["clubsDemo", "/clubs → /clubs/demo"],
    ["discoverProfile", "/discover → /profile/<id>"],
    ["profileChat", "perfil → /chat/<id> (Enviar mensaje)"],
  ])("%s", async (key) => {
    const spec = PATHS[key]!;
    const { Target, resolve } = makeHungTarget();
    const { container, root } = await mountPath(
      spec,
      Target,
      APP_ROUTER_USE_TRANSITIONS,
    );
    try {
      expect(container.innerHTML).toContain(spec.fromMarker);
      expect(container.innerHTML).not.toContain("Cargando...");

      clickButton(container, spec.buttonLabel);
      await afterTap();

      // Con el chunk en vuelo: loader inmediato, vista vieja fuera.
      expect(container.innerHTML).not.toContain(spec.fromMarker);
      expect(container.innerHTML).toContain("Cargando...");

      // Al resolver el chunk: la vista nueva pinta y la vieja no vuelve.
      await act(async () => {
        resolve({ default: () => <div>{spec.toMarker}</div> });
      });
      expect(
        await screen.findByText(spec.toMarker, {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(container.innerHTML).not.toContain(spec.fromMarker);
      expect(container.innerHTML).not.toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  });

  it("la constante del fix es false (la navegación es urgente)", () => {
    expect(APP_ROUTER_USE_TRANSITIONS).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Controles: con transiciones por defecto el bug sigue ahí (prueba    */
/* de que el harness lo ve; si estos fallan, el harness no discrimina) */
/* ------------------------------------------------------------------ */
describe("control: con transiciones por defecto la vista vieja se retiene", () => {
  it("/clubs → /clubs/demo con transición: vista vieja tras la microtarea", async () => {
    const spec = PATHS.clubsDemo!;
    const { Target } = makeHungTarget();
    const { container, root } = await mountPath(spec, Target, undefined);
    try {
      expect(container.innerHTML).toContain(spec.fromMarker);
      clickButton(container, spec.buttonLabel);
      await afterTap();
      // Sin el fix: la transición no ha commiteado — la vista vieja
      // sigue y NO hay loader.
      expect(container.innerHTML).toContain(spec.fromMarker);
      expect(container.innerHTML).not.toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  });

  it("perfil → /chat/<id> con transición + flushSync: también se retiene (flushSync es no-op)", async () => {
    const spec = PATHS.profileChat!;
    const { Target } = makeHungTarget();
    const { container, root } = await mountPath(spec, Target, undefined);
    try {
      expect(container.innerHTML).toContain(spec.fromMarker);
      clickButton(container, spec.buttonLabel);
      await afterTap();
      // El botón real lleva `flushSync: true` (ProfileDetail:790) y
      // aun así la vista vieja se retiene: bajo BrowserRouter plano
      // esa opción no cambia nada.
      expect(container.innerHTML).toContain(spec.fromMarker);
      expect(container.innerHTML).not.toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  });
});
