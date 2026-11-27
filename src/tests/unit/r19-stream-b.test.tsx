/**
 * Ronda 19, stream B — el botón "Entrar como Sofía / Carmen &
 * Roberto" de la sección "Cuenta demo activa" reentraba al instante
 * pero SIN el toast "Modo Demo Activado" (test dirigido ronda 18,
 * PR #78, 2026-11-26 08:30–08:53 CST, device browser 886 px: 3
 * intentos sin toast, mientras el "Entrar" de "Tus cuentas demo en
 * este navegador" sí lo muestra).
 *
 * Causa raíz (ver DemoSelector.tsx): ese botón hacía un
 * `navigate(...)` pelado, sin pasar por `handleDemoLogin` ni
 * `handleLocalAccountLogin`, que son los únicos que disparan el
 * toast. No es un toast despedido por el cambio de ruta (el
 * <Toaster /> vive en MainLayout, por encima del <Outlet />, y los
 * otros caminos sí lo muestran sobre el perfil), ni otra instancia
 * de sonner, ni un toast disparado antes de montar el Toaster: el
 * toast NO SE DISPARABA NUNCA — el onClick no contenía ninguna
 * llamada a `toast()`.
 *
 * El fix: `handleActiveSessionLogin` dispara el mismo toast
 * ("🎭 Modo Demo Activado" / "Bienvenido de nuevo, <nickname>")
 * y luego navega a la misma ruta que antes. La sesión ya existe
 * (el banner solo se muestra si `getActiveDemoSession()` la
 * resuelve), así que no hace falta `signIn` ni restaurar nada.
 *
 * Cómo prueban estos tests (y qué NO):
 * - Montan el DemoSelector REAL (no un stub con `navigate()`), con
 *   el `signIn` mockeado como el real, el MainLayout REAL, el
 *   ProtectedRoute REAL y el react-router REAL con el
 *   `useTransitions` de la app; el chunk destino colgado a propósito.
 * - El click es un `button.click()` real sobre un root montado con
 *   `createRoot`, SIN `act()`: `act()` vacía las transiciones y
 *   enmascara errores de timing (lección de las rondas 16–18). La
 *   aserción es tras `sleep(50)`: el toast se dispara síncrono en
 *   el handler y la navegación ya se pidió.
 * - La aserción es la conjunción toast llamado + /demo fuera +
 *   "Cargando..." presente: el toast solo prueba que se disparó, el
 *   loader prueba que la navegación no cambió (sigue reentrando al
 *   instante, como antes del fix).
 * - Lo que solo un test en dispositivo puede confirmar: que el toast
 *   se VEA sobre el perfil en el teléfono. Esto prueba que se dispara
 *   y que la navegación ocurre; la visibilidad ya la probó el test
 *   dirigido de la ronda 18 para los otros caminos (mismo <Toaster />).
 *
 * Prueba de discriminación: con el fix revertido (el `navigate(...)`
 * pelado restaurado en DemoSelector, commit 878c1b8), los 2 tests del
 * banner FALLAN (mockToast nunca se llama) y los 3 pins de regresión
 * siguen en verde. Ver el informe del stream.
 *
 * Convención de mocks: misma que r18-stream-a (Supabase con rechazo,
 * useAuth con estado hoisted, useToast); siembra de sesión canónica
 * como r14-stream-b.
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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DemoSelector } from "@/components/auth/DemoSelector";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import { APP_ROUTER_USE_TRANSITIONS } from "@/utils/routerConfig";
import { createLocalDemoAccount } from "@/lib/demo-registration";
import { generateDemoUserUUID } from "@/lib/demo-uuid";

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
 * Siembra en localStorage la sesión demo canónica (Sofía / Carmen &
 * Roberto), como la deja `handleDemoAuth` tras "Explorar como
 * Single/Pareja" (r14-stream-b). Sin ella no aparece la sección
 * "Cuenta demo activa".
 */
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
/* El banner "Cuenta demo activa": reentrar dispara el mismo toast    */
/* que los otros caminos y navega al instante (sin cambiar la         */
/* navegación: el loader aparece y /demo sale).                       */
/* ------------------------------------------------------------------ */
describe("ronda 19 stream B: 'Entrar como …' del banner muestra el toast", () => {
  it.each([
    [
      "single@outlook.es",
      "Entrar como Sofía",
      "Bienvenido de nuevo, Sofía",
      "Perfil single",
    ],
    [
      "pareja@outlook.es",
      "Entrar como Carmen & Roberto",
      "Bienvenido de nuevo, Carmen & Roberto",
      "Perfil pareja",
    ],
  ] as const)(
    "banner (%s): toast 'Modo Demo Activado' + navegación inmediata",
    async (email, buttonLabel, expectedDescription, toMarker) => {
      seedCanonicalSession(email);
      // La sesión ya existe en el mundo real: el usuario está
      // autenticado (sin signIn en este camino, solo reentrada).
      // Igual que el control de r18-stream-a.
      authState.user = { id: "demo-user-1", email };
      const { Target, resolve } = makeHungTarget();
      const { container, root } = await mountDemo(Target);
      try {
        expect(container.innerHTML).toContain("Cuenta demo activa");
        // textContent, no innerHTML: el "&" de "Carmen & Roberto" va
        // escapado como "&amp;" en el HTML serializado.
        expect(container.textContent).toContain(buttonLabel);

        clickButton(container, buttonLabel);
        // 50 ms: de sobra para el handler síncrono (toast) y para
        // que la navegación urgente commitee el loader.
        await sleep(50);

        // El toast que faltaba: mismo título que los otros caminos.
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "🎭 Modo Demo Activado",
            description: expectedDescription,
          }),
        );
        // La navegación no cambió: /demo fuera, loader inmediato.
        expect(container.innerHTML).not.toContain("Modo Demo");
        expect(container.textContent).not.toContain(buttonLabel);
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
/* Pins de regresión: los caminos que ya mostraban el toast lo        */
/* siguen mostrando y navegan igual.                                  */
/* ------------------------------------------------------------------ */
describe("ronda 19 stream B: pins de regresión de los caminos con toast", () => {
  it.each([
    ["single", "Explorar como Single", "Perfil single"],
    ["couple", "Explorar como Pareja", "Perfil pareja"],
  ])(
    "Explorar como %s: toast + navegación inmediata",
    async (_type, buttonLabel, _toMarker) => {
      const { Target } = makeHungTarget();
      const { container, root } = await mountDemo(Target);
      try {
        clickButton(container, buttonLabel);
        await sleep(50);
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "🎭 Modo Demo Activado" }),
        );
        expect(container.innerHTML).not.toContain("Modo Demo");
        expect(container.innerHTML).toContain("Cargando...");
      } finally {
        root.unmount();
        container.remove();
      }
    },
  );

  it("'Entrar' de 'Tus cuentas demo en este navegador': toast + navegación inmediata", async () => {
    createLocalDemoAccount({
      email: "testr19b@demo.local",
      nickname: "TestR19b",
      accountType: "single",
    });
    // La cuenta registrada es la sesión activa: el usuario está
    // autenticado (el banner no aparece para ella; se gestiona
    // desde su fila de la lista).
    authState.user = { id: "demo-user-1", email: "testr19b@demo.local" };
    const { Target } = makeHungTarget();
    const { container, root } = await mountDemo(Target);
    try {
      expect(container.innerHTML).toContain(
        "Tus cuentas demo en este navegador",
      );
      expect(container.innerHTML).toContain("TestR19b");
      expect(container.innerHTML).not.toContain("Cuenta demo activa");

      clickButton(container, "Entrar");
      await sleep(50);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "🎭 Modo Demo Activado",
          description: "Bienvenido de nuevo, TestR19b",
        }),
      );
      expect(container.innerHTML).not.toContain("Modo Demo");
      expect(container.innerHTML).toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  });
});
