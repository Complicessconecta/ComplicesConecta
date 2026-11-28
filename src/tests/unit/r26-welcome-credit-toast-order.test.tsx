/**
 * Ronda 26, stream A — el toast "🎁 +50 CMPX de bienvenida" debe
 * verse DESPUÉS del toast "🎭 Modo Demo Activado", no ser
 * reemplazado por él al instante.
 *
 * Causa raíz (test dirigido del PR #87: +50 visto en 0 de 4 logins,
 * saldos correctos): en el login demo el evento
 * DEMO_WELCOME_CREDIT_EVENT se dispara DENTRO de `signIn` (useAuth
 * lo espera: `await ensureDemoWelcomeCredit(...)`, useAuth.ts:754)
 * y el toast de demo de DemoSelector llega DESPUÉS (tras resolver
 * `signIn`, DemoSelector.tsx:337-340). Con TOAST_LIMIT=1
 * (useToast.ts:4,82) el toast nuevo reemplaza al anterior al
 * instante: el +50 era invisible (~0 ms).
 *
 * El fix (MainLayout): el listener difiere el toast de bienvenida
 * DEMO_WELCOME_CREDIT_TOAST_DELAY_MS (4 s) — más que los 3,5 s que
 * tarda el toast de demo en descartarse solo (TOAST_REMOVE_DELAY,
 * useToast.ts) — así el de demo se lee entero y luego entra el +50
 * y se queda sus 3,5 s. El toast de demo no se toca.
 *
 * DISCRIMINACIÓN: estos tests FALLAN contra el árbol de la ronda 25
 * — el listener de MainLayout llamaba a `toast` en síncrono al
 * recibir el evento, así que el +50 entraba ANTES que el toast de
 * demo (test 1: orden invertido y nada visible a los 4 s) o lo
 * reemplazaba al instante (test 2: a t=0 ya se ve el +50, no el
 * demo). Pasan con el fix.
 *
 * Cómo prueban el orden (y qué NO): montan el MainLayout REAL con
 * el `useToast` mockeado como grabador de llamadas (mismo patrón
 * que r18-stream-a) y reproducen la secuencia EXACTA de llamadas de
 * producción — `notifyDemoWelcomeCredit` (lo que hace
 * `ensureDemoWelcomeCredit` dentro de `signIn`) y la llamada
 * `toast({ title: "🎭 Modo Demo Activado" })` de DemoSelector — con
 * relojes falsos. La visibilidad se modela con las dos reglas del
 * store real: TOAST_LIMIT=1 (solo sobrevive el toast más reciente)
 * y descarte solo a los 3,5 s. Lo que solo el test dirigido en
 * dispositivo puede confirmar es el timing REAL del toast en el
 * navegador (render de Radix, animaciones); esto prueba que el
 * listener difiere el +50 el retardo exacto y en el orden exacto.
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
  DEMO_WELCOME_CREDIT_EVENT,
  notifyDemoWelcomeCredit,
} from "@/lib/demo-wallet";

/** TOAST_REMOVE_DELAY (useToast.ts): cada toast se descarta solo a los 3,5 s. */
const TOAST_VISIBLE_MS = 3500;

interface ToastCall {
  title: string;
  description?: string;
  /** Reloj falso (Date.now mockeado) en el momento de la llamada. */
  at: number;
}

let toastCalls: ToastCall[] = [];

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

/** La llamada EXACTA de DemoSelector tras resolver `signIn`. */
function demoToast() {
  mockToast({
    title: "🎭 Modo Demo Activado",
    description: "Bienvenido al modo demo como Usuario Single",
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/**
 * Título del toast visible "ahora" según las reglas del store real:
 * TOAST_LIMIT=1 (solo sobrevive el más reciente) y descarte solo a
 * los 3,5 s de su llamada. `null` = ningún toast visible.
 */
function visibleToastTitle(now: number): string | null {
  for (let i = toastCalls.length - 1; i >= 0; i--) {
    const call = toastCalls[i]!;
    if (now - call.at < TOAST_VISIBLE_MS) return call.title;
  }
  return null;
}

describe("r26 — el toast +50 CMPX entra después del toast de demo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toastCalls = [];
    mockToast.mockClear();
    mockToast.mockImplementation(
      (props: { title?: string; description?: string }) => {
        toastCalls.push({
          title: String(props.title ?? ""),
          description: props.description,
          at: Date.now(),
        });
        return { id: "mock", dismiss: () => {}, update: () => {} };
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("login demo (vía signIn): demo primero, +50 a los 4 s con el saldo, visible 3,5 s", () => {
    mountLayout();

    // Secuencia EXACTA de producción en handleDemoLogin
    // (DemoSelector.tsx:337-340): 1) `await signIn(...)` — dentro,
    // useAuth espera el crédito (useAuth.ts:754) y el evento se
    // dispara ANTES del toast de demo; 2) tras resolver signIn,
    // DemoSelector muestra el toast de demo.
    notifyDemoWelcomeCredit({
      accountType: "single",
      amount: 50,
      balance: 1300,
    });
    demoToast();

    // t=0: solo se ve el toast de demo; el +50 aún no ha entrado.
    expect(toastCalls).toHaveLength(1);
    expect(visibleToastTitle(Date.now())).toBe("🎭 Modo Demo Activado");

    // El toast de demo se descarta solo a los 3,5 s.
    advance(TOAST_VISIBLE_MS);
    expect(visibleToastTitle(Date.now())).toBeNull();

    // A los 4 s entra el +50 CMPX con el saldo.
    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS - TOAST_VISIBLE_MS);
    expect(toastCalls).toHaveLength(2);
    expect(toastCalls.map((c) => c.title)).toEqual([
      "🎭 Modo Demo Activado",
      "🎁 +50 CMPX de bienvenida",
    ]);
    expect(toastCalls[1]?.description).toContain("1300 CMPX");
    expect(visibleToastTitle(Date.now())).toBe("🎁 +50 CMPX de bienvenida");

    // Y se queda sus 3,5 s enteros.
    advance(TOAST_VISIBLE_MS - 1);
    expect(visibleToastTitle(Date.now())).toBe("🎁 +50 CMPX de bienvenida");
    advance(1);
    expect(visibleToastTitle(Date.now())).toBeNull();
  });

  it("login por cuenta local/activa: demo primero (síncrono) y +50 a los 4 s", () => {
    mountLayout();

    // Secuencia de handleLocalAccountLogin / handleActiveSessionLogin
    // (DemoSelector.tsx:172-184 y 220-227): `void
    // ensureDemoWelcomeCredit(...)` y LUEGO el toast de demo en
    // síncrono; el evento llega en la microtarea siguiente al
    // crédito, así que aquí el toast de demo va primero y el evento
    // después — el +50 debe seguir entrando a los 4 s, no al instante.
    demoToast();
    notifyDemoWelcomeCredit({
      accountType: "single",
      amount: 50,
      balance: 1300,
    });

    expect(toastCalls).toHaveLength(1);
    expect(visibleToastTitle(Date.now())).toBe("🎭 Modo Demo Activado");

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(toastCalls).toHaveLength(2);
    expect(visibleToastTitle(Date.now())).toBe("🎁 +50 CMPX de bienvenida");
  });

  it("sin crédito no hay toast diferido: montar y esperar 4 s no muestra nada", () => {
    mountLayout();

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(toastCalls).toHaveLength(0);
    expect(visibleToastTitle(Date.now())).toBeNull();
  });

  it("el evento sin listener previo no se pierde (se cubre en r26-welcome-credit-pending)", () => {
    // Guarda: el listener existe desde el montaje; un evento sin
    // detalle no debe programar ningún toast.
    mountLayout();
    window.dispatchEvent(new CustomEvent(DEMO_WELCOME_CREDIT_EVENT));

    advance(DEMO_WELCOME_CREDIT_TOAST_DELAY_MS);
    expect(toastCalls).toHaveLength(0);
  });
});
