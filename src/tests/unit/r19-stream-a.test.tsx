/**
 * Ronda 19, stream A — el tope de 15 s no dispara en SPA Discover→perfil.
 *
 * CAUSA RAÍZ (no está en la ruta ni en el lazy): el bucle de
 * realimentación de `PerformanceMonitoringService` satura el hilo
 * principal. Medido en Chromium real (preview local, 886 px):
 * - El observer de `resource` dispara `recordMetric("resourceLoadTime")`
 *   por cada recurso; en PROD cada métrica persiste (getUser + insert
 *   en `app_metrics`, getUser + insert en `monitoring_sessions`).
 * - Cada una de esas peticiones ES un recurso nuevo → el observer
 *   vuelve a disparar. Proporción medida getUser:app_metrics = 2:1
 *   exacto; 201 getUser/s y 100 inserts/s en /discover en reposo;
 *   heartbeat de 100 ms con huecos de 0,6–1,8 s en reposo; tras el
 *   click en Ana el renderer deja de responder a CDP y la URL se queda
 *   en /discover 20+ s. Con el hilo así, el `setTimeout` de 15 s del
 *   tope de chunk (ronda 18) no puede disparar y el panel de error no
 *   aparece nunca. En carga directa el perfil gana la carrera (el
 *   chunk de 52 kB llega en ~3 s, antes de saturarse el hilo); en SPA
 *   desde Discover el bucle YA está saturado al hacer click.
 * - El fix (un solo archivo, `PerformanceMonitoringService.ts`): (a)
 *   el observer ignora los recursos de telemetría
 *   (`isTelemetryResourceUrl`); (b) `recordMetric` NO persiste las
 *   métricas `resourceLoadTime` en Supabase (siguen en memoria para
 *   `generateReport`/`getMetrics`).
 *
 * Qué prueba este archivo:
 * 1. `isTelemetryResourceUrl`: telemetría sí, contenido no.
 * 2. `recordMetric` con PROD: `resourceLoadTime` NO toca Supabase
 *    (0 getUser, 0 inserts) mientras `pageLoadTime` SÍ persiste.
 *    Núcleo de la discriminación: al revertir el fix, el test 2 falla
 *    (la métrica de recurso vuelve a persistir).
 * 3. La ruta YA NO SUSPENDE (causa raíz 2, carga imperativa del
 *    chunk): `ProfileDetailRoute` renderiza su loader sin necesidad
 *    de un Suspense alrededor y el perfil aparece al resolver el
 *    chunk, tanto en SPA (/discover → /profile/3) como en directo.
 *    El test "sin Suspense" es el discriminador de este fix: con el
 *    `React.lazy` de la ronda 18 la ruta TIRA una promesa al
 *    renderizar sin boundary y el test falla; con la carga imperativa
 *    renderiza el loader y luego el perfil. Los tests de SPA/directa
 *    con chunk colgado o lento pasan antes y después (jsdom no
 *    reproduce la pérdida del retry: el ping del Suspense sobrevive
 *    ahí a updates a DefaultLane y a flushSync, en build dev y prod);
 *    guardan el comportamiento de la ruta, no el retry. La
 *    discriminación en navegador real está en las sondas: build con
 *    el lazy (telemetría ya fija) → SPA atascada 60+ s con el chunk
 *    en 12–18 ms; build con la carga imperativa → el perfil aparece
 *    en segundos (ver informe del stream).
 *
 * Relojes REALES (con fake timers el scheduler de React 19 no corre
 * en happy-dom, ver r9-stream-c). Tope acortado a 500 ms por prop en
 * las pruebas SPA/directa; el valor de producción (15 s) lo fija el
 * test de r18-stream-b.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
  isDemo: false,
}));
const mockToast = vi.hoisted(() => vi.fn());
const supabaseBehavior = vi.hoisted(() => ({
  mode: "reject" as "reject" | "empty",
}));
const sbCalls = vi.hoisted(() => ({
  getUser: 0,
  getSession: 0,
  inserts: [] as string[],
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
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
    q.insert = (rows: unknown) => {
      return Promise.resolve({ data: null, error: null });
    };
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
      from: (table: string) => {
        const q = makeQuery();
        // El insert de persistencia cuenta por tabla.
        const origInsert = q.insert as (rows: unknown) => Promise<unknown>;
        q.insert = (rows: unknown) => {
          sbCalls.inserts.push(table);
          return origInsert(rows);
        };
        return q;
      },
      rpc: () => stubError(),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () => {
          sbCalls.getSession++;
          return Promise.resolve({ data: { session: null }, error: null });
        },
        getUser: () => {
          sbCalls.getUser++;
          return Promise.resolve({
            data: { user: { id: "r19-user" } },
            error: null,
          });
        },
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

import {
  type ComponentType,
  type ReactElement,
  createElement,
} from "react";
import { createRoot } from "react-dom/client";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import ProfileLayout from "@/layouts/ProfileLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { APP_ROUTER_USE_TRANSITIONS } from "@/utils/routerConfig";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const StubProfile = () => createElement("div", null, "Perfil de prueba");

async function loadServiceModule() {
  const mod = await import("@/services/core/PerformanceMonitoringService");
  return mod;
}

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  window.localStorage.clear();
  authState.user = { id: "r19-user" };
  authState.profile = null;
  authState.isDemo = true;
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
  sbCalls.getUser = 0;
  sbCalls.getSession = 0;
  sbCalls.inserts = [];
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/* ------------------------------------------------------------------ */
/* 1. El filtro de telemetría                                          */
/* ------------------------------------------------------------------ */
describe("isTelemetryResourceUrl (ronda 19: el observer no se mide a sí mismo)", () => {
  it("telemetría sí: supabase, datadog, posthog, speed-insights, reportes CSP", async () => {
    const { isTelemetryResourceUrl } = await loadServiceModule();
    expect(
      isTelemetryResourceUrl("https://dummy.supabase.co/auth/v1/user"),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "https://dummy.supabase.co/rest/v1/app_metrics?select=*",
      ),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "https://axtvqnozatbmllvwzuim.supabase.co/rest/v1/monitoring_sessions",
      ),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "https://browser-intake-us5-datadoghq.com/api/v2/rum?ddsource=browser",
      ),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "https://browser-intake-us5-datadoghq.com/api/v2/logs",
      ),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl("https://app.posthog.com/static/array.js"),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "https://va.vercel-scripts.com/v1/speed-insights",
      ),
    ).toBe(true);
    expect(
      isTelemetryResourceUrl(
        "http://127.0.0.1:4176/api/csp-violation-report",
      ),
    ).toBe(true);
  });

  it("contenido no: imágenes, chunks, css, fuentes", async () => {
    const { isTelemetryResourceUrl } = await loadServiceModule();
    expect(
      isTelemetryResourceUrl(
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      ),
    ).toBe(false);
    expect(
      isTelemetryResourceUrl(
        "http://127.0.0.1:4176/assets/js/pages-profiles-SIy8oy-F.js",
      ),
    ).toBe(false);
    expect(
      isTelemetryResourceUrl(
        "http://127.0.0.1:4176/assets/css/index-DN9cM-Mv.css",
      ),
    ).toBe(false);
    expect(
      isTelemetryResourceUrl("https://fonts.googleapis.com/css2?family=Inter"),
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 2. La puerta de persistencia (núcleo de la discriminación)          */
/* ------------------------------------------------------------------ */
describe("recordMetric en PROD: resourceLoadTime no persiste, el resto sí", () => {
  it("resourceLoadTime: 0 getUser y 0 inserts (el bucle no arranca)", async () => {
    vi.stubEnv("PROD", true);
    const { PerformanceMonitoringService } = await loadServiceModule();
    const service = new PerformanceMonitoringService();
    service.recordMetric({
      name: "resourceLoadTime",
      value: 123,
      unit: "ms",
      category: "network",
      metadata: { url: "https://images.unsplash.com/photo-x", type: "img" },
    });
    // persistMetric/logMonitoringSession son fire-and-forget: dar
    // tiempo a que getUser resuelva y el insert se dispare si existe.
    await sleep(300);
    expect(sbCalls.getUser).toBe(0);
    expect(sbCalls.inserts).toEqual([]);
    // Pero la métrica SÍ queda en memoria para el reporte.
    expect(
      service.getMetrics({ name: "resourceLoadTime" }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("pageLoadTime: SÍ persiste (el fix no apaga la telemetría)", async () => {
    vi.stubEnv("PROD", true);
    const { PerformanceMonitoringService } = await loadServiceModule();
    const service = new PerformanceMonitoringService();
    service.recordMetric({
      name: "pageLoadTime",
      value: 1500,
      unit: "ms",
      category: "load",
    });
    await sleep(300);
    // persistMetric (1 getUser + insert app_metrics) y
    // logMonitoringSession (1 getUser + insert monitoring_sessions).
    expect(sbCalls.getUser).toBe(2);
    expect(sbCalls.inserts).toContain("app_metrics");
    expect(sbCalls.inserts).toContain("monitoring_sessions");
  });

  it("sin PROD no persiste nada (comportamiento previo intacto)", async () => {
    vi.stubEnv("PROD", false);
    const { PerformanceMonitoringService } = await loadServiceModule();
    const service = new PerformanceMonitoringService();
    service.recordMetric({
      name: "pageLoadTime",
      value: 1500,
      unit: "ms",
      category: "load",
    });
    await sleep(300);
    expect(sbCalls.getUser).toBe(0);
    expect(sbCalls.inserts).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 3. El mecanismo de la ruta en SPA (pasa antes y después del fix;   */
/*    jsdom no reproduce el bucle: guarda el tope de 15 s de r18)      */
/* ------------------------------------------------------------------ */
function DiscoverStub() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Descubrir</h1>
      <button
        type="button"
        onClick={() =>
          navigate("/profile/3", {
            state: {
              profile: {
                id: "3",
                name: "Ana",
                age: 25,
                location: "Ciudad de México",
              },
            },
          })
        }
      >
        Ver perfil de Ana
      </button>
    </div>
  );
}

async function mountSpa(
  RouteElement: ReactElement,
  initialEntries: string[],
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(
    <MemoryRouter
      initialEntries={initialEntries}
      useTransitions={APP_ROUTER_USE_TRANSITIONS}
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/discover" element={<DiscoverStub />} />
          <Route
            element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/profile/:id" element={RouteElement} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
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

describe("la ruta ya no suspende (causa raíz 2, carga imperativa)", () => {
  it("sin Suspense alrededor: renderiza el loader y luego el perfil", async () => {
    // DISCRIMINADOR: con el React.lazy de la ronda 18 este render
    // TIRA una promesa (suspende) y no hay boundary que la atrape:
    // el test falla. Con la carga imperativa la ruta commitea su
    // loader y el setState del import muestra el perfil.
    const slow = () =>
      new Promise<{ default: ComponentType<unknown> }>((resolve) =>
        setTimeout(() => resolve({ default: StubProfile }), 300),
      );
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      root.render(
        <MemoryRouter>
          <ProfileDetailRoute chunkTimeoutMs={5000} importer={slow} />
        </MemoryRouter>,
      );
      await sleep(200);
      expect(container.innerHTML).toContain("Cargando...");
      expect(
        await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(container.innerHTML).not.toContain("Cargando...");
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("SPA /discover → /profile/3 con chunk colgado: el panel aparece al tope", async () => {
    let importerCalls = 0;
    const hung = () => {
      importerCalls++;
      return new Promise<{ default: ComponentType<unknown> }>(() => {});
    };
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute chunkTimeoutMs={500} importer={hung} />,
      ["/discover"],
    );
    try {
      expect(container.innerHTML).toContain("Descubrir");
      clickButton(container, "Ver perfil de Ana");
      await Promise.resolve();
      expect(container.innerHTML).toContain("Cargando...");
      expect(container.innerHTML).not.toContain("Descubrir");
      expect(
        await screen.findByText(
          "No se pudo cargar el perfil",
          {},
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText("Reintentar")).toBeTruthy();
      // El efecto corre una sola vez: el temporizador de la carrera
      // es el que dispara, no un reintento.
      expect(importerCalls).toBe(1);
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("SPA /discover → /profile/3 con chunk que resuelve: el perfil aparece sin update externo", async () => {
    const slow = () =>
      new Promise<{ default: ComponentType<unknown> }>((resolve) =>
        setTimeout(() => resolve({ default: StubProfile }), 300),
      );
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute chunkTimeoutMs={5000} importer={slow} />,
      ["/discover"],
    );
    try {
      clickButton(container, "Ver perfil de Ana");
      await Promise.resolve();
      expect(container.innerHTML).toContain("Cargando...");
      expect(
        await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(container.innerHTML).not.toContain("Cargando...");
      expect(container.innerHTML).not.toContain(
        "No se pudo cargar el perfil",
      );
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("CONTROL directo /profile/3 con chunk colgado: el panel aparece al tope", async () => {
    let importerCalls = 0;
    const hung = () => {
      importerCalls++;
      return new Promise<{ default: ComponentType<unknown> }>(() => {});
    };
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute chunkTimeoutMs={500} importer={hung} />,
      ["/profile/3"],
    );
    try {
      expect(container.innerHTML).toContain("Cargando...");
      expect(
        await screen.findByText(
          "No se pudo cargar el perfil",
          {},
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText("Reintentar")).toBeTruthy();
      expect(importerCalls).toBe(1);
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("CONTROL directo /profile/3 con chunk que resuelve: el perfil aparece", async () => {
    const slow = () =>
      new Promise<{ default: ComponentType<unknown> }>((resolve) =>
        setTimeout(() => resolve({ default: StubProfile }), 300),
      );
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute chunkTimeoutMs={5000} importer={slow} />,
      ["/profile/3"],
    );
    try {
      expect(container.innerHTML).toContain("Cargando...");
      expect(
        await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
      ).toBeTruthy();
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("tras el timeout, Reintentar carga el chunk ya en caché", async () => {
    // El import resuelve a los 800 ms; el tope es 500 ms: el primer
    // intento cae al error, pero el módulo ya está resuelto cuando el
    // usuario reintenta (el navegador deduplica el fetch del módulo).
    let chunkPromise: Promise<{ default: ComponentType<unknown> }> | undefined;
    const late = () => {
      if (!chunkPromise) {
        chunkPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ default: StubProfile }), 800),
        );
      }
      return chunkPromise;
    };
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute chunkTimeoutMs={500} importer={late} />,
      ["/discover"],
    );
    try {
      clickButton(container, "Ver perfil de Ana");
      await Promise.resolve();
      expect(
        await screen.findByText("Reintentar", {}, { timeout: 5000 }),
      ).toBeTruthy();
      await sleep(700);
      clickButton(container, "Reintentar");
      expect(
        await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(screen.queryByText("Reintentar")).toBeNull();
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("rechazo inmediato del chunk muestra el error sin esperar el tope", async () => {
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const { container, root } = await mountSpa(
      <ProfileDetailRoute
        chunkTimeoutMs={10_000}
        importer={() =>
          Promise.reject(
            new Error("Failed to fetch dynamically imported module"),
          )
        }
      />,
      ["/discover"],
    );
    try {
      clickButton(container, "Ver perfil de Ana");
      await Promise.resolve();
      // Si esperara al tope (10 s) este findByText de 5 s agotaría.
      expect(
        await screen.findByText("Reintentar", {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(
        screen.getByText("No se pudo cargar el perfil"),
      ).toBeTruthy();
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);

  it("un error de render del perfil NO lo traga el boundary: propaga", async () => {
    const mod = await import("@/pages/ProfileDetailRoute");
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
      importer?: () => Promise<{ default: ComponentType<unknown> }>;
    }>;
    const errors: unknown[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container, {
      onUncaughtError: (error) => {
        errors.push(error);
      },
    });
    try {
      root.render(
        <MemoryRouter>
          <ProfileDetailRoute
            chunkTimeoutMs={5000}
            importer={() =>
              Promise.resolve({
                default: () => {
                  throw new Error("boom de render");
                },
              })
            }
          />
        </MemoryRouter>,
      );
      await sleep(2000);
      expect(
        errors.some(
          (e) => e instanceof Error && e.message.includes("boom de render"),
        ),
      ).toBe(true);
      expect(container.textContent ?? "").not.toContain(
        "No se pudo cargar el perfil",
      );
    } finally {
      root.unmount();
      container.remove();
    }
  }, 20000);
});
