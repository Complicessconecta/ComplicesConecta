/**
 * Ronda 11, stream B: tema claro (light) + títulos NFT.
 *
 * Aserciones de render/clases para las 8 correcciones de la ronda 10
 * que no se pueden verificar por geometría en happy-dom (sin layout):
 * se comprueba que los elementos llevan las clases opacas claras y que
 * NADA de lo que se veía truncado sigue llevando `truncate` con ancho
 * máximo. La confirmación visual (contraste real a 886 px) queda para
 * el test de verificación en el preview.
 *
 * Los mocks de useAuth/useTokens/useToast son por archivo; los valores
 * de la sesión se controlan con el estado hoisted `authState` (misma
 * convención que r9-stream-d-ui.test.tsx).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const mockClipboardWrite = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));
const mockIsAuthenticated = vi.hoisted(() => () => true);
const mockIsDemo = vi.hoisted(() => () => true);
// Código de referido UUID como el que veía la ronda 10
// ("REF609dcb3b-23f7-423f-a…"): 40 caracteres mono.
const LONG_REFERRAL_CODE = "REF609dcb3b-23f7-423f-a700-00023f74b708";

vi.mock("@/integrations/supabase/client", () => {
  const makeQuery = (): unknown => {
    const q = {
      select: () => q,
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => q,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
      update: () => q,
      delete: () => q,
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return q;
  };
  return {
    supabase: {
      from: () => makeQuery(),
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
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
    signIn: mockSignIn,
    isAuthenticated: mockIsAuthenticated,
    isDemo: mockIsDemo,
    isDemoMode: mockIsDemo,
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useTokens", () => ({
  useTokens: () => ({
    balance: {
      cmpxBalance: 1250,
      gtkBalance: 850,
      cmpxStaked: 400,
      gtkStaked: 0,
      cmpxAvailable: 850,
      gtkAvailable: 850,
      monthlyEarned: 0,
      monthlyLimit: 1000,
      monthlyRemaining: 1000,
      referralCode: LONG_REFERRAL_CODE,
      totalReferrals: 5,
    },
    transactions: [],
    stakingRecords: [],
    pendingRewards: [],
    loading: false,
    error: null,
    claimWorldIdReward: vi.fn(),
    startStaking: vi.fn(),
    completeStaking: vi.fn(),
    refreshTokens: vi.fn(),
    hasActiveStaking: false,
    hasPendingRewards: false,
    isWorldIdEligible: false,
  }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    GlobalSearchService: { search: vi.fn().mockResolvedValue([]) },
  };
});

vi.mock("@/services/clubs/clubContentService", () => ({
  loadClubEvents: () => Promise.resolve({ items: [] }),
  loadClubMembers: () => Promise.resolve({ items: [] }),
  createClubEvent: () => Promise.resolve({ id: "ev-1" }),
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { TokenDashboard } from "@/components/tokens/TokenDashboard";
import DemoSelector from "@/components/auth/DemoSelector";
import ClubAdminPanel from "@/components/admin/panels/ClubAdminPanel";
import { ProfileSocialSettings } from "@/components/profiles/shared/ProfileSocialSettings";
import { DistanceBadge } from "@/components/profiles/shared/DistanceBadge";
import { VanishSearchInput } from "@/components/ui/vanish-search-input";
import { createLocalDemoAccount } from "@/lib/demo-registration";

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  mockClipboardWrite.mockClear();
  authState.user = null;
  authState.profile = null;
});

function renderSingleDemoTokens() {
  authState.user = {
    id: "609dcb3b-23f7-423f-a700-00023f74b708",
    email: "single@outlook.es",
  };
  authState.profile = {
    id: "609dcb3b-23f7-423f-a700-00023f74b708",
    email: "single@outlook.es",
    profile_type: "single",
  };
  render(
    <BrowserRouter>
      <TokenDashboard isDemoMode nfts={[]} />
    </BrowserRouter>,
  );
}

describe("B1: /tokens — pastilla de referido y SIMULACIÓN", () => {
  it("muestra el código de referido COMPLETO, sin truncar, y la etiqueta entera", async () => {
    renderSingleDemoTokens();
    await waitFor(() =>
      expect(screen.getByText(/Tu Balance de Tokens/)).toBeTruthy(),
    );

    // La etiqueta nunca se trunca ("Tu c…" en la ronda 10).
    const label = screen.getByText("Tu código de referido:");
    expect(label.className).not.toContain("truncate");

    // La pastilla muestra el código UUID completo: sin `truncate` y
    // sin el `max-w-[180px]` que lo cortaba en "REF609dcb3b-…".
    const badge = screen.getByText(LONG_REFERRAL_CODE);
    expect(badge.className).not.toContain("truncate");
    expect(badge.className).not.toContain("max-w-[180px]");
    expect(badge.className).toContain("wrap-break-word");
  });

  it("el botón copiar sigue funcionando y copia el código completo", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockClipboardWrite.mockResolvedValue(undefined) },
      configurable: true,
    });
    renderSingleDemoTokens();
    await waitFor(() =>
      expect(screen.getByText(/Tu Balance de Tokens/)).toBeTruthy(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Copiar código de referido" }),
    );
    await waitFor(() =>
      expect(mockClipboardWrite).toHaveBeenCalledWith(LONG_REFERRAL_CODE),
    );
  });

  it("la pastilla SIMULACIÓN ya no es absoluta: no puede tapar el título", async () => {
    renderSingleDemoTokens();
    await waitFor(() =>
      expect(screen.getByText(/Tu Balance de Tokens/)).toBeTruthy(),
    );

    const pill = screen.getByText("SIMULACIÓN");
    expect(pill.className).not.toContain("absolute");
    expect(pill.parentElement?.className).not.toContain("absolute");
    // El título sigue presente y completo.
    expect(screen.getByText("🪙 Tu Balance de Tokens")).toBeTruthy();
  });
});

describe("B2: /clubs/demo — tabla de clubs y Eventos", () => {
  it("los nombres de club y 'Eventos (0)' llevan texto oscuro en claro", async () => {
    render(<ClubAdminPanel />);
    const name = await screen.findByText("Club Demo CómplicesConecta", {}, { timeout: 5000 });
    const nameCell = name.closest("td");
    expect(nameCell?.className).toContain("text-slate-900");
    expect(nameCell?.className).toContain("dark:text-white");
    expect(nameCell?.className).not.toContain("text-white\"");
    // La tabla ya no es blanca sobre fondo claro.
    const table = name.closest("table");
    expect(table?.className).toContain("text-slate-900");
    expect(table?.className).toContain("dark:text-white");

    const eventsHeading = await screen.findByText("Eventos (0)", {}, { timeout: 5000 });
    expect(eventsHeading.className).toContain("text-slate-900");
    expect(eventsHeading.className).toContain("dark:text-white");
  });
});

describe("B4: /profile-single — 'Amistad y privacidad del perfil'", () => {
  it("la tarjeta y sus descripciones llevan texto oscuro en claro", () => {
    render(
      <ProfileSocialSettings
        userId="609dcb3b-23f7-423f-a700-00023f74b708"
        profileType="single"
        isDemo
      />,
    );
    expect(
      screen.getByText("Amistad y privacidad del perfil"),
    ).toBeTruthy();
    const section = screen
      .getByText("Amistad y privacidad del perfil")
      .closest("section");
    expect(section?.className).toContain("bg-white");
    expect(section?.className).toContain("dark:bg-white/5");
    expect(section?.className).toContain("border-slate-200");
    // Las descripciones ya no son blancas sobre claro.
    expect(screen.getByText("Visibilidad del perfil").className).toContain(
      "text-slate-900",
    );
  });
});

describe("B5: /profile-couple — barra de búsqueda", () => {
  it("la pastilla es blanca opaca en claro y el texto tecleado oscuro", () => {
    render(
      <VanishSearchInput
        placeholders={["Buscar parejas en Ciudad de México..."]}
        onSubmit={() => undefined}
      />,
    );
    const input = screen.getByLabelText("Buscar experiencias y usuarios");
    expect(input.className).toContain("text-slate-900");
    expect(input.className).toContain("dark:text-white");
    const pill = input.closest("div[class*='rounded-full']");
    expect(pill?.className).toContain("bg-white");
    expect(pill?.className).toContain("dark:bg-neutral-900/50");
    expect(pill?.className).toContain("border-slate-300");
  });
});

describe("B6: /demo — lista de cuentas demo", () => {
  it("los nombres se ven completos (sin truncate) y la sección es legible en claro", () => {
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("userType");
    window.localStorage.removeItem("demo_user");

    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );

    for (const name of ["anonr8test", "TestR7"]) {
      const el = screen.getByText(name);
      expect(el.className).not.toContain("truncate");
      expect(el.className).toContain("wrap-break-word");
      expect(el.className).toContain("text-slate-900");
    }
    const section = screen
      .getByText("Tus cuentas demo en este navegador")
      .closest("div[class*='rounded-lg']");
    expect(section?.className).toContain("bg-slate-50");
    expect(section?.className).toContain("dark:bg-white/5");
  });
});

describe("B7: /discover — pastilla de distancia", () => {
  it("'A ~15 km' lleva fondo claro opaco y texto oscuro en claro", () => {
    render(<DistanceBadge distanceKm={15} />);
    const badge = screen.getByText("A ~15 km");
    const pill = badge.closest("span[class*='rounded-full']");
    expect(pill?.className).toContain("bg-slate-100");
    expect(pill?.className).toContain("text-slate-800");
    expect(pill?.className).toContain("dark:bg-white/10");
    expect(pill?.className).toContain("dark:text-white/90");
  });
});
