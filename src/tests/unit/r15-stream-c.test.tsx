/**
 * Ronda 15, stream C — 4 puntos del test dirigido + humo del PR #74
 * (2026-11-26 02:27–02:44 CST, navegador del teléfono de Wacko, 886 px,
 * solo cuentas demo; veredicto DO NOT MERGE):
 *
 * 1. Contraste en tema claro (bloqueador 3): /settings con texto blanco
 *    sobre claro (título, subtítulo, "Volver al Inicio", pestaña
 *    "Privacidad", botón "Guardar Configuración"); misma clase de bug en
 *    la tarjeta "¿Tienes un Club?" de /clubs, el aviso de la wallet demo
 *    y la pastilla "✓ Amigos" del perfil público de Ana. Además los
 *    valores de los campos de ambos editores de perfil se veían oscuros
 *    sobre fondo oscuro ("Sofía", "Roberto").
 *    Causa raíz: `bg-love-gradient` / `bg-primary` / `bg-card` y demás
 *    tokens compilan a nada o a declaraciones inválidas bajo Tailwind v4
 *    + @theme inline (misma clase que ronda 13 D1 y ronda 14 F4); las
 *    páginas además sobreescribían los defaults correctos de Tabs con
 *    `text-white`.
 * 2. Eliminar colgado: "Eliminar cuenta permanentemente" desde /settings
 *    se quedaba en "Eliminando…" >13 s (DataPrivacyService encadena ~8
 *    idas a Supabase para un UUID demo que no existe); el Eliminar de
 *    /demo sí funciona (deleteActiveDemoSession, síncrono). /settings
 *    ahora usa ese camino en sesión demo.
 * 3. Conteo de reseñas: el encabezado decía "(128 reseñas)" mientras la
 *    sección decía 129 — el encabezado ahora lee el mismo almacén y se
 *    actualiza con el evento `cc:club-user-reviews-changed`.
 * 4. Dock lento: la URL cambiaba al instante pero el contenido tardaba
 *    segundos. Causa: TODAS las rutas lazy dependían de los chunks
 *    gigantes pages-ai (6,3 MB), pages-chat (1,6 MB) y pages-large
 *    (2,3 MB), precargados en el boot; el grupo `shared-core` de
 *    vite.config.ts los saca a un chunk pequeño. Además `lazyWithDefault`
 *    cacheaba el import rechazado (un fallo transitorio de chunk
 *    envenenaba la ruta hasta recargar): ahora reintenta una vez.
 *
 * Convención de mocks: misma que r14-stream-b (Supabase con modos,
 * useAuth con estado hoisted, useToast) + useBiometricAuth simulado
 * para que BiometricSettings no toque `navigator.credentials` en el test.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
  isDemo: false,
}));
const supabaseBehavior = vi.hoisted(() => ({
  mode: "reject" as "reject" | "empty",
}));

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
    q.single = () =>
      supabaseBehavior.mode === "empty"
        ? Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          })
        : stubError();
    q.maybeSingle = () =>
      supabaseBehavior.mode === "empty"
        ? Promise.resolve({ data: null, error: null })
        : stubError();
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      (supabaseBehavior.mode === "reject"
        ? stubError()
        : Promise.resolve({ data: [], error: null })).then(
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

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: authState.profile,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: () => Boolean(authState.user),
    isAdmin: () => false,
    isDemo: () => authState.isDemo,
    isDemoMode: () => authState.isDemo,
    getProfileType: () => "single",
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

vi.mock("@/features/auth/useBiometricAuth", () => ({
  useBiometricAuth: () => ({
    isLoading: false,
    isEnabled: false,
    checkBiometricAvailability: vi.fn(),
    getBiometricConfig: () => Promise.resolve(null),
    setBiometricEnabled: vi.fn(),
    registerBiometric: vi.fn(),
    clearBiometricSessions: vi.fn(),
  }),
}));

vi.mock("@/services/clubs/clubContentService", () => ({
  loadClubEvents: vi.fn().mockResolvedValue({ items: [] }),
  loadClubDiscounts: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { Suspense, Component, type ReactNode } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Settings from "@/pages/Settings";
import { Clubs } from "@/pages/Clubs";
import { DemoWallet } from "@/components/wallet/DemoWallet";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { ClubProfileHeader } from "@/components/clubs/ClubProfileHeader";
import { ClubProfileReviews } from "@/components/clubs/ClubProfileReviews";
import { lazyWithDefault } from "@/utils/lazyWithDefault";
import {
  createLocalDemoAccount,
  getActiveDemoSession,
  listLocalDemoAccounts,
} from "@/lib/demo-registration";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import type { Club } from "@/entities/club";

/** ¿La clase `cls` aparece como token suelto (sin prefijo `dark:`)? */
const hasBareClass = (el: Element | null, cls: string) =>
  !!el && new RegExp(`(^|\\s)${cls}(\\s|$)`).test(el.className);

/** Matcher por textContent completo: el conteo se renderiza como
 *  `(` + nº + ` reseñas)` en nodos de texto separados. */
const byFullText = (text: string) => (_: string, el: Element | null) =>
  el?.textContent === text;

const EDEN_CLUB: Club = {
  id: "eden-noir-test",
  name: "Eden Noir",
  slug: "eden-noir",
  address: "Av. de los Insurgentes 123",
  city: "Ciudad de México",
  latitude: 19.4326,
  longitude: -99.1332,
  is_featured: false,
  is_active: true,
  membership_tier: "free",
  rating_average: 4.5,
  rating_count: 128,
  check_in_count: 0,
};

function seedDemoSingle(theme: "light" | "dark") {
  window.localStorage.setItem("demo_authenticated", "true");
  window.localStorage.setItem("userType", "single");
  window.localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: generateDemoUserUUID("single@outlook.es"),
      email: "single@outlook.es",
      role: "user",
      accountType: "single",
      profile_type: "single",
      first_name: "Sofía",
      name: "Sofía",
      age: 28,
      location: "CDMX, México",
      bio: "Bio de prueba",
      profession: "Diseñadora",
      is_demo: true,
    }),
  );
  window.localStorage.setItem("demo_theme", JSON.stringify(theme));
  authState.user = { id: generateDemoUserUUID("single@outlook.es") };
  authState.isDemo = true;
}

function seedDemoCouple(theme: "light" | "dark") {
  window.localStorage.setItem("demo_authenticated", "true");
  window.localStorage.setItem("userType", "couple");
  window.localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: generateDemoUserUUID("pareja@outlook.es"),
      email: "pareja@outlook.es",
      role: "user",
      accountType: "couple",
      profile_type: "couple",
      first_name: "Carmen",
      name: "Carmen & Roberto",
      partner1: { firstName: "Roberto", age: 30 },
      partner2: { firstName: "Carmen", age: 28 },
      is_demo: true,
    }),
  );
  window.localStorage.setItem("demo_theme", JSON.stringify(theme));
  authState.user = { id: generateDemoUserUUID("pareja@outlook.es") };
  authState.isDemo = true;
}

beforeEach(() => {
  window.localStorage.clear();
  authState.user = null;
  authState.profile = null;
  authState.isDemo = false;
  mockNavigate.mockClear();
  mockToast.mockClear();
  supabaseBehavior.mode = "reject";
});

/* ------------------------------------------------------------------ */
/* 1 — Contraste en /settings (tema claro)                              */
/* ------------------------------------------------------------------ */
describe("1: /settings legible en tema claro", () => {
  const renderSettings = () =>
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Settings />
      </MemoryRouter>,
    );

  it("título y subtítulo oscuros sobre claro (no text-white suelto)", () => {
    renderSettings();
    const h1 = screen.getByText("Configuración", { selector: "h1" });
    expect(h1.className).toContain("text-slate-900");
    expect(h1.className).toContain("dark:text-white");
    expect(hasBareClass(h1, "text-white")).toBe(false);
    const subtitle = screen.getByText(/Gestiona tu privacidad/);
    expect(subtitle.className).toContain("text-slate-600");
    expect(hasBareClass(subtitle, "text-white")).toBe(false);
  });

  it("'Volver al Inicio' oscuro sobre claro", () => {
    renderSettings();
    const back = screen.getByText("Volver al Inicio").closest("button") as HTMLElement;
    expect(back.className).toContain("text-slate-900");
    expect(back.className).toContain("dark:text-white");
    expect(hasBareClass(back, "text-white")).toBe(false);
  });

  it("pestaña 'Privacidad' activa: fondo blanco y texto oscuro, no blanca sobre blanca", async () => {
    renderSettings();
    const tab = screen.getByRole("tab", { name: /Privacidad/ });
    expect(tab.getAttribute("data-state")).toBe("active");
    expect(tab.className).toContain("text-slate-900");
    expect(tab.className).toContain("bg-white");
    expect(hasBareClass(tab, "text-white")).toBe(false);
    // Al cambiar a otra pestaña, Privacidad queda inactiva y legible.
    // Radix activa el tab en `mousedown` (el click solo no basta).
    const ubicacion = screen.getByRole("tab", { name: /Ubicación/ });
    fireEvent.mouseDown(ubicacion);
    fireEvent.click(ubicacion);
    await waitFor(() =>
      expect(tab.getAttribute("data-state")).toBe("inactive"),
    );
    expect(tab.className).toContain("text-slate-500");
    expect(hasBareClass(tab, "text-white")).toBe(false);
  });

  it("'Guardar Configuración' tiene gradiente real (no bg-love-gradient muerto)", async () => {
    renderSettings();
    const save = await screen.findByText("Guardar Configuración");
    const button = save.closest("button") as HTMLButtonElement;
    expect(button.className).toContain("bg-linear-to-r");
    expect(button.className).toContain("from-fuchsia-600");
    expect(button.className).not.toContain("bg-love-gradient");
    expect(button.className).toContain("text-white");
  });
});

/* ------------------------------------------------------------------ */
/* 1b — Los 3 puntos extra de contraste                                 */
/* ------------------------------------------------------------------ */
describe("1b: los 3 puntos extra de contraste", () => {
  it("/clubs: tarjeta '¿Tienes un Club?' con texto oscuro sobre claro", async () => {
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Routes>
          <Route path="/clubs" element={<Clubs />} />
        </Routes>
      </MemoryRouter>,
    );
    const heading = await screen.findByText("¿Tienes un Club?", {
      timeout: 5000,
    });
    expect(heading.className).toContain("text-slate-900");
    expect(heading.className).toContain("dark:text-white");
    expect(hasBareClass(heading, "text-white")).toBe(false);
    const card = heading.closest(".bg-white") as HTMLElement | null;
    expect(card).not.toBeNull();
  });

  it("DemoWallet: tarjetas con gradiente opaco (no translúcido sobre claro)", () => {
    render(<DemoWallet userId="wallet-r15c" accountType="single" />);
    const title = screen.getByText("Wallet Demo");
    const card = title.closest(".bg-linear-to-br") as HTMLElement | null;
    expect(card).not.toBeNull();
    expect(card!.className).toContain("from-purple-900 to-blue-900");
    expect(card!.className).not.toContain("from-purple-900/40");
    expect(card!.className).not.toContain("to-blue-900/40");
  });

  it("DemoWallet anónimo: aviso ámbar legible en claro (no blanco sobre ámbar)", () => {
    const { userId } = createLocalDemoAccount({
      email: "anon-r15c@outlook.es",
      nickname: "AnonR15C",
      firstName: "Anónimo",
      accountType: "single",
      age: 30,
      isAnonymous: true,
    });
    render(<DemoWallet userId={userId} accountType="single" />);
    const title = screen.getByText("Billetera desactivada en cuentas anónimas");
    expect(title.className).toContain("text-amber-900");
    expect(title.className).toContain("dark:text-white");
    expect(hasBareClass(title, "text-white")).toBe(false);
    const body = screen.getByText(/La billetera está desactivada en cuentas anónimas/);
    expect(body.className).toContain("text-amber-800");
    expect(body.className).toContain("dark:text-white/80");
    expect(hasBareClass(body, "text-white")).toBe(false);
  });

  it("perfil público de Ana: pastilla 'Amigos' verde oscuro sobre claro", async () => {
    vi.doMock("@/lib/friends", async () => {
      const actual = await vi.importActual<typeof import("@/lib/friends")>(
        "@/lib/friends",
      );
      return { ...actual, getFriendStatus: () => Promise.resolve("friends") };
    });
    const { FriendRequestButton: FreshButton } = await import(
      "@/components/profiles/shared/FriendRequestButton"
    );
    render(
      <FreshButton
        profileId="demo-single-1"
        profileName="Ana"
        viewerId="viewer-1"
        viewerName="Sofía"
        isOwnProfile={false}
        isDemo
      />,
    );
    const pill = await screen.findByText(/Amigos/, {}, { timeout: 5000 });
    // Las clases viven en el botón/pastilla ancestro, no en el texto.
    let pillEl: Element | null = pill;
    while (pillEl && !pillEl.className.includes("emerald")) {
      pillEl = pillEl.parentElement;
    }
    expect(pillEl).not.toBeNull();
    expect(pillEl!.className).toContain("text-emerald-700");
    expect(pillEl!.className).toContain("dark:text-emerald-200");
    expect(hasBareClass(pillEl, "text-emerald-200")).toBe(false);
    vi.doUnmock("@/lib/friends");
  });
});

/* ------------------------------------------------------------------ */
/* 1c — Valores de los editores legibles en ambos temas                 */
/* ------------------------------------------------------------------ */
describe("1c: valores de los editores legibles en ambos temas", () => {
  it("editor single, tema claro: 'Sofía' gris oscuro sobre claro", async () => {
    seedDemoSingle("light");
    const { default: EditProfileSingle } = await import(
      "@/pages/profiles/single/EditProfileSingle"
    );
    render(
      <MemoryRouter initialEntries={["/edit-profile-single"]}>
        <EditProfileSingle />
      </MemoryRouter>,
    );
    const input = (await screen.findByDisplayValue("Sofía", {
      timeout: 5000,
    })) as HTMLInputElement;
    expect(input.className).toContain("text-gray-900");
    expect(input.className).toContain("bg-white/20");
    expect(hasBareClass(input, "text-white")).toBe(false);
  });

  it("editor single, tema oscuro: 'Sofía' blanca sobre oscuro", async () => {
    seedDemoSingle("dark");
    const { default: EditProfileSingle } = await import(
      "@/pages/profiles/single/EditProfileSingle"
    );
    render(
      <MemoryRouter initialEntries={["/edit-profile-single"]}>
        <EditProfileSingle />
      </MemoryRouter>,
    );
    const input = (await screen.findByDisplayValue("Sofía", {
      timeout: 5000,
    })) as HTMLInputElement;
    expect(hasBareClass(input, "text-white")).toBe(true);
  });

  it("editor pareja, tema claro: 'Roberto' gris oscuro sobre claro", async () => {
    seedDemoCouple("light");
    const { default: EditProfileCouple } = await import(
      "@/pages/profiles/couple/EditProfileCouple"
    );
    render(
      <MemoryRouter initialEntries={["/edit-profile-couple"]}>
        <EditProfileCouple />
      </MemoryRouter>,
    );
    const input = (await screen.findByDisplayValue("Roberto", {
      timeout: 5000,
    })) as HTMLInputElement;
    expect(input.className).toContain("text-gray-900");
    expect(input.className).toContain("bg-white/20");
    expect(hasBareClass(input, "text-white")).toBe(false);
  });

  it("editor pareja, tema oscuro: 'Roberto' blanco sobre oscuro", async () => {
    seedDemoCouple("dark");
    const { default: EditProfileCouple } = await import(
      "@/pages/profiles/couple/EditProfileCouple"
    );
    render(
      <MemoryRouter initialEntries={["/edit-profile-couple"]}>
        <EditProfileCouple />
      </MemoryRouter>,
    );
    const input = (await screen.findByDisplayValue("Roberto", {
      timeout: 5000,
    })) as HTMLInputElement;
    expect(hasBareClass(input, "text-white")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* 2 — Eliminar desde /settings completa en demo                        */
/* ------------------------------------------------------------------ */
describe("2: eliminar desde /settings completa en demo", () => {
  it("cuenta registrada no canónica: se borra del registro y la sesión, sin quedarse en 'Eliminando...'", async () => {
    const { userId } = createLocalDemoAccount({
      email: "borrar-r15c@outlook.es",
      nickname: "BorrarR15C",
      firstName: "Borrar",
      accountType: "single",
      age: 30,
    });
    // La creación deja la sesión activa (r14-stream-b): verificar.
    expect(getActiveDemoSession()).not.toBeNull();
    expect(getActiveDemoSession()?.isRegistered).toBe(true);
    expect(listLocalDemoAccounts()).toHaveLength(1);

    authState.user = { id: userId };
    authState.isDemo = true;

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <PrivacySettings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Eliminar cuenta permanentemente"));
    const confirm = await screen.findByRole("button", {
      name: "Sí, eliminar mi cuenta",
    });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(listLocalDemoAccounts()).toHaveLength(0);
    });
    expect(getActiveDemoSession()).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "✅ Cuenta eliminada" }),
    );
    // El botón no se quedó colgado en "Eliminando...".
    expect(
      screen.queryByText("Eliminando...", { selector: "button *" }),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 3 — Conteo de reseñas vivo                                           */
/* ------------------------------------------------------------------ */
describe("3: el encabezado usa el conteo vivo de reseñas", () => {
  const seedOneReview = () =>
    window.localStorage.setItem(
      "cc_club_reviews_v1:eden-noir-test",
      JSON.stringify([
        {
          id: "r1",
          author: "Sofía",
          rating: 5,
          comment: "Muy buen ambiente.",
          date: new Date().toISOString(),
        },
      ]),
    );

  it("con 1 reseña de usuario y rating_count 128, el encabezado dice 129", () => {
    seedOneReview();
    render(<ClubProfileHeader club={EDEN_CLUB} />);
    expect(screen.getByText(byFullText("(129 reseñas)"))).toBeTruthy();
    expect(screen.queryByText(byFullText("(128 reseñas)"))).toBeNull();
  });

  it("publicar otra reseña actualiza el encabezado a 130 sin recargar", async () => {
    seedOneReview();
    render(
      <MemoryRouter>
        <ClubProfileHeader club={EDEN_CLUB} />
        <ClubProfileReviews
          reviews={[]}
          averageRating={4.5}
          totalReviews={128}
          clubId="eden-noir-test"
          currentUserName="Sofía"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(byFullText("(129 reseñas)"))).toBeTruthy();
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Segunda visita, todo excelente." },
    });
    fireEvent.click(screen.getByText("Publicar reseña"));
    await waitFor(() => {
      expect(screen.getByText(byFullText("(130 reseñas)"))).toBeTruthy();
    });
    expect(screen.queryByText(byFullText("(129 reseñas)"))).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 4 — El contenido del dock cambia de inmediato (lazy con reintento)   */
/* ------------------------------------------------------------------ */
describe("4: lazyWithDefault reintenta un fallo transitorio de chunk", () => {
  class ErrorBoundary extends Component<
    { children: ReactNode },
    { error: Error | null }
  > {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    componentDidCatch() {
      /* El error se afirma en el estado, no se propaga al test. */
    }
    render() {
      return this.state.error
        ? `Error: ${this.state.error.message}`
        : this.props.children;
    }
  }

  it("el importador falla una vez y luego resuelve: la ruta pinta", async () => {
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("chunk load failed"))
      .mockResolvedValue({
        default: () => <div>Contenido de Config</div>,
      });
    const LazyConfig = lazyWithDefault(importer);
    render(
      <Suspense fallback={<div>Cargando…</div>}>
        <LazyConfig />
      </Suspense>,
    );
    expect(await screen.findByText("Contenido de Config")).toBeTruthy();
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it("el importador falla siempre: rechaza tras el único reintento (sin bucle)", async () => {
    const importer = vi
      .fn()
      .mockRejectedValue(new Error("chunk load failed"));
    const LazyConfig = lazyWithDefault(importer);
    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Cargando…</div>}>
          <LazyConfig />
        </Suspense>
      </ErrorBoundary>,
    );
    expect(await screen.findByText(/Error: chunk load failed/)).toBeTruthy();
    expect(importer).toHaveBeenCalledTimes(2);
  });
});
