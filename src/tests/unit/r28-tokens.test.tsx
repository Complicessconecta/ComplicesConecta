/**
 * RONDA 28 (bloque O) — Limpieza de la página de tokens.
 *
 * Capturas 433057_17–433053_21 y 433020_22 (04:19–04:20 CST).
 *
 * O1: había DOS asistentes de tokens en /tokens — el primero
 * (TokenChatBot, burbuja "👋 ¡Hola Usuario! Bienvenido a tu asistente
 * de tokens Beta...") se quita; queda SOLO el segundo, la tarjeta
 * "Asistente Token IA [BETA]" (TokenAiChat, dentro de TokenDashboard).
 * O2: la "Distribución" con % (60/25/10/5) está marcada
 * DESACTUALIZADA en el anexo del modelo de tokens
 * (FLUJO_TRABAJO_TOKENS_CMPX_GTK.md §11.2, "pendiente de nueva
 * distribución"): los % se quitan, quedan solo los flujos de cómo
 * circula CMPX, sin cifras inventadas.
 * O4: tarjetas reescritas con el criterio de Wacko (creíble = se
 * queda; promesa falsa = se cambia; especulación = solo condicionada
 * a adopción y competencia) y su corrección 04:32 ("entre las
 * pioneras", NO "la primera"); APY 8-18% y 15-35% AMBOS
 * desactualizados según el mismo anexo (§11.2), así que no hay ningún
 * APY vigente en la página; roadmap 2026 → 2027.
 * O5: descargo al pie ("pueden cambiar sin previo aviso").
 *
 * Cubre: (1) un solo asistente renderizado y el que queda responde;
 * (2) distribución sin % y con la nota de revisión; (3) roadmap
 * 2027 y staking en "próximamente" sin APY; (4) tarjetas con el
 * copy honesto; (5) descargo presente; (6) cableado estático (no
 * queda `<TokenChatBot />` en Tokens.tsx).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import Tokens from "@/pages/Tokens";
import { TokenAiChat } from "@/components/tokens/TokenAiChat";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: () => true,
    user: { id: "user-1" },
    shouldUseRealSupabase: () => false,
    profile: null,
  }),
}));

vi.mock("@/features/auth/useBiometricAuth", () => ({
  useBiometricAuth: () => ({
    authenticate: async () => ({ success: false }),
    verifyPin: async () => false,
    isBiometricAvailable: false,
    isBiometricEnabled: false,
    hasPin: false,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/services/payments/NFTService", () => ({
  nftService: { getUserNFTs: async () => [] },
}));

vi.mock("@/services/payments/WalletService", () => ({
  walletService: { getWalletByUserId: async () => null },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: null,
}));

// TokenDashboard es pesado (wallet, staking, NFTs); para la
// composición de /tokens basta con su pieza relevante: el asistente
// REAL (TokenAiChat), que es el que debe quedar como único asistente
// de la página.
vi.mock("@/components/tokens/TokenDashboard", () => ({
  TokenDashboard: () => <TokenAiChat />,
}));

const renderTokens = () =>
  render(
    <MemoryRouter>
      <Tokens />
    </MemoryRouter>,
  );

const tokensSource = () =>
  readFileSync(
    path.resolve(__dirname, "../../pages/Tokens.tsx"),
    "utf-8",
  );

describe("R28-O: página de tokens", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("O1: un solo asistente — queda 'Asistente Token IA', no el chat duplicado", () => {
    renderTokens();

    expect(screen.getAllByText("Asistente Token IA")).toHaveLength(1);
    expect(
      screen.queryByText(/¡Hola Usuario! Bienvenido a tu asistente de tokens Beta/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Escribe tu mensaje..."),
    ).not.toBeInTheDocument();
  });

  it("O1: el asistente que queda responde (saldo) y ya no promete APY en staking", async () => {
    renderTokens();
    const input = screen.getByLabelText("Pregunta al asistente de tokens");

    fireEvent.change(input, { target: { value: "saldo" } });
    fireEvent.submit(input.closest("form")!);
    // La respuesta simulada tarda 1500 ms (setTimeout en TokenAiChat).
    await waitFor(
      () => expect(screen.getByText(/balance combinado/)).toBeInTheDocument(),
      { timeout: 4000 },
    );

    fireEvent.change(input, { target: { value: "staking" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(
      () =>
        expect(
          screen.getByText(/El staking de GTK llegará próximamente/),
        ).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(
      screen.queryByText(/ganar un rendimiento anual/),
    ).not.toBeInTheDocument();
  });

  it("O2: distribución sin % — flujos legibles y nota de revisión", () => {
    renderTokens();

    expect(screen.getByText("Cómo circula CMPX:")).toBeInTheDocument();
    expect(screen.getByText("Venta directa a usuarios")).toBeInTheDocument();
    expect(
      screen.getByText("Recompensas por referidos y actividades"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reserva para desarrollo y marketing"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Distribución:")).not.toBeInTheDocument();
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
    expect(
      screen.getByText(/se publicarán cuando se defina la nueva distribución/),
    ).toBeInTheDocument();
  });

  it("O4: roadmap 2027, staking en próximamente, sin APY vigente", () => {
    renderTokens();

    expect(screen.getByText("Q2 2027")).toBeInTheDocument();
    expect(screen.getByText("Q3 2027")).toBeInTheDocument();
    expect(screen.getByText("Q4 2027")).toBeInTheDocument();
    expect(screen.queryByText("Q2 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Staking (próximamente):")).toBeInTheDocument();
    expect(screen.queryByText("Staking Tiers:")).not.toBeInTheDocument();
    expect(
      screen.getByText(/hoy no hay ningún APY vigente/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/8-18%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/15-35%/)).not.toBeInTheDocument();
  });

  it("O4: tarjetas honestas — pioneras, sin 'la primera' ni 40M+ ni promesas", () => {
    renderTokens();

    expect(
      screen.getByText("Entre las Pioneras con Token Nativo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/impulsando la adopción de criptomonedas en apps/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no hay apreciación garantizada/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Blockchain y NFTs se suman próximamente/),
    ).toBeInTheDocument();
    expect(screen.queryByText("First Mover Advantage")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Primera plataforma social en México con token nativo/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/40M\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/valor creciente/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ingresos pasivos/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/genera ingresos recurrentes/),
    ).not.toBeInTheDocument();
  });

  it("O5: descargo al pie — cifras, porcentajes y fechas pueden cambiar sin previo aviso", () => {
    renderTokens();

    // La frase aparece también en la nota del roadmap; el descargo
    // completo (con "Aviso:" y "de esta página") es único.
    expect(
      screen.getByText(
        /Aviso: las cifras, porcentajes y fechas de esta página pueden cambiar sin previo aviso/,
      ),
    ).toBeInTheDocument();
  });

  it("O1 (estático): Tokens.tsx ya no importa ni renderiza TokenChatBot", () => {
    const src = tokensSource();
    expect(src).not.toContain('import { TokenChatBot }');
    expect(src).not.toContain("<TokenChatBot />");
  });
});
