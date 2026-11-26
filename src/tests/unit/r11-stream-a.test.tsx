/**
 * Ronda 11, stream A: los 2 bloqueadores duros del test de la ronda 10
 * (18:02–18:30, veredicto NO fusionar) + verificación del default
 * privado del anónimo, que en la ronda 10 no se pudo verificar en vivo
 * porque el borrado estaba roto.
 *
 * 1h. "Eliminar" en /demo no hacía NADA (5 clics, sin diálogo, sin
 *     toast, sin borrado): la confirmación era window.confirm(), que
 *     en webviews se descarta solo. Ahora es un AlertDialog en la app.
 * 1f. Cuenta atrás de 24 h: formato HH:MM:SS con tick de 1 s, visible
 *     en la galería limitada del anónimo Y en la galería de la pareja
 *     tras aceptar una solicitud de acceso a fotos.
 * 1a. El anónimo recién creado nace privado/invisible por defecto
 *     (badge "Anónimo", selector "🔒 Privado", píldora "👻 Invisible").
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));
const mockIsAuthenticated = vi.hoisted(() => () => true);
const mockIsDemo = vi.hoisted(() => () => true);

// Misma convención que r10-stream-a.test.tsx: el cliente real de
// Supabase no se puede importar en vitest.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: false,
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: authState.profile,
    signIn: mockSignIn,
    isAuthenticated: mockIsAuthenticated,
    isDemo: mockIsDemo,
    isDemoMode: mockIsDemo,
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import {
  formatRemainingHHMMSS,
  canCreateAnonymousAccountOnDevice,
} from "@/lib/anonymous";
import {
  ANONYMOUS_DEFAULT_PRIVACY_SETTINGS,
  getVisibilityBadge,
  hasStoredPrivacySettings,
} from "@/lib/visibility";
import {
  readVisibilityLocal,
  visibilityLabel,
} from "@/lib/profileVisibility";
import {
  createLocalDemoAccount,
  deleteLocalDemoAccount,
  isAnonymousDemoProfile,
  listLocalDemoAccounts,
} from "@/lib/demo-registration";
import {
  getAnonymousPhotoAccessRemainingMs,
  listAnonymousPhotoAccessGrantedBy,
} from "@/lib/friends";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DemoSelector from "@/components/auth/DemoSelector";
import {
  GrantedGalleryAccessList,
  LiveCountdown,
  PhotoAccessCountdown,
} from "@/components/profiles/shared/PhotoAccessCountdown";

const NOW = new Date("2026-11-25T12:00:00.000Z").getTime();
const HOUR_MS = 60 * 60 * 1000;

function seedRequests(requests: Array<Record<string, unknown>>): void {
  window.localStorage.setItem(
    "friend_requests_demo",
    JSON.stringify(requests),
  );
}

function storedInvisible(userId: string): boolean | undefined {
  const stored = JSON.parse(
    window.localStorage.getItem(`single_privacy:${userId}`) ?? "{}",
  ) as { invisible?: boolean };
  return stored.invisible;
}

function renderDemoSelector() {
  return render(
    <BrowserRouter>
      <DemoSelector />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  authState.user = null;
  authState.profile = null;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("1h. Eliminar en /demo con diálogo en la app (sin window.confirm)", () => {
  it("el clic en Eliminar abre el diálogo y window.confirm nunca se llama", () => {
    // jsdom no trae window.confirm: se define para poder espiar si
    // alguien lo llama (la regresión de la ronda 10 era justo eso).
    window.confirm = vi.fn(() => true) as typeof window.confirm;
    const confirmSpy = vi.spyOn(window, "confirm");
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    renderDemoSelector();
    fireEvent.click(
      screen.getByLabelText("Eliminar la cuenta demo anonr8test"),
    );
    expect(screen.getByText("¿Eliminar cuenta demo?")).toBeTruthy();
    // La cuenta sigue listada hasta confirmar.
    expect(screen.getByText("anonr8test")).toBeTruthy();
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("confirmar borra, libera el hueco anónimo y habilita crear otra", () => {
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    renderDemoSelector();
    // Botón de crear anónima deshabilitado mientras hay una.
    expect(
      screen.getByRole("button", { name: "Crear cuenta demo anónima" }),
    ).toHaveProperty("disabled", true);
    fireEvent.click(
      screen.getByLabelText("Eliminar la cuenta demo anonr8test"),
    );
    fireEvent.click(screen.getByText("Sí, eliminar"));
    expect(screen.queryByText("anonr8test")).toBeNull();
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
    // Y el botón de crear vuelve a estar habilitado.
    expect(
      screen.getByRole("button", { name: "Crear cuenta demo anónima" }),
    ).toHaveProperty("disabled", false);
    // Y se puede crear la siguiente (anonr9test).
    expect(() =>
      createLocalDemoAccount({
        email: "anonr9test@demo.local",
        nickname: "anonr9test",
        accountType: "single",
        isAnonymous: true,
      }),
    ).not.toThrow();
  });

  it("borrar también limpia país y NFTs locales de esa cuenta", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
      countryCode: "MX",
    });
    window.localStorage.setItem(
      `demo_nfts:${userId}`,
      JSON.stringify(["nft-1"]),
    );
    expect(
      window.localStorage.getItem(`profile_country:${userId}`),
    ).toBe("MX");
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    expect(
      window.localStorage.getItem(`profile_country:${userId}`),
    ).toBeNull();
    expect(window.localStorage.getItem(`demo_nfts:${userId}`)).toBeNull();
    expect(window.localStorage.getItem(`single_privacy:${userId}`)).toBeNull();
  });

  it("las canónicas no tienen botón de eliminar y el lib las rechaza", () => {
    window.localStorage.setItem(
      "cc_local_demo_accounts_v1",
      JSON.stringify([
        {
          email: "single@outlook.es",
          nickname: "Sofía",
          userId: "canonical-sofia",
          profile: { id: "canonical-sofia", email: "single@outlook.es" },
        },
        {
          email: "pareja@outlook.es",
          nickname: "Carmen & Roberto",
          userId: "canonical-couple",
          profile: { id: "canonical-couple", email: "pareja@outlook.es" },
        },
      ]),
    );
    renderDemoSelector();
    expect(screen.getByText("Sofía")).toBeTruthy();
    expect(screen.getByText("Carmen & Roberto")).toBeTruthy();
    expect(
      screen.queryByLabelText("Eliminar la cuenta demo Sofía"),
    ).toBeNull();
    expect(
      screen.queryByLabelText("Eliminar la cuenta demo Carmen & Roberto"),
    ).toBeNull();
    expect(listLocalDemoAccounts()).toHaveLength(2);
    expect(deleteLocalDemoAccount("canonical-sofia").deleted).toBe(false);
    expect(deleteLocalDemoAccount("canonical-couple").deleted).toBe(false);
    expect(listLocalDemoAccounts()).toHaveLength(2);
  });
});

describe("1f. Cuenta atrás de 24 h en vivo (HH:MM:SS, tick de 1 s)", () => {
  it("formatRemainingHHMMSS: 23:59:59, 00:45:00, 00:00:45, expirado, sin acceso", () => {
    expect(formatRemainingHHMMSS(86_399_000)).toBe("23:59:59");
    expect(formatRemainingHHMMSS(2_700_000)).toBe("00:45:00");
    expect(formatRemainingHHMMSS(45_000)).toBe("00:00:45");
    expect(formatRemainingHHMMSS(0)).toBe("expirado");
    expect(formatRemainingHHMMSS(null)).toBe("sin acceso");
  });

  it("LiveCountdown tickea cada segundo: 00:00:05 → 00:00:04 → 00:00:03", () => {
    render(<LiveCountdown remainingMs={5_000} />);
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "00:00:05",
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "00:00:04",
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "00:00:03",
    );
  });

  it("LiveCountdown avisa al expirar y muestra 'expirado'", () => {
    const onExpire = vi.fn();
    render(<LiveCountdown remainingMs={2_000} onExpire={onExpire} />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "expirado",
    );
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("PhotoAccessCountdown muestra HH:MM:SS con acceso vigente y tickea", () => {
    const viewer = generateDemoUserUUID("viewer@demo.local");
    const owner = generateDemoUserUUID("anon@demo.local");
    seedRequests([
      {
        id: "demo-photo-1",
        fromId: viewer,
        toId: owner,
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - HOUR_MS).toISOString(),
      },
    ]);
    render(<PhotoAccessCountdown viewerId={viewer} ownerId={owner} />);
    // 24 h desde la aceptación (hace 1 h) → 23:00:00 exactas.
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "23:00:00",
    );
    expect(screen.getByText(/Acceso a la galería concedido/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "22:59:58",
    );
  });

  it("PhotoAccessCountdown muestra el texto estático solo sin acceso vigente", () => {
    const viewer = generateDemoUserUUID("viewer@demo.local");
    const owner = generateDemoUserUUID("anon@demo.local");
    render(
      <PhotoAccessCountdown
        viewerId={viewer}
        ownerId={owner}
        fallback={<p>1 acceso concedido expira a las 24 h</p>}
      />,
    );
    expect(screen.queryByTestId("live-countdown")).toBeNull();
    expect(
      screen.getByText("1 acceso concedido expira a las 24 h"),
    ).toBeTruthy();
  });

  it("el acceso concedido a la PAREJA también tiene cuenta atrás (24 h)", () => {
    // Flujo del test ronda 10: anonr8test pide acceso a la pareja, la
    // pareja acepta; la galería de la pareja debe mostrar la cuenta
    // atrás al espectador (y la lista al dueño).
    const viewer = generateDemoUserUUID("anonr8test@demo.local");
    const coupleUserId = generateDemoUserUUID("pareja@outlook.es");
    seedRequests([
      {
        id: "demo-photo-2",
        fromId: viewer,
        toId: coupleUserId,
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 2 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - HOUR_MS).toISOString(),
      },
    ]);
    expect(
      getAnonymousPhotoAccessRemainingMs(viewer, coupleUserId, NOW),
    ).toBe(23 * HOUR_MS);
    // El dueño la ve aunque se le pase la ficha ("demo-couple-456"):
    // la concesión se guarda con el id canónico (ronda 10, C1).
    const granted = listAnonymousPhotoAccessGrantedBy(
      "demo-couple-456",
      NOW,
    );
    expect(granted).toHaveLength(1);
    expect(granted[0]?.remainingMs).toBe(23 * HOUR_MS);
    render(<GrantedGalleryAccessList ownerId="demo-couple-456" />);
    expect(screen.getByTestId("live-countdown").textContent).toBe(
      "23:00:00",
    );
  });

  it("el acceso expirado (25 h) ya no muestra cuenta atrás en la pareja", () => {
    const viewer = generateDemoUserUUID("anonr8test@demo.local");
    const coupleUserId = generateDemoUserUUID("pareja@outlook.es");
    seedRequests([
      {
        id: "demo-photo-3",
        fromId: viewer,
        toId: coupleUserId,
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 26 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
      },
    ]);
    expect(
      getAnonymousPhotoAccessRemainingMs(viewer, coupleUserId, NOW),
    ).toBeNull();
    expect(
      listAnonymousPhotoAccessGrantedBy("demo-couple-456", NOW),
    ).toHaveLength(0);
    render(<GrantedGalleryAccessList ownerId="demo-couple-456" />);
    expect(screen.queryByTestId("live-countdown")).toBeNull();
  });
});

describe("1a. El anónimo recién creado nace privado/invisible por defecto", () => {
  it("crear un anónimo siembra invisible + private y las etiquetas lo muestran", () => {
    const { userId, profile } = createLocalDemoAccount({
      email: "anonr11@demo.local",
      nickname: "anonr11",
      accountType: "single",
      isAnonymous: true,
    });
    expect(isAnonymousDemoProfile(profile)).toBe(true);
    expect(storedInvisible(userId)).toBe(true);
    expect(hasStoredPrivacySettings(userId, "single")).toBe(true);
    expect(readVisibilityLocal(userId)).toBe("private");
    // Píldora "👻 Invisible" y selector "🔒 Privado": lo que lee el
    // encabezado del perfil propio y ProfileSocialSettings.
    expect(
      getVisibilityBadge(
        { ...ANONYMOUS_DEFAULT_PRIVACY_SETTINGS },
        false,
      ).label,
    ).toBe("👻 Invisible");
    expect(visibilityLabel(readVisibilityLocal(userId))).toBe(
      "🔒 Privado",
    );
  });

  it("el selector de /demo muestra la insignia Anónimo en la cuenta nueva", () => {
    createLocalDemoAccount({
      email: "anonr11@demo.local",
      nickname: "anonr11",
      accountType: "single",
      isAnonymous: true,
    });
    renderDemoSelector();
    expect(screen.getByText("anonr11")).toBeTruthy();
    expect(screen.getByText("Anónimo")).toBeTruthy();
  });

  it("tras borrar y recrear, el anónimo nuevo vuelve a nacer privado", () => {
    const first = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    expect(deleteLocalDemoAccount(first.userId)).toEqual({
      deleted: true,
    });
    expect(readVisibilityLocal(first.userId)).toBe("public");
    const second = createLocalDemoAccount({
      email: "anonr9test@demo.local",
      nickname: "anonr9test",
      accountType: "single",
      isAnonymous: true,
    });
    expect(storedInvisible(second.userId)).toBe(true);
    expect(hasStoredPrivacySettings(second.userId, "single")).toBe(true);
    expect(readVisibilityLocal(second.userId)).toBe("private");
    expect(
      visibilityLabel(readVisibilityLocal(second.userId)),
    ).toBe("🔒 Privado");
  });
});
