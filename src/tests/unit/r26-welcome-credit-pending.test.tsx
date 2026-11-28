/**
 * Ronda 26, stream A — un crédito disparado ANTES de que MainLayout
 * monte su listener no se pierde (arranque en frío con restauración
 * de sesión).
 *
 * Causa: MainLayout monta su listener de DEMO_WELCOME_CREDIT_EVENT
 * DESPUÉS del efecto init de useAuth (mismo componente, los efectos
 * del hook se registran primero). Si el crédito se dispara antes de
 * que el listener exista, el evento no lo escucha nadie y el toast
 * de +50 CMPX no aparece nunca.
 *
 * El fix (demo-wallet.ts + MainLayout.tsx): `notifyDemoWelcomeCredit`
 * guarda el detalle en un hueco pendiente en memoria; MainLayout lo
 * toma al montar (`takePendingDemoWelcomeCredit`) y muestra el toast
 * con el mismo diferido de 4 s; el listener consume el hueco al
 * recibir el evento, así que un remontaje no repite el toast.
 *
 * DISCRIMINACIÓN: estos tests FALLAN contra el árbol de la ronda 25
 * — `takePendingDemoWelcomeCredit` no existe (falla el import) y,
 * aun sin él, el evento disparado antes del montaje no programaría
 * ningún toast. Pasan con el fix.
 *
 * Nota de alcance: el hueco solo vive en memoria (no en
 * localStorage). Un reload recarga el módulo vacío, pero el crédito
 * ya reclamado no vuelve a disparar el evento (idempotente por el
 * flag `cc_demo_welcome_claimed_v1`), así que no hay toast que
 * recuperar tras un reload.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockToast = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: { id: "demo-user-1", email: "single@outlook.es" },
    profile: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: () => true,
    isAdmin: () => false,
    isDemo: () => true,
    isDemoMode: () => true,
    getProfileType: () => "single",
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { act, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  MainLayout,
  DEMO_WELCOME_CREDIT_TOAST_DELAY_MS,
} from "@/components/layout/MainLayout";
import {
  notifyDemoWelcomeCredit,
  takePendingDemoWelcomeCredit,
  type DemoWelcomeCreditEventDetail,
} from "@/lib/demo-wallet";

const CREDIT: DemoWelcomeCreditEventDetail = {
  accountType: "single",
  amount: 50,
  balance: 1300,
};

function mountLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>Inicio</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("r26 — crédito disparado antes del listener no se pierde", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockToast.mockClear();
    mockToast.mockImplementation(() => ({
      id: "mock",
      dismiss: () => {},
      update: () => {},
    }));
    // Vaciar el hueco entre tests (el módulo se comparte en el archivo).
    takePendingDemoWelcomeCredit();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    takePendingDemoWelcomeCredit();
  });

  it("takePending: sin notificar devuelve null; tras notificar devuelve el detalle una sola vez", () => {
    expect(takePendingDemoWelcomeCredit()).toBeNull();

    notifyDemoWelcomeCredit(CREDIT);
    expect(takePendingDemoWelcomeCredit()).toEqual(CREDIT);
    expect(takePendingDemoWelcomeCredit()).toBeNull();
  });

  it("evento antes del montaje: al montar, el toast +50 sale a los 4 s", () => {
    // Arranque en frío: el crédito (init-restore de useAuth) se
    // dispara antes de que MainLayout monte su listener.
    notifyDemoWelcomeCredit(CREDIT);

    mountLayout();

    expect(mockToast).not.toHaveBeenCalled();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "🎁 +50 CMPX de bienvenida",
        description: expect.stringContaining("1300 CMPX"),
      }),
    );
  });

  it("evento con el listener ya montado: se consume el hueco y un remontaje no repite el toast", () => {
    const first = mountLayout();

    notifyDemoWelcomeCredit(CREDIT);
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).toHaveBeenCalledTimes(1);

    // Remontaje (misma sesión, mismo módulo): el hueco ya se consumió.
    first.unmount();
    mountLayout();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it("sin evento previo, montar no programa ningún toast", () => {
    mountLayout();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).not.toHaveBeenCalled();
  });
});
