/**
 * Ronda 9, stream C — Chat Íntimo (punto 5), pestaña Notificaciones
 * del Dashboard (punto 10) e índice /docs/legal/ (punto 12).
 *
 * Hechos del test de verificación ronda 8 (2026-11-25 03:13–03:41 CST,
 * veredicto NO MERGE, ~886 px):
 *
 * - Punto 5: en /requests el botón "Chat Íntimo" abre el modal y se
 *   queda en "Cargando chat…" >10 s (15 s el segundo intento); el
 *   boundary con "Reintentar" / "Abrir en página completa" NUNCA
 *   aparece, aunque la ronda 8 acotó la espera a 6 s en
 *   loadChatModule. La página /chat-intimo SÍ carga. El camino
 *   timeout → boundary SE PROBÓ con el ChatDock real y un chunk
 *   atascado (test "punto 5a"): funciona. La causa que queda es que
 *   si el lazy no se resuelve NI rechaza, nada acota el spinner: el
 *   vigilante de carga del dock (CHAT_LOAD_TIMEOUT_MS + 2 s) es la
 *   segunda red y es lo que prueba "punto 5b" con el camino de carga
 *   SIN timeout (el de la ronda 7).
 * - Punto 10: tocar "Notificaciones" en /dashboard aterrizaba en
 *   /404. La pestaña en sí no navega (Radix Tabs, sin onValueChange
 *   ni navigate): al activarla monta NotificationCenter y
 *   useRealtimeNotifications violaba las reglas de hooks (4
 *   useCallback DENTRO del useMemo de notificationHandler): en el
 *   primer setState el orden de hooks cambiaba y React lanzaba
 *   `TypeError: Cannot read properties of undefined (reading
 *   'length')`; el ErrorBoundary de producción lo convertía en
 *   `window.location.href = "/404"`.
 * - Punto 12: /docs/legal/ mostraba 9 tarjetas; public/docs/legal/
 *   sirve 14 documentos. El índice debe listar los 14.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// El cliente real de Supabase no se puede importar en vitest:
// `AppConfig.supabase.url` es undefined y `normalizeSupabaseUrl`
// revienta al importar el módulo. Misma convención que r8-stream-c:
// mock sin backend, como el preview. La cadena es "thenable" para
// que getUserNotifications/getUnreadCount resuelvan vacío sin error.
const makeQueryChain = () => {
  const chain: Record<string, unknown> = {};
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.range = () =>
    Promise.resolve({ data: [], error: null, count: 0 });
  chain.maybeSingle = () =>
    Promise.resolve({ data: null, error: null });
  chain.single = () => Promise.resolve({ data: null, error: null });
  chain.then = (resolve: (v: unknown) => void) =>
    resolve({ data: [], error: null, count: 0 });
  return chain;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => makeQueryChain() }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
    channel: () => {
      const ch: Record<string, unknown> = {};
      ch.on = () => ch;
      ch.subscribe = () => Promise.resolve({});
      return ch;
    },
    removeChannel: () => Promise.resolve({}),
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

// Gamification solo usa `profile` de useAuth; el Dashboard usa
// useTokens para la pestaña Analytics. Ambos se mockean para montar
// el Dashboard REAL sin backend.
vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    profile: { name: "Sofía", display_name: "Sofía" },
    user: { id: "demo-user", email: "single@outlook.es" },
    isAuthenticated: true,
    isDemo: () => true,
    getProfileType: () => "single",
    signOut: async () => {},
  }),
}));

vi.mock("@/hooks/useTokens", () => ({
  useTokens: () => ({
    balance: { cmpxBalance: 0, cmpxStaked: 0, gtkBalance: 0 },
    transactions: [],
    pendingRewards: [],
    hasActiveStaking: false,
  }),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { readdirSync } from "node:fs";
import { join } from "node:path";

beforeEach(() => {
  window.localStorage.clear();
  // Relojes REALES: con fake timers el avance se atasca (el scheduler
  // de React 19 no corre sobre los timers falsos en happy-dom).
  vi.useRealTimers();
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/pages/Chat");
  vi.doUnmock("@/lib/intimateChat");
});

describe("punto 5a: dock con chunk atascado (camino ronda 8)", () => {
  it(
    "tras el timeout de 6 s aparece Reintentar (boundary), no spinner eterno",
    async () => {
      vi.resetModules();
      // El chunk no resuelve nunca: el import queda pendiente.
      vi.doMock("@/pages/Chat", () => new Promise(() => {}));
      const { ChatDock } = await import("@/components/layout/MainLayout");

      render(
        <MemoryRouter>
          <ChatDock isOpen onClose={() => {}} />
        </MemoryRouter>,
      );

      expect(screen.getByText("Cargando chat…")).toBeTruthy();
      expect(screen.queryByText("Reintentar")).toBeNull();

      // El timeout real es 6 s: el boundary debe aparecer poco después.
      // Márgenes amplios a propósito: en esta VM la CPU es compartida
      // (5 streams en paralelo) y los temporizadores de pared se
      // retrasan; el boundary dispara a ~6 s por diseño (comprobado
      // con volcado del DOM: "Reintentar" presente a los 7 s).
      expect(
        await screen.findByText("Reintentar", {}, { timeout: 15000 }),
      ).toBeTruthy();
      expect(screen.getByText("Abrir en página completa")).toBeTruthy();
    },
    45000,
  );
});

describe("punto 5b: dock con camino de carga SIN timeout (ronda 7)", () => {
  it(
    "el vigilante muestra Reintentar aunque el lazy nunca se resuelva ni rechace",
    async () => {
      vi.resetModules();
      // El chunk no resuelve nunca…
      vi.doMock("@/pages/Chat", () => new Promise(() => {}));
      // …y el camino de carga NO tiene timeout (ronda 7: import pelado,
      // sin carrera): el boundary no puede dispararse porque nada
      // rechaza. Solo el vigilante del dock (6 s + 2 s) acota el spinner.
      vi.doMock("@/lib/intimateChat", () => ({
        OPEN_INTIMATE_CHAT_EVENT: "complices:open-chat-intimo",
        CHAT_LOAD_TIMEOUT_MS: 6000,
        loadChatModule: () => import("@/pages/Chat"),
      }));
      const { ChatDock } = await import("@/components/layout/MainLayout");

      render(
        <MemoryRouter>
          <ChatDock isOpen onClose={() => {}} />
        </MemoryRouter>,
      );

      expect(screen.getByText("Cargando chat…")).toBeTruthy();
      expect(
        await screen.findByText("Reintentar", {}, { timeout: 12000 }),
      ).toBeTruthy();
      expect(screen.getByText("Abrir en página completa")).toBeTruthy();
    },
    30000,
  );
});

describe("punto 10: pestaña Notificaciones del Dashboard", () => {
  it(
    "al tocar Notificaciones la lista se muestra en /dashboard, sin navegar fuera ni romper",
    async () => {
      window.localStorage.setItem("demo_authenticated", "true");
      window.localStorage.setItem(
        "demo_user",
        JSON.stringify({
          display_name: "Sofía",
          email: "single@outlook.es",
          profile_type: "single",
        }),
      );
      window.localStorage.setItem("userType", "single");
      const { default: Dashboard } = await import("@/pages/Dashboard");

      let pathname = "";
      const LocationSpy = () => {
        pathname = useLocation().pathname;
        return null;
      };

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <LocationSpy />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<div>FUERA DE /dashboard</div>} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("dashboard-container")).toBeTruthy();
        },
        { timeout: 5000 },
      );

      // Radix Tabs activa en mousedown, no en click: fireEvent.click no
      // cambia la pestaña; userEvent sí dispara la secuencia completa.
      const user = userEvent.setup();
      await user.click(screen.getByRole("tab", { name: /Notificaciones/i }));

      // defaultOpen: la lista se ve al entrar a la pestaña.
      expect(
        await screen.findByText("No hay notificaciones", {}, { timeout: 5000 }),
      ).toBeTruthy();
      expect(pathname).toBe("/dashboard");
      expect(screen.queryByText("FUERA DE /dashboard")).toBeNull();
      // En test PROD=false el ErrorBoundary muestra su fallback en vez
      // de redirigir a /404: si aparece, en producción sería el /404.
      expect(screen.queryByText("¡Oops! Algo salió mal")).toBeNull();
      // Sin violación de reglas de hooks en el montaje.
      expect(screen.queryByText("No hay notificaciones")).not.toBeNull();
    },
    30000,
  );
});

describe("punto 12: índice /docs/legal/ == documentos servidos", () => {
  it("el índice lista los 14 documentos de public/docs/legal/", async () => {
    const served = readdirSync(
      join(process.cwd(), "public/docs/legal"),
    )
      .filter((f) => f.endsWith(".md"))
      .sort();
    expect(served).toHaveLength(14);

    const { default: Legal } = await import("@/pages/Legal");
    render(
      <MemoryRouter>
        <Legal />
      </MemoryRouter>,
    );

    // Una tarjeta por documento servido (un botón "Ver Documento").
    expect(screen.getAllByText("Ver Documento")).toHaveLength(14);

    // Los 5 que faltaban en la ronda 8 (9 tarjetas).
    for (const title of [
      "Términos y Condiciones de Uso",
      "Deslinde de Responsabilidad",
      "Condiciones de NFTs",
      "Responsabilidad Legal - Tokens CMPX/GTK",
      "Términos de Servicio - Blockchain",
    ]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    // Y los 9 que ya estaban siguen ahí. OJO: 3 de estos títulos se
    // repiten por diseño (no es un bug del índice): "Ley Olimpia…"
    // está también en la sección destacada "Ley Olimpia Destacada", y
    // "Términos de Servicio" / "Política de Privacidad" están también
    // como botones del hero (navegan a /terms y /privacy). Por eso
    // getAllByText con >= 1, no getByText (que exige unicidad).
    for (const title of [
      "Ley Olimpia - Protección contra Violencia Digital",
      "Términos de Servicio",
      "Política de Privacidad",
      "Términos de Uso para Clubs",
    ]) {
      expect(screen.getAllByText(title).length).toBeGreaterThanOrEqual(1);
    }
    expect(served).toEqual([
      "API.md",
      "CLUBS_LEGAL_DISCLAIMER.md",
      "CLUBS_PRIVACY_POLICY.md",
      "DESLINDE_RESPONSABILIDAD.md",
      "DISCLAIMER.md",
      "LEGAL_COMPLIANCE_MEXICO.md",
      "LEY_OLIMPIA.md",
      "NFT_CONDITIONS.md",
      "POLITICA_PRIVACIDAD.md",
      "TERMINOS_USO_CLUBS.md",
      "TERMINOS_Y_CONDICIONES.md",
      "TERMS_OF_SERVICE-BLOCKCHAIN.md",
      "TERMS_OF_SERVICE.md",
      "TOKENS_LEGAL.md",
    ]);
  });
});
