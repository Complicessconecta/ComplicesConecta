/**
 * Ronda 18, stream B — tope de carga del chunk de /profile/:id.
 *
 * Síntoma (test dirigido ronda 17, PR #77, DO NOT MERGE, 2026-11-26
 * 06:46–07:02 CST, device browser 886 px, una pestaña): al navegar a
 * /profile/<id> la pantalla se quedaba en "Cargando…" 45–90 s en las
 * 4 cargas (2 necesitaron recarga manual; 1 resolvió sola a ~45–60 s).
 *
 * QUÉ LOADER ERA (no el de la consulta): el `PageLoader` de MainLayout
 * ("Cargando...", `src/components/layout/MainLayout.tsx:32-44`),
 * fallback del `<Suspense key={pathname}>` del `<Outlet />`. En
 * /profile/:id es el único Suspense y el único "Cargando...": el
 * wrapper dice "Cargando perfil…" (otro texto, y ya con tope de 10 s
 * desde la ronda 17), ProtectedRoute dice "Verificando
 * autenticación...", el dock "Cargando chat…" ni se monta en rutas de
 * perfil. ProfileDetail era un `React.lazy` pelado (App.tsx:65-67):
 * un `import()` que no resuelve ni rechaza dejaba el fallback para
 * siempre. El chunk `pages-profiles` mide 52,38 kB: no es tamaño, es
 * una descarga colgada sin cota.
 *
 * El fix: `ProfileDetailRoute` carga el chunk con `lazyWithTimeout`
 * (15 s) y un boundary que solo atiende errores de descarga del chunk
 * (timeout o fetch roto) con "No se pudo cargar el perfil" +
 * Reintentar (recrea el lazy) + "Volver a perfiles". El timeout de
 * 10 s de la consulta Supabase del wrapper NO se toca.
 *
 * Cómo se prueba (relojes REALES: con fake timers el scheduler de
 * React 19 no corre en happy-dom, ver r9-stream-c): el chunk se
 * mockea con `vi.doMock` (colgado / lento / rechazo inmediato) y el
 * tope se acorta por prop en casi todos los tests; UN test usa el
 * tope real de 15 s para fijar el valor de producción.
 *
 * DISCRIMINACIÓN: si se revierte el fix (el lazy vuelve a ser pelado,
 * sin carrera contra el timeout), los tests de "chunk colgado" FALLAN
 * (Reintentar no aparece nunca). Medido en el informe del stream.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Suspense, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

const CHUNK_PATH = "@/pages/profiles/shared/ProfileDetail";
const ROUTE_PATH = "@/pages/ProfileDetailRoute";

const StubProfile = () =>
  createElement("div", null, "Perfil de prueba");

async function renderRoute(
  chunkTimeoutMs?: number,
  importer?: () => Promise<{ default: ComponentType<unknown> }>,
) {
  const mod = await import(ROUTE_PATH);
  const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
    chunkTimeoutMs?: number;
    importer?: () => Promise<{ default: ComponentType<unknown> }>;
  }>;
  const props: {
    chunkTimeoutMs?: number;
    importer?: () => Promise<{ default: ComponentType<unknown> }>;
  } = {};
  if (chunkTimeoutMs !== undefined) props.chunkTimeoutMs = chunkTimeoutMs;
  if (importer !== undefined) props.importer = importer;
  render(
    <MemoryRouter>
      <Suspense fallback={<p>Cargando...</p>}>
        <ProfileDetailRoute {...props} />
      </Suspense>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock(CHUNK_PATH);
});

describe("raceChunkLoad / isChunkLoadError (unidad, sin React)", () => {
  it("isChunkLoadError: timeout y fetch roto sí; error de render no", async () => {
    const { ChunkLoadTimeoutError, isChunkLoadError } = await import(
      "@/utils/lazyWithTimeout"
    );
    expect(isChunkLoadError(new ChunkLoadTimeoutError("x", 100))).toBe(
      true,
    );
    expect(
      isChunkLoadError(
        new Error("Failed to fetch dynamically imported module"),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("Importing a module script failed")),
    ).toBe(true);
    expect(isChunkLoadError(new Error("Loading chunk 42 failed"))).toBe(
      true,
    );
    expect(isChunkLoadError(new Error("boom de render"))).toBe(false);
    expect(isChunkLoadError("ni siquiera un Error")).toBe(false);
  });

  it("raceChunkLoad: el import colgado rechaza con ChunkLoadTimeoutError al tope", async () => {
    const { ChunkLoadTimeoutError, raceChunkLoad } = await import(
      "@/utils/lazyWithTimeout"
    );
    const started = Date.now();
    await expect(
      raceChunkLoad(() => new Promise(() => {}), 100, "test-chunk"),
    ).rejects.toBeInstanceOf(ChunkLoadTimeoutError);
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(5000);
  });

  it("raceChunkLoad: el import rápido resuelve y el rechazo inmediato pasa tal cual", async () => {
    const { raceChunkLoad } = await import("@/utils/lazyWithTimeout");
    await expect(
      raceChunkLoad(() => Promise.resolve({ ok: true }), 100, "x"),
    ).resolves.toEqual({ ok: true });
    const boom = new Error("fetch roto");
    await expect(
      raceChunkLoad(() => Promise.reject(boom), 5000, "x"),
    ).rejects.toBe(boom);
  });

  it("el tope de producción del chunk es 15 s", async () => {
    const { PROFILE_DETAIL_CHUNK_TIMEOUT_MS } = await import(ROUTE_PATH);
    expect(PROFILE_DETAIL_CHUNK_TIMEOUT_MS).toBe(15_000);
  });
});

describe("chunk de /profile/:id colgado (el atasco de la ronda 17)", () => {
  it("con el chunk colgado aparece Reintentar al vencer el tope (no spinner eterno)", async () => {
    vi.doMock(CHUNK_PATH, () => new Promise(() => {}));
    await renderRoute(500);

    expect(screen.getByText("Cargando...")).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();

    expect(
      await screen.findByText("Reintentar", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(
      screen.getByText("No se pudo cargar el perfil"),
    ).toBeTruthy();
    expect(screen.getByText("Volver a perfiles")).toBeTruthy();
    expect(screen.queryByText("Cargando...")).toBeNull();
  });

  it("antes del tope el loader sigue (el timeout no corta antes)", async () => {
    vi.doMock(CHUNK_PATH, () => new Promise(() => {}));
    await renderRoute(2000);

    expect(screen.getByText("Cargando...")).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();

    // A ~500 ms (tope 2000 ms) sigue cargando: ni error ni corte.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(screen.getByText("Cargando...")).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();

    // Y a los 2 s el error sí aparece.
    expect(
      await screen.findByText("Reintentar", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });

  it(
    "con el tope REAL de producción (15 s) el chunk colgado también cae al error",
    async () => {
      vi.doMock(CHUNK_PATH, () => new Promise(() => {}));
      // Sin chunkTimeoutMs: usa PROFILE_DETAIL_CHUNK_TIMEOUT_MS (15 s).
      await renderRoute();

      expect(screen.getByText("Cargando...")).toBeTruthy();
      expect(
        await screen.findByText("Reintentar", {}, { timeout: 25000 }),
      ).toBeTruthy();
      expect(
        screen.getByText("No se pudo cargar el perfil"),
      ).toBeTruthy();
    },
    40000,
  );
});

describe("chunk lento o con fallo transitorio", () => {
  it("chunk lento que sí resuelve antes del tope renderiza sin error", async () => {
    vi.doMock(
      CHUNK_PATH,
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ default: StubProfile }), 300),
        ),
    );
    await renderRoute(2000);

    expect(
      await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();
    expect(screen.queryByText("No se pudo cargar el perfil")).toBeNull();
  });

  it("tras el timeout, Reintentar carga el chunk ya en caché (descarga que llegó tarde)", async () => {
    // El import resuelve a los 800 ms; el tope es 500 ms: el primer
    // intento cae al error, pero el módulo ya está en caché cuando el
    // usuario reintenta (así llega la descarga lenta en producción:
    // el navegador deduplica el fetch del módulo).
    let chunkPromise: Promise<unknown> | undefined;
    vi.doMock(CHUNK_PATH, () => {
      if (!chunkPromise) {
        chunkPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ default: StubProfile }), 800),
        );
      }
      return chunkPromise;
    });
    await renderRoute(500);

    expect(
      await screen.findByText("Reintentar", {}, { timeout: 5000 }),
    ).toBeTruthy();
    // El módulo resuelve a los 800 ms: esperar a que YA esté
    // resuelto antes de reintentar. En un navegador real el segundo
    // `import()` se engancha a la descarga en curso y el reintento
    // inmediato también funcionaría; en vitest, un segundo `import()`
    // de un módulo mockeado cuya factoría sigue pendiente NO resuelve
    // nunca (medido en scratch: concurrente → TIMEOUT-2000ms), así
    // que reintentar antes de los 800 ms agotaría el segundo tope.
    // El clic tardío es además el caso realista (el usuario lee el
    // error antes de tocar Reintentar).
    await new Promise((resolve) => setTimeout(resolve, 700));
    fireEvent.click(screen.getByText("Reintentar"));
    expect(
      await screen.findByText("Perfil de prueba", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("rechazo inmediato del chunk (fetch roto) muestra el error sin esperar el tope", async () => {
    // Sin doMock aquí: el importador se pasa directo (ver
    // ProfileDetailRouteProps.importer).
    await renderRoute(10_000, () =>
      Promise.reject(
        new Error("Failed to fetch dynamically imported module"),
      ),
    );

    // Si esperara al tope (10 s) este findByText de 5 s agotaría.
    expect(
      await screen.findByText("Reintentar", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(
      screen.getByText("No se pudo cargar el perfil"),
    ).toBeTruthy();
  });
});

describe("el boundary es SELECTIVO (solo errores de chunk)", () => {
  it("un error de render del perfil NO lo traga el boundary: propaga", async () => {
    vi.doMock(CHUNK_PATH, () => ({
      default: () => {
        throw new Error("boom de render");
      },
    }));
    const mod = await import(ROUTE_PATH);
    const ProfileDetailRoute = mod.ProfileDetailRoute as ComponentType<{
      chunkTimeoutMs?: number;
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
          <Suspense fallback={<p>Cargando...</p>}>
            <ProfileDetailRoute chunkTimeoutMs={5000} />
          </Suspense>
        </MemoryRouter>,
      );
      // El lazy resuelve en microtareas; el render que tira llega
      // enseguida. Margen amplio por la CPU compartida de la VM.
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
  });
});
