/**
 * Ronda 10, stream C (C1, nivel UI): la bandeja de /requests con la
 * solicitud enviada con los ids que usa la UI real (ficha
 * "demo-couple-456" de /profile-couple y tarjeta de Discover), no con
 * el id de sesión que usaba el test de la ronda 9. Si el merge no
 * canoniza, la tarjeta del anónimo no aparece en Recibidas de la
 * pareja aunque el almacén tenga la solicitud.
 *
 * Los mocks de useAuth/useTokens/useToast son por archivo; los valores
 * de la sesión se controlan con el estado hoisted `authState` (misma
 * convención que r9-stream-d-ui.test.tsx).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));
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
    rpc: () => Promise.resolve({ data: null, error: null }),
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
import { MemoryRouter } from "react-router-dom";
import Requests from "@/pages/Requests";
import {
  createLocalDemoAccount,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import {
  areFriendsSync,
  sendFriendRequest,
} from "@/lib/friends";
import { canViewFullProfile } from "@/lib/profileVisibility";
import { generateDemoUUID } from "@/lib/demo-uuid";

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  authState.user = null;
  authState.profile = null;
});

function seedCoupleAndAnon() {
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
  authState.user = { id: couple.userId, email: "pareja@outlook.es" };
  authState.profile = { ...couple.profile };
  return { couple, anon };
}

describe("C1: /requests con la solicitud enviada desde la ficha/tarjeta", () => {
  it("la solicitud enviada con el id de FICHA aparece en Recibidas y aceptar levanta el gate", async () => {
    const { couple, anon } = seedCoupleAndAnon();
    // Así la envía la UI real desde /profile-couple: profileId es el
    // id de la ficha, no el id de sesión de la pareja.
    const sent = await sendFriendRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

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
      () => expect(within(card).getByText("Aceptada")).toBeTruthy(),
      { timeout: 3000 },
    );
    // El gate de perfil privado se levanta para el remitente.
    expect(
      canViewFullProfile({
        visibility: "private",
        isOwner: false,
        isFriend: areFriendsSync(anon.userId, couple.userId),
      }),
    ).toBe(true);
  });

  it("la solicitud enviada con el id de TARJETA de Discover aparece en Recibidas", async () => {
    const { anon } = seedCoupleAndAnon();
    // Así la envía la UI real desde ProfileDetail vía Discover: la
    // tarjeta 6 del roster es Carmen & Roberto.
    const sent = await sendFriendRequest(
      anon.userId,
      generateDemoUUID("demo-profile-6"),
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("anonr8test", {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});
