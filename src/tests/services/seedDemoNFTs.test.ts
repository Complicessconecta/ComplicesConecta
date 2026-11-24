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
  WalletService: { isDemoMode: () => true },
  walletService: {},
}));

vi.mock("@/types/blockchain", () => ({
  safeBlockchainCast: (value: unknown) => value,
}));

import { seedDemoNFTs, DEFAULT_DEMO_NFTS } from "@/services/payments/NFTService";

describe("seedDemoNFTs (espejo de pareja)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("siembra los 4 NFTs demo para el usuario pareja", () => {
    seedDemoNFTs("uid-pareja-demo");

    const raw = window.localStorage.getItem("demo_nfts:uid-pareja-demo");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string) as Array<{
      name: string;
      is_couple: boolean;
    }>;
    expect(stored).toHaveLength(4);
    expect(stored.map((n) => n.name)).toEqual(
      DEFAULT_DEMO_NFTS.map((n) => n.name),
    );
  });

  it("deja exactamente 2 NFTs de pareja (Épico y Común) para el filtro de Couple", () => {
    seedDemoNFTs("uid-pareja-demo");

    const stored = JSON.parse(
      window.localStorage.getItem("demo_nfts:uid-pareja-demo") as string,
    ) as Array<{ name: string; is_couple: boolean }>;
    const couple = stored.filter((n) => n.is_couple);
    expect(couple.map((n) => n.name).sort()).toEqual([
      "Cómplice Común",
      "Cómplice Épico",
    ]);
  });

  it("no sobrescribe una colección ya guardada (minteada por el usuario)", () => {
    const custom = [{ id: "mio-1", name: "NFT Demo Minteado" }];
    window.localStorage.setItem(
      "demo_nfts:uid-pareja-demo",
      JSON.stringify(custom),
    );

    seedDemoNFTs("uid-pareja-demo");

    expect(
      window.localStorage.getItem("demo_nfts:uid-pareja-demo"),
    ).toBe(JSON.stringify(custom));
  });

  it("no hace nada sin userId", () => {
    seedDemoNFTs("");
    expect(window.localStorage.length).toBe(0);
  });
});
