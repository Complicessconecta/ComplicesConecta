import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecurityService } from "@/services/auth/auth/SecurityService";

vi.mock("@/lib/security/rateLimiter", () => ({
  rateLimiter: {
    checkLimit: vi.fn(() => ({
      allowed: true,
      remaining: 3,
      resetTime: Date.now() + 60_000,
    })),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const digestToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(hash));
};

describe("SecurityService reset token timing", () => {
  let securityService: SecurityService;

  beforeEach(() => {
    vi.clearAllMocks();
    securityService = new SecurityService();
  });

  it("mantiene un tiempo de respuesta consistente para token inválido", async () => {
    const storedTokenHash = await digestToken("correct-token");
    const tokenExpiry = new Date(Date.now() + 60_000).toISOString();

    const startA = Date.now();
    const resultA = await securityService.validatePasswordResetToken({
      identifier: "user@example.com",
      token: "bad-token",
      storedTokenHash,
      tokenExpiry,
      minDurationMs: 200,
    });
    const durationA = Date.now() - startA;

    const startB = Date.now();
    const resultB = await securityService.validatePasswordResetToken({
      identifier: "user@example.com",
      token: "bad-token",
      storedTokenHash,
      tokenExpiry,
      minDurationMs: 200,
    });
    const durationB = Date.now() - startB;

    expect(resultA.isValid).toBe(false);
    expect(resultB.isValid).toBe(false);
    expect(Math.abs(durationA - durationB)).toBeLessThan(60);
  });
});
