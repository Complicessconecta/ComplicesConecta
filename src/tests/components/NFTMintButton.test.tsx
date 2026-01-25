import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock services
vi.mock("@/services/payments/WalletService", () => ({
  walletService: {
    executeDemoAction: vi.fn().mockResolvedValue({ tokenId: 123 }),
  },
  WalletService: {
    isDemoMode: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("@/services/payments/NFTService", () => ({
  nftService: {
    mintSingleNFT: vi.fn(),
    requestCoupleNFT: vi.fn(),
  },
}));

describe("NFTMintButton", () => {
  let NFTMintButton: typeof import("@/components/ui/buttons/NFTMintButton").NFTMintButton;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/components/ui/buttons/NFTMintButton");
    NFTMintButton = mod.NFTMintButton;
  });

  const defaultProps = {
    userId: "user-123",
    type: "single" as const,
    nftName: "Test NFT",
    nftDescription: "Test Description",
  };

  it("renders correctly", () => {
    render(<NFTMintButton {...defaultProps} />);
    expect(screen.getByText("Mintear NFT")).toBeInTheDocument();
  });

  it("shows error if partner email is missing for couple type", async () => {
    render(<NFTMintButton {...defaultProps} type="couple" />);

    fireEvent.click(screen.getByText("Crear NFT de Pareja"));

    await waitFor(() => {
      expect(
        screen.getByText("Email de pareja requerido para NFT de pareja"),
      ).toBeInTheDocument();
    });
  });

  it("handles successful minting in demo mode", async () => {
    render(<NFTMintButton {...defaultProps} />);

    fireEvent.click(screen.getByText("Mintear NFT"));

    await waitFor(() => {
      expect(screen.getByText("NFT Minteado!")).toBeInTheDocument();
    });
  });
});
