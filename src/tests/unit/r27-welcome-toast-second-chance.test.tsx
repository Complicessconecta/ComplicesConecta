/**
 * Ronda 27 — segunda oportunidad del toast "🎁 +50 CMPX de bienvenida".
 *
 * Causa (test dirigido del PR #88: DO NOT MERGE por el ítem 4): en
 * el primer inicio como Single el toast de demo apareció pero el
 * +50 CMPX NO apareció en 10 s (saldo correcto 1,300); en el primer
 * inicio como Pareja la secuencia SÍ funcionó (demo → +50 "Tu saldo
 * ahora es de 2050 CMPX."). Single y Pareja comparten UNA sola
 * función handleDemoLogin, el mismo evento y el mismo listener, así
 * que no hay diferencia de código entre ambos: es una carrera de
 * tiempos en la capa de toasts en el momento más cargado (primer
 * inicio, pestaña fresca) con TOAST_LIMIT=1 y el diferido de 4 s.
 *
 * El fix (demo-wallet.ts + MainLayout.tsx): `notifyDemoWelcomeCredit`
 * escribe además una marca persistente en localStorage
 * (`cc_demo_welcome_toast_pending_v1`, con `claimedAt`, fresca 60 s)
 * que consume quien MUESTRA el toast — es el token de entrega
 * exactamente-una-vez. El primer intento (diferido 4 s, ronda 26)
 * la consume al mostrar. Si ese timer se pierde, la marca sigue ahí
 * y MainLayout programa una segunda oportunidad al cambiar de ruta
 * (el login demo navega siempre a /profile-single o /profile-couple)
 * y al montar (un reload dentro de la ventana es otra segunda
 * oportunidad), con el mismo diferido de 4 s; al disparar toma la
 * marca y si ya no está no repite. Un remontaje o una reentrada
 * nunca repiten: la marca se consume al mostrar y el crédito ya
 * reclamado no vuelve a escribirla.
 *
 * DISCRIMINACIÓN: estos tests FALLAN contra el árbol de la ronda 26
 * — `takePendingWelcomeToast` / `peekPendingWelcomeToast` no existen
 * (falla el import) y, aun sin ellos, el primer intento perdido no
 * programaría ningún toast al remontar (test 2) ni al navegar
 * (test 3). Pasan con el fix.
 *
 * Cómo se simula el primer intento perdido: se monta MainLayout, se
 * dispara el crédito (el listener programa el timer de 4 s) y se
 * DESMONTA antes de avanzar el reloj — el cleanup del efecto limpia
 * los timers, exactamente lo que pasa si MainLayout se remonta en el
 * primer inicio. Al remontar, solo la marca persistente puede
 * recuperar el toast.
 *
 * Lo que solo el test dirigido en dispositivo puede confirmar es el
 * timing REAL del toast en el navegador (render de Radix, el toast
 * visible y estable ≥2 s tras el toast de demo en el primer inicio
 * de Single); esto prueba que la segunda oportunidad existe, se
 * dispara una sola vez y nunca repite.
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
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  MainLayout,
  DEMO_WELCOME_CREDIT_TOAST_DELAY_MS,
} from "@/components/layout/MainLayout";
import {
  DEMO_WELCOME_TOAST_FRESHNESS_MS,
  DEMO_WELCOME_TOAST_PENDING_KEY,
  notifyDemoWelcomeCredit,
  peekPendingWelcomeToast,
  takePendingDemoWelcomeCredit,
  takePendingWelcomeToast,
  type DemoWelcomeCreditEventDetail,
} from "@/lib/demo-wallet";

const CREDIT: DemoWelcomeCreditEventDetail = {
  accountType: "single",
  amount: 50,
  balance: 1300,
};

function plus50Calls() {
  return mockToast.mock.calls.filter(
    (call) => call[0]?.title === "🎁 +50 CMPX de bienvenida",
  );
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Expone `navigate` fuera del árbol para simular el cambio de ruta. */
let testNavigate: ((to: string) => void) | null = null;

function NavProbe() {
  const navigate = useNavigate();
  useEffect(() => {
    testNavigate = navigate;
  }, [navigate]);
  return null;
}

function mountLayout(initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <>
                <div>Inicio</div>
                <NavProbe />
              </>
            }
          />
          <Route
            path="/profile-single"
            element={<div>Perfil Single</div>}
          />
          <Route
            path="/profile-couple"
            element={<div>Perfil Pareja</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function navigateTo(path: string) {
  act(() => {
    testNavigate?.(path);
  });
}

describe("r27 — segunda oportunidad del toast +50 CMPX", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    testNavigate = null;
    mockToast.mockClear();
    mockToast.mockImplementation(() => ({
      id: "mock",
      dismiss: () => {},
      update: () => {},
    }));
    // Vaciar ambos huecos entre tests (el módulo se comparte en el archivo).
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  it("la marca persistente: notify la escribe, take la devuelve una sola vez, peek no la consume", () => {
    expect(takePendingWelcomeToast()).toBeNull();
    expect(peekPendingWelcomeToast()).toBeNull();

    notifyDemoWelcomeCredit(CREDIT);

    expect(peekPendingWelcomeToast()).toEqual(
      expect.objectContaining({
        accountType: "single",
        amount: 50,
        balance: 1300,
      }),
    );
    // peek no consume: sigue ahí.
    expect(peekPendingWelcomeToast()).not.toBeNull();
    expect(takePendingWelcomeToast()).toEqual(
      expect.objectContaining({ accountType: "single", balance: 1300 }),
    );
    // take sí consume: la segunda vez es null.
    expect(takePendingWelcomeToast()).toBeNull();
    expect(peekPendingWelcomeToast()).toBeNull();
  });

  it("primer intento perdido (remontaje antes de los 4 s): al remontar, el toast sale una sola vez", () => {
    const first = mountLayout();

    // El crédito dispara el evento con el listener montado: el
    // primer intento programa su timer de 4 s.
    notifyDemoWelcomeCredit(CREDIT);
    expect(mockToast).not.toHaveBeenCalled();

    // El remontaje limpia los timers del primer intento (cleanup
    // del efecto): el toast se pierde si no hay segunda oportunidad.
    first.unmount();
    mountLayout();

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
    expect(plus50Calls()[0]?.[0]).toEqual(
      expect.objectContaining({
        title: "🎁 +50 CMPX de bienvenida",
        description: expect.stringContaining("1300 CMPX"),
      }),
    );

    // Y no se repite al avanzar más tiempo.
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
  });

  it("navegación tras el evento: los dos timers no duplican el toast (sale una sola vez)", () => {
    mountLayout();

    notifyDemoWelcomeCredit(CREDIT);
    // El login demo navega siempre a /profile-single: el cambio de
    // ruta programa la segunda oportunidad (mismo diferido de 4 s)
    // ADEMÁS del primer intento. El primero dispara primero (4 s
    // desde el evento) y consume la marca; la segunda oportunidad
    // la encuentra vacía y no repite.
    navigateTo("/profile-single");

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);

    // Navegar de nuevo no reprograma nada: la marca ya se consumió.
    navigateTo("/profile-couple");
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
  });

  it("segunda oportunidad sin primer intento: crédito antes del montaje sale una sola vez al montar", () => {
    // Arranque en frío: el crédito se dispara antes de que MainLayout
    // monte (hueco en memoria + marca persistente, ambos escritos).
    notifyDemoWelcomeCredit(CREDIT);

    mountLayout();

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
  });

  it("primer intento mostrado: remontar y navegar NO repiten el toast", () => {
    const first = mountLayout();

    notifyDemoWelcomeCredit(CREDIT);
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);

    // Remontaje: la marca ya se consumió al mostrar.
    first.unmount();
    mountLayout();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);

    // Navegación: tampoco hay marca que re-disparar.
    navigateTo("/profile-single");
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(plus50Calls()).toHaveLength(1);
  });

  it("reentrada (crédito ya reclamado, sin evento ni marca): montar y navegar no muestran nada", () => {
    mountLayout();

    navigateTo("/profile-single");
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).not.toHaveBeenCalled();

    navigateTo("/profile-couple");
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("marca caducada (>60 s): al montar no muestra nada y la borra en silencio", () => {
    window.localStorage.setItem(
      DEMO_WELCOME_TOAST_PENDING_KEY,
      JSON.stringify({
        ...CREDIT,
        claimedAt: Date.now() - DEMO_WELCOME_TOAST_FRESHNESS_MS - 1000,
      }),
    );

    mountLayout();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(DEMO_WELCOME_TOAST_PENDING_KEY),
    ).toBeNull();
  });

  it("marca corrupta: al montar no muestra nada y la borra", () => {
    window.localStorage.setItem(DEMO_WELCOME_TOAST_PENDING_KEY, "{no-json");

    mountLayout();
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(mockToast).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(DEMO_WELCOME_TOAST_PENDING_KEY),
    ).toBeNull();
  });
});
