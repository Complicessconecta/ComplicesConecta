/**
 * Ronda 18, stream A — B1/B2: /demo retiene la vista con el toast
 * "Modo Demo Activado" y sin loader.
 *
 * Síntoma (test dirigido ronda 17, PR #77, DO NOT MERGE, 2026-11-26
 * 06:46–07:02 CST, device browser 886 px): al tocar "Explorar como
 * Single" / "Explorar como Pareja" en /demo, la vista /demo se queda
 * con el toast "Modo Demo Activado", sin loader; el perfil
 * (/profile-single, /profile-couple) llega solo en la observación
 * siguiente.
 *
 * Causa raíz (ver DemoSelector.tsx): NO es el router — la ronda 17 ya
 * lo hizo urgente (`useTransitions={false}`, routerConfig.ts) y eso
 * cubre la navegación UNA VEZ PEDIDA. Aquí la navegación ni siquiera
 * se pide durante 1 s: `handleDemoLogin` (y `handleLocalAccountLogin`,
 * mismo patrón) hace `await signIn(...)`, muestra el toast y luego
 * `setTimeout(() => navigate(...), 1000)`. Durante ese segundo no hay
 * navegación, no hay loader y no cambia la URL: solo /demo + toast.
 * En el teléfono, con el hilo principal ocupado, el temporizador se
 * alarga más allá del segundo y la cadencia de observación del test
 * dirigido lo lee como "vista retenida". El `signIn` demo no es el
 * cuello: `handleDemoAuth` (app-config.ts:129) solo escribe
 * localStorage y `loadProfile` en rama demo es trabajo local síncrono
 * (useAuth.ts:96-226); el toast aparece porque `signIn` ya resolvió.
 * Tampoco es la guarda: `ProtectedRoute` deja pasar en cuanto
 * `signIn` pone el usuario (el `loading` se apaga en su `finally`).
 *
 * El fix: navegar DE INMEDIATO tras el `signIn` exitoso, sin el
 * `setTimeout(..., 1000)`. El toast sobrevive al cambio de ruta: el
 * `<Toaster />` vive en MainLayout (MainLayout.tsx:299), por encima
 * del `<Outlet />`, así que "Modo Demo Activado" se sigue viendo
 * sobre el perfil. Las escrituras de sesión tampoco dependen del
 * retardo: `handleDemoAuth` ya escribió `demo_authenticated`,
 * `demo_user` y `userType` en localStorage de forma síncrona antes de
 * que `signIn` resuelva.
 *
 * Cómo prueban estos tests (y qué NO):
 * - Montan el DemoSelector REAL (no un stub con `navigate()`), con el
 *   `signIn` mockeado como el real: resuelve de inmediato y pone el
 *   usuario (como `setUser` en useAuth.ts:648-651), el MainLayout
 *   REAL, el ProtectedRoute REAL y el react-router REAL con el
 *   `useTransitions` de la app; el chunk destino colgado a propósito.
 * - El click es un `button.click()` real sobre un root montado con
 *   `createRoot`, SIN `act()`: `act()` vacía las transiciones y
 *   enmascara retenciones (lección de la ronda 16). La aserción es
 *   tras `sleep(50)`: con el fix, el `navigate()` ya se pidió en la
 *   continuación del `await signIn` (microtareas) y el loader urgente
 *   ya commiteó; con el bug, a los 50 ms el temporizador de 1000 ms
 *   ni ha disparado y /demo sigue ahí con el toast ya mostrado.
 * - La aserción es la conjunción "Modo Demo" fuera + "Cargando..."
 *   presente: el botón muestra un "Cargando..." transitorio mientras
 *   `isLoading`, pero solo existe mientras DemoSelector está montado;
 *   si "Modo Demo" ya no está, el "Cargando..." solo puede ser el
 *   `<PageLoader />` de MainLayout.
 * - El control reproduce el patrón VIEJO (`setTimeout(navigate, 1000)`)
 *   con un botón stub: a los 50 ms retiene la vista sin loader y el
 *   loader aparece tras el segundo (se espera por sondeo hasta 5 s,
 *   porque en esta VM el temporizador puede disparar tarde bajo carga
 *   y un `sleep(1200)` fijo tiene poco margen). Pasa antes y después
 *   del fix y prueba que el harness ve el retardo como retención (si
 *   este control fallara, el harness no discriminaría).
 * - Lo que solo un test en dispositivo puede confirmar: la latencia
 *   REAL de descarga del chunk en red móvil. Esto prueba que la
 *   navegación se pide de inmediato y el loader commitea, no la
 *   latencia.
 *
 * Prueba de discriminación: con el fix revertido (el `setTimeout`
 * de 1000 ms restaurado en DemoSelector), los 2 tests de caminos
 * FALLAN (a los 50 ms /demo sigue ahí, sin loader) y el control
 * sigue en verde. Ver el informe del stream.
 *
 * Convención de mocks: misma que r17-stream-a (Supabase con rechazo,
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
    // Como el signIn real (useAuth.ts, rama demo): resuelve de
    // inmediato y deja el usuario puesto (setUser) antes de
    // resolver, así ProtectedRoute deja pasar al navegar.
    signIn: async (email: string) => {
      authState.user = { id: "demo-user-1", email };
      return { user: authState.user, session: {} };
    },
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
import { DemoSelector } from "@/components/auth/DemoSelector";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import { APP_ROUTER_USE_TRANSITIONS } from "@/utils/routerConfig";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** Monta /demo con el DemoSelector REAL y los perfiles colgados. */
async function mountDemo(Target: ComponentType) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(
    <MemoryRouter
      initialEntries={["/demo"]}
      useTransitions={APP_ROUTER_USE_TRANSITIONS}
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/demo" element={<DemoSelector />} />
          {profileRoute(Target, "/profile-single")}
          {profileRoute(Target, "/profile-couple")}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  // El root concurrente asienta el montaje inicial: se espera al
  // título de /demo en vez de un sleep fijo (bajo carga de CPU el
  // montaje puede tardar más de 200 ms y el sleep enmascara el fallo).
  await screen.findByText("Modo Demo", {}, { timeout: 5000 });
  return { container, root };
}

function clickButton(container: HTMLElement, label: string) {
  const btn = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement | undefined;
  expect(btn).toBeTruthy();
  btn!.click();
}

/**
 * Sondea hasta que la vista vieja sale y el loader entra (o agota el
 * tiempo y deja que la aserción siguiente falle con el mensaje claro).
 * Un `sleep` fijo no basta para el control del retardo: en esta VM el
 * `setTimeout(..., 1000)` puede disparar tarde bajo carga.
 */
async function waitForLoader(
  container: HTMLElement,
  fromMarker: string,
  timeoutMs = 5000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (
      !container.innerHTML.includes(fromMarker) &&
      container.innerHTML.includes("Cargando...")
    ) {
      return;
    }
    await sleep(50);
  }
}

beforeEach(() => {
  window.localStorage.clear();
  authState.user = null;
  authState.profile = null;
  authState.isDemo = true;
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
  document.body.innerHTML = "";
});

/* ------------------------------------------------------------------ */
/* B1/B2 con el fix: el loader aparece de inmediato, /demo no se      */
/* retiene (el toast sí se mostró: es el síntoma del dispositivo).    */
/* ------------------------------------------------------------------ */
describe("ronda 18 stream A: /demo no retiene la vista tras Explorar", () => {
  it.each([
    ["single", "Explorar como Single", "/profile-single", "Perfil single"],
    ["couple", "Explorar como Pareja", "/profile-couple", "Perfil pareja"],
  ])(
    "B1/B2 (%s): loader inmediato y /demo fuera tras el tap",
    async (_type, buttonLabel, _to, toMarker) => {
      const { Target, resolve } = makeHungTarget();
      const { container, root } = await mountDemo(Target);
      try {
        expect(container.innerHTML).toContain("Modo Demo");
        expect(container.innerHTML).not.toContain("Cargando...");

        clickButton(container, buttonLabel);
        // 50 ms: muy por debajo del retardo viejo (1000 ms), de sobra
        // para que la continuación del `await signIn` (microtareas)
        // pida la navegación y el loader urgente commitee.
        await sleep(50);

        // El toast del dispositivo SÍ se mostró (el login resolvió).
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "🎭 Modo Demo Activado" }),
        );
        // Pero /demo ya no está: loader inmediato, vista vieja fuera.
        expect(container.innerHTML).not.toContain("Modo Demo");
        expect(container.innerHTML).not.toContain(buttonLabel);
        expect(container.innerHTML).toContain("Cargando...");

        // Al resolver el chunk: la vista nueva pinta y /demo no vuelve.
        await act(async () => {
          resolve({
            default: () => <div>{`${toMarker} (destino)`}</div>,
          });
        });
        expect(
          await screen.findByText(`${toMarker} (destino)`, {}, {
            timeout: 5000,
          }),
        ).toBeTruthy();
        expect(container.innerHTML).not.toContain("Modo Demo");
        expect(container.innerHTML).not.toContain("Cargando...");
      } finally {
        root.unmount();
        container.remove();
      }
    },
  );
});

/* ------------------------------------------------------------------ */
/* Control: el patrón VIEJO (`setTimeout(navigate, 1000)`) retiene    */
/* la vista sin loader a los 50 ms y solo navega ~1 s después. Pasa   */
/* antes y después del fix: prueba que el harness ve el retardo como  */
/* retención (si este control fallara, el harness no discriminaría).  */
/* ------------------------------------------------------------------ */
describe("control: el retardo de 1000 ms antes de navegar retiene /demo", () => {
  it("botón con setTimeout(..., 1000): /demo retenida a los 50 ms, loader tras el segundo", async () => {
    function DelayedNavButton() {
      const navigate = useNavigate();
      return (
        <button
          type="button"
          onClick={() => {
            // Patrón viejo de DemoSelector.handleDemoLogin antes del
            // fix: toast ya mostrado, navegación pedida 1 s después.
            setTimeout(() => {
              navigate("/profile-single");
            }, 1000);
          }}
        >
          Entrar con retardo
        </button>
      );
    }
    const { Target } = makeHungTarget();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(
      <MemoryRouter
        initialEntries={["/demo"]}
        useTransitions={APP_ROUTER_USE_TRANSITIONS}
      >
        <Routes>
          <Route element={<MainLayout />}>
            <Route
              path="/demo"
              element={
                <div>
                  <h1>Selector demo</h1>
                  <DelayedNavButton />
                </div>
              }
            />
            {profileRoute(Target, "/profile-single")}
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("Selector demo", {}, { timeout: 5000 });
    try {
      expect(container.innerHTML).toContain("Selector demo");
      // Sin signIn no hay usuario: ProtectedRoute rebotaría a /auth
      // (sin ruta en el harness) y el contenedor quedaría vacío al
      // navegar. El control simula un usuario ya autenticado.
      authState.user = { id: "demo-user-1", email: "single@outlook.es" };
      clickButton(container, "Entrar con retardo");
      await sleep(50);
      // El temporizador aún no disparó: vista vieja, sin loader.
      expect(container.innerHTML).toContain("Selector demo");
      expect(container.innerHTML).not.toContain("Cargando...");
      // Tras el segundo: la navegación por fin se pide y el loader
      // urgente commitea (el chunk sigue colgado). Se sondea en vez
      // de un sleep fijo: el temporizador puede disparar tarde.
      await waitForLoader(container, "Selector demo");
      expect(container.innerHTML).not.toContain("Selector demo");
      expect(container.innerHTML).toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  });
});
