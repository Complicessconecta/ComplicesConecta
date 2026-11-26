/**
 * Ronda 14, stream E: el flujo demo de clubs está al revés, con la
 * navegación "Volver" rota y sin salida de la sesión demo.
 *
 * E1. /clubs/demo abre en vista ADMIN/CREADOR por defecto
 *     ("Panel Admin — Vista de creador — Modo Demo", `showAdminPanel`
 *     inicial `true`, ClubsDemo.tsx:296 — decisión de la ronda 3 que
 *     Wacko revierte el 2026-11-26): debe abrir en vista PÚBLICA y el
 *     admin solo entra por la acción explícita "Panel Admin".
 * E2. "Volver" en el flujo de clubs: falta en la vista admin, y el de
 *     la vista pública de /clubs/demo va siempre a /clubs-public aunque
 *     se venga de /clubs (salto a una sección que no es la anterior).
 * E3. "Cerrar sesión" solo existe en la cabecera de /clubs/demo
 *     (MainLayout, `isClubDemoRoute`): en la vista pública y en el
 *     listado no hay forma de cerrar la sesión demo y queda abierta.
 *     La vista admin debe exigir la sesión demo del club: tras el
 *     logout, una visita a /clubs/demo muestra la vista pública.
 *
 * Sesión demo del club (`src/lib/clubDemoSession.ts`, nuevo): clave
 * `demo_club_admin` en localStorage. Con prefijo `demo_` la barren
 * `clearDemoAuth` (app-config) y `StorageManager.clearDemoSession`
 * en cada logout, así que el "Cerrar sesión" de la cabecera global
 * también la limpia. Entrar al admin la marca; salir del admin o
 * cerrar sesión la borra.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Misma convención que r10-stream-a / r13-stream-d / r14-stream-d: el
// cliente real de Supabase no se puede importar en vitest. La cadena es
// thenable porque ClubAdminPanel hace `await supabase.from("clubs")
// .select(...).order(...)` (Promise.race contra un timeout de 3 s) y
// clubContentService encadena `.eq().eq().order()`; con isDemoMode
// true el servicio devuelve el respaldo demo sin tocar Supabase.
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

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ClubsDemo } from "@/pages/ClubsDemo";
import { ClubsPublic } from "@/pages/ClubsPublic";
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
        <Route
          path="/clubs-public"
          element={<div>Lista pública</div>}
        />
        <Route path="/clubs" element={<div>Directorio de clubs</div>} />
        <Route
          path="/clubs-public/demo"
          element={<div>Perfil público demo</div>}
        />
      </Routes>
    </MemoryRouter>,
  );

const renderClubsPublic = (entries: string[] = ["/clubs-public"]) =>
  render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path="/clubs-public" element={<ClubsPublic />} />
        <Route path="/clubs-public/:slug" element={<ClubsPublic />} />
        <Route path="/clubs" element={<div>Directorio de clubs</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("E1. /clubs/demo abre en vista pública por defecto", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("muestra el formulario de reseña y no la vista de creador", () => {
    renderClubsDemo();
    // Vista pública por defecto: el formulario de ClubProfileReviews
    // (clubId "demo") está a la vista sin pulsar nada (vía que el
    // stream D verificó que funciona en demo).
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(
      screen.queryByText("Vista de creador — Modo Demo"),
    ).toBeNull();
    // El admin sigue a un toque, por acción explícita.
    expect(
      screen.getByRole("button", { name: "Panel Admin" }),
    ).toBeTruthy();
  });

  it("entrar al Panel Admin muestra la vista de creador y marca la sesión", () => {
    renderClubsDemo();
    fireEvent.click(screen.getByRole("button", { name: "Panel Admin" }));
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();
    expect(screen.queryByText("Escribe una reseña")).toBeNull();
    expect(
      window.localStorage.getItem(CLUB_DEMO_ADMIN_SESSION_KEY),
    ).toBe("true");
  });

  it("con sesión de admin guardada, /clubs/demo abre en admin", () => {
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemo();
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();
    expect(screen.queryByText("Escribe una reseña")).toBeNull();
  });
});

describe("E2. Volver en cada vista del flujo de clubs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("Volver en admin vuelve a la vista pública del mismo club y cierra la sesión de admin", () => {
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemo();
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    // Misma ruta, vista pública del mismo club demo.
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(
      screen.queryByText("Vista de creador — Modo Demo"),
    ).toBeNull();
    expect(
      window.localStorage.getItem(CLUB_DEMO_ADMIN_SESSION_KEY),
    ).toBeNull();
  });

  it("Volver en la vista pública sin origen va al listado público", () => {
    renderClubsDemo();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByText("Lista pública")).toBeTruthy();
  });

  it("Volver en la vista pública con origen /clubs vuelve al directorio", () => {
    renderClubsDemo([
      { pathname: "/clubs/demo", state: { from: "/clubs" } },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByText("Directorio de clubs")).toBeTruthy();
  });
});

describe("E3. Cerrar sesión en las vistas demo del club", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("en admin: limpia la sesión demo y vuelve al listado público", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    renderClubsDemo();
    expect(screen.getByText("Vista de creador — Modo Demo")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(
      window.localStorage.getItem(CLUB_DEMO_ADMIN_SESSION_KEY),
    ).toBeNull();
    expect(screen.getByText("Lista pública")).toBeTruthy();
  });

  it("en la vista pública: limpia la sesión demo y vuelve al listado público", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    renderClubsDemo();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(screen.getByText("Lista pública")).toBeTruthy();
  });

  it("tras cerrar sesión, una visita nueva a /clubs/demo muestra la vista pública, no admin", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(CLUB_DEMO_ADMIN_SESSION_KEY, "true");
    const { unmount } = renderClubsDemo();
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );
    expect(screen.getByText("Lista pública")).toBeTruthy();
    unmount();

    // Visita nueva, sin sesión: pública, no admin.
    renderClubsDemo();
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(
      screen.queryByText("Vista de creador — Modo Demo"),
    ).toBeNull();
  });

  it("sin sesión demo no hay botón Cerrar sesión en la vista pública", () => {
    renderClubsDemo();
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).toBeNull();
  });

  it("en /clubs-public: con sesión demo hay Cerrar sesión; al pulsar limpia y desaparece", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    renderClubsPublic();
    expect(screen.getByText("Club Demo CómplicesConecta")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).toBeNull();
  });

  it("en /clubs-public/demo: Cerrar sesión limpia y vuelve al listado", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    renderClubsPublic(["/clubs-public/demo"]);
    expect(screen.getByText("Club Demo CómplicesConecta")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    // El listado público (la tarjeta "¿Tienes un club?" solo está ahí).
    expect(screen.getByText("¿Tienes un club?")).toBeTruthy();
  });

  it("en /clubs-public sin sesión demo no hay botón Cerrar sesión", () => {
    renderClubsPublic();
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).toBeNull();
  });
});

describe("E3. Sesión demo del club (lógica)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("enter/has/clear de la sesión de admin", () => {
    expect(hasClubDemoAdminSession()).toBe(false);
    enterClubDemoAdminSession();
    expect(hasClubDemoAdminSession()).toBe(true);
    expect(isClubDemoSessionActive()).toBe(true);
    clearClubDemoAdminSession();
    expect(hasClubDemoAdminSession()).toBe(false);
    expect(isClubDemoSessionActive()).toBe(false);
  });

  it("la sesión demo de la app también activa la sesión del club", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    expect(isClubDemoSessionActive()).toBe(true);
  });

  it("closeClubDemoSession limpia la sesión demo y la de admin", () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", "{}");
    window.localStorage.setItem("userType", "single");
    enterClubDemoAdminSession();
    closeClubDemoSession();
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    expect(window.localStorage.getItem("userType")).toBeNull();
    expect(hasClubDemoAdminSession()).toBe(false);
  });
});
