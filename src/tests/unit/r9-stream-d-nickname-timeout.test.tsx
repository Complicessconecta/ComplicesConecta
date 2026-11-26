/**
 * Ronda 9, stream D, punto 1 (segunda parte): con Supabase configurado
 * pero sin respuesta (red colgada / RPC que nunca resuelve), el paso 1
 * del registro debe resolver con veredicto provisional antes de la
 * cota de 5 s, y no debe re-disparar la verificación en bucle.
 *
 * Archivo aparte de r9-stream-d.test.tsx porque el mock del cliente
 * de Supabase es por archivo: aquí `isSupabaseConfigured` es true y
 * la RPC no resuelve nunca; allí es false y la RPC no debe llamarse.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";

const supabaseCalls = vi.hoisted(() => ({ rpc: 0, from: 0 }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      supabaseCalls.from += 1;
      return {
        select: () => ({
          ilike: () => ({
            // La consulta directa tampoco resuelve nunca.
            limit: () => new Promise(() => {}),
          }),
        }),
      };
    },
    // La RPC no resuelve nunca (red colgada): es el caso del test
    // de verificación ronda 8 (spinner sin fin, >8 s).
    rpc: () => {
      supabaseCalls.rpc += 1;
      return new Promise(() => {});
    },
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: true,
  isDemoMode: false,
}));

import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  NicknameValidator,
  NICKNAME_CHECK_TIMEOUT_MS,
} from "@/components/auth/NicknameValidator";

beforeEach(() => {
  window.localStorage.clear();
  supabaseCalls.rpc = 0;
  supabaseCalls.from = 0;
});

/**
 * Réplica del cableado real de los formularios de registro: callback
 * inline cuya identidad cambia en cada render del padre.
 */
function Harness({
  onValidation,
}: {
  onValidation: (
    isValid: boolean,
    isAvailable: boolean,
    status?: string,
  ) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [validation, setValidation] = useState({
    isValid: false,
    isAvailable: false,
  });
  return (
    <NicknameValidator
      value={nickname}
      onChange={setNickname}
      onValidationChange={(isValid, isAvailable, status) => {
        setValidation({ isValid, isAvailable });
        onValidation(isValid, isAvailable, status);
      }}
    />
  );
}

describe("NicknameValidator con servidor colgado", () => {
  it("resuelve con veredicto provisional antes de la cota de 5 s", async () => {
    expect(NICKNAME_CHECK_TIMEOUT_MS).toBe(5000);
    vi.useFakeTimers();
    try {
      const onValidation = vi.fn();
      render(<Harness onValidation={onValidation} />);
      fireEvent.change(screen.getByPlaceholderText("Tu apodo único"), {
        target: { value: "termr8zz99" },
      });

      // 500 ms de debounce + 5 s de cota: el veredicto llega.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(supabaseCalls.rpc).toBe(1);
      // Todavía sin veredicto: la RPC sigue colgada y el timeout no
      // ha saltado (el spinner es lo correcto aquí).
      expect(onValidation).not.toHaveBeenCalledWith(
        true,
        true,
        "unverified",
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(NICKNAME_CHECK_TIMEOUT_MS);
      });
      expect(onValidation).toHaveBeenCalledWith(true, true, "unverified");
      // El mensaje provisional (ámbar) es la señal de que el estado
      // salió de "checking": reportUnverified pone isChecking=false.
      expect(
        screen.getByText(/No se pudo verificar en el servidor/),
      ).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("no re-dispara la verificación tras el veredicto provisional", async () => {
    vi.useFakeTimers();
    try {
      const onValidation = vi.fn();
      render(<Harness onValidation={onValidation} />);
      fireEvent.change(screen.getByPlaceholderText("Tu apodo único"), {
        target: { value: "termr8zz99" },
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          600 + NICKNAME_CHECK_TIMEOUT_MS + 1000,
        );
      });
      expect(onValidation).toHaveBeenCalledWith(true, true, "unverified");

      const callsBefore = onValidation.mock.calls.length;
      const rpcBefore = supabaseCalls.rpc;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(supabaseCalls.rpc).toBe(rpcBefore);
      expect(onValidation.mock.calls.length).toBe(callsBefore);
    } finally {
      vi.useRealTimers();
    }
  });
});
