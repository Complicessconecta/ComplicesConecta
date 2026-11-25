/**
 * Ronda 10, stream D: cobertura de las correcciones de la ronda.
 *
 * Completa lo que NO cubrían los tests de ronda 9 (r9-stream-a:
 * reglas del anónimo a nivel lib; r9-stream-d / r9-stream-d-ui:
 * registro demo local, merge de solicitudes y wallet por usuario):
 *  - D1: botón "Crear cuenta demo anónima" siempre visible en /demo
 *    (o deshabilitado con el motivo si ya existe una).
 *  - D2: fallback del avatar en /requests (nunca un id numérico/UUID
 *    como glifo; icono de persona o iniciales).
 *  - D3: bloqueo de cartera anónima, gate de chat (casos que faltaban),
 *    merge de solicitudes en Recibidas (acceso a fotos + remitente sin
 *    resolver), persistencia de visibilidad tras logout (capa lib; el
 *    cableado de UI es del stream C) e insignia "Anónimo".
 *
 * Los mocks de useAuth/useToast/supabase son por archivo; los valores
 * de la sesión se controlan con el estado hoisted `authState`.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));
// Funciones de auth estables (hoisted): `useAuth` real recrea estas
// funciones en cada render, y un mock con arrow inline haría lo mismo —
// cualquier efecto que dependa de ellas entraría en bucle infinito.
const mockIsAuthenticated = vi.hoisted(() => () => true);
const mockIsDemo = vi.hoisted(() => () => true);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
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

import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DemoSelector from "@/components/auth/DemoSelector";
import Requests from "@/pages/Requests";
import { AnimatedProfileCard } from "@/components/profiles/shared/AnimatedProfileCard";
import { getAvatarInitials } from "@/lib/avatarFallback";
import {
  ANONYMOUS_WALLET_BLOCKED_REASON,
  canAnonymousChat,
  canAnonymousUseWallet,
} from "@/lib/anonymous";
import { canSendMessageTo } from "@/lib/chatLimits";
import {
  createLocalDemoAccount,
  findLocalAnonymousAccount,
  isAnonymousDemoProfile,
  restoreLocalDemoSession,
} from "@/lib/demo-registration";
import {
  areFriendsSync,
  listIncomingRequestsSync,
  resolveDemoProfileName,
  sendFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import {
  ANONYMOUS_BADGE_LABEL,
  DEFAULT_PRIVACY_SETTINGS,
  getVisibilityBadge,
  isAnonymousDiscoverProfile,
  isProfileInvisible,
  privacyStorageKey,
  readPrivacySettingsSync,
  shouldShowInDiscover,
} from "@/lib/visibility";

beforeEach(() => {
  window.localStorage.clear();
  mockSignIn.mockClear();
  mockNavigate.mockClear();
  mockToast.mockClear();
  authState.user = null;
  authState.profile = null;
});

/* ------------------------------------------------------------------ */
/* D1: botón "Crear cuenta demo anónima" siempre en /demo              */
/* ------------------------------------------------------------------ */

describe("D1: crear cuenta demo anónima en /demo", () => {
  it("sin cuenta anónima: el botón está visible, habilitado y despliega el formulario", () => {
    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", {
      name: "Crear cuenta demo anónima",
    });
    expect(button).toBeTruthy();
    expect(button).toBeEnabled();
    // El formulario aún no está desplegado.
    expect(screen.queryByText("Crear Perfil Anónimo")).toBeNull();

    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: "Ocultar formulario" }),
    ).toBeTruthy();
    // El formulario anónimo es el mismo de los perfiles.
    expect(screen.getByText("Crear Perfil Anónimo")).toBeTruthy();
    expect(screen.getByLabelText("Alias")).toBeTruthy();
  });

  it("con cuenta anónima: el botón sigue visible pero deshabilitado, con el motivo y el apodo", () => {
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });

    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", {
      name: "Crear cuenta demo anónima",
    });
    expect(button).toBeTruthy();
    expect(button).toBeDisabled();
    expect(
      screen.getByText(/Ya existe una cuenta anónima en este dispositivo/),
    ).toBeTruthy();
    expect(screen.getAllByText("anonr8test").length).toBeGreaterThan(0);
    // Sin formulario: no hay forma de crear otra mientras exista una.
    expect(screen.queryByText("Crear Perfil Anónimo")).toBeNull();
    expect(findLocalAnonymousAccount()?.nickname).toBe("anonr8test");
  });

  it("tras borrar la cuenta anónima del registro, el botón vuelve a habilitarse", async () => {
    createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });

    render(
      <MemoryRouter>
        <DemoSelector />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: "Crear cuenta demo anónima" }),
    ).toBeDisabled();

    // Simula el borrado de cuentas demo del stream A: la cuenta sale
    // de `cc_local_demo_accounts_v1` (sin helper público de borrado en
    // esta ronda) y la página recupera el foco.
    const raw = window.localStorage.getItem("cc_local_demo_accounts_v1");
    const accounts = JSON.parse(raw as string) as Array<{
      email: string;
    }>;
    window.localStorage.setItem(
      "cc_local_demo_accounts_v1",
      JSON.stringify(accounts.filter((a) => a.email !== "anonr8test@demo.local")),
    );
    fireEvent(window, new Event("focus"));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Crear cuenta demo anónima" }),
      ).toBeEnabled(),
    );
  });
});

/* ------------------------------------------------------------------ */
/* D2: fallback del avatar (nunca un id como glifo)                    */
/* ------------------------------------------------------------------ */

describe("D2: getAvatarInitials", () => {
  it("nombres de persona dan iniciales (máx. 2 letras)", () => {
    expect(getAvatarInitials("Sofía")).toBe("S");
    expect(getAvatarInitials("Raúl")).toBe("R");
    expect(getAvatarInitials("Anabella & Julio")).toBe("AJ");
    expect(getAvatarInitials("Carmen & Roberto")).toBe("CR");
    expect(getAvatarInitials("Ana María")).toBe("AM");
  });

  it("identificadores crudos devuelven null: el avatar es el icono de persona", () => {
    // El glifo "101" del test de verificación de la ronda 9.
    expect(getAvatarInitials("101")).toBeNull();
    expect(getAvatarInitials("12345")).toBeNull();
    expect(getAvatarInitials("609dcb3b-23f7-423f-a700-00023f74b708")).toBeNull();
    expect(getAvatarInitials("demo-3")).toBeNull();
    expect(getAvatarInitials("demo-social:ana")).toBeNull();
    expect(getAvatarInitials("single@outlook.es")).toBeNull();
    expect(getAvatarInitials("3 Mosqueteros")).toBeNull();
    expect(getAvatarInitials("")).toBeNull();
    expect(getAvatarInitials("   ")).toBeNull();
    expect(getAvatarInitials(null)).toBeNull();
    expect(getAvatarInitials(undefined)).toBeNull();
  });
});

describe("D2: avatar en las tarjetas de /requests", () => {
  it("un remitente sin resolver muestra el icono de persona, no su UUID", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    // Remitente que NO existe en el registro local, el roster ni los
    // datos sociales: su nombre visible es el id crudo (comportamiento
    // documentado de resolveDemoProfileName).
    const unknownSenderId = "11111111-2222-4333-8444-555555555555";
    expect(resolveDemoProfileName(unknownSenderId)).toBe(unknownSenderId);

    restoreLocalDemoSession(couple.profile);
    const sent = await sendFriendRequest(
      unknownSenderId,
      couple.userId,
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    const card = screen
      .getByText(unknownSenderId)
      .closest(".card-accessible") as HTMLElement;
    expect(card).not.toBeNull();
    const avatar = within(card).getByTestId("request-avatar");
    // El círculo no contiene el UUID ni ningún dígito: solo el icono.
    expect(avatar.textContent).toBe("");
    expect(avatar.querySelector("svg")).not.toBeNull();
  });

  it("un remitente con nombre muestra sus iniciales en el avatar", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    restoreLocalDemoSession(couple.profile);
    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    // Invitación fija: "Anabella & Julio" → iniciales "AJ".
    const card = screen
      .getByText("Anabella & Julio")
      .closest(".card-accessible") as HTMLElement;
    expect(card).not.toBeNull();
    expect(within(card).getByTestId("request-avatar").textContent).toBe("AJ");
  });
});

/* ------------------------------------------------------------------ */
/* D3: bloqueo de cartera anónima                                      */
/* ------------------------------------------------------------------ */

describe("D3: bloqueo de cartera anónima", () => {
  it("la billetera está bloqueada para anónimos y libre para el resto, con motivo en español", () => {
    expect(canAnonymousUseWallet(true)).toBe(false);
    expect(canAnonymousUseWallet(false)).toBe(true);
    expect(ANONYMOUS_WALLET_BLOCKED_REASON).toContain("verifica tu perfil");
    expect(ANONYMOUS_WALLET_BLOCKED_REASON).toContain("CMPX");
  });

  it("la cuenta anónima creada por registro se detecta como anónima (el gate tiene de qué colgar)", () => {
    const anon = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    const normal = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
      // Un registro single normal siempre trae datos personales (edad,
      // bio, género): sin ellos, la heurística legado de
      // `isAnonymousDemoProfile` lo clasificaría como anónimo.
      age: 30,
      bio: "Explorando la plataforma.",
      gender: "male",
    });
    expect(isAnonymousDemoProfile(anon.profile)).toBe(true);
    expect(canAnonymousUseWallet(isAnonymousDemoProfile(anon.profile))).toBe(
      false,
    );
    expect(isAnonymousDemoProfile(normal.profile)).toBe(false);
    expect(canAnonymousUseWallet(isAnonymousDemoProfile(normal.profile))).toBe(
      true,
    );
  });
});

/* ------------------------------------------------------------------ */
/* D3: gate de chat (casos que faltaban en r9-stream-a)                */
/* ------------------------------------------------------------------ */

describe("D3: gate de chat con cuentas anónimas", () => {
  it("destinatario anónimo sin amistad: bloqueado; con amistad: permitido", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: false,
        recipientIsAnonymous: true,
        areFriends: false,
      }),
    ).toMatchObject({ allowed: false });
    expect(
      canAnonymousChat({
        senderIsAnonymous: false,
        recipientIsAnonymous: true,
        areFriends: true,
      }),
    ).toMatchObject({ allowed: true });
  });

  it("ambos anónimos sin amistad: bloqueado; con amistad: permitido", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: true,
        areFriends: false,
      }).allowed,
    ).toBe(false);
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: true,
        areFriends: true,
      }).allowed,
    ).toBe(true);
  });

  it("canSendMessageTo aplica la misma regla por el lado del destinatario", () => {
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: true,
        recipientIsAnonymous: true,
        areFriends: false,
      }).allowed,
    ).toBe(false);
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: true,
        recipientIsAnonymous: true,
        areFriends: true,
      }).allowed,
    ).toBe(true);
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: true,
        recipientIsAnonymous: false,
        areFriends: false,
      }).allowed,
    ).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* D3: merge de solicitudes en Recibidas                               */
/* ------------------------------------------------------------------ */

describe("D3: merge de solicitudes locales en Recibidas", () => {
  it("una solicitud de acceso a fotos llega a Recibidas de la pareja con su tipo galería", async () => {
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
    restoreLocalDemoSession(couple.profile);
    const sent = await sendPhotoAccessRequest(
      anon.userId,
      couple.userId,
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);

    const incoming = listIncomingRequestsSync(couple.userId, "photo_access");
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.kind).toBe("photo_access");
    expect(incoming[0]?.fromId).toBe(anon.userId);

    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };
    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("anonr8test", {}, { timeout: 5000 }),
    ).toBeTruthy();
    // La solicitud de fotos lleva el mensaje de galería.
    expect(
      screen.getByText("Solicitud para ver la galería privada"),
    ).toBeTruthy();
    // Las 3 invitaciones fijas siguen ahí (sin duplicados).
    expect(screen.getByText("Anabella & Julio")).toBeTruthy();
    expect(screen.getByText("Carmen & Roberto")).toBeTruthy();
  });

  it("sin solicitudes locales, Recibidas muestra solo las 3 fijas", async () => {
    const couple = createLocalDemoAccount({
      email: "pareja@outlook.es",
      nickname: "Carmen & Roberto",
      accountType: "couple",
      firstName: "Carmen",
      partnerFirstName: "Roberto",
    });
    restoreLocalDemoSession(couple.profile);
    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };

    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Anabella & Julio", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(listIncomingRequestsSync(couple.userId)).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* D3: persistencia de visibilidad (capa lib)                          */
/* ------------------------------------------------------------------ */

describe("D3: persistencia de visibilidad tras cerrar sesión", () => {
  it("invisible guardado se lee igual tras borrar las claves de sesión (logout)", () => {
    const userId = "609dcb3b-23f7-423f-a700-00023f74b708";
    // Lo que escribe la sección de Privacidad (clave por usuario y
    // tipo, independiente de la sesión demo).
    window.localStorage.setItem(
      privacyStorageKey(userId, "single"),
      JSON.stringify({ ...DEFAULT_PRIVACY_SETTINGS, invisible: true }),
    );

    expect(readPrivacySettingsSync(userId, "single").invisible).toBe(true);
    expect(
      isProfileInvisible(readPrivacySettingsSync(userId, "single")),
    ).toBe(true);
    expect(
      getVisibilityBadge(readPrivacySettingsSync(userId, "single"), true)
        .label,
    ).toBe("👻 Invisible");

    // Logout: se borran las claves de sesión, NO la de privacidad.
    window.localStorage.removeItem("demo_authenticated");
    window.localStorage.removeItem("demo_user");
    window.localStorage.removeItem("userType");

    expect(readPrivacySettingsSync(userId, "single").invisible).toBe(true);
    expect(
      shouldShowInDiscover({
        invisible: true,
      }),
    ).toBe(false);
  });

  it("visible por defecto: sin ajustes guardados no es invisible", () => {
    const userId = "48bb1f12-ff99-4ff9-a900-0000ff99c6cb";
    expect(readPrivacySettingsSync(userId, "couple")).toEqual(
      DEFAULT_PRIVACY_SETTINGS,
    );
    expect(
      getVisibilityBadge(readPrivacySettingsSync(userId, "couple"), true)
        .label,
    ).toBe("🟢 En línea");
  });

  it("aceptar una solicitud crea la amistad: el gate de perfil privado se levanta", async () => {
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
    restoreLocalDemoSession(couple.profile);
    await sendFriendRequest(anon.userId, couple.userId, undefined, true);
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(false);

    authState.user = { id: couple.userId, email: "pareja@outlook.es" };
    authState.profile = { ...couple.profile };
    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>,
    );

    const card = screen
      .getByText("anonr8test")
      .closest(".card-accessible") as HTMLElement;
    fireEvent.click(
      within(card).getByRole("button", { name: /Aceptar/ }),
    );
    await waitFor(
      () => expect(areFriendsSync(anon.userId, couple.userId)).toBe(true),
      { timeout: 3000 },
    );
  });
});

/* ------------------------------------------------------------------ */
/* D3: insignia "Anónimo"                                             */
/* ------------------------------------------------------------------ */

describe("D3: insignia Anónimo", () => {
  it("el perfil anónimo se marca como tal y solo lo ven verificados", () => {
    expect(ANONYMOUS_BADGE_LABEL).toBe("Anónimo");
    expect(isAnonymousDiscoverProfile({ isAnonymous: true })).toBe(true);
    expect(isAnonymousDiscoverProfile({ is_anonymous: true })).toBe(true);
    expect(isAnonymousDiscoverProfile({})).toBe(false);
    expect(
      shouldShowInDiscover(
        { isAnonymous: true },
        null,
        { viewerIsVerified: true },
      ),
    ).toBe(true);
    expect(
      shouldShowInDiscover(
        { isAnonymous: true },
        null,
        { viewerIsVerified: false },
      ),
    ).toBe(false);
    expect(shouldShowInDiscover({ isAnonymous: true })).toBe(false);
  });

  it("la tarjeta de perfil muestra la insignia Anónimo solo si es anónimo", () => {
    const { rerender } = render(
      <AnimatedProfileCard
        id={1}
        name="Invitado"
        age={28}
        location="Ciudad de México"
        image="https://example.com/foto.jpg"
        isAnonymous
      />,
    );
    expect(screen.getByText("Anónimo")).toBeTruthy();

    rerender(
      <AnimatedProfileCard
        id={1}
        name="Sofía"
        age={28}
        location="Ciudad de México"
        image="https://example.com/foto.jpg"
      />,
    );
    expect(screen.queryByText("Anónimo")).toBeNull();
  });
});
