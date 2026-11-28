/**
 * Ronda 25, stream A — crédito de bienvenida por TODAS las vías de
 * sesión demo.
 *
 * Causa raíz (retest ronda 24): el crédito solo estaba cableado en
 * `useAuth.signIn` (rama demo), pero hay tres caminos que establecen
 * sesión demo SIN pasar por `signIn` y nunca acreditaban:
 * (1) `DemoSelector.handleLocalAccountLogin` (botón "Entrar" de "Tus
 * cuentas demo"), (2) `DemoSelector.handleActiveSessionLogin` (botón
 * "Entrar como …" de "Cuenta demo activa") y (3) la restauración de
 * sesión al arrancar (init de `useAuth`). En el retest la pestaña
 * heredó sesión activa, así que las re-entradas usaron esos botones.
 *
 * DISCRIMINACIÓN: estos tests FALLAN contra el árbol viejo — no
 * existe `ensureDemoWelcomeCredit` ni `DEMO_WELCOME_CREDIT_EVENT`
 * (falla el import) y, aun sin ellos, la secuencia exacta que usan
 * hoy los handlers (`restoreLocalDemoSession` + resolver tipo y
 * anonimato + helper) dejaba el saldo en la semilla (1250/2000):
 * el test 1 es la reproducción directa del fallo del retest.
 *
 * Renderizar `DemoSelector` completo es demasiado pesado (router +
 * `useAuth` + registro demo); se testea el helper extraído y la
 * secuencia exacta de llamadas que hacen los handlers, con los
 * mismos resolutores (`resolveDemoAccountType`,
 * `isAnonymousDemoProfile`, `getActiveDemoSessionProfile`). El
 * cableado en los handlers es una llamada `void` al helper tras
 * restaurar la sesión (ver `DemoSelector.tsx` y `useAuth.ts`).
 *
 * El cliente real de Supabase no se puede importar en vitest (misma
 * convención que r24): se usa un stub. La vía demo de
 * `claimWelcomeCredit` nunca toca Supabase.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import {
  ensureDemoWelcomeCredit,
  welcomeTokensService,
  WELCOME_CREDIT_CMPX,
} from "@/services/payments/WelcomeTokensService";
import {
  DEMO_WELCOME_CREDIT_EVENT,
  getDemoWalletBalance,
  type DemoWelcomeCreditEventDetail,
} from "@/lib/demo-wallet";
import {
  getActiveDemoSessionProfile,
  isAnonymousDemoProfile,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import { resolveDemoAccountType } from "@/lib/app-config";
import { logger } from "@/lib/logger";
import type { Profile } from "@/types/supabase-custom";

/** Perfil demo mínimo con forma de `Profile` (como lo guarda `demo_user`). */
function demoProfile(overrides: Record<string, unknown>): Profile {
  return {
    id: "demo-user-1",
    email: "single@outlook.es",
    first_name: "Sofía",
    display_name: "Sofía",
    profile_type: "single",
    relationship_type: "single",
    ...overrides,
  } as unknown as Profile;
}

const SINGLE_PROFILE = demoProfile({});
const COUPLE_PROFILE = demoProfile({
  id: "demo-couple-1",
  email: "pareja@outlook.es",
  first_name: "Carmen & Roberto",
  display_name: "Carmen & Roberto",
  profile_type: "couple",
  relationship_type: "couple",
});
/** Cuenta anónima local: `is_anonymous` explícito (formulario anónimo). */
const ANONYMOUS_PROFILE = demoProfile({
  id: "demo-anon-1",
  email: "anon@demo.local",
  first_name: "",
  display_name: "",
  is_anonymous: true,
});

/**
 * La secuencia EXACTA que ejecuta hoy `handleLocalAccountLogin`
 * (y, con el perfil de `getActiveDemoSessionProfile()`,
 * `handleActiveSessionLogin`): restaurar sesión + resolver tipo y
 * anonimato + llamar al helper.
 */
async function loginAsLocalAccount(profile: Profile) {
  restoreLocalDemoSession(profile);
  return ensureDemoWelcomeCredit({
    userId: profile.id,
    accountType: resolveDemoAccountType(profile) ?? "single",
    isAnonymous: isAnonymousDemoProfile(profile),
  });
}

describe("r25 — crédito de bienvenida por todas las vías demo", () => {
  let events: DemoWelcomeCreditEventDetail[] = [];
  let onWelcomeCredit: (event: Event) => void;

  beforeEach(() => {
    window.localStorage.clear();
    events = [];
    onWelcomeCredit = (event: Event) => {
      const detail = (event as CustomEvent<DemoWelcomeCreditEventDetail>)
        .detail;
      if (detail) events.push(detail);
    };
    window.addEventListener(DEMO_WELCOME_CREDIT_EVENT, onWelcomeCredit);
  });

  afterEach(() => {
    window.removeEventListener(DEMO_WELCOME_CREDIT_EVENT, onWelcomeCredit);
    vi.restoreAllMocks();
  });

  it("login por cuenta local single acredita 50 CMPX (1250 → 1300) y dispara el evento", async () => {
    const result = await loginAsLocalAccount(SINGLE_PROFILE);

    expect(result.credited).toBe(true);
    expect(result.alreadyClaimed).toBe(false);
    expect(result.balance).toBe(1300);
    expect(getDemoWalletBalance("single").cmpx).toBe(1300);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      accountType: "single",
      amount: WELCOME_CREDIT_CMPX,
      balance: 1300,
    });
  });

  it("re-login NO duplica: segunda llamada devuelve alreadyClaimed, saldo sigue 1300 y no hay segundo evento", async () => {
    await loginAsLocalAccount(SINGLE_PROFILE);
    const second = await loginAsLocalAccount(SINGLE_PROFILE);

    expect(second.credited).toBe(false);
    expect(second.alreadyClaimed).toBe(true);
    expect(second.balance).toBe(1300);
    expect(getDemoWalletBalance("single").cmpx).toBe(1300);
    expect(events).toHaveLength(1);
  });

  it("login por cuenta local pareja acredita 50 CMPX (2000 → 2050)", async () => {
    const result = await loginAsLocalAccount(COUPLE_PROFILE);

    expect(result.credited).toBe(true);
    expect(result.balance).toBe(2050);
    expect(getDemoWalletBalance("couple").cmpx).toBe(2050);
    expect(events).toHaveLength(1);
    expect(events[0]?.accountType).toBe("couple");
  });

  it("init-restore: un demo_user con forma Profile (profile_type/relationship_type) resuelve el tipo y acredita", async () => {
    // Lo que hace el init de useAuth tras loadProfile: resuelve desde
    // el demo_user parseado, no desde el mockUser ({id, email}).
    const parsedDemoUser = JSON.parse(
      JSON.stringify(COUPLE_PROFILE),
    ) as Profile;
    const result = await ensureDemoWelcomeCredit({
      userId: parsedDemoUser.id,
      accountType: resolveDemoAccountType(parsedDemoUser) ?? "single",
      isAnonymous: isAnonymousDemoProfile(parsedDemoUser),
    });

    expect(resolveDemoAccountType(parsedDemoUser)).toBe("couple");
    expect(result.credited).toBe(true);
    expect(result.balance).toBe(2050);
    expect(events).toHaveLength(1);
  });

  it("sesión activa anónima: el perfil guardado resuelve anónimo y NO acredita ni dispara evento", async () => {
    restoreLocalDemoSession(ANONYMOUS_PROFILE);

    const activeProfile = getActiveDemoSessionProfile();
    expect(activeProfile).not.toBeNull();
    expect(isAnonymousDemoProfile(activeProfile)).toBe(true);

    const result = await ensureDemoWelcomeCredit({
      userId: ANONYMOUS_PROFILE.id,
      accountType:
        resolveDemoAccountType(activeProfile) ?? "single",
      isAnonymous: isAnonymousDemoProfile(activeProfile),
    });

    expect(result.credited).toBe(false);
    expect(getDemoWalletBalance("single").cmpx).toBe(1250);
    expect(events).toHaveLength(0);
  });

  it("sesión activa sin demo_user legible: el perfil es null y el handler no debe acreditar (fail-closed)", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", "{json-roto");

    expect(getActiveDemoSessionProfile()).toBeNull();
  });

  it("fallo NO silencioso: si claimWelcomeCredit lanza, logger.error recibe el error real y el resultado lo reporta", async () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(welcomeTokensService, "claimWelcomeCredit").mockRejectedValueOnce(
      new Error("boom-test-fallo-credito"),
    );

    const result = await ensureDemoWelcomeCredit({
      userId: SINGLE_PROFILE.id,
      accountType: "single",
      isAnonymous: false,
    });

    expect(result.credited).toBe(false);
    expect(result.error).toContain("boom-test-fallo-credito");
    expect(errorSpy).toHaveBeenCalled();
    const firstCall = errorSpy.mock.calls[0];
    expect(firstCall?.[0]).toContain("bono de bienvenida");
    const metadata = firstCall?.[1] as Record<string, unknown> | undefined;
    expect(String(metadata?.error)).toContain("boom-test-fallo-credito");
    expect(events).toHaveLength(0);
    expect(getDemoWalletBalance("single").cmpx).toBe(1250);
  });
});
