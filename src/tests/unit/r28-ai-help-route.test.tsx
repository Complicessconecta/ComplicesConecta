/**
 * RONDA 28 (bloque N) — el icono ✨ del dock ("IA Ayuda", /ai-help)
 * abría una página que se quedaba en "Cargando..." sin resolver
 * (captura 433017_16, 04:09 CST).
 *
 * Causa raíz con evidencia: /ai-help era un `lazyWithDefault` pelado
 * en App.tsx:116-118, sin ImperativeLazyRoute ni tope — la misma
 * exposición al retry perdido del Suspense que /profiles (ronda 27),
 * /requests (ronda 22) y /admin/dashboard (ronda 21). El chunk de
 * AIControlCenter arrastra WebLLM (el más pesado de los lazy): si la
 * descarga se atasca en el teléfono, el PageLoader no tenía salida.
 * El fix es el mismo patrón probado: ImperativeLazyRoute con tope de
 * 15 s y error con Reintentar. No hay rama demo que añadir: la página
 * es estática + LegalChatBox (IA local, sin Supabase); el modelo se
 * descarga en segundo plano dentro de la tarjeta, con su propio
 * estado de error.
 *
 * Cubre: (1) el importador resuelve → la página renderiza (sin
 * loader infinito); (2) el importador se cuelga → tras el tope
 * aparece el error con Reintentar, no "Cargando..." para siempre;
 * (3) Reintentar vuelve a cargar el chunk; (4) el cableado de
 * App.tsx usa ImperativeLazyRoute para /ai-help (sin `lazy` pelado).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ImperativeLazyRoute } from "@/pages/ImperativeLazyRoute";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

const FakeAiHelp = () => (
  <div>
    <h1>Centro de Control de IA</h1>
    <p>Asistente IA de Cómplices</p>
  </div>
);

const renderRoute = (importer: () => Promise<unknown>, timeoutMs = 150) =>
  render(
    <MemoryRouter>
      <ImperativeLazyRoute
        importer={importer}
        chunkName="pages-ai-help"
        chunkTimeoutMs={timeoutMs}
        errorTitle="No se pudo cargar la IA Ayuda"
        fallbackPath="/"
        fallbackLabel="Volver al inicio"
      />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.useRealTimers();
});

describe("R28-N: /ai-help con tope de carga y Reintentar", () => {
  it("el chunk resuelve → la página renderiza, sin loader infinito", async () => {
    renderRoute(() => Promise.resolve({ default: FakeAiHelp }));
    await screen.findByText("Centro de Control de IA");
    expect(
      screen.queryByText("Cargando..."),
    ).not.toBeInTheDocument();
  });

  it("el chunk se cuelga → tras el tope aparece el error con Reintentar", async () => {
    renderRoute(() => new Promise(() => {}));
    // Mientras carga, el PageLoader está visible (comportamiento
    // normal); tras el tope debe salir de ahí.
    await screen.findByText("Cargando...");
    await screen.findByText("No se pudo cargar la IA Ayuda", {}, { timeout: 5000 });
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver al inicio" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
  });

  it("Reintentar tras el fallo vuelve a cargar el chunk", async () => {
    let attempts = 0;
    const flakyImporter = () => {
      attempts += 1;
      if (attempts === 1) return new Promise(() => {});
      return Promise.resolve({ default: FakeAiHelp });
    };
    renderRoute(flakyImporter);
    await screen.findByText("No se pudo cargar la IA Ayuda", {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Centro de Control de IA");
    expect(attempts).toBe(2);
  });
});

describe("R28-N: cableado de /ai-help en App.tsx", () => {
  it("la ruta usa ImperativeLazyRoute, no un lazy pelado", () => {
    const appTsx = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "App.tsx",
      ),
      "utf-8",
    );
    // El importador es const a nivel de módulo (identidad estable).
    expect(appTsx).toContain(
      'const importAiHelpChunk = () => import("@/pages/AIControlCenter")',
    );
    expect(appTsx).toContain('chunkName="pages-ai-help"');
    // Ya no hay const lazy de AIControlCenter ni ruta pelada.
    expect(appTsx).not.toContain("const AIControlCenter = lazyWithDefault");
    expect(appTsx).not.toContain("element={<AIControlCenter />}");
  });
});
