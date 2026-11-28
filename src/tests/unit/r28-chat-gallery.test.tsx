/**
 * RONDA 28 (bloque M) — botón "Galería" del modal Chat Íntimo.
 *
 * Lo que reportó Wacko (capturas 433015_14 / 433016_13, 04:06 CST):
 * en la sala pública "Singles Lifestyle", pulsar "Galería" "no realiza
 * acción y da un error".
 *
 * Diagnóstico con evidencia (ver reporte):
 * - El botón SÍ tiene handler (togglePrivateGallery, Chat.tsx): en sala
 *   pública dispara el toast honesto "Sin galería privada".
 * - PERO el toast era INVISIBLE: el viewport de toasts es en flujo al
 *   inicio de <main>, sin z-index propio, y el modal del dock es
 *   `fixed inset-0 z-50` (MainLayout.tsx) — el toast se renderizaba
 *   DEBAJO del panel del modal. Desde el teléfono: pulsar Galería no
 *   hacía nada visible.
 * - Además el tercer botón ("Pública"/"Privada") llamaba al MISMO
 *   handler: una etiqueta de tipo de sala que responde con el error
 *   de galería. Ahora es un indicador sin onClick.
 *
 * Cubre: (1) Galería en sala pública muestra el aviso honesto (y el
 * viewport pinta por encima del modal z-50); (2) Galería en sala
 * privada abre el panel de verdad; (3) el indicador de tipo de sala
 * no es un botón (no dispara la galería).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// El cliente real de Supabase no se puede importar en vitest (misma
// convención que r9-stream-c): mock sin backend.
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

// OJO (lección ronda 27): los mocks deben devolver la MISMA identidad
// en cada llamada a useAuth()/etc. Chat tiene efectos con `user` en
// deps: si el mock devolviera un objeto nuevo por render, el efecto
// se re-correría en cada render (setState → render → efecto...) y el
// worker se quedaría colgado en un bucle síncrono sin salida (eso
// pasó en el primer intento de este archivo: 10 min sin una línea).
const authStub = vi.hoisted(() => ({
  profile: { name: "Sofía", display_name: "Sofía" },
  user: { id: "demo-user", email: "single@demo.local" },
  isAuthenticated: () => true,
  isDemo: () => true,
  getProfileType: () => "single",
  signOut: async () => {},
}));

const realtimeStub = vi.hoisted(() => ({
  messages: [] as unknown[],
  sendMessage: async () => {},
}));

const consentStub = vi.hoisted(() => ({
  verification: null,
  isPaused: false,
  startMonitoring: () => {},
  stopMonitoring: async () => {},
}));

const featuresStub = vi.hoisted(() => ({
  features: { messagingPrivacy: false, requests: true },
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => authStub,
}));

vi.mock("@/features/chat/useRealtimeChat", () => ({
  useRealtimeChat: () => realtimeStub,
}));

vi.mock("@/hooks/useConsentVerification", () => ({
  useConsentVerification: () => consentStub,
}));

vi.mock("@/hooks/useFeatures", () => ({
  useFeatures: () => featuresStub,
}));

vi.mock("@/services/social", () => ({
  matchService: { checkExistingMatch: async () => true },
  // PrivateGallery (se renderiza al abrir el panel en sala privada)
  // lo importa: sin estos dos el import del módulo revienta.
  galleryPrivacyService: {
    getCMPCost: () => 100,
    unlockGallery: async () => ({ success: true }),
  },
}));

vi.mock("@/services/payments/TokenService", () => ({
  tokenService: {
    getBalance: async () => ({ cmpx: 0 }),
    spendTokens: async () => false,
  },
}));

vi.mock("@/lib/invitations", () => ({
  invitationService: {},
}));

vi.mock("@/services/payments/galleryCommission", () => ({
  recordGalleryCommission: async () => {},
}));

import Chat from "@/pages/Chat";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/useToast";

beforeEach(() => {
  window.localStorage.clear();
  // Ruta demo: el efecto de modo de Chat lee esta bandera.
  window.localStorage.setItem("demo_authenticated", "true");
  vi.useRealTimers();
});

const renderChat = () =>
  render(
    <MemoryRouter>
      <Toaster />
      <Chat embedded />
    </MemoryRouter>,
  );

async function openRoom(roomName: RegExp, tab?: "public") {
  // La lista muestra el tab activo (por defecto "Privado"); las salas
  // públicas viven en el tab "Público".
  if (tab === "public") {
    fireEvent.click(
      await screen.findByRole("button", { name: /Público/ }),
    );
  }
  const room = await screen.findByText(roomName);
  fireEvent.click(room);
}

describe("R28-M: Galería del modal Chat Íntimo", () => {
  it("en sala pública muestra el aviso honesto (visible por encima del modal)", async () => {
    renderChat();
    await openRoom(/Singles Lifestyle/, "public");
    fireEvent.click(await screen.findByText("Galería"));

    const toastTitle = await screen.findByText("Sin galería privada");
    expect(toastTitle).toBeInTheDocument();
    await screen.findByText(
      /Las salas públicas no tienen galería privada/,
    );

    // M1: el toast vive en un viewport por encima de los overlays
    // fijos z-50 (el modal del dock) y sigue en flujo (no `fixed`).
    const viewport = toastTitle.closest("ol");
    expect(viewport).not.toBeNull();
    expect(viewport!.className).toContain("z-[60]");
    expect(viewport!.className).toContain("relative");
    expect(viewport!.className).not.toContain("fixed");
  });

  it("en sala privada abre el panel de la galería de verdad", async () => {
    renderChat();
    await openRoom(/^Sofia$/);
    fireEvent.click(await screen.findByText("Galería"));

    await screen.findByText("Galería privada de Sofia");
    expect(
      screen.getByRole("button", { name: /Cerrar galería/ }),
    ).toBeInTheDocument();
  });

  it("el indicador de tipo de sala no es un botón ni dispara la galería", async () => {
    renderChat();
    await openRoom(/Singles Lifestyle/, "public");

    expect(screen.getByLabelText("Sala pública")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Pública/ }),
    ).not.toBeInTheDocument();

    // El toast del test anterior (misma store global de useToast)
    // puede seguir vivo: esperar a que se auto-cierre (3.5 s) antes
    // de afirmar que ESTE clic no dispara nada.
    await waitFor(
      () => {
        expect(
          screen.queryByText("Sin galería privada"),
        ).not.toBeInTheDocument();
      },
      { timeout: 6000 },
    );
    fireEvent.click(screen.getByLabelText("Sala pública"));
    expect(
      screen.queryByText("Sin galería privada"),
    ).not.toBeInTheDocument();
  });
});

describe("R28-M: el viewport de toasts pinta por encima de overlays z-50", () => {
  it("un toast disparado se renderiza en un viewport relative z-[60]", async () => {
    render(
      <MemoryRouter>
        <Toaster />
      </MemoryRouter>,
    );
    toast({ title: "Aviso de prueba" });
    const title = await screen.findByText("Aviso de prueba");
    const viewport = title.closest("ol");
    expect(viewport).not.toBeNull();
    expect(viewport!.className).toContain("z-[60]");
    expect(viewport!.className).toContain("relative");
  });
});
