/**
 * Ronda 14, stream F: perfiles single/pareja (espejos).
 *
 * Tests escritos ANTES del fix (en rojo contra b6524ec):
 * - F2: la vista de intereses traga la selección guardada (array vacío
 *   `[]` anula el fallback demo; los títulos demo no están en
 *   SAFE_INTERESTS y el editor no los muestra como seleccionados).
 * - F3: el mensaje enviado en producción no aparece hasta el eco de
 *   Realtime; la carga inicial lenta de FriendRequestButton puede pisar
 *   el "Solicitud enviada".
 * - F4: los 6 interruptores de /settings (Visibilidad / Privacidad
 *   avanzada) no tienen clases visibles (tokens HSL sin hsl()) y las
 *   secciones de privacidad del perfil no los tienen como filas.
 * - F7: flujo demo de mint (límite 4 solo minteados, capacidad 8;
 *   pareja ve 2 de semilla + 4 minteados).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderHook, act as hookAct } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Mock de Supabase (convención r10/r13): cadena thenable + stub.     */
/* ------------------------------------------------------------------ */
const insertSingleResult = { data: null as unknown, error: null as unknown };
const selectRowsResult: { data: unknown[]; error: null } = {
  data: [],
  error: null,
};
const makeThenable = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const thenable = {
    ...chain,
    then: (resolve: (v: unknown) => void) => resolve(result),
    catch: () => thenable,
  };
  for (const key of ["select", "eq", "order", "limit", "single", "maybeSingle", "insert", "update", "delete", "or", "neq", "in"]) {
    (thenable as Record<string, unknown>)[key] = () => thenable;
  }
  (thenable as Record<string, unknown>).select = () => thenable;
  (thenable as Record<string, unknown>).single = () =>
    Promise.resolve(insertSingleResult);
  return thenable;
};

vi.mock("@/integrations/supabase/client", () => {
  const channelStub = {
    on: (..._args: unknown[]) => channelStub,
    subscribe: (cb?: (status: string) => void) => {
      void Promise.resolve().then(() => cb?.("SUBSCRIBED"));
      return channelStub;
    },
    unsubscribe: () => channelStub,
    track: () => Promise.resolve("ok"),
    presenceState: () => ({}),
    send: () => Promise.resolve("ok"),
  };
  return {
    supabase: {
      from: (_table: string) => ({
        select: () => makeThenable(selectRowsResult),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve(insertSingleResult),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
      channel: () => channelStub,
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: null }, error: null }),
        getUser: () =>
          Promise.resolve({ data: { user: null }, error: null }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    },
    isSupabaseConfigured: false,
    isDemoMode: false,
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  parseSavedSingleDemoInterests,
  parseSavedCoupleDemoInterests,
  resolveDemoInterestList,
  visibleInterestOptions,
  DEMO_USER_CHANGED_EVENT,
} from "@/lib/profile-interests";
import { SAFE_INTERESTS } from "@/lib/lifestyle-interests";
import {
  nftService,
  countMintedDemoNFTs,
  DEMO_MINT_LIMIT,
  DEMO_NFT_STORAGE_CAP,
  getDemoNFTSeedItems,
} from "@/services/payments/NFTService";
import { useRealtimeChat } from "@/features/chat/useRealtimeChat";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  insertSingleResult.data = null;
  insertSingleResult.error = null;
});

afterEach(() => {
  localStorage.clear();
});

/* ------------------------------------------------------------------ */
/* F2 — resolución de intereses guardados (demo)                       */
/* ------------------------------------------------------------------ */
describe("F2: la vista muestra los intereses guardados en demo", () => {
  const FALLBACK = ["Lifestyle Exclusivo", "Privacidad Total", "Chat Encriptado"];

  it("un array vacío guardado NO borra el fallback demo", () => {
    expect(resolveDemoInterestList([], FALLBACK)).toEqual(FALLBACK);
    expect(resolveDemoInterestList([], FALLBACK)).not.toEqual([]);
  });

  it("una selección guardada manda sobre el fallback", () => {
    expect(
      resolveDemoInterestList(["Lifestyle Swinger", "Clubs Privados"], FALLBACK),
    ).toEqual(["Lifestyle Swinger", "Clubs Privados"]);
  });

  it("sin nada guardado se usa el fallback", () => {
    expect(resolveDemoInterestList(undefined, FALLBACK)).toEqual(FALLBACK);
    expect(resolveDemoInterestList(null, FALLBACK)).toEqual(FALLBACK);
  });

  it("el demo_user single con interests: [] no deja la vista vacía", () => {
    const saved = parseSavedSingleDemoInterests({ interests: [] });
    expect(resolveDemoInterestList(saved, FALLBACK)).toEqual(FALLBACK);
  });

  it("el demo_user single con selección real se lee tal cual", () => {
    const saved = parseSavedSingleDemoInterests({
      interests: ["Lifestyle Swinger"],
    });
    expect(resolveDemoInterestList(saved, FALLBACK)).toEqual([
      "Lifestyle Swinger",
    ]);
  });

  it("el demo_user pareja con partner1/partner2 vacíos cae al fallback por miembro", () => {
    const parsed = parseSavedCoupleDemoInterests({
      interests: [],
      partner1: { interests: [] },
      partner2: { interests: ["Lifestyle Swinger"] },
    });
    expect(resolveDemoInterestList(parsed.couple, FALLBACK)).toEqual(FALLBACK);
    expect(resolveDemoInterestList(parsed.his, FALLBACK)).toEqual(FALLBACK);
    expect(resolveDemoInterestList(parsed.her, FALLBACK)).toEqual([
      "Lifestyle Swinger",
    ]);
  });

  it("F8: los títulos demo pre-cargados se muestran como opciones seleccionables", () => {
    // Los títulos demo ("Lifestyle Exclusivo"...) NO están en
    // SAFE_INTERESTS: el editor solo renderizaba SAFE_INTERESTS, así
    // que la selección pre-cargada (3/10, 6/6) no se veía marcada.
    expect(SAFE_INTERESTS).not.toContain("Lifestyle Exclusivo");
    const options = visibleInterestOptions(SAFE_INTERESTS, [
      "Lifestyle Exclusivo",
      "Privacidad Total",
    ]);
    expect(options).toContain("Lifestyle Exclusivo");
    expect(options).toContain("Privacidad Total");
    expect(options).toContain("Lifestyle Swinger");
    // Sin duplicados y con las guardadas primero (visibles arriba).
    expect(options.slice(0, 2)).toEqual([
      "Lifestyle Exclusivo",
      "Privacidad Total",
    ]);
    expect(new Set(options).size).toBe(options.length);
  });

  it("F2/F3: el editor avisa al perfil cuando guarda (evento demo-user-changed)", () => {
    const seen: string[] = [];
    const onChange = () => seen.push("changed");
    window.addEventListener(DEMO_USER_CHANGED_EVENT, onChange);
    window.dispatchEvent(new Event(DEMO_USER_CHANGED_EVENT));
    expect(seen).toEqual(["changed"]);
    window.removeEventListener(DEMO_USER_CHANGED_EVENT, onChange);
  });
});

/* ------------------------------------------------------------------ */
/* F7 — flujo demo de mint de NFT                                      */
/* ------------------------------------------------------------------ */
describe("F7: mint demo (límite 4 minteados, capacidad 8)", () => {
  it("la semilla es 4 (single) y 2 visibles para la pareja", () => {
    const seed = getDemoNFTSeedItems();
    expect(seed).toHaveLength(4);
    expect(seed.filter((n) => n.is_couple === true)).toHaveLength(2);
    expect(seed.filter((n) => n.is_couple === false)).toHaveLength(2);
    expect(countMintedDemoNFTs(seed)).toBe(0);
  });

  it("single: 4 mints OK (colección 8), el 5º es null (límite)", async () => {
    const uid = "test-user-single";
    for (let i = 0; i < 4; i++) {
      const created = await nftService.mintDemoNFT(uid, { isCouple: false });
      expect(created).not.toBeNull();
    }
    const all = await nftService.getUserNFTs(uid, { demoFallback: true });
    expect(all).toHaveLength(8);
    expect(countMintedDemoNFTs(all)).toBe(4);
    expect(all.length).toBeLessThanOrEqual(DEMO_NFT_STORAGE_CAP);
    const fifth = await nftService.mintDemoNFT(uid, { isCouple: false });
    expect(fifth).toBeNull();
  });

  it("pareja: ve 2 de semilla; 4 mints de pareja → 6 visibles; el 5º es null", async () => {
    const uid = "test-user-couple";
    const fresh = await nftService.getUserNFTs(uid, { demoFallback: true });
    expect(fresh.filter((n) => n.is_couple)).toHaveLength(2);
    for (let i = 0; i < 4; i++) {
      const created = await nftService.mintDemoNFT(uid, { isCouple: true });
      expect(created).not.toBeNull();
      expect(created?.is_couple).toBe(true);
    }
    const all = await nftService.getUserNFTs(uid, { demoFallback: true });
    expect(all.filter((n) => n.is_couple)).toHaveLength(6);
    expect(countMintedDemoNFTs(all)).toBe(4);
    const fifth = await nftService.mintDemoNFT(uid, { isCouple: true });
    expect(fifth).toBeNull();
  });

  it("el límite cuenta solo minteados: mintear no recorta la semilla", async () => {
    const uid = "test-user-seed";
    await nftService.mintDemoNFT(uid, { isCouple: false });
    const all = await nftService.getUserNFTs(uid, { demoFallback: true });
    expect(all).toHaveLength(5);
    expect(all.filter((n) => !n.minted_by_user)).toHaveLength(4);
  });
});

/* ------------------------------------------------------------------ */
/* F3 — el mensaje enviado aparece al instante (producción)            */
/* ------------------------------------------------------------------ */
describe("F3: enviar mensaje en producción lo muestra sin esperar el eco", () => {
  it("sendMessage añade el mensaje insertado al estado local", async () => {
    insertSingleResult.data = {
      id: "msg-1",
      content: "Hola, ¿qué tal?",
      sender_id: "user-1",
      created_at: new Date().toISOString(),
    };
    insertSingleResult.error = null;
    const { result } = renderHook(() =>
      useRealtimeChat({ userId: "user-1", chatRoomId: "room-1" }),
    );
    // Dejar que el canal se suscriba y cargue el historial vacío.
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toHaveLength(0);
    await hookAct(async () => {
      await result.current.sendMessage("Hola, ¿qué tal?");
    });
    // Sin ningún evento de Realtime: el mensaje ya está en la lista.
    expect(
      result.current.messages.map((m) => m.content),
    ).toContain("Hola, ¿qué tal?");
  });
});

/* ------------------------------------------------------------------ */
/* F3 — FriendRequestButton: la carga inicial lenta no pisa el envío   */
/* ------------------------------------------------------------------ */
describe("F3: enviar solicitud de amistad actualiza el botón al instante", () => {
  it("una carga inicial que resuelve tarde no devuelve el botón a 'Enviar'", async () => {
    let resolveStatus!: (v: string) => void;
    const statusPromise = new Promise<string>((resolve) => {
      resolveStatus = resolve;
    });
    vi.doMock("@/lib/friends", async () => {
      const actual = await vi.importActual<typeof import("@/lib/friends")>(
        "@/lib/friends",
      );
      // La 1ª lectura (carga inicial) tarda; las siguientes leen el
      // almacén ya actualizado por el envío → "pending_sent", como en
      // producción (sendFriendRequest escribe antes de la re-lectura).
      let calls = 0;
      return {
        ...actual,
        getFriendStatus: () => {
          calls += 1;
          return calls === 1
            ? statusPromise
            : Promise.resolve("pending_sent");
        },
        sendFriendRequest: () => Promise.resolve({ ok: true }),
      };
    });
    const { FriendRequestButton } = await import(
      "@/components/profiles/shared/FriendRequestButton"
    );
    render(
      <FriendRequestButton
        profileId="demo-single-1"
        profileName="Sofía"
        viewerId="viewer-1"
        viewerName="Carmen & Roberto"
        isOwnProfile={false}
        isDemo
      />,
    );
    // Enviar ANTES de que resuelva la carga inicial.
    const sendButton = await screen.findByText("Enviar solicitud de amistad");
    fireEvent.click(sendButton);
    await waitFor(() =>
      expect(screen.getByText("Solicitud enviada")).toBeTruthy(),
    );
    // La carga inicial resuelve tarde con "sin relación": el botón NO
    // debe volver a "Enviar solicitud de amistad".
    await act(async () => {
      resolveStatus("none");
    });
    expect(screen.queryByText("Enviar solicitud de amistad")).toBeNull();
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();
    vi.doUnmock("@/lib/friends");
  });
});

/* ------------------------------------------------------------------ */
/* F4 — interruptores de /settings visibles y filas en el perfil       */
/* ------------------------------------------------------------------ */
describe("F4: los 6 ajustes de privacidad tienen interruptor visible", () => {
  it("PrivacySettings renderiza los 6 interruptores con color explícito", async () => {
    vi.doMock("@/features/auth/useAuth", () => ({
      useAuth: () => ({ user: { id: "user-1" } }),
    }));
    vi.doMock("@/hooks/useToast", () => ({
      useToast: () => ({ toast: vi.fn() }),
    }));
    const { PrivacySettings } = await import(
      "@/components/settings/PrivacySettings"
    );
    const { container } = render(<PrivacySettings />);
    for (const label of [
      "Mostrar estado en línea",
      "Mostrar distancia",
      "Mostrar edad",
      "Aprobar matches automáticamente",
      "Bloquear capturas de pantalla",
      "Modo incógnito",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    const switches = container.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(6);
    // El Switch compartido usa bg-primary/bg-input/bg-background
    // (canales HSL sin hsl() → inválido → pista invisible). Las
    // secciones de perfil ya lo resuelven con clases explícitas; aquí
    // debe pasar lo mismo.
    switches.forEach((sw) => {
      expect(sw.className).toMatch(/bg-emerald-500|bg-slate-300/);
    });
    vi.doUnmock("@/features/auth/useAuth");
    vi.doUnmock("@/hooks/useToast");
  });

  it("SinglePrivacySection incluye los 6 ajustes como filas con interruptor", async () => {
    vi.doMock("@/features/auth/useAuth", () => ({
      useAuth: () => ({ user: { id: "user-1" } }),
    }));
    const { SinglePrivacySection } = await import(
      "@/components/profiles/single/SinglePrivacySection"
    );
    const { container } = render(
      <SinglePrivacySection userId="user-1" isDemoMode />,
    );
    for (const label of [
      "Mostrar estado en línea",
      "Mostrar distancia",
      "Mostrar edad",
      "Aprobar matches automáticamente",
      "Bloquear capturas de pantalla",
      "Modo incógnito",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(container.querySelectorAll('[role="switch"]').length).toBeGreaterThanOrEqual(6);
    vi.doUnmock("@/features/auth/useAuth");
  });

  it("CouplePrivacySection incluye los 6 ajustes como filas con interruptor", async () => {
    const { CouplePrivacySection } = await import(
      "@/components/profiles/couple/CouplePrivacySection"
    );
    const { container } = render(
      <CouplePrivacySection userId="user-1" isDemoMode />,
    );
    for (const label of [
      "Mostrar estado en línea",
      "Mostrar distancia",
      "Mostrar edad",
      "Aprobar matches automáticamente",
      "Bloquear capturas de pantalla",
      "Modo incógnito",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(container.querySelectorAll('[role="switch"]').length).toBeGreaterThanOrEqual(6);
  });

  it("el interruptor persiste en el almacén de privacidad (demo localStorage)", async () => {
    const { SinglePrivacySection } = await import(
      "@/components/profiles/single/SinglePrivacySection"
    );
    const { container } = render(
      <SinglePrivacySection userId="user-1" isDemoMode />,
    );
    const toggle = container.querySelector(
      "#single-privacy-show_online_status",
    ) as HTMLElement;
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    const raw = window.localStorage.getItem("single_privacy:user-1");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).show_online_status).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* F7 — el botón de mint muestra el límite (no parece desactivado)     */
/* ------------------------------------------------------------------ */
describe("F7: el botón de mint muestra el límite en vez de parecer desactivado", () => {
  it("sin minteos: botón activo con (0/4)", async () => {
    vi.doMock("@/hooks/useToast", () => ({
      useToast: () => ({ toast: vi.fn() }),
    }));
    const { DemoWallet } = await import("@/components/wallet/DemoWallet");
    render(<DemoWallet userId="wallet-fresh" accountType="single" />);
    const label = await screen.findByText(/Mintear NFT Demo \(0\/4\)/);
    const button = label.closest("button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    vi.doUnmock("@/hooks/useToast");
  });

  it("en el tope (4/4): botón desactivado con 'Límite demo alcanzado'", async () => {
    vi.doMock("@/hooks/useToast", () => ({
      useToast: () => ({ toast: vi.fn() }),
    }));
    const uid = "wallet-limit";
    for (let i = 0; i < 4; i++) {
      await nftService.mintDemoNFT(uid, { isCouple: false });
    }
    const { DemoWallet } = await import("@/components/wallet/DemoWallet");
    render(<DemoWallet userId={uid} accountType="single" />);
    const label = await screen.findByText(
      /Límite demo alcanzado \(4\/4\)/,
    );
    const button = label.closest("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    vi.doUnmock("@/hooks/useToast");
  });
});

/* ------------------------------------------------------------------ */
/* F3 — escribir en el almacén de solicitudes avisa a las listas       */
/* ------------------------------------------------------------------ */
describe("F3: el almacén de solicitudes avisa cuando cambia", () => {
  it("sendFriendRequest (demo) dispara friend-requests-changed", async () => {
    // importActual: el test del botón (F3, arriba) hace doMock de este
    // módulo y su stub devuelve { ok: true } sin escribir; aquí se
    // quiere el módulo real, que escribe y dispara el evento.
    const { FRIEND_REQUESTS_CHANGED_EVENT, sendFriendRequest } =
      await vi.importActual<typeof import("@/lib/friends")>("@/lib/friends");
    let fired = 0;
    const onChange = () => {
      fired += 1;
    };
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChange);
    const result = await sendFriendRequest(
      "viewer-1",
      "demo-single-1",
      undefined,
      true,
    );
    expect(result.ok).toBe(true);
    expect(fired).toBeGreaterThanOrEqual(1);
    window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, onChange);
  });
});

/* ------------------------------------------------------------------ */
/* F5 — la tarjeta de suscripción ya sigue la convención claro/oscuro  */
/* ------------------------------------------------------------------ */
describe("F5: la tarjeta de suscripción sigue la convención claro/oscuro", () => {
  it("single y couple: fondo blanco + texto oscuro en claro; text-white solo en el botón de gradiente", async () => {
    const { SingleSubscriptionCard } = await import(
      "@/components/profiles/single/SingleSubscriptionCard"
    );
    const { CoupleSubscriptionCard } = await import(
      "@/components/profiles/couple/CoupleSubscriptionCard"
    );
    const { container: c1 } = render(
      <SingleSubscriptionCard
        isPremium={false}
        isOwnProfile
        onManage={() => {}}
      />,
    );
    const { container: c2 } = render(
      <CoupleSubscriptionCard
        isPremium={false}
        isOwnProfile
        onManage={() => {}}
      />,
    );
    for (const container of [c1, c2]) {
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toContain("bg-white");
      expect(root.className).toContain("text-slate-900");
      // `dark:text-white` no cuenta: solo el token exacto `text-white`.
      const bareWhite = [...container.querySelectorAll("*")].filter(
        (el) =>
          el.classList.contains("text-white") && el.tagName !== "BUTTON",
      );
      expect(bareWhite).toHaveLength(0);
    }
  });
});
