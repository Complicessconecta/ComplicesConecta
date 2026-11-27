/**
 * Ronda 22, stream C — test dirigido del PR #81 (2026-11-27 00:47–01:08 CST).
 *
 * 1. /requests (FAIL 1): primera carga congelada >18 s en «Cargando…».
 *    La ruta ya no es un `lazy` pelado: ImperativeLazyRoute con importer
 *    estable a nivel de módulo (importRequestsChunk), tope 15 s y panel
 *    con Reintentar — mismo patrón que /admin/dashboard y /ley-olimpia
 *    en la ronda 21.
 * 2. /matches y /clubs (FAIL 2): tarjetas oscuras forzadas en tema claro.
 *    Fondo claro en claro + variantes `dark:` (patrón ronda 21).
 * 3. Arte NFT (FAIL 3): el wordmark «Cómplices Conecta» del «Cómplice
 *    Épico» se cortaba en el borde inferior del modal de detalle
 *    (`aspect-video` + `object-cover` sobre arte vertical 2:3). El modal
 *    ahora muestra el arte entero (`object-contain`, sin aspecto fijo,
 *    tope max-h-[46vh]). La miniatura de la rejilla (aspect-square +
 *    object-cover) SE DEJA como está por decisión del coordinador: es
 *    una miniatura y el recorte ahí es intencional.
 *
 * Relojes REALES (con fake timers el scheduler de React 19 no corre
 * en happy-dom, ver r9-stream-c). Topes acortados por prop en las
 * pruebas del wrapper; el valor de producción (15 s) es el mismo que
 * el de ProfileDetailRoute. La confirmación visual (contraste real a
 * 886 px, primera carga de /requests sin recarga, wordmark entero)
 * queda para el test dirigido en el preview.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: "r22-user", email: "demo@demo.local" } as unknown,
  profile: {
    id: "r22-user",
    display_name: "Usuario Prueba",
  } as unknown,
  isDemo: () => true,
  isAdmin: () => false,
  isAuthenticated: () => true,
  getProfileType: () => "single",
  isDemoMode: () => true,
  shouldUseRealSupabase: () => false,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  loadProfile: vi.fn(),
  shouldUseProductionAdmin: () => false,
  appMode: "production" as const,
  session: null,
}));
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
  const makeQuery = (): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.or = () => q;
    q.gte = () => q;
    q.in = () => q;
    q.order = () => q;
    q.limit = () => q;
    q.insert = () => Promise.resolve({ data: null, error: null });
    q.update = () => q;
    q.single = () => Promise.resolve({ data: null, error: null });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve({ data: [], error: null, count: 0 }).then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    return q;
  };
  return {
    supabase: {
      from: () => makeQuery(),
      rpc: () => Promise.resolve({ data: false, error: null }),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "r22-user" } },
            error: null,
          }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { createElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ImperativeLazyRoute } from "@/pages/ImperativeLazyRoute";
import Matches from "@/pages/Matches";
import { Clubs } from "@/pages/Clubs";
import { DemoWallet } from "@/components/wallet/DemoWallet";

/** ¿La clase `cls` aparece como token suelto (sin prefijo `dark:`)? */
const hasBareClass = (el: Element | null, cls: string) =>
  !!el &&
  new RegExp(`(^|\\s)${cls.replace("/", "\\/")}(\\s|$)`).test(el.className);

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  window.localStorage.clear();
  authState.user = { id: "r22-user", email: "demo@demo.local" };
  authState.profile = { id: "r22-user", display_name: "Usuario Prueba" };
  authState.isDemo = () => true;
  authState.isAdmin = () => false;
  authState.isAuthenticated = () => true;
  mockToast.mockClear();
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/* ------------------------------------------------------------------ */
/* 1 — /requests por ImperativeLazyRoute                                */
/* ------------------------------------------------------------------ */
describe("r22-C ítem 1 — /requests carga con tope y Reintentar", () => {
  it("el importer real resuelve y aparece el heading «Invitaciones» sin Suspense", async () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => import("@/pages/Requests"),
          chunkName: "pages-requests",
          errorTitle: "No se pudo cargar la página de solicitudes",
          fallbackPath: "/",
          fallbackLabel: "Volver al inicio",
        }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Invitaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No se pudo cargar la página de solicitudes"),
    ).not.toBeInTheDocument();
  });

  it("chunk colgado: el tope muestra el panel con Reintentar", async () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(ImperativeLazyRoute, {
          importer: () => new Promise(() => {}),
          chunkName: "pages-requests",
          chunkTimeoutMs: 50,
          errorTitle: "No se pudo cargar la página de solicitudes",
          fallbackPath: "/",
          fallbackLabel: "Volver al inicio",
        }),
      ),
    );
    expect(
      await screen.findByText("No se pudo cargar la página de solicitudes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "La descarga tardó demasiado. Revisa tu conexión e inténtalo de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  it("el tope de producción sigue siendo 15 000 ms", async () => {
    const mod = await import("@/pages/ImperativeLazyRoute");
    expect(mod.IMPERATIVE_LAZY_CHUNK_TIMEOUT_MS).toBe(15_000);
  });
});

/* ------------------------------------------------------------------ */
/* 2a — /matches por tema                                              */
/* ------------------------------------------------------------------ */
describe("r22-C ítem 2a — /matches: fondo claro en claro, oscuro en oscuro", () => {
  function renderMatches() {
    return render(
      createElement(MemoryRouter, null, createElement(Matches)),
    );
  }

  it("raíz: fondo claro sin dark:, gradiente solo en oscuro", async () => {
    const { container } = renderMatches();
    await screen.findByText("Anabella & Julio");
    const root = screen
      .getByText("Nuevos Matches")
      .closest(".min-h-screen") as Element;
    expect(root.className).toContain("bg-slate-100");
    expect(root.className).toContain("dark:bg-linear-to-b");
    expect(hasBareClass(root, "bg-linear-to-b")).toBe(false);
    expect(container.querySelector(".bg-linear-to-b")).toBeNull();
  });

  it("tarjetas de estadísticas: blancas en claro, oscuras solo en oscuro", async () => {
    renderMatches();
    await screen.findByText("Anabella & Julio");
    const card = screen
      .getByText("Nuevos Matches")
      .closest(".rounded-xl") as Element;
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("dark:bg-gray-800/50");
    expect(card.className).toContain("border-slate-200");
    expect(card.className).toContain("dark:border-purple-500/20");
    expect(hasBareClass(card, "bg-gray-800/50")).toBe(false);
    const label = screen.getByText("Nuevos Matches");
    expect(label.className).toContain("text-slate-600");
    expect(label.className).toContain("dark:text-gray-300");
  });

  it("filtro inactivo: claro en claro, oscuro solo en oscuro", async () => {
    renderMatches();
    await screen.findByText("Anabella & Julio");
    const button = screen.getByRole("button", { name: /Nuevos/ });
    expect(button.className).toContain("bg-white");
    expect(button.className).toContain("text-slate-700");
    expect(button.className).toContain("dark:bg-gray-800/50");
    expect(button.className).toContain("dark:text-gray-200");
    expect(hasBareClass(button, "bg-gray-800/50")).toBe(false);
  });

  it("MatchCard: blanca en claro, oscura solo en oscuro; chips y botones por tema", async () => {
    renderMatches();
    await screen.findByText("Anabella & Julio");
    const card = screen
      .getByText("Anabella & Julio")
      .closest(".group") as Element;
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("dark:bg-gray-800/50");
    expect(card.className).toContain("border-slate-200");
    expect(card.className).toContain("dark:border-gray-700/50");
    expect(hasBareClass(card, "bg-gray-800/50")).toBe(false);
    const chip = screen.getByText("Fiestas Privadas");
    expect(chip.className).toContain("bg-purple-100");
    expect(chip.className).toContain("text-purple-800");
    expect(chip.className).toContain("dark:bg-purple-900/40");
    expect(chip.className).toContain("dark:text-purple-100");
    expect(hasBareClass(chip, "bg-purple-900/40")).toBe(false);
    const messageBtn = screen.getAllByRole("button", {
      name: "Mensaje",
    })[0];
    expect(messageBtn.className).toContain("bg-slate-100");
    expect(messageBtn.className).toContain("text-slate-700");
    expect(messageBtn.className).toContain("dark:bg-gray-700/50");
    const viewBtn = screen.getAllByRole("button", {
      name: "Ver perfil",
    })[0];
    expect(viewBtn.className).toContain("bg-slate-100");
    expect(viewBtn.className).toContain("text-slate-700");
    expect(viewBtn.className).toContain("dark:bg-gray-700/50");
    const date = screen.getByText("Conectado hace 2 horas");
    expect(date.className).toContain("text-slate-500");
    expect(date.className).toContain("dark:text-gray-400");
  });
});

/* ------------------------------------------------------------------ */
/* 2b — /clubs: solo las 2 tarjetas de sección                        */
/* ------------------------------------------------------------------ */
describe("r22-C ítem 2b — /clubs: las 2 tarjetas de sección por tema", () => {
  function renderClubs() {
    return render(createElement(MemoryRouter, null, createElement(Clubs)));
  }

  it("«Ventajas de Estar Vinculado»: blanca en claro, gradiente solo en oscuro", async () => {
    renderClubs();
    const title = await screen.findByText(
      "Ventajas de Estar Vinculado con ComplicesConecta",
      {},
      { timeout: 5000 },
    );
    const card = title.closest("div.bg-white") as Element;
    expect(card.className).toContain("dark:bg-linear-to-br");
    expect(card.className).toContain("dark:from-purple-900");
    expect(card.className).toContain("border-slate-200");
    expect(card.className).toContain("dark:border-white/20");
    expect(hasBareClass(card, "from-purple-900")).toBe(false);
    expect(title.className).toContain("text-slate-900");
    expect(title.className).toContain("dark:text-white");
    const item = screen.getByText("Página Pública Profesional");
    expect(item.className).toContain("text-slate-900");
    expect(item.className).toContain("dark:text-white");
    const body = screen.getByText(
      /con información completa, galería de fotos y calendario de eventos/,
    );
    expect(body.className).toContain("text-slate-600");
    expect(body.className).toContain("dark:text-white/70");
    expect(hasBareClass(body, "text-white/70")).toBe(false);
  });

  it("«Próximamente»: ámbar claro en claro, gradiente solo en oscuro", async () => {
    renderClubs();
    const title = await screen.findByText(
      /Próximamente en ComplicesConecta/,
      {},
      { timeout: 5000 },
    );
    const card = title.closest("div.bg-amber-50") as Element;
    expect(card.className).toContain("dark:bg-linear-to-r");
    expect(card.className).toContain("dark:from-amber-900/40");
    expect(card.className).toContain("border-amber-300");
    expect(card.className).toContain("dark:border-amber-400/30");
    expect(hasBareClass(card, "from-amber-900/40")).toBe(false);
    expect(title.className).toContain("text-amber-900");
    expect(title.className).toContain("dark:text-white");
    const item = screen.getByText("Clubs en Perfiles");
    expect(item.className).toContain("text-slate-900");
    expect(item.className).toContain("dark:text-white");
    const body = screen.getByText(/Los clubs verificados tendrán/);
    expect(body.className).toContain("text-slate-600");
    expect(body.className).toContain("dark:text-white/70");
    const launch = screen
      .getByText(/Lanzamiento estimado:/)
      .closest("p") as Element;
    expect(launch.className).toContain("text-amber-800");
    expect(launch.className).toContain("dark:text-amber-200");
    expect(hasBareClass(launch, "text-amber-200")).toBe(false);
  });

  it("fuera del hallazgo: los option del select de ciudad se dejan como están", async () => {
    renderClubs();
    await screen.findByText(
      /Próximamente en ComplicesConecta/,
      {},
      { timeout: 5000 },
    );
    const option = screen.getByText("Todas las ciudades");
    expect(option.className).toContain("bg-purple-900");
  });
});

/* ------------------------------------------------------------------ */
/* 3 — detalle NFT: arte entero                                        */
/* ------------------------------------------------------------------ */
describe("r22-C ítem 3 — detalle NFT: arte completo, sin recorte", () => {
  it("el modal del «Cómplice Épico» usa object-contain sin aspect-video; la miniatura se deja", async () => {
    const { container } = render(
      createElement(DemoWallet, {
        userId: "wallet-r22c",
        accountType: "single",
      }),
    );
    await screen.findByText("Cómplice Épico");
    // Miniatura de la rejilla: recorte intencional, sin tocar.
    const thumb = screen
      .getAllByAltText("Cómplice Épico")
      .find((img) => img.className.includes("object-cover")) as Element;
    expect(thumb).toBeDefined();
    expect(thumb.className).toContain("object-cover");
    expect(thumb.parentElement?.className).toContain("aspect-square");
    // Abrir el detalle.
    const card = screen
      .getByText("Cómplice Épico")
      .closest('[role="button"]') as Element;
    fireEvent.click(card);
    await screen.findByRole("button", { name: "Cerrar detalle" });
    // Badge EPIC y valor 2000 CMPX siguen visibles en el detalle.
    expect(screen.getAllByText("EPIC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2000 CMPX").length).toBeGreaterThan(0);
    const modalImg = screen
      .getAllByAltText("Cómplice Épico")
      .find((img) => img.className.includes("object-contain")) as Element;
    expect(modalImg).toBeDefined();
    expect(modalImg.className).toContain("object-contain");
    expect(modalImg.className).toContain("max-h-[46vh]");
    expect(modalImg.className).not.toContain("object-cover");
    expect(modalImg.parentElement?.className).not.toContain("aspect-video");
    // Ya no queda ningún aspect-video en el componente.
    expect(container.querySelector(".aspect-video")).toBeNull();
  });
});
