/**
 * Feature flags — sección inversión / donaciones
 * La sección (/donations, /invest, /investors) está oculta por el flag
 * `investmentSection` hasta Q3 + revisión legal (ver plan de subscripción
 * de clubs y Stripe). Este test es el candado: si alguien enciende el flag,
 * el test falla a propósito y el cambio queda visible en revisión.
 */
import { describe, it, expect } from "vitest";
import { getFeatureFlags, isFeatureEnabled } from "@/lib/features";

describe("Feature flags — investmentSection", () => {
  it("la sección inversión / donaciones está deshabilitada", () => {
    expect(isFeatureEnabled("investmentSection")).toBe(false);
  });

  it("el flag existe y es false en la fase actual", () => {
    const flags = getFeatureFlags();
    expect(flags).toHaveProperty("investmentSection", false);
  });
});
