// Ronda 20, stream A — tests de la migración World ID v1 → v4
// (@worldcoin/idkit 4.6.0: IDKitRequestWidget + orbLegacy + allow_legacy_proofs).
// Cubre el comportamiento nuevo que la reescritura introduce frente al
// componente v1 anterior (IDKitWidget / VerificationLevel / ISuccessResult):
//  - sin rpContext el botón no abre el widget y avisa que falta configuración
//  - un resultado V3 se convierte a WorldIDProof y se verifica vía worldid-verify
//  - un resultado no-V3 (p. ej. V4) se rechaza ANTES de llamar al servidor
//  - un resultado V3 sin respuestas se rechaza sin llamar al servidor
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import React from "react";

// Props capturadas del widget v4 (para disparar onSuccess/onError a mano).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedWidgetProps: any = null;
const mockInvoke = vi.fn();
const mockToast = vi.fn();

vi.mock("@worldcoin/idkit", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IDKitRequestWidget: (props: any) => {
    capturedWidgetProps = props;
    return <div data-testid="idkit-request-widget" />;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbLegacy: (opts: any) => ({ __preset: "orbLegacy", ...opts }),
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { WorldIDButton as AuthWorldIDButton } from "@/components/auth/WorldIDButton";
import { WorldIDButton as UiWorldIDButton } from "@/components/ui/buttons/WorldIDButton";

// rp_context firmado por el backend (aquí un stub: el componente solo lo
// exige como prop y lo pasa al widget; la firma real es trabajo de backend).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeRpContext = { rp: "stub" } as any;

const v3Result = {
  protocol_version: "3.0",
  nonce: "nonce-1",
  environment: "staging",
  responses: [
    {
      identifier: "proof_of_human",
      proof: "0xproof",
      merkle_root: "0xroot",
      nullifier: "0xnullifier",
    },
  ],
};

const v4Result = {
  protocol_version: "4.0",
  nonce: "nonce-2",
  action: "verify-human",
  environment: "staging",
  responses: [
    {
      identifier: "proof_of_human",
      proof: ["0xproof"],
      session_nullifier: ["0xnull"],
      issuer_schema_id: 11,
      expires_at_min: 9999999999,
      sybil_score: 0,
    },
  ],
};

const verifyOk = {
  data: {
    success: true,
    message: "ok",
    data: {
      user_id: "user-123",
      worldid_verified: true,
      verification_level: "orb",
      rewards: { worldid_reward: 100, referral_reward: 0, total: 100 },
    },
  },
  error: null,
};

function openWidget() {
  fireEvent.click(screen.getByRole("button", { name: /Verificar con World ID/i }));
}

describe.each([
  { name: "auth (@/components/auth/WorldIDButton)", Component: AuthWorldIDButton },
  { name: "ui (@/components/ui/buttons/WorldIDButton)", Component: UiWorldIDButton },
])("WorldIDButton v4 — $name", ({ Component }) => {
  beforeEach(() => {
    capturedWidgetProps = null;
    mockInvoke.mockReset();
    mockToast.mockClear();
    mockInvoke.mockResolvedValue(verifyOk);
  });

  test("sin rpContext: no abre el widget y avisa que falta configuración", () => {
    const onError = vi.fn();
    render(<Component onError={onError} />);
    openWidget();

    expect(screen.queryByTestId("idkit-request-widget")).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "World ID no disponible",
        description: expect.stringContaining("aún no está configurada"),
      }),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("aún no está configurada"),
    );
  });

  test("con rpContext: abre el widget v4 con app_id, action y preset orb", () => {
    render(<Component rpContext={fakeRpContext} />);
    openWidget();

    expect(screen.getByTestId("idkit-request-widget")).toBeInTheDocument();
    expect(capturedWidgetProps).toMatchObject({
      app_id: expect.any(String),
      action: "verify-human",
      rp_context: fakeRpContext,
      allow_legacy_proofs: true,
      autoClose: true,
      language: "es",
    });
    expect(capturedWidgetProps.preset).toMatchObject({
      __preset: "orbLegacy",
      signal: "user-123",
    });
  });

  test("resultado V3: se verifica vía worldid-verify y onSuccess recibe la prueba", async () => {
    const onSuccess = vi.fn();
    render(<Component rpContext={fakeRpContext} onSuccess={onSuccess} />);
    openWidget();
    await act(async () => { await capturedWidgetProps.onSuccess(v3Result); });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("worldid-verify", {
        body: {
          proof: {
            merkle_root: "0xroot",
            nullifier_hash: "0xnullifier",
            proof: "0xproof",
            verification_level: "orb",
            action: "verify-human",
            signal: "user-123",
          },
          user_id: "user-123",
          invited_by: undefined,
        },
      });
    });
    expect(onSuccess).toHaveBeenCalledWith({
      merkle_root: "0xroot",
      nullifier_hash: "0xnullifier",
      proof: "0xproof",
      verification_level: "orb",
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Verificado con World ID/i }),
      ).toBeInTheDocument();
    });
  });

  test("resultado V4: se rechaza antes de llamar al servidor", async () => {
    const onError = vi.fn();
    render(<Component rpContext={fakeRpContext} onError={onError} />);
    openWidget();
    await act(async () => { await capturedWidgetProps.onSuccess(v4Result); });

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error de Verificación" }),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("no compatible con el servidor"),
    );
  });

  test("resultado V3 sin respuestas: se rechaza sin llamar al servidor", async () => {
    const onError = vi.fn();
    render(<Component rpContext={fakeRpContext} onError={onError} />);
    openWidget();
    await act(async () => {
      await capturedWidgetProps.onSuccess({ ...v3Result, responses: [] });
    });

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("no devolvió ninguna prueba"),
    );
  });

  test("error del widget (user_rejected): toast y onError, sin llamar al servidor", async () => {
    const onError = vi.fn();
    render(<Component rpContext={fakeRpContext} onError={onError} />);
    openWidget();
    await act(async () => { await capturedWidgetProps.onError("user_rejected"); });

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error de World ID" }),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("cancelada por el usuario"),
    );
  });
});
