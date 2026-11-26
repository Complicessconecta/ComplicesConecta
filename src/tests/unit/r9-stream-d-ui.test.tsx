/**
 * Ronda 9, stream D (pruebas de componente): selector de cuentas demo
 * en /demo, bandeja de /requests con solicitudes locales y wallet por
 * usuario en /tokens.
 *
 * Los mocks de useAuth/useTokens/useToast son por archivo; los valores
 * de la sesión se controlan con el estado hoisted `authState`.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const supabaseCalls = vi.hoisted(() => ({ rpc: 0 }));
const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));
// Funciones de auth estables (hoisted): `useAuth` real recrea estas
// funciones en cada render, y un mock con arrow inline haría lo mismo —
// cualquier efecto que dependa de ellas entraría en bucle infinito.
const mockIsAuthenticated = vi.hoisted(() => () => true);
const mockIsDemo = vi.hoisted(() => () => true);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    rpc: () => {
      supabaseCalls.rpc += 1;
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

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
    // Balance 0 a propósito: TokenDashboard cae en el fallback
    // canónico por tipo de cuenta (el camino que fallaba en el
    // test ronda 8: mostraba 1350/850 en sesión de pareja).
    balance: {
      cmpxBalance: 0,
      gtkBalance: 0,
      cmpxStaked: 0,
      gtkStaked: 0,
      cmpxAvailable: 0,
      gtkAvailable: 0,
      monthlyEarned: 0,
      monthlyLimit: 1000,
      monthlyRemaining: 1000,
      referralCode: "DEMO2026",
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

import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, BrowserRouter } from "react-router-dom";
import DemoSelector from "@/components/auth/DemoSelector";
import Requests from "@/pages/Requests";
import { TokenDashboard } from "@/components/tokens/TokenDashboard";
import {
  createLocalDemoAccount,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import { areFriendsSync, sendFriendRequest } from "@/lib/friends";

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  authState.user = null;
  authState.profile = null;
});

describe("punto 2: selector de cuentas demo en /demo", () => {
  it("lista las cuentas locales tras el logout y entra con TestR7", async () => {
    const testr7 = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    createLocalDemoAccount({
      email: "parejatest@demo.local",
      nickname: "ParejaTest",
      accountType: "couple",
    });

    // Simula el logout: la sesión se borra, el registro no.
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("userType");
    window.localStorage.removeItem("demo_user");

    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Tus cuentas demo en este navegador"),
    ).toBeTruthy();
    expect(screen.getByText("TestR7")).toBeTruthy();
    expect(screen.getByText("anonr8test")).toBeTruthy();
    expect(screen.getByText("ParejaTest")).toBeTruthy();
    expect(screen.getByText("testr7@demo.local")).toBeTruthy();
    expect(screen.getByText("Anónimo")).toBeTruthy();

    const row = screen.getByText("TestR7").closest("li");
    expect(row).not.toBeNull();
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", { name: /Entrar/ }),
    );

    expect(window.localStorage.getItem("demo_authenticated")).toBe("true");
    expect(window.localStorage.getItem("userType")).toBe("single");
    const demoUser = JSON.parse(
      window.localStorage.getItem("demo_user") as string,
    ) as { id: string };
    expect(demoUser.id).toBe(testr7.userId);
    await waitFor(
      () => expect(mockNavigate).toHaveBeenCalledWith("/profile-single"),
      { timeout: 3000 },
    );
  });

  it("sin cuentas registradas no muestra la sección", () => {
    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );
    expect(
      screen.queryByText("Tus cuentas demo en este navegador"),
    ).toBeNull();
  });
});

describe("punto 3: bandeja de /requests con solicitudes locales", () => {
  it("la solicitud del anónimo aparece en Recibidas de la pareja y aceptar crea la amistad", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    const anon = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    // Sesión de la pareja (la destinataria).
    restoreLocalDemoSession(couple.profile);
    const sent = await sendFriendRequest(
      anon.userId,
      couple.userId,
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    // Recibidas es la pestaña por defecto: el remitente se ve por
    // nombre, no por id.
    expect(
      await screen.findByText("anonr8test", {}, { timeout: 5000 }),
    ).toBeTruthy();
    // Las 3 invitaciones fijas siguen ahí.
    expect(screen.getByText("Anabella & Julio")).toBeTruthy();

    const card = screen
      .getByText("anonr8test")
      .closest(".card-accessible") as HTMLElement;
    expect(card).not.toBeNull();
    fireEvent.click(
      within(card).getByRole("button", { name: /Aceptar/ }),
    );

    await waitFor(
      () => expect(areFriendsSync(anon.userId, couple.userId)).toBe(true),
      { timeout: 3000 },
    );
    await waitFor(
      () =>
        expect(within(card).getByText("Aceptada")).toBeTruthy(),
      { timeout: 3000 },
    );
  });
});

describe("punto 4: TokenDashboard por usuario", () => {
  it("en sesión de pareja muestra 2000/1500/2, no la wallet de Sofía", async () => {
    authState.user = {
      id: "48bb1f12-ff99-4ff9-a900-0000ff99c6cb",
      email: "pareja@outlook.es",
    };
    authState.profile = {
      id: "48bb1f12-ff99-4ff9-a900-0000ff99c6cb",
      email: "pareja@outlook.es",
      profile_type: "couple",
    };

    render(
      <BrowserRouter>
        <TokenDashboard isDemoMode nfts={[]} />
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByText("2000")).toBeTruthy());
    expect(screen.getByText("1500")).toBeTruthy();
    expect(screen.getByText(/NFTs en esta wallet:/)).toHaveTextContent(
      "NFTs en esta wallet: 2",
    );
  });

  it("una pareja @demo.local sin tipo en `user` también resuelve por perfil", async () => {
    // El `user` mock de useAuth en init no trae accountType ni
    // profile_type y el email no es canónico: antes resolvía single.
    authState.user = {
      id: "aaaaaaaa-1111-4222-8333-444444444444",
      email: "parejatest@demo.local",
    };
    authState.profile = {
      id: "aaaaaaaa-1111-4222-8333-444444444444",
      email: "parejatest@demo.local",
      accountType: "couple",
      profile_type: "couple",
    };

    render(
      <BrowserRouter>
        <TokenDashboard isDemoMode nfts={[]} />
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByText("2000")).toBeTruthy());
    expect(screen.getByText(/NFTs en esta wallet:/)).toHaveTextContent(
      "NFTs en esta wallet: 2",
    );
  });

  it("en sesión single muestra 1250/850/4", async () => {
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

    await waitFor(() => expect(screen.getByText("1250")).toBeTruthy());
    expect(screen.getByText("850")).toBeTruthy();
    expect(screen.getByText(/NFTs en esta wallet:/)).toHaveTextContent(
      "NFTs en esta wallet: 4",
    );
  });
});
