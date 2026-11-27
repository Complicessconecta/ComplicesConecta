/**
 * Ronda 16, stream B — bloqueador 2: el dock Config mostraba el
 * perfil VIEJO tras navegar a /settings.
 *
 * Síntoma (test dirigido 2026-11-26 04:22–04:41 CST, navegador del
 * teléfono, 886 px; reproducido 2 veces): al tocar Config en el dock
 * estando en el perfil, la URL cambiaba a /settings al instante pero
 * la vista seguía siendo el perfil completo de Sofía — con los
 * countdowns de acceso a fotos corriendo — y el contenido real de
 * /settings aparecía solo momentos después. El test de la ronda 14
 * vio la misma clase de síntoma ("la URL cambia al instante pero el
 * contenido tarda segundos"). Es el tercer round sobre este síntoma.
 *
 * Causa raíz (NO el tamaño del chunk, ronda 15): la cadena es
 * 1. el dock llama `navigate("/settings")` (Navigation.tsx),
 * 2. react-router 7 envuelve el cambio de ruta en
 *    `React.startTransition` (transición),
 * 3. la ruta /settings es lazy (`lazyWithDefault` en App.tsx) y su
 *    chunk aún no está descargado, así que suspende,
 * 4. en una transición, React RETIENE la UI ya visible en vez de
 *    mostrar el fallback de un Suspense YA MONTADO.
 * El `key={pathname}` que había en el <Outlet> de MainLayout solo
 * remontaba la página, no el boundary: el boundary seguía teniendo
 * contenido previo que retener y el fallback no aparecía nunca
 * mientras el chunk estaba en vuelo. La `key` vive ahora EN EL
 * BOUNDARY (MainLayout.tsx), así que cada navegación monta un
 * boundary nuevo sin contenido previo que retener y React pinta
 * <PageLoader /> DE INMEDIATO. Además el dock precarga el chunk de
 * /settings en idle al montar (Navigation.tsx), para que en el caso
 * común el contenido pinte sin loader.
 *
 * Por qué el fix de la ronda 15 no surtió efecto: `lazyWithDefault`
 * solo reintenta cuando el import RECHAZA; una descarga lenta pero
 * exitosa nunca rechaza, así que el reintento no corría y la
 * transición seguía reteniendo el perfil viejo todo el tiempo de la
 * descarga. Y `codeSplitting.groups` (vite.config.ts) solo achica lo
 * que hay que descargar, no precarga el chunk de /settings ni cambia
 * la retención de la transición. El test §4 de r15-stream-c solo
 * probaba el reintento en un lazy aislado, nunca la navegación.
 *
 * Qué prueban estos tests (y qué NO):
 * - Usan el MainLayout REAL, el Navigation REAL (el dock con su
 *   botón Config), el react-router REAL y `lazyWithDefault` REAL.
 *   El perfil es un stub (el ProfileSingle real es pesado y tiene
 *   fallos preexistentes ajenos a este bug) y el chunk de /settings
 *   es un lazy colgado a propósito: eso aísla exactamente el
 *   mecanismo (transición + Suspense), que vive en MainLayout y el
 *   router, no en la página de perfil.
 * - El test 1 es la regresión: con el chunk en vuelo, tras el toque
 *   en Config el perfil viejo debe haber DESAPARECIDO de inmediato
 *   y debe verse "Cargando...". Sin la `key` en el boundary, el
 *   perfil viejo sigue en el DOM y el test falla.
 * - Lo que solo un test en dispositivo puede confirmar: el tiempo
 *   REAL de descarga del chunk en red móvil y que, con la precarga,
 *   el toque pinte el contenido sin pasar por el loader. Este test
 *   prueba el mecanismo (nunca contenido viejo), no la latencia.
 * - La precarga del chunk se afirma en §1 (segundo test): es el
 *   primer montaje del dock en el archivo, así que el contador del
 *   mock de Settings mide exactamente esa precarga.
 *
 * Convención de mocks: misma que r14-stream-b / r15-stream-c
 * (Supabase con rechazo, useAuth con estado hoisted, useToast).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
  isDemo: false,
}));
const mockToast = vi.hoisted(() => vi.fn());
const settingsImportCalls = vi.hoisted(() => ({ count: 0 }));
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

// El módulo real de /settings NO se carga en este archivo: el mock
// cuenta cuántas veces se evalúa (la precarga del dock) y evita que
// la precarga arrastre el árbol real de Settings en el test.
vi.mock("@/pages/Settings", () => {
  settingsImportCalls.count += 1;
  return {
    default: () => <div>Configuración (mock)</div>,
  };
});

import { lazy, type ComponentType } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazyWithDefault } from "@/utils/lazyWithDefault";

/** Perfil propio, stub del ProfileSingle real: el marcador y el
 *  countdown son lo que el test dirigido seguía viendo tras tocar
 *  Config (el perfil completo de Sofía, con los countdowns de acceso
 *  a fotos corriendo). */
const ProfileStub = () => (
  <div>
    <h1>Perfil de Sofía</h1>
    <p>Foto disponible en 23:59:58</p>
  </div>
);

/** El chunk de /settings aún en vuelo: el lazy no resuelve nunca. */
const HungSettings = lazyWithDefault(
  (): Promise<{ default: ComponentType }> =>
    new Promise(() => {
      // No resuelve nunca: simula la descarga del chunk en curso.
    }),
);

/** El chunk de /settings que resuelve cuando el test lo libera. */
let resolveSettings!: (v: { default: ComponentType }) => void;
const ResolvingSettings = lazyWithDefault(
  (): Promise<{ default: ComponentType }> =>
    new Promise((resolve) => {
      resolveSettings = resolve;
    }),
);

function renderProfileToSettings(SettingsPage: ComponentType) {
  return render(
    <MemoryRouter initialEntries={["/profile-single"]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/profile-single" element={<ProfileStub />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** El botón Config del dock real (Navigation). */
function clickDockConfig() {
  const configButton = screen
    .getByText("Config")
    .closest("button") as HTMLButtonElement;
  fireEvent.click(configButton);
}

beforeEach(() => {
  window.localStorage.clear();
  authState.user = { id: "r16b-user" };
  authState.profile = null;
  authState.isDemo = true;
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
  settingsImportCalls.count = 0;
});

/* ------------------------------------------------------------------ */
/* 1 — Regresión del bloqueador 2: nada de perfil viejo tras Config    */
/* ------------------------------------------------------------------ */
describe("1: dock Config no retiene el perfil viejo mientras carga /settings", () => {
  it("con el chunk en vuelo, tras tocar Config el perfil desaparece y se ve el loader (sin esperar)", () => {
    renderProfileToSettings(HungSettings);
    // Estado inicial: el perfil está en pantalla, sin loader.
    expect(screen.getByText("Perfil de Sofía")).toBeTruthy();
    expect(screen.queryByText("Cargando...")).toBeNull();

    clickDockConfig();

    // SIN esperar a que el chunk resuelva (nunca resuelve): el
    // contenido viejo ya no debe estar y el loader debe estar.
    // Sin la key en el boundary de MainLayout, el perfil viejo
    // sigue en el DOM y estas dos aserciones fallan.
    expect(screen.queryByText("Perfil de Sofía")).toBeNull();
    expect(screen.queryByText(/23:59:58/)).toBeNull();
    expect(screen.getByText("Cargando...")).toBeTruthy();
  });

  it("el dock precarga el chunk de /settings al montar (el toque no paga la descarga en frío)", async () => {
    renderProfileToSettings(HungSettings);
    expect(screen.getByText("Perfil de Sofía")).toBeTruthy();
    // La precarga corre en idle/setTimeout(0) al montar el dock.
    await waitFor(() =>
      expect(settingsImportCalls.count).toBeGreaterThan(0),
    );
  });
});

/* ------------------------------------------------------------------ */
/* 2 — Cuando el chunk resuelve, /settings pinta y el perfil no vuelve */
/* ------------------------------------------------------------------ */
describe("2: la navegación completa cuando el chunk resuelve", () => {
  it("tras tocar Config, al resolver el chunk aparece /settings y el perfil no vuelve", async () => {
    renderProfileToSettings(ResolvingSettings);
    expect(screen.getByText("Perfil de Sofía")).toBeTruthy();

    clickDockConfig();

    // Mientras está en vuelo: loader, nada de perfil viejo.
    expect(screen.queryByText("Perfil de Sofía")).toBeNull();
    expect(screen.getByText("Cargando...")).toBeTruthy();

    await act(async () => {
      resolveSettings({
        default: () => <div>Contenido de Config</div>,
      });
    });
    expect(await screen.findByText("Contenido de Config")).toBeTruthy();
    expect(screen.queryByText("Perfil de Sofía")).toBeNull();
    expect(screen.queryByText("Cargando...")).toBeNull();
  });
});
