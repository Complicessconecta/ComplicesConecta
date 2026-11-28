/**
 * Ronda 28 — banner persistente del crédito de bienvenida +50 CMPX.
 *
 * Causa (tests dirigidos de las PR #87, #88 y #89, DO NOT MERGE por
 * el ítem 4): en el primer inicio como Single el toast de demo
 * apareció pero el de +50 CMPX NO apareció (saldo correcto 1,300);
 * en el test del PR #89 la segunda oportunidad de la ronda 27
 * TAMPOCO funcionó al recargar /profile-single (10 s, nada),
 * mientras la Pareja sí veía la secuencia completa. La entrega está
 * probada en unit tests con discriminación dos veces (rondas 26/27),
 * pero en vivo el toast no llega al DOM en el primer inicio — y un
 * aviso que se puede perder por tiempos es el UI equivocado para un
 * crédito que el usuario acaba de ganar.
 *
 * El fix: `WelcomeCreditBanner`, renderizado dentro de `DemoWallet`
 * (el componente de billetera compartido por /profile-single y
 * /profile-couple: UN solo punto de integración), muestra el crédito
 * con el mismo copy del toast ("🎁 +50 CMPX de bienvenida", "Tu
 * saldo ahora es de X CMPX.") SOLO si la marca persistente
 * `cc_demo_welcome_toast_pending_v1` sigue presente tras la ventana
 * del toast (8 s = 4 s de diferido + 3,5 s de vida del toast + 0,5 s
 * de margen), y la CONSUME AL MOSTRAR (token exactamente-una-vez).
 * Si el toast se mostró, la marca ya está consumida y no hay banner.
 * Nunca en reentrada (sin marca), nunca para anonymous (sin marca
 * y DemoWallet ni siquiera renderiza el banner en su rama anónima).
 *
 * DISCRIMINACIÓN: estos tests FALLAN contra el árbol de la ronda 27
 * — `WelcomeCreditBanner` no existe (falla el import) y DemoWallet
 * no lo renderiza. Pasan con el fix.
 *
 * Lo que solo el test dirigido en dispositivo puede confirmar es
 * que el banner aparece en vivo en el primer inicio (Pareja PRIMERO
 * en pestaña fresca, luego Single — ver reporte) cuando el toast no
 * aparece, con el saldo correcto, y que nunca duplica un toast que
 * sí se mostró.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockToast = vi.hoisted(() => vi.fn());
const anonState = vi.hoisted(() => ({ isAnonymous: false }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

vi.mock("@/services/payments/NFTService", () => ({
  DEFAULT_DEMO_NFTS: [],
  nftService: {
    getUserNFTs: vi.fn().mockResolvedValue([]),
    mintDemoNFT: vi.fn(),
  },
  DEMO_NFTS_CHANGED_EVENT: "demo-nfts-changed",
  DEMO_MINT_LIMIT: 4,
  countMintedDemoNFTs: () => 0,
}));

vi.mock("@/lib/demo-registration", () => ({
  findLocalDemoAccountById: () =>
    anonState.isAnonymous ? { isAnonymous: true } : undefined,
}));

import { act, render, screen, fireEvent } from "@testing-library/react";
import { WelcomeCreditBanner } from "@/components/wallet/WelcomeCreditBanner";
import { DemoWallet } from "@/components/wallet/DemoWallet";
import {
  DEMO_WELCOME_TOAST_FRESHNESS_MS,
  DEMO_WELCOME_TOAST_PENDING_KEY,
  clearPendingWelcomeToast,
  notifyDemoWelcomeCredit,
  peekPendingWelcomeToast,
  takePendingWelcomeToast,
  takePendingDemoWelcomeCredit,
  type DemoWelcomeCreditEventDetail,
} from "@/lib/demo-wallet";

const CREDIT: DemoWelcomeCreditEventDetail = {
  accountType: "single",
  amount: 50,
  balance: 1300,
};

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function bannerTitle() {
  return screen.queryByText("🎁 +50 CMPX de bienvenida");
}

function writeStaleMark() {
  window.localStorage.setItem(
    DEMO_WELCOME_TOAST_PENDING_KEY,
    JSON.stringify({
      ...CREDIT,
      claimedAt: Date.now() - DEMO_WELCOME_TOAST_FRESHNESS_MS - 1000,
    }),
  );
}

describe("r28 — banner persistente del crédito +50 CMPX", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockToast.mockClear();
    anonState.isAnonymous = false;
    consoleInfoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => {});
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  it("marca presente al montar → banner visible tras 8 s, con el saldo, y la marca queda consumida", () => {
    notifyDemoWelcomeCredit(CREDIT);
    render(<WelcomeCreditBanner />);

    expect(bannerTitle()).toBeNull();
    advance(4000);
    // A los 4 s el toast tendría su oportunidad: el banner aún no.
    expect(bannerTitle()).toBeNull();

    advance(4000);
    expect(bannerTitle()).not.toBeNull();
    expect(
      screen.getByText("Tu saldo ahora es de 1300 CMPX."),
    ).not.toBeNull();
    // Consumida al mostrar: nadie más puede mostrar el aviso.
    expect(peekPendingWelcomeToast()).toBeNull();
    expect(
      consoleInfoSpy.mock.calls.some(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("[toast-diag] banner shown"),
      ),
    ).toBe(true);
  });

  it("toast mostrado primero (marca consumida antes del chequeo) → sin banner", () => {
    notifyDemoWelcomeCredit(CREDIT);
    render(<WelcomeCreditBanner />);

    // Simula el primer intento o la segunda oportunidad: el toast
    // se mostró y consumió la marca antes de la ventana del banner.
    expect(takePendingWelcomeToast()).not.toBeNull();

    advance(8000);
    expect(bannerTitle()).toBeNull();
  });

  it("descartar con «Entendido» cierra el banner y no reaparece al remontar", () => {
    notifyDemoWelcomeCredit(CREDIT);
    const first = render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).not.toBeNull();

    fireEvent.click(screen.getByText("Entendido"));
    expect(bannerTitle()).toBeNull();
    expect(peekPendingWelcomeToast()).toBeNull();
    expect(
      consoleInfoSpy.mock.calls.some(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("[toast-diag] banner dismissed"),
      ),
    ).toBe(true);

    first.unmount();
    render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).toBeNull();
  });

  it("descartar con la X cierra el banner", () => {
    notifyDemoWelcomeCredit(CREDIT);
    render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).not.toBeNull();

    fireEvent.click(screen.getByLabelText("Cerrar aviso de bienvenida"));
    expect(bannerTitle()).toBeNull();
  });

  it("reentrada (sin marca) → sin banner", () => {
    expect(peekPendingWelcomeToast()).toBeNull();
    render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).toBeNull();
  });

  it("marca caduca (>60 s) → sin banner y la marca se borra en silencio", () => {
    writeStaleMark();
    render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).toBeNull();
    expect(window.localStorage.getItem(DEMO_WELCOME_TOAST_PENDING_KEY)).toBeNull();
  });

  it("marca más vieja que la ventana al montar (20 s) → banner inmediato", () => {
    notifyDemoWelcomeCredit(CREDIT);
    // 20 s después: la ventana del toast (8 s) ya pasó.
    advance(20000);
    render(<WelcomeCreditBanner />);
    advance(1);
    expect(bannerTitle()).not.toBeNull();
    expect(
      screen.getByText("Tu saldo ahora es de 1300 CMPX."),
    ).not.toBeNull();
  });

  it("crédito con el perfil ya montado (evento en vivo) → banner 8 s después del evento", () => {
    render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).toBeNull();

    act(() => {
      notifyDemoWelcomeCredit(CREDIT);
    });
    advance(4000);
    expect(bannerTitle()).toBeNull();
    advance(4000);
    expect(bannerTitle()).not.toBeNull();
  });

  it("banner visible una sola vez: tras mostrarse, remontar no lo repite", () => {
    notifyDemoWelcomeCredit(CREDIT);
    const first = render(<WelcomeCreditBanner />);
    advance(8000);
    expect(bannerTitle()).not.toBeNull();

    first.unmount();
    render(<WelcomeCreditBanner />);
    advance(8000);
    // La marca se consumió al mostrar: el segundo montaje no tiene nada.
    expect(bannerTitle()).toBeNull();
  });

  it("integración DemoWallet: con marca, el banner aparece en la billetera tras 8 s", async () => {
    notifyDemoWelcomeCredit(CREDIT);
    render(<DemoWallet userId="demo-user-1" accountType="single" />);
    // Vaciar la carga asíncrona de NFTs (mock resuelve []).
    await act(async () => {});
    expect(bannerTitle()).toBeNull();

    advance(8000);
    expect(bannerTitle()).not.toBeNull();
    expect(
      screen.getByText("Tu saldo ahora es de 1300 CMPX."),
    ).not.toBeNull();
  });

  it("integración DemoWallet: sin marca, no hay banner en la billetera", async () => {
    render(<DemoWallet userId="demo-user-1" accountType="single" />);
    await act(async () => {});
    advance(8000);
    expect(bannerTitle()).toBeNull();
  });

  it("integración DemoWallet anónima: ni con marca presente hay banner (doble guarda)", async () => {
    anonState.isAnonymous = true;
    notifyDemoWelcomeCredit(CREDIT);
    render(<DemoWallet userId="anon-1" accountType="single" />);
    await act(async () => {});
    advance(8000);
    // La rama anónima de DemoWallet muestra la tarjeta de
    // "Billetera desactivada" y ni siquiera monta el banner: en
    // producción esta combinación es imposible (el anónimo nunca
    // acredita, así que nunca se escribe la marca), pero la guarda
    // está aquí por si acaso.
    expect(bannerTitle()).toBeNull();
    expect(screen.getByText(/Billetera desactivada/)).not.toBeNull();
    // La rama anónima ni siquiera monta el banner: la marca queda
    // intacta (en producción esta combinación no existe).
    expect(peekPendingWelcomeToast()).not.toBeNull();
  });
});

describe("r28 — logs [toast-diag] del pipeline del toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "info").mockImplementation(() => {});
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    takePendingDemoWelcomeCredit();
    window.localStorage.clear();
  });

  it("notifyDemoWelcomeCredit registra marca escrita + evento", () => {
    notifyDemoWelcomeCredit(CREDIT);
    expect(console.info).toHaveBeenCalledWith(
      "[toast-diag] notify credit",
      "single",
      50,
      1300,
    );
    // La marca quedó escrita para quien muestre el aviso.
    expect(peekPendingWelcomeToast()).not.toBeNull();
    clearPendingWelcomeToast();
  });
});
