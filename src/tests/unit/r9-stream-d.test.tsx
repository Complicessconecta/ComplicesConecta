/**
 * Ronda 9, stream D: registro (NicknameValidator con cota de espera),
 * selector de cuentas demo, bandeja de solicitudes demo y wallet
 * por usuario en /tokens.
 *
 * Hechos que fijan (test de verificación ronda 8, 2026-11-25
 * 03:13–03:41 CST, veredicto DO NOT MERGE):
 *
 * 1. /auth paso 1 bloqueado: el checker de apodo giraba sin fin y
 *    "Continuar" quedaba deshabilitado (apodos anonr8test y
 *    termr8zz99, >8 s). Sin backend en el preview, el paso 1 debe
 *    resolver con veredicto provisional en tiempo acotado y sin
 *    re-disparos.
 * 2. La lista de cuentas demo ya no aparecía tras el primer login:
 *    /demo solo ofrecía "Explorar como Single/Pareja". El registro
 *    local (`cc_local_demo_accounts_v1`) debe listar TestR7
 *    (testr7@demo.local, ID 6d8057e7…) y anonr8test
 *    (anonr8test@demo.local, ID 5bac1c86…).
 * 3. La solicitud de amistad del anónimo a la pareja nunca llegaba
 *    a la bandeja de la pareja (/requests solo mostraba las 3 fijas):
 *    debe aparecer en Recibidas y aceptar debe crear la amistad.
 * 4. /tokens mostraba la wallet de Sofía en sesión de pareja (CMPX
 *    1350 / GTK 850 / 4 NFTs) en vez de la de la pareja (2000 /
 *    1500 / 2 NFTs): la wallet es por usuario.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";

// El cliente real de Supabase no se puede importar en vitest:
// `AppConfig.supabase.url` es undefined y `normalizeSupabaseUrl`
// revienta al importar el módulo. Misma convención que el resto de
// tests unitarios: mock del cliente (aquí, sin backend, como el
// preview: `isSupabaseConfigured` en false).
const supabaseCalls = vi.hoisted(() => ({ rpc: 0 }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
        }),
        ilike: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    rpc: () => {
      supabaseCalls.rpc += 1;
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  createLocalDemoAccount,
  findLocalDemoAccount,
  findLocalDemoAccountById,
  listLocalDemoAccounts,
} from "@/lib/demo-registration";
import {
  areFriendsSync,
  listIncomingRequestsSync,
  respondFriendRequest,
  resolveDemoProfileName,
  sendFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import { getDemoWalletBalance } from "@/lib/demo-wallet";
import {
  resolveCurrentDemoAccountType,
  resolveDemoAccountType,
} from "@/lib/app-config";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import { NicknameValidator } from "@/components/auth/NicknameValidator";

beforeEach(() => {
  window.localStorage.clear();
  supabaseCalls.rpc = 0;
});

describe("punto 2: registro de cuentas demo locales", () => {
  it("TestR7 y anonr8test tienen los ids del test de verificación ronda 8", () => {
    const testr7 = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
      firstName: "TestR7",
      age: 30,
    });
    const anon = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      firstName: "anonr8test",
      isAnonymous: true,
    });

    // Ids dados por el test de verificación (prefijos): no se inventan,
    // se derivan del email con generateDemoUserUUID.
    expect(testr7.userId.startsWith("6d8057e7")).toBe(true);
    expect(anon.userId.startsWith("5bac1c86")).toBe(true);
    expect(generateDemoUserUUID("testr7@demo.local")).toBe(testr7.userId);
    expect(generateDemoUserUUID("anonr8test@demo.local")).toBe(anon.userId);
  });

  it("listLocalDemoAccounts lista todas las cuentas registradas, ordenadas por apodo", () => {
    createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    createLocalDemoAccount({
      email: "parejatest@demo.local",
      nickname: "ParejaTest",
      accountType: "couple",
    });

    const accounts = listLocalDemoAccounts();
    expect(accounts.map((a) => a.nickname)).toEqual([
      "anonr8test",
      "ParejaTest",
      "TestR7",
    ]);
    expect(
      accounts.find((a) => a.nickname === "anonr8test")?.isAnonymous,
    ).toBe(true);
  });

  it("findLocalDemoAccountById resuelve por id de usuario", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    expect(findLocalDemoAccountById(userId)?.email).toBe(
      "testr7@demo.local",
    );
    expect(
      findLocalDemoAccountById("11111111-2222-4333-8444-555555555555"),
    ).toBeNull();
    expect(findLocalDemoAccount("TestR7")?.userId).toBe(userId);
  });

  it("el registro sobrevive al logout (la sesión se borra, la cuenta no)", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("userType");
    window.localStorage.removeItem("demo_user");

    expect(listLocalDemoAccounts().map((a) => a.userId)).toEqual([userId]);
    expect(findLocalDemoAccount("testr7@demo.local")?.userId).toBe(userId);
  });
});

describe("punto 1: NicknameValidator sin backend", () => {
  /**
   * Réplica del cableado real de los formularios de registro
   * (SingleRegistrationForm / CoupleRegistrationForm): el callback
   * es una arrow inline, así que su identidad cambia en cada render
   * del padre. Antes eso reiniciaba el debounce y relanzaba la
   * verificación en bucle.
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

  it("veredicto provisional sin llamar a la RPC y sin re-disparos", async () => {
    vi.useFakeTimers();
    try {
      const onValidation = vi.fn();
      render(<Harness onValidation={onValidation} />);
      const input = screen.getByPlaceholderText("Tu apodo único");
      fireEvent.change(input, { target: { value: "anonr8test" } });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      expect(onValidation).toHaveBeenCalledWith(true, true, "unverified");
      expect(
        screen.getByText(/No se pudo verificar en el servidor/),
      ).toBeTruthy();
      // Sin backend no se intenta nada contra el servidor.
      expect(supabaseCalls.rpc).toBe(0);

      // Sin re-disparos: 10 s más no vuelven a llamar ni a cambiar
      // el veredicto (antes el ciclo padre↔checker no terminaba).
      const callsBefore = onValidation.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(supabaseCalls.rpc).toBe(0);
      expect(onValidation.mock.calls.length).toBe(callsBefore);
    } finally {
      vi.useRealTimers();
    }
  });

  it("un apodo reservado se marca como usado sin llamar a la RPC", async () => {
    vi.useFakeTimers();
    try {
      const onValidation = vi.fn();
      render(<Harness onValidation={onValidation} />);
      fireEvent.change(screen.getByPlaceholderText("Tu apodo único"), {
        target: { value: "admin" },
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(onValidation).toHaveBeenCalledWith(true, false, "taken");
      expect(screen.getByText(/Este apodo está reservado/)).toBeTruthy();
      expect(supabaseCalls.rpc).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("punto 3: solicitud de amistad demo de anónimo a pareja", () => {
  it("la solicitud llega a la bandeja del destinatario y aceptar crea la amistad", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    const anon = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    const coupleId = couple.userId;
    const anonId = anon.userId;

    // La pareja canónica es Carmen & Roberto (id del test ronda 8).
    expect(coupleId).toBe("48bb1f12-ff99-4ff9-a900-0000ff99c6cb");
    expect(areFriendsSync(anonId, coupleId)).toBe(false);

    // El gate ("Solicitar ver perfil") envía amistad demo.
    const sent = await sendFriendRequest(anonId, coupleId, undefined, true);
    expect(sent.ok).toBe(true);

    // La bandeja del destinatario la ve (antes: solo las 3 fijas).
    const incoming = listIncomingRequestsSync(coupleId);
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.fromId).toBe(anonId);
    expect(incoming[0]?.toId).toBe(coupleId);
    expect(incoming[0]?.kind).toBe("friendship");
    expect(incoming[0]?.status).toBe("pending");

    // El nombre visible del remitente se resuelve (no el id crudo).
    expect(resolveDemoProfileName(anonId)).toBe("anonr8test");
    expect(resolveDemoProfileName(coupleId)).toBe("Carmen & Roberto");
    expect(resolveDemoProfileName("11111111-2222-4333-8444-555555555555")).toBe(
      "11111111-2222-4333-8444-555555555555",
    );

    // Aceptar crea la amistad: el gate se levanta.
    const responded = await respondFriendRequest(
      incoming[0]!.id,
      "accepted",
      true,
    );
    expect(responded.ok).toBe(true);
    expect(areFriendsSync(anonId, coupleId)).toBe(true);
    expect(listIncomingRequestsSync(coupleId)).toHaveLength(0);
  });

  it("rechazar no crea amistad y una solicitud de fotos usa su propio kind", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
    });
    const anon = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    const sent = await sendPhotoAccessRequest(
      anon.userId,
      couple.userId,
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);

    const incoming = listIncomingRequestsSync(couple.userId, "photo_access");
    expect(incoming).toHaveLength(1);
    expect(listIncomingRequestsSync(couple.userId, "friendship")).toHaveLength(
      0,
    );

    const declined = await respondFriendRequest(
      incoming[0]!.id,
      "declined",
      true,
    );
    expect(declined.ok).toBe(true);
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(false);
  });
});

describe("punto 4: wallet por usuario", () => {
  it("la pareja canónica tiene 2000/1500/2 y Sofía 1250/850/4", () => {
    expect(getDemoWalletBalance("couple")).toEqual({
      cmpx: 2000,
      gtk: 1500,
      nfts: 2,
    });
    expect(getDemoWalletBalance("single")).toEqual({
      cmpx: 1250,
      gtk: 850,
      nfts: 4,
    });
    // Sin tipo, el fallback es single (igual que antes).
    expect(getDemoWalletBalance(null)).toEqual({
      cmpx: 1250,
      gtk: 850,
      nfts: 4,
    });
  });

  it("resolveCurrentDemoAccountType: perfil > user > demo_user guardado", () => {
    // El mock de `user` de useAuth en la ruta de inicialización no
    // trae tipo: solo {id, email}. El perfil cargado sí.
    const coupleUser = {
      id: "48bb1f12-ff99-4ff9-a900-0000ff99c6cb",
      email: "pareja@outlook.es",
    };
    const coupleProfile = { ...coupleUser, profile_type: "couple" };
    expect(resolveCurrentDemoAccountType(coupleProfile, coupleUser)).toBe(
      "couple",
    );

    // Sin perfil, el email canónico resuelve (resolveDemoAccountType).
    expect(resolveCurrentDemoAccountType(null, coupleUser)).toBe("couple");
    expect(
      resolveCurrentDemoAccountType(null, {
        id: "609dcb3b-23f7-423f-a700-00023f74b708",
        email: "single@outlook.es",
      }),
    ).toBe("single");

    // Cuenta @demo.local sin tipo en `user`: la salva el demo_user
    // guardado (forma Profile) o la clave userType.
    const localCoupleUser = {
      id: "aaaaaaaa-1111-4222-8333-444444444444",
      email: "parejatest@demo.local",
    };
    expect(resolveCurrentDemoAccountType(null, localCoupleUser)).toBeNull();
    window.localStorage.setItem(
      "demo_user",
      JSON.stringify({ ...localCoupleUser, accountType: "couple" }),
    );
    expect(resolveCurrentDemoAccountType(null, localCoupleUser)).toBe(
      "couple",
    );

    window.localStorage.removeItem("demo_user");
    window.localStorage.setItem("userType", "couple");
    expect(resolveCurrentDemoAccountType(null, localCoupleUser)).toBe(
      "couple",
    );

    // Forma entrecomillada ('"couple"'): la deja el setter de
    // usePersistedState de DemoSelector (JSON.stringify) y los
    // lectores en crudo no la ven; el resolver sí debe verla.
    window.localStorage.setItem("userType", '"couple"');
    expect(resolveCurrentDemoAccountType(null, localCoupleUser)).toBe(
      "couple",
    );

    // Sin ninguna fuente, null (el llamador decide el fallback).
    window.localStorage.clear();
    expect(resolveCurrentDemoAccountType(null, localCoupleUser)).toBeNull();
    expect(resolveDemoAccountType(localCoupleUser)).toBeNull();
  });
});
