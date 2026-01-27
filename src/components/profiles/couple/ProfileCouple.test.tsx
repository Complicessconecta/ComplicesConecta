import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, beforeEach, test, expect } from "vitest";
import React from "react";
import ProfileCouple from "@/pages/profiles/couple/ProfileCouple";
import { useToast } from "@/hooks/useToast";
import { generateMockCoupleProfiles } from "@/fixtures/coupleProfiles";

// Mock dependencies
vi.mock("@/components/Navigation", () => ({
  default: () => <div data-testid="navigation">Navigation</div>,
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
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

// Mock services
vi.mock("@/services/WalletService", () => ({
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

vi.mock("@/services/NFTService", () => ({
  nftService: {
    getUserNFTs: vi.fn().mockResolvedValue([]),
    getCoupleNFTRequests: vi.fn().mockResolvedValue([]),
    requestCoupleNFT: vi.fn(),
  },
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

// Mock generateMockCoupleProfiles
vi.mock("@/fixtures/coupleProfiles", () => ({
  generateMockCoupleProfiles: vi.fn(() => [
    {
      id: "mock-couple-1",
      profile_id: "CC-MOCK-001",
      couple_name: "Mock Couple",
      username: "@mock_couple",
      partner1_first_name: "Partner 1",
      partner2_first_name: "Partner 2",
      is_verified: true,
      relationship_type: "man-woman",
      partner1_age: 30,
      partner2_age: 30,
      partner1_gender: "male",
      partner2_gender: "female",
    },
  ]),
  useProfileScore: vi.fn(() => ({
    score: 100,
    label: "High",
    color: "green",
    icon: "🏆",
  })),
}));

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
    renderWithRouter(<ProfileCouple />);
    expect(screen.getByText(/Cargando perfil.../i)).toBeTruthy();
  });

  test("renders profile content after loading", async () => {
    renderWithRouter(<ProfileCouple />);

    // Wait for profile to load (component has a 1.5s delay)
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
    // Mock usePersistedState to return demo auth true
    // Note: Since we can't easily mock hooks used inside component that are not directly mocked in test file
    // without more setup, and usePersistedState uses localStorage, we can mock localStorage.
    localStorage.setItem("demo_authenticated", JSON.stringify("true"));
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

    // Mock failure
    vi.mocked(generateMockCoupleProfiles).mockImplementationOnce(() => {
      throw new Error("Loading failed");
    });

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
