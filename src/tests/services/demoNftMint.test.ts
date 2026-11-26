import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/utils/safeLocalStorage", () => ({
  safeGetItem: (key: string) => window.localStorage.getItem(key),
}));

vi.mock("@/services/payments/WalletService", () => ({
  // getInstance: el constructor de NFTService lo llama al importar el
  // módulo (antes el mock no lo tenía y el test fallaba en la
  // importación, sin llegar a ningún test).
  WalletService: { isDemoMode: () => true, getInstance: () => ({}) },
  walletService: {},
}));

vi.mock("@/types/blockchain", () => ({
  safeBlockchainCast: (value: unknown) => value,
}));

import {
  nftService,
  countMintedDemoNFTs,
  getDemoNFTSeedItems,
  DEMO_MINT_LIMIT,
  DEFAULT_DEMO_NFTS,
} from "@/services/payments/NFTService";
import {
  getDemoWalletBalance,
  creditDemoWallet,
  DEMO_WALLET_STORAGE_KEY,
  LEGACY_DEMO_WALLET_STORAGE_KEY,
} from "@/lib/demo-wallet";

function readStored(uid: string): Array<Record<string, unknown>> {
  const raw = window.localStorage.getItem(`demo_nfts:${uid}`);
  expect(raw).not.toBeNull();
  return JSON.parse(raw as string) as Array<Record<string, unknown>>;
}

describe("mint demo (ronda 8, puntos 4 y 7)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("el primer mint single conserva la semilla: 4 → 5 (1 minteado)", async () => {
    const created = await nftService.mintDemoNFT("uid-single", {
      isCouple: false,
      name: "NFT Demo",
    });

    expect(created).not.toBeNull();
    expect(created?.is_couple).toBe(false);
    const stored = readStored("uid-single");
    expect(stored).toHaveLength(5);
    expect(countMintedDemoNFTs(stored)).toBe(1);
    expect(stored.map((n) => n.name)).toContain("Cómplice Legendario");
  });

  it("el mint de pareja es is_couple y la pareja pasa de 2 a 3", async () => {
    await nftService.mintDemoNFT("uid-pareja", {
      isCouple: true,
      name: "NFT de Pareja",
    });

    const stored = readStored("uid-pareja");
    const couple = stored.filter((n) => n.is_couple === true);
    expect(couple).toHaveLength(3);
    expect(countMintedDemoNFTs(stored)).toBe(1);
    // La semilla de pareja sigue intacta (Épico y Común).
    expect(couple.map((n) => n.name).sort()).toContain("Cómplice Épico");
    expect(couple.map((n) => n.name).sort()).toContain("Cómplice Común");
  });

  it("el tope cuenta solo minteados: permite 4 y el 5º es null", async () => {
    for (let i = 0; i < DEMO_MINT_LIMIT; i++) {
      const created = await nftService.mintDemoNFT("uid-tope", {
        isCouple: false,
        name: `NFT ${i + 1}`,
      });
      expect(created).not.toBeNull();
    }
    const fifth = await nftService.mintDemoNFT("uid-tope", {
      isCouple: false,
      name: "NFT 5",
    });
    expect(fifth).toBeNull();
    expect(readStored("uid-tope")).toHaveLength(
      DEFAULT_DEMO_NFTS.length + DEMO_MINT_LIMIT,
    );
  });

  it("countMintedDemoNFTs: la semilla sola es 0", () => {
    expect(countMintedDemoNFTs(getDemoNFTSeedItems())).toBe(0);
    expect(
      countMintedDemoNFTs([
        ...getDemoNFTSeedItems(),
        { id: "demo-nft-1", minted_by_user: true },
      ]),
    ).toBe(1);
  });
});

describe("saldo demo persistente (ronda 8, punto 8)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("el reclamo escribe en la clave nueva, fuera del barrido `demo_`", () => {
    const next = creditDemoWallet("single", { cmpx: 100 });

    expect(next.cmpx).toBe(1350);
    expect(window.localStorage.getItem(DEMO_WALLET_STORAGE_KEY)).not.toBeNull();
    expect(DEMO_WALLET_STORAGE_KEY.startsWith("demo_")).toBe(false);
    expect(
      window.localStorage.getItem(LEGACY_DEMO_WALLET_STORAGE_KEY),
    ).toBeNull();
    expect(getDemoWalletBalance("single").cmpx).toBe(1350);
  });

  it("migra el saldo de la clave vieja una vez y la borra", () => {
    window.localStorage.setItem(
      LEGACY_DEMO_WALLET_STORAGE_KEY,
      JSON.stringify({ single: { cmpx: 1350, gtk: 850 } }),
    );

    expect(getDemoWalletBalance("single").cmpx).toBe(1350);
    expect(window.localStorage.getItem(DEMO_WALLET_STORAGE_KEY)).not.toBeNull();
    expect(
      window.localStorage.getItem(LEGACY_DEMO_WALLET_STORAGE_KEY),
    ).toBeNull();
  });
});
