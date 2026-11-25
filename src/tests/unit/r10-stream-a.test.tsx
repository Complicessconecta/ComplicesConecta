/**
 * Ronda 10, stream A: perfil anónimo — los 7 fallos del test ronda 9.
 *
 * A1. El anónimo nace PRIVADO (invisible + visibilidad "private").
 * A2. Nunca muestra "✓ Verificado": la marca `is_verified` ya no se
 *     fuerza en useAuth para el anónimo (verificado por el test de
 *     integración manual: el perfil muestra la insignia "Anónimo").
 * A3. Sin cartera: el hook no asigna el saldo canónico al anónimo y
 *     TokenDashboard muestra el estado bloqueado (test de componente
 *     abajo: sin saldos, sin reclamar, sin staking, sin referidos).
 * A4. Chat con gate ANTES de navegar (decisión canAnonymousChat, ya
 *     cubierta en r9; aquí se cubre que el gate rechaza sin amistad).
 * A5. Formulario de reseña en el club con "Reseña anónima" + "En
 *     revisión" (test de componente abajo).
 * A6. Cuenta atrás de los accesos concedidos a la galería limitada.
 * A7. Eliminar cuentas demo locales (el hueco anónimo se libera).
 * A8. Like bloqueado para el anónimo sin estados contradictorios.
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

// Misma convención que r8-stream-c.test.ts: el cliente real de
// Supabase no se puede importar en vitest.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
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
      totalReferrals: 0,
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
    // Ronda 10 (stream A, punto A3): la sesión es anónima.
    isAnonymousWalletBlocked: true,
  }),
}));

import {
  ANONYMOUS_REVIEW_LABEL,
  canAnonymousChat,
  canAnonymousLike,
  canCreateAnonymousAccountOnDevice,
  ANONYMOUS_LIKE_BLOCKED_MESSAGE,
  formatAnonymousPhotoAccessRemaining,
} from "@/lib/anonymous";
import {
  ANONYMOUS_DEFAULT_PRIVACY_SETTINGS,
  hasStoredPrivacySettings,
} from "@/lib/visibility";
import { readVisibilityLocalOrNull } from "@/lib/profileVisibility";
import {
  createLocalDemoAccount,
  deleteLocalDemoAccount,
  findLocalAnonymousAccount,
  listLocalDemoAccounts,
  seedAnonymousPrivacyDefaults,
} from "@/lib/demo-registration";
import { listAnonymousPhotoAccessGrantedBy } from "@/lib/friends";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TokenDashboard } from "@/components/tokens/TokenDashboard";
import { ClubProfileReviews } from "@/components/clubs/ClubProfileReviews";
import DemoSelector from "@/components/auth/DemoSelector";

const NOW = Date.now();
const HOUR_MS = 60 * 60 * 1000;

function seedRequests(
  requests: Array<Record<string, unknown>>,
): void {
  window.localStorage.setItem(
    "friend_requests_demo",
    JSON.stringify(requests),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  authState.user = null;
  authState.profile = null;
});

describe("A1. El anónimo nace PRIVADO", () => {
  it("crear un anónimo siembra invisible:true y visibilidad private", () => {
    const { userId } = createLocalDemoAccount({
      email: "anonr10@demo.local",
      nickname: "anonr10",
      accountType: "single",
      isAnonymous: true,
    });
    const stored = JSON.parse(
      window.localStorage.getItem(`single_privacy:${userId}`) ?? "{}",
    ) as { invisible?: boolean };
    expect(stored.invisible).toBe(true);
    expect(readVisibilityLocalOrNull(userId)).toBe("private");
    expect(ANONYMOUS_DEFAULT_PRIVACY_SETTINGS.invisible).toBe(true);
    expect(hasStoredPrivacySettings(userId, "single")).toBe(true);
  });

  it("la siembra no pisa una elección explícita del dueño", () => {
    const { userId } = createLocalDemoAccount({
      email: "anonr10@demo.local",
      nickname: "anonr10",
      accountType: "single",
      isAnonymous: true,
    });
    // El dueño decide volverse visible después de crear la cuenta.
    window.localStorage.setItem(
      `single_privacy:${userId}`,
      JSON.stringify({ invisible: false }),
    );
    window.localStorage.setItem(`profile_visibility:${userId}`, "public");
    seedAnonymousPrivacyDefaults(userId, "single");
    const stored = JSON.parse(
      window.localStorage.getItem(`single_privacy:${userId}`) ?? "{}",
    ) as { invisible?: boolean };
    expect(stored.invisible).toBe(false);
    expect(readVisibilityLocalOrNull(userId)).toBe("public");
  });

  it("una cuenta normal sigue naciendo visible", () => {
    const { userId } = createLocalDemoAccount({
      email: "normal@demo.local",
      nickname: "normal",
      accountType: "single",
    });
    expect(readVisibilityLocalOrNull(userId)).toBeNull();
    expect(hasStoredPrivacySettings(userId, "single")).toBe(false);
  });
});

describe("A8. Like bloqueado para el anónimo", () => {
  it("el anónimo no puede dar like y el motivo menciona las reseñas", () => {
    const check = canAnonymousLike(true);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe(ANONYMOUS_LIKE_BLOCKED_MESSAGE);
    expect(ANONYMOUS_LIKE_BLOCKED_MESSAGE).toMatch(/solo pueden crear reseñas/);
  });

  it("una cuenta normal sí puede dar like", () => {
    expect(canAnonymousLike(false)).toEqual({ allowed: true });
  });
});

describe("A4. Chat con gate antes de navegar", () => {
  it("anónimo sin amistad aceptada: chat bloqueado", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: false,
      }).allowed,
    ).toBe(false);
  });

  it("anónimo con amistad aceptada: chat permitido", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: true,
      }).allowed,
    ).toBe(true);
  });
});

describe("A6. Cuenta atrás de accesos concedidos a la galería limitada", () => {
  it("lista el acceso vigente con sus ms restantes y su nombre", () => {
    const { userId: viewerId } = createLocalDemoAccount({
      email: "viewer@demo.local",
      nickname: "viewer",
      accountType: "single",
    });
    seedRequests([
      {
        id: "r1",
        fromId: viewerId,
        toId: "anon-1",
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 23 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 23 * HOUR_MS).toISOString(),
      },
    ]);
    const granted = listAnonymousPhotoAccessGrantedBy("anon-1", NOW);
    expect(granted).toHaveLength(1);
    expect(granted[0]?.viewerId).toBe(viewerId);
    expect(granted[0]?.viewerName).toBe("viewer");
    expect(granted[0]?.remainingMs).toBeGreaterThan(0);
    expect(granted[0]?.remainingMs).toBeLessThanOrEqual(HOUR_MS + 1000);
    expect(
      formatAnonymousPhotoAccessRemaining(granted[0]?.remainingMs ?? null),
    ).toMatch(/restantes/);
  });

  it("el acceso expirado (25 h) ya no se lista", () => {
    seedRequests([
      {
        id: "r1",
        fromId: "viewer-1",
        toId: "anon-1",
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
      },
    ]);
    expect(listAnonymousPhotoAccessGrantedBy("anon-1", NOW)).toHaveLength(0);
  });

  it("la solicitud pendiente no es un acceso concedido", () => {
    seedRequests([
      {
        id: "r1",
        fromId: "viewer-1",
        toId: "anon-1",
        kind: "photo_access",
        status: "pending",
        message: null,
        createdAt: new Date(NOW - HOUR_MS).toISOString(),
      },
    ]);
    expect(listAnonymousPhotoAccessGrantedBy("anon-1", NOW)).toHaveLength(0);
  });
});

describe("A7. Eliminar cuentas demo locales", () => {
  it("eliminar la anónima libera el hueco para crear otra", () => {
    const { userId } = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(false);
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    expect(findLocalAnonymousAccount()).toBeNull();
    expect(listLocalDemoAccounts()).toHaveLength(0);
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
    // Y ahora sí se puede crear la siguiente (anonr9test).
    expect(() =>
      createLocalDemoAccount({
        email: "anonr9test@demo.local",
        nickname: "anonr9test",
        accountType: "single",
        isAnonymous: true,
      }),
    ).not.toThrow();
  });

  it("eliminar también borra sus ajustes locales de privacidad", () => {
    const { userId } = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    expect(hasStoredPrivacySettings(userId, "single")).toBe(true);
    deleteLocalDemoAccount(userId);
    expect(hasStoredPrivacySettings(userId, "single")).toBe(false);
    expect(readVisibilityLocalOrNull(userId)).toBeNull();
  });

  it("las cuentas demo canónicas no se pueden eliminar", () => {
    window.localStorage.setItem(
      "cc_local_demo_accounts_v1",
      JSON.stringify([
        {
          email: "single@outlook.es",
          nickname: "Sofía",
          userId: "canonical-sofia",
          profile: { id: "canonical-sofia", email: "single@outlook.es" },
        },
      ]),
    );
    const result = deleteLocalDemoAccount("canonical-sofia");
    expect(result.deleted).toBe(false);
    expect(result.reason).toMatch(/no se pueden eliminar/i);
    expect(listLocalDemoAccounts()).toHaveLength(1);
  });

  it("eliminar una cuenta inexistente no rompe nada", () => {
    expect(deleteLocalDemoAccount("no-existe").deleted).toBe(false);
  });

  it("el selector de /demo elimina con confirmación y libera el hueco", () => {
    // jsdom no trae window.confirm: se define para el test.
    window.confirm = vi.fn(() => true) as typeof window.confirm;
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    render(
      <BrowserRouter>
        <DemoSelector />
      </BrowserRouter>,
    );
    expect(screen.getByText("anonr8test")).toBeTruthy();
    fireEvent.click(
      screen.getByLabelText("Eliminar la cuenta demo anonr8test"),
    );
    expect(screen.queryByText("anonr8test")).toBeNull();
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
  });
});

describe("A3. /tokens como anónimo: estado bloqueado, sin cartera ajena", () => {
  it("TokenDashboard muestra el bloqueo y ningún saldo ni reclamar ni staking", () => {
    authState.user = {
      id: "anon-1",
      email: "anonr9test@demo.local",
      first_name: "anonr9test",
    };
    authState.profile = {
      id: "anon-1",
      email: "anonr9test@demo.local",
      is_anonymous: true,
      is_verified: false,
      display_name: "anonr9test",
    };
    render(
      <BrowserRouter>
        <TokenDashboard />
      </BrowserRouter>,
    );
    expect(
      screen.getByText("Billetera desactivada en cuentas anónimas"),
    ).toBeTruthy();
    expect(
      screen.getByText(/Sin saldos, sin recompensas, sin staking/),
    ).toBeTruthy();
    expect(screen.queryByText(/Reclamar 100 CMPX/i)).toBeNull();
    expect(screen.queryByText(/1,250|1250/)).toBeNull();
    expect(screen.queryByText(/850/)).toBeNull();
  });
});

describe("A5. Formulario de reseña en el club", () => {
  it("el anónimo publica una reseña etiquetada y en revisión", () => {
    render(
      <BrowserRouter>
        <ClubProfileReviews
          reviews={[]}
          averageRating={0}
          totalReviews={0}
          clubId="eden-noir-test"
          isAnonymous
        />
      </BrowserRouter>,
    );
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Ambiente increíble, muy buen trato." },
    });
    fireEvent.click(screen.getByText("Publicar reseña como anónimo"));
    expect(screen.getByText(ANONYMOUS_REVIEW_LABEL)).toBeTruthy();
    expect(screen.getByText("En revisión")).toBeTruthy();
    expect(screen.getByText("Anónimo")).toBeTruthy();
    expect(
      screen.getByText("Ambiente increíble, muy buen trato."),
    ).toBeTruthy();
  });

  it("el anónimo sin interacción previa ve el bloqueo y no el formulario", () => {
    render(
      <BrowserRouter>
        <ClubProfileReviews
          reviews={[]}
          averageRating={0}
          totalReviews={0}
          clubId="eden-noir-test"
          isAnonymous
          hasInteraction={false}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText(/sin haber interactuado/i)).toBeTruthy();
    expect(screen.queryByText("Publicar reseña como anónimo")).toBeNull();
  });

  it("una cuenta normal publica con su nombre y sin marca de moderación", () => {
    render(
      <BrowserRouter>
        <ClubProfileReviews
          reviews={[]}
          averageRating={0}
          totalReviews={0}
          clubId="eden-noir-test-2"
          currentUserName="Sofía"
        />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByLabelText("4 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Muy buen lugar." },
    });
    fireEvent.click(screen.getByText("Publicar reseña"));
    expect(screen.getByText("Sofía")).toBeTruthy();
    expect(screen.queryByText(ANONYMOUS_REVIEW_LABEL)).toBeNull();
    expect(screen.queryByText("En revisión")).toBeNull();
  });
});
