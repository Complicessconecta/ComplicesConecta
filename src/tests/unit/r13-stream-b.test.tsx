/**
 * Ronda 13, stream B — verificación de los tres puntos:
 *
 * B1. /tokens "Mis NFTs (Wallet)": el valor CMPX va DEBAJO del arte
 *     (nunca sobre él, como la rejilla "Mis NFTs" del perfil en
 *     ronda 12) y el encabezado / la línea de estado envuelven en
 *     vez de truncarse.
 * B2. Discover "Filtros Avanzados": el slider "Compatibilidad
 *     mínima" existe en el panel, con el mismo cableado que
 *     Edad/Distancia (Radix Slider, `Filters.minCompatibility`,
 *     `applyFilters` contra `matchScore`, 0 = sin filtro).
 * B3. Selector de signo zodiacal: la etiqueta visible ya no se
 *     corta ("Automático (según fecha)"), la frase completa vive
 *     en el `title` del select y en el párrafo de ayuda.
 *
 * Nota de alcance: jsdom no tiene layout, así que "visible a
 * 886 px en ambos temas" no se puede probar aquí — eso se verifica
 * en navegador real (ronda de verificación). Estos tests prueban
 * presencia, cableado y operabilidad del control.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Misma convención que el resto de tests unitarios: mock del cliente
// de Supabase (sin backend, como el preview).
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
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
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
    user: null,
    profile: null,
    isAuthenticated: () => false,
    getProfileType: () => null,
    isDemoMode: () => false,
    isDemo: () => false,
    isAdmin: () => false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useTokens", () => ({
  useTokens: () => ({
    balance: {
      cmpxBalance: 500,
      cmpxStaked: 500,
      gtkBalance: 100,
      monthlyEarned: 200,
      monthlyRemaining: 800,
      monthlyLimit: 1000,
      referralCode: "TEST123",
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
    isAnonymousWalletBlocked: false,
    earnTokens: vi.fn(),
    spendTokens: vi.fn(),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { TokenDashboard } from "@/components/tokens/TokenDashboard";
import { Discover } from "@/pages/Discover";
import { SinglePrivacySection } from "@/components/profiles/single/SinglePrivacySection";
import { CouplePrivacySection } from "@/components/profiles/couple/CouplePrivacySection";

// jsdom no implementa scrollIntoView; Discover lo usa en efectos.
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const renderWithRouter = (component: React.ReactElement) =>
  render(<MemoryRouter initialEntries={["/discover"]}>{component}</MemoryRouter>);

describe("Ronda 13 stream B — B1: Mis NFTs (Wallet) en /tokens", () => {
  const mockNFTs = [
    {
      id: "nft-1",
      name: "Cool NFT #1",
      collection: "Cómplices",
      image_url: "https://example.com/nft1.jpg",
      token_id: "123",
      value: 250,
      rarity: "rare",
    },
    {
      id: "nft-2",
      name: "Cool NFT #2",
      collection: "Cómplices",
      image_url: "https://example.com/nft2.jpg",
      token_id: "124",
      value: 80,
      rarity: "common",
    },
  ];

  it("el valor CMPX va debajo del arte, nunca sobre él", async () => {
    renderWithRouter(<TokenDashboard nfts={mockNFTs} />);

    await waitFor(() => {
      expect(screen.getByText(/Mis NFTs \(Wallet\)/i)).toBeInTheDocument();
    });

    const price = screen.getByText("250 CMPX");
    // Sin ancestro posicionado encima del arte: antes era una píldora
    // `absolute bottom-2 left-2` sobre la imagen.
    expect(price.closest(".absolute")).toBeNull();

    // El arte (contenedor aspect-square de la imagen) no contiene el precio.
    const img = screen.getByAltText("Cool NFT #1");
    const artContainer = img.closest(".aspect-square");
    expect(artContainer).not.toBeNull();
    expect(artContainer!.textContent).not.toContain("250 CMPX");

    // Y el precio viene DESPUÉS del arte en el DOM (debajo, no encima).
    expect(
      artContainer!.compareDocumentPosition(price) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("el encabezado y la línea de estado envuelven en vez de truncarse", async () => {
    renderWithRouter(<TokenDashboard nfts={mockNFTs} />);

    await waitFor(() => {
      expect(screen.getByText(/Mis NFTs \(Wallet\)/i)).toBeInTheDocument();
    });

    // Título: el CardTitle envuelve (flex-wrap) y el span no trunca.
    const heading = screen.getByText("Mis NFTs (Wallet)");
    expect(heading.parentElement!.className).toContain("flex-wrap");
    expect(heading.className).toContain("wrap-break-word");
    expect(heading.className).not.toContain("truncate");

    // Línea de estado: "NFTs en esta wallet: N" sin `truncate` y con
    // fila que envuelve (antes se veía "NFTs en esta wal…" en angosto).
    const status = screen.getByText((_content, element) =>
      element?.tagName === "SPAN" &&
      (element.textContent ?? "").startsWith("NFTs en esta wallet:"),
    );
    expect(status.className).not.toContain("truncate");
    expect(status.parentElement!.className).toContain("flex-wrap");
  });
});

describe("Ronda 13 stream B — B2: Compatibilidad mínima en Discover", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("el panel Filtros Avanzados incluye el slider de compatibilidad", async () => {
    renderWithRouter(<Discover />);

    // El panel es colapsable: se abre con el botón Filtros del header.
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    await waitFor(() => {
      expect(screen.getByText("Filtros Avanzados:")).toBeInTheDocument();
    });

    // La `aria-label` vive en el Root de Radix, no en el thumb (el
    // thumb no hereda nombre, igual que en Edad/Distancia): se busca
    // el Root por su aria-label y el thumb dentro de él.
    const compatRoot = document.querySelector(
      '[aria-label="Compatibilidad mínima"]',
    ) as HTMLElement | null;
    expect(compatRoot).not.toBeNull();
    const slider = within(compatRoot!).getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("100");
    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    expect(screen.getByText("Compatibilidad mínima: 0%")).toBeInTheDocument();

    // El slider vive DENTRO del panel (no en otro bloque de la página).
    const heading = screen.getByText("Filtros Avanzados:");
    let node: HTMLElement | null = heading.parentElement;
    let panel: HTMLElement | null = null;
    while (node) {
      if (node.contains(slider)) {
        panel = node;
        break;
      }
      node = node.parentElement;
    }
    expect(panel).not.toBeNull();

    // Orden en el panel: después de Distancia, antes de Intereses
    // (mismo flujo que Edad/Distancia).
    const distanceLabel = screen.getByText(/^Distancia: /);
    const compatLabel = screen.getByText(/^Compatibilidad mínima: /);
    const interestsLabel = screen.getByText("Intereses");
    expect(
      distanceLabel.compareDocumentPosition(compatLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      compatLabel.compareDocumentPosition(interestsLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("el slider es operable: cambia el valor y la etiqueta", async () => {
    renderWithRouter(<Discover />);

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    await waitFor(() => {
      expect(screen.getByText("Filtros Avanzados:")).toBeInTheDocument();
    });
    const compatRoot = document.querySelector(
      '[aria-label="Compatibilidad mínima"]',
    ) as HTMLElement | null;
    expect(compatRoot).not.toBeNull();
    const slider = within(compatRoot!).getByRole("slider");

    // Misma ruta de cambio de valor que un arrastre (Radix Slider):
    // el thumb responde a teclado y dispara onValueChange → setFilters.
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByText("Compatibilidad mínima: 1%")).toBeInTheDocument();
    });
    expect(slider.getAttribute("aria-valuenow")).toBe("1");
  });
});

describe("Ronda 13 stream B — B3: etiqueta del signo zodiacal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("single: la opción automática cabe entera y el title guarda la frase completa", () => {
    render(
      <SinglePrivacySection userId="r13-b3-single" isDemoMode />,
    );

    const select = screen.getByTitle(
      "Automático (según fecha de nacimiento)",
    );
    expect(select.tagName).toBe("SELECT");

    // Etiqueta visible completa, sin elipsis: ya no es la frase larga
    // que se cortaba sin el paréntesis de cierre.
    expect(
      within(select as HTMLElement).getByText("Automático (según fecha)"),
    ).toBeInTheDocument();
    expect(
      within(select as HTMLElement).queryByText(
        "Automático (según fecha de nacimiento)",
      ),
    ).toBeNull();

    // El sentido completo sigue en el párrafo de ayuda de arriba.
    expect(
      screen.getByText(/tu fecha de nacimiento no estaba guardada/),
    ).toBeInTheDocument();
  });

  it("pareja: los dos selects llevan la misma etiqueta corta y el title completo", () => {
    render(
      <CouplePrivacySection userId="r13-b3-couple" isDemoMode />,
    );

    const selects = screen.getAllByTitle(
      "Automático (según fecha de nacimiento)",
    );
    expect(selects).toHaveLength(2);
    for (const select of selects) {
      expect(select.tagName).toBe("SELECT");
      expect(
        within(select as HTMLElement).getByText("Automático (según fecha)"),
      ).toBeInTheDocument();
      expect(
        within(select as HTMLElement).queryByText(
          "Automático (según fecha de nacimiento)",
        ),
      ).toBeNull();
    }
  });
});
