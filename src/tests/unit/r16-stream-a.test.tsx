/**
 * Ronda 16, stream A — bloqueador 1 del test dirigido de la ronda 15
 * (2026-11-26 04:22–04:41 CST, navegador del teléfono de Wacko, 886 px,
 * veredicto DO NOT MERGE): en el perfil single (Sofía), tema claro, el
 * aviso al pie de la wallet demo — "Esta es una wallet demo con datos
 * mock para familiarizarte con el ecosistema. En producción, podrás
 * conectar tu wallet real de MetaMask…" — se veía BLANCO sobre el fondo
 * pálido de la página, casi ilegible.
 *
 * Causa raíz: la ronda 15 (stream C) opacó las 4 tarjetas de DemoWallet
 * (Wallet, Tokens, NFTs, Staking) con `from-purple-900 to-blue-900`, pero
 * este aviso vive FUERA de ellas, en la raíz `space-y-6` sin fondo
 * propio, con `text-white/80` y `text-white/70` sueltos. En tema claro
 * el fondo de la página es casi blanco (`--background: 350 20% 99%` en
 * src/index.css) y el blanco sobre claro no se lee. El CSS compilado lo
 * confirma: `.text-white\/80{color:rgba(255,255,255,.8)}` existe — el
 * problema no era una clase ausente, era texto blanco sin fondo.
 *
 * El arreglo es por instancia, mismo patrón que el aviso anónimo de este
 * componente: texto explícito claro/oscuro (`text-slate-700` /
 * `dark:text-white/80`, `text-slate-600` / `dark:text-white/70`); en
 * tema oscuro no cambia nada. La pareja usa el MISMO componente
 * (ProfileCouple.tsx:2417, `accountType="couple"`), así que el arreglo
 * la cubre también y este archivo lo fija en ambos tipos de cuenta.
 *
 * Convención de mocks: misma que r15-stream-c (Supabase con rechazo,
 * useToast simulado); DemoWallet no necesita router ni sesión demo.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoWallet } from "@/components/wallet/DemoWallet";

vi.mock("@/integrations/supabase/client", () => {
  const stubError = () =>
    Promise.reject(
      new Error("Supabase not configured - using stub client"),
    );
  const makeQuery = (): Record<string, unknown> => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.order = () => q;
    q.insert = () => q;
    q.update = () => q;
    q.single = () => stubError();
    q.maybeSingle = () => stubError();
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      stubError().then(
        onFulfilled as (v: unknown) => unknown,
        onRejected as (e: unknown) => unknown,
      );
    return q;
  };
  return {
    supabase: {
      from: () => makeQuery(),
      rpc: () => stubError(),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
      functions: { invoke: () => Promise.resolve({ error: null }) },
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn(), toasts: [], dismiss: vi.fn() }),
  toast: vi.fn(),
}));

/** ¿La clase `cls` aparece como token suelto (sin prefijo `dark:`)? */
const hasBareClass = (el: Element | null, cls: string) =>
  !!el &&
  new RegExp(`(^|\\s)${cls.replace("/", "\\/")}(\\s|$)`).test(el.className);

/** Las dos líneas del aviso al pie de la wallet demo. */
const footerLines = () => ({
  line1: screen.getByText(
    /Esta es una wallet demo con datos mock para familiarizarte/,
  ),
  line2: screen.getByText(
    /En producción, podrás conectar tu wallet real de MetaMask/,
  ),
});

describe("r16 stream A: aviso de wallet demo legible en tema claro", () => {
  it("single: línea 1 oscura sobre claro, blanca solo en oscuro", () => {
    render(<DemoWallet userId="wallet-r16a" accountType="single" />);
    const { line1 } = footerLines();
    expect(line1.className).toContain("text-slate-700");
    expect(line1.className).toContain("dark:text-white/80");
    expect(hasBareClass(line1, "text-white/80")).toBe(false);
    expect(hasBareClass(line1, "text-white")).toBe(false);
  });

  it("single: línea 2 oscura sobre claro, blanca solo en oscuro", () => {
    render(<DemoWallet userId="wallet-r16a" accountType="single" />);
    const { line2 } = footerLines();
    expect(line2.className).toContain("text-slate-600");
    expect(line2.className).toContain("dark:text-white/70");
    expect(hasBareClass(line2, "text-white/70")).toBe(false);
    expect(hasBareClass(line2, "text-white")).toBe(false);
  });

  it("couple: mismo aviso, mismo arreglo (mismo componente)", () => {
    render(<DemoWallet userId="wallet-r16a-couple" accountType="couple" />);
    const { line1, line2 } = footerLines();
    expect(line1.className).toContain("text-slate-700");
    expect(line1.className).toContain("dark:text-white/80");
    expect(hasBareClass(line1, "text-white/80")).toBe(false);
    expect(line2.className).toContain("text-slate-600");
    expect(line2.className).toContain("dark:text-white/70");
    expect(hasBareClass(line2, "text-white/70")).toBe(false);
  });

  it("el aviso no vive dentro de una tarjeta oscura: el color del texto es lo único que lo hace legible", () => {
    render(<DemoWallet userId="wallet-r16a" accountType="single" />);
    const { line1 } = footerLines();
    // Si el aviso estuviera dentro de una tarjeta con gradiente opaco,
    // el blanco sería legible y este test no haría falta: aquí se fija
    // que NO hay tarjeta oscura detrás, así que el texto claro/oscuro
    // explícito es la única garantía de contraste.
    expect(line1.closest(".bg-linear-to-br")).toBeNull();
    expect(line1.closest(".bg-purple-900")).toBeNull();
  });
});
