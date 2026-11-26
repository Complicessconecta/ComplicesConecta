/**
 * Ronda 15, stream B: /clubs/demo seguía abriendo en admin en runtime
 * (test dirigido + humo del PR #74, 2026-11-26 02:27–02:44 CST,
 * navegador del teléfono de Wacko, 886 px, veredicto DO NOT MERGE).
 *
 * B1. La vista pública renderizaba el panel admin incondicional.
 *     La ronda 14 (stream E) solo cerró la rama admin
 *     (`showAdminPanel` inicial desde `hasClubDemoAdminSession()`),
 *     pero la vista pública de ClubsDemo terminaba con
 *     `<ClubProfileAdmin analytics={DEMO_ANALYTICS} clubId={club.id} />`
 *     (ClubsDemo.tsx:625, antes del fix): el "Panel de Administración"
 *     completo — pestañas Editar Perfil, Imágenes, Eventos…,
 *     "Solo Dueño", "Guardar Cambios" — se veía al bajar, sin sesión
 *     y sin pulsar nada. Su test E1 solo negaba "Vista de creador —
 *     Modo Demo" (el subtítulo de la rama admin), nunca el panel en
 *     la pública. Además la cabecera pública pintaba la insignia
 *     "Admin" y ClubProfileHeader otra ("Admin" con `club.id ===
 *     "demo"`), así que el visitante veía insignias de admin.
 * B2. "Cerrar sesión" en /clubs/demo cerraba TODA la sesión de Sofía.
 *     `closeClubDemoSession` (clubDemoSession.ts:72-76, antes del
 *     fix) llamaba a `clearDemoAuth()`, que borra `demo_authenticated`
 *     y barre todas las claves `demo_*`: /profile-single redirigía
 *     a /auth. Y el botón en página se mostraba con
 *     `isClubDemoSessionActive()`, true también con solo la sesión
 *     demo de la app: Sofía veía "Cerrar sesión" en /clubs/demo sin
 *     haber entrado al admin del club.
 * B3. El "Cerrar sesión" de la cabecera global (MainLayout,
 *     `isClubDemoRoute`) se pintaba siempre en /clubs/demo, también
 *     sin ninguna sesión activa.
 *
 * Fix: el panel admin solo vive en la rama admin de ClubsDemo; la
 * insignia "Admin" de la cabecera pública se quita y la de
 * ClubProfileHeader solo se pinta con `isOwner` (rama admin);
 * `closeClubDemoSession` borra SOLO `demo_club_admin` y el botón en
 * página ("Cerrar sesión del club") solo se muestra con sesión de
 * admin del club; el botón de la cabecera global solo se muestra si
 * hay sesión que cerrar (ese SÍ es el logout de la app, por diseño).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Misma convención que r14-stream-e: el cliente real de Supabase no se
// puede importar en vitest. La cadena es thenable porque ClubAdminPanel
// hace `await supabase.from("clubs").select(...).order(...)`
// (Promise.race contra un timeout de 3 s) y clubContentService encadena
// `.eq().eq().order()`; con isDemoMode true el servicio devuelve el
// respaldo demo sin tocar Supabase.
const makeQuery = () => {
  const q = {
    data: null,
    error: null,
  } as unknown as Record<string, unknown> & {
    then: (resolve: (v: { data: null; error: null }) => void) => void;
  };
  q.then = (resolve) => resolve({ data: null, error: null });
  q.select = () => q;
  q.insert = () => q;
  q.update = () => q;
  q.delete = () => q;
  q.eq = () => q;
  q.order = () => q;
  q.limit = () => q;
  q.single = () => Promise.resolve({ data: null, error: null });
  q.maybeSingle = () => Promise.resolve({ data: null, error: null });
  return q;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => makeQuery(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
    },
  },
  isSupabaseConfigured: false,
  isDemoMode: true,
}));

// Patrón de r14-stream-c: useAuth mockeado con estado hoisted para
// montar MainLayout (B3); ClubsDemo no usa useAuth.
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    profile: authState.profile,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: () => Boolean(authState.user),
    isDemo: () =>
      Boolean((authState.user as { is_demo?: boolean } | null)?.is_demo),
    isDemoMode: () =>
      Boolean((authState.user as { is_demo?: boolean } | null)?.is_demo),
    getProfileType: () => "single",
    shouldUseRealSupabase: () => false,
    appMode: "production" as const,
  }),
}));

const mockToast = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useToast", () => ({
  // Toaster (montado por MainLayout) lee `toasts`: sin él, `toasts.map`
  // rompe el render del layout en el test.
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ClubsDemo } from "@/pages/ClubsDemo";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  CLUB_DEMO_ADMIN_SESSION_KEY,
  clearClubDemoAdminSession,
  closeClubDemoSession,
  enterClubDemoAdminSession,
  hasClubDemoAdminSession,
  isClubDemoSessionActive,
} from "@/lib/clubDemoSession";

const renderClubsDemo = (
  entries: Array<string | { pathname: string; state?: unknown }> = [
    "/clubs/demo",
  ],
) =>
  render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path="/clubs/demo" element={<ClubsDemo />} />
        <Route path="/clubs-public" element={<div>Lista pública</div>} />
        <Route path="/clubs" element={<div>Directorio de clubs</div>} />
        <Route
          path="/clubs-public/demo"
          element={<div>Perfil público demo</div>}
        />
      </Routes>
    </MemoryRouter>,
  );

/** /clubs/demo dentro del layout real (cabecera global incluida). */
const renderClubsDemoInLayout = () =>
  render(
    <MemoryRouter initialEntries={["/clubs/demo"]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/clubs/demo" element={<ClubsDemo />} />
          <Route path="/clubs-public" element={<div>Lista pública</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("B1. Vista pública por defecto: sin panel admin ni insignias Admin", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.user = null;
    authState.profile = null;
  });

  it("sin sesión no hay Panel de Administración, Solo Dueño ni Guardar Cambios", () => {
    renderClubsDemo();
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
    expect(screen.queryByText("Solo Dueño")).toBeNull();
    expect(screen.queryByText("Guardar Cambios")).toBeNull();
    expect(
      screen.queryByText("Vista de creador — Modo Demo"),
    ).toBeNull();
    // Sin insignia "Admin" en la vista pública: ni la de la cabecera
    // de la página ni la de ClubProfileHeader (club.id === "demo").
    expect(screen.queryByText("Admin")).toBeNull();
    // La entrada explícita al admin sigue existiendo.
    expect(
      screen.getByRole("button", { name: "Panel Admin" }),
    ).toBeTruthy();
  });

  it("con solo la sesión demo de la app (Sofía), la pública sigue sin panel admin", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    renderClubsDemo();
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
    expect(screen.queryByText("Solo Dueño")).toBeNull();
    expect(screen.queryByText("Admin")).toBeNull();
    // Y sin botón de cierre del club: Sofía no entró al admin del
    // club, así que no hay sesión del club que cerrar.
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión del club" }),
    ).toBeNull();
  });
});

describe("B2. Admin solo con sesión de club demo o por Panel Admin", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.user = null;
    authState.profile = null;
  });

  it("con sesión de admin guardada, /clubs/demo abre en admin con el panel", () => {
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemo();
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();
    expect(screen.getByText("Panel de Administración")).toBeTruthy();
    expect(screen.getByText("Solo Dueño")).toBeTruthy();
    expect(screen.getByText("Guardar Cambios")).toBeTruthy();
  });

  it("entrar por Panel Admin muestra el panel; Volver vuelve a la pública sin panel", () => {
    renderClubsDemo();
    fireEvent.click(screen.getByRole("button", { name: "Panel Admin" }));
    expect(screen.getByText("Panel de Administración")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
    expect(screen.queryByText("Solo Dueño")).toBeNull();
    expect(screen.queryByText("Admin")).toBeNull();
    expect(
      window.localStorage.getItem(CLUB_DEMO_ADMIN_SESSION_KEY),
    ).toBeNull();
  });
});

describe("B3. Cerrar la sesión del club no desloguea a la usuaria demo", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.user = null;
    authState.profile = null;
  });

  it("en admin: borra solo la sesión del club; demo_authenticated sobrevive", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", "{}");
    window.localStorage.setItem("userType", "single");
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemo();
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión del club" }),
    );

    expect(
      window.localStorage.getItem(CLUB_DEMO_ADMIN_SESSION_KEY),
    ).toBeNull();
    // La sesión demo de la app sigue abierta: /profile-single no
    // redirige a /auth por cerrar el club.
    expect(window.localStorage.getItem("demo_authenticated")).toBe(
      "true",
    );
    expect(window.localStorage.getItem("demo_user")).toBe("{}");
    expect(window.localStorage.getItem("userType")).toBe("single");
    expect(screen.getByText("Lista pública")).toBeTruthy();
  });

  it("tras cerrar la sesión del club, una visita nueva abre en vista pública", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    const { unmount } = renderClubsDemo();
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión del club" }),
    );
    expect(screen.getByText("Lista pública")).toBeTruthy();
    unmount();

    renderClubsDemo();
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
    expect(
      window.localStorage.getItem("demo_authenticated"),
    ).toBe("true");
  });

  it("closeClubDemoSession borra solo la marca de admin del club", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", "{}");
    window.localStorage.setItem("userType", "single");
    enterClubDemoAdminSession();
    expect(hasClubDemoAdminSession()).toBe(true);

    closeClubDemoSession();

    expect(hasClubDemoAdminSession()).toBe(false);
    expect(window.localStorage.getItem("demo_authenticated")).toBe(
      "true",
    );
    expect(window.localStorage.getItem("demo_user")).toBe("{}");
    expect(window.localStorage.getItem("userType")).toBe("single");
  });

  it("enter/has/clear de la sesión de admin siguen funcionando", () => {
    expect(hasClubDemoAdminSession()).toBe(false);
    enterClubDemoAdminSession();
    expect(hasClubDemoAdminSession()).toBe(true);
    expect(isClubDemoSessionActive()).toBe(true);
    clearClubDemoAdminSession();
    expect(hasClubDemoAdminSession()).toBe(false);
    expect(isClubDemoSessionActive()).toBe(false);
  });

  it("la sesión demo de la app sigue activando isClubDemoSessionActive (la usa /clubs-public)", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    expect(isClubDemoSessionActive()).toBe(true);
  });
});

describe("B4. Cabecera global de /clubs/demo: Cerrar sesión solo con sesión", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.user = null;
    authState.profile = null;
  });

  it("sin ninguna sesión no hay botón Cerrar sesión en el encabezado", () => {
    renderClubsDemoInLayout();
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).toBeNull();
    // La página en sí sigue en vista pública.
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(screen.queryByText("Panel de Administración")).toBeNull();
  });

  it("con sesión de admin del club, el encabezado sí ofrece Cerrar sesión (logout global)", () => {
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemoInLayout();
    // Cabecera global (logout de la app) y botón en página (solo club)
    // son dos botones distintos con dos etiquetas distintas.
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión del club" }),
    ).toBeTruthy();
    expect(screen.getByText("Panel de Administración")).toBeTruthy();
  });
});
