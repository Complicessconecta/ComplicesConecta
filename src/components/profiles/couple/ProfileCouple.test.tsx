import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, beforeEach, test, expect } from "vitest";
import React from "react";
import ProfileCouple from "@/pages/profiles/couple/ProfileCouple";
import { useToast } from "@/hooks/useToast";

// Control del RPC de Supabase por test. Por defecto rechaza (como el
// cliente stub sin backend); cada test lo reconfigura antes de renderizar.
const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }));

// Supabase: el componente solo usa `supabase.rpc("get_profile_by_user_id")`
// para cargar el perfil, y `supabase.from(...)` en las secciones hijas
// (p. ej. CouplePrivacySection). El stub de `from` resuelve
// { data: null } para que esas secciones caigan a su fallback de
// localStorage sin tocar red.
vi.mock("@/integrations/supabase/client", () => {
  const queryStub: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === "symbol") return undefined;
        if (prop === "then")
          return (resolve: (value: unknown) => void) =>
            resolve({ data: null, error: null });
        if (prop === "catch") return () => queryStub;
        return (..._args: unknown[]) => queryStub;
      },
    },
  );
  return {
    supabase: {
      rpc: (...args: unknown[]) => mockRpc(...args),
      from: (..._args: unknown[]) => queryStub,
      storage: {
        from: () => ({
          createSignedUrl: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
      },
    },
    isDemoMode: false,
  };
});

// Mock dependencies
vi.mock("@/components/Navigation", () => ({
  default: () => <div data-testid="navigation">Navigation</div>,
}));

vi.mock("@/components/ui/cards/Card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/buttons/Button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock services (rutas reales que importa el componente)
vi.mock("@/services/payments/WalletService", () => ({
  walletService: {
    getOrCreateWallet: vi.fn().mockResolvedValue({}),
    getTokenBalances: vi
      .fn()
      .mockResolvedValue({ cmpx: "0", gtk: "0", matic: "0" }),
    getTestnetTokensInfo: vi.fn().mockResolvedValue(null),
  },
  WalletService: {
    isDemoMode: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/services/payments/NFTService", () => ({
  nftService: {
    getUserNFTs: vi.fn().mockResolvedValue([]),
    getCoupleNFTRequests: vi.fn().mockResolvedValue([]),
    requestCoupleNFT: vi.fn(),
  },
  seedDemoNFTs: vi.fn(),
  DEFAULT_DEMO_NFTS: [],
}));

// Mock UI components to prevent rendering issues
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/vanish-search-input", () => ({
  VanishSearchInput: () => (
    <div data-testid="vanish-search-input">Search Input</div>
  ),
}));

vi.mock("@/components/ui/card-hover-effect", () => ({
  HoverEffect: () => <div data-testid="hover-effect">Hover Effect</div>,
}));

vi.mock("@/components/ui/events-carousel", () => ({
  EventsCarousel: () => (
    <div data-testid="events-carousel">Events Carousel</div>
  ),
}));

vi.mock("@/components/modals/animated-modal", () => ({
  Modal: ({ children }: any) => <>{children}</>,
  ModalBody: ({ children }: any) => <>{children}</>,
  ModalContent: ({ children }: any) => <>{children}</>,
  ModalFooter: ({ children }: any) => <>{children}</>,
  ModalTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/ui/file-upload", () => ({
  FileUpload: () => <div data-testid="file-upload">File Upload</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock useAuth
vi.mock("@/features/auth/useAuth", () => {
  const mockUser = { id: "test-user-1", email: "test@example.com" };
  const mockProfile = { id: "test-profile-1", is_demo: true };
  return {
    useAuth: vi.fn(() => ({
      user: mockUser,
      profile: mockProfile,
      isAuthenticated: vi.fn(() => true),
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      checkAuth: vi.fn(),
      deleteAccount: vi.fn(),
      error: null,
      getProfileType: () => "single",
      isDemoMode: () => true,
      isDemo: () => true,
      isAdmin: () => false,
      signOut: vi.fn(),
    })),
  };
});

// Mock useToast - simpler mock that allows overriding
vi.mock("@/hooks/useToast", () => ({
  useToast: vi.fn(),
}));

// Mock Navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/features/profile/useProfileScore", () => ({
  useProfileScore: () => ({
    score: 95,
    label: "Excelente",
    color: "text-green-500",
    icon: "🏆",
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ProfileCouple", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Por defecto el RPC rechaza: reproduce el cliente stub sin backend
    // (la rama de error de DB del componente).
    mockRpc.mockRejectedValue(
      new Error("Supabase not configured - using stub client"),
    );

    // Mock ResizeObserver to prevent Radix UI errors
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock PointerEvent
    // @ts-ignore
    global.PointerEvent = class extends Event {
      constructor(type: string, props: any) {
        super(type, props);
      }
    };

    // Setup default toast mock for every test
    vi.mocked(useToast).mockReturnValue({
      toast: vi.fn(),
      toasts: [],
      dismiss: vi.fn(),
    });
  });

  test("renders loading state initially", () => {
    // El RPC nunca resuelve: la carga queda pendiente y el estado de
    // carga sigue visible (sin esto, el RPC resuelve/rechaza en el mismo
    // tick de act() y el loading nunca se llega a observar).
    mockRpc.mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<ProfileCouple />);
    expect(screen.getByText(/Cargando perfil.../i)).toBeTruthy();
  });

  test("renders profile content after loading", async () => {
    // El RPC devuelve un perfil de pareja válido: el componente toma la
    // rama de carga real (antes el test dependía del fallback a mocks del
    // catch externo, que la rama de error de DB ya no alcanza).
    mockRpc.mockResolvedValue({
      data: {
        account_type: "couple",
        couple_id: "mock-couple-1",
        profile_id: "CC-MOCK-001",
        name: "Mock Couple",
        nickname: "mock_couple",
        location: "CDMX",
        bio: "Perfil de ejemplo",
        is_verified: true,
        relationship_type: "man-woman",
        his_name: "Partner 1",
        her_name: "Partner 2",
        his_age: 30,
        her_age: 30,
        his_gender: "male",
        her_gender: "female",
        interested_in: ["female"],
        user_id: "test-user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    renderWithRouter(<ProfileCouple />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Cargando perfil.../i)).toBeNull();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText("Mock Couple")).toBeTruthy();
    expect(screen.getAllByText("@mock_couple").length).toBeGreaterThan(0);
    expect(screen.getByText("ID: CC-MOCK-001")).toBeTruthy();
  });

  test("renders demo profile when demo mode is active", async () => {
    // demo_authenticated se lee en crudo (getItem() === "true"), sin JSON.
    localStorage.setItem("demo_authenticated", "true");
    localStorage.setItem("demo_user", JSON.stringify({ name: "Demo User" }));

    renderWithRouter(<ProfileCouple />);

    expect(await screen.findByText("ID: CC-DEMO-001")).toBeTruthy();

    // Clean up
    localStorage.removeItem("demo_authenticated");
    localStorage.removeItem("demo_user");
  });

  test("displays error toast when profile loading fails", async () => {
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    });

    // El RPC rechaza por defecto (beforeEach): la rama de error de DB
    // del componente muestra el toast "Error al cargar perfil".
    renderWithRouter(<ProfileCouple />);

    // Should eventually call toast
    // Wait for the timeout + error handling
    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error al cargar perfil",
            variant: "destructive",
          }),
        );
      },
      { timeout: 3000 },
    );
  });
});
