/**
 * Ronda 16, stream C — 3 menores del test dirigido + humo del PR #75
 * (2026-11-26 04:22–04:41 CST, navegador del teléfono de Wacko, 886 px,
 * preview F2brG4GrE, head d87b362; veredicto DO NOT MERGE, estos tres
 * son menores, no bloqueadores):
 *
 * 1. Conteo de reseñas rancio en la LISTA /clubs: la tarjeta del Club
 *    Demo decía "128 Reseñas" mientras /clubs/demo ya decía 130 (2
 *    reseñas publicadas en el test). La ronda 15 (stream C) dejó vivo
 *    solo el encabezado; la lista seguía con el `rating_count` /
 *    `review_count` estático de la semilla. La tarjeta usa ahora el
 *    mismo mecanismo (`useLiveReviewCount` + evento
 *    `cc:club-user-reviews-changed`).
 * 2. Toast espurio "No se pudieron cargar las notificaciones" en
 *    varias páginas. Causa: la guarda demo de `NotificationBell`
 *    leía `(user as any).is_demo`, pero `user` es el `User` de
 *    Supabase y el mock demo de `useAuth` nunca trae `is_demo` (solo
 *    `profile` lo lleva): la guarda era código muerto y la campana
 *    lanzaba la consulta real con un UUID demo y sin sesión real. La
 *    guarda usa ahora `isDemo()` / `profile.is_demo`, y el fallo de
 *    la carga en segundo plano ya no pinta toast destructivo (queda
 *    en vacío y se registra).
 * 3. Primer click en "Enviar mensaje" del perfil público no hacía
 *    nada visible. Causa: la ruta de chat es lazy y `navigate()` va
 *    en `startTransition` (react-router): en frío la transición
 *    mantiene el perfil visible hasta que llega el chunk, sin
 *    fallback. El botón precarga el chunk con hover/foco y navega
 *    con `flushSync: true`, así que el primer toque pinta el
 *    `PageLoader` de inmediato.
 *
 * Convención de mocks: misma que r15-stream-c (Supabase con modos,
 * useAuth con estado hoisted, useToast, useNavigate mockeado) +
 * `@/pages/Chat` mockeado para observar la precarga.
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
const supabaseFromSpy = vi.hoisted(() => vi.fn());
const chatImportSpy = vi.hoisted(() => vi.fn());

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
    q.limit = () => q;
    q.insert = () => q;
    q.update = () => q;
    q.delete = () => q;
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
      from: (...args: unknown[]) => {
        supabaseFromSpy(...args);
        return makeQuery();
      },
      rpc: () => stubError(),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) }),
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

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/pages/Chat", () => {
  chatImportSpy();
  return { default: () => null };
});

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Clubs } from "@/pages/Clubs";
import {
  ClubProfileReviews,
  USER_REVIEWS_CHANGED_EVENT,
} from "@/components/clubs/ClubProfileReviews";
import { LiveClubReviewCount } from "@/components/clubs/ClubReviewCount";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import ProfileDetailInner from "@/components/profiles/shared/ProfileDetail";
import { generateDemoUserUUID } from "@/lib/demo-uuid";

const REVIEWS_KEY = "cc_club_reviews_v1:demo";

const seedUserReviews = (count: number) =>
  window.localStorage.setItem(
    REVIEWS_KEY,
    JSON.stringify(
      Array.from({ length: count }, (_, i) => ({
        id: `user-review-${i + 1}`,
        userId: "current-user",
        userName: "Sofía",
        rating: 5,
        comment: `Reseña de prueba ${i + 1}.`,
        checkInDate: new Date().toISOString(),
        helpfulCount: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      })),
    ),
  );

/** Sesión demo canónica de Sofía (como r15-stream-c): sin ella el
 *  detalle redirige a /auth y Ana queda tras el gate de privado
 *  (Sofía sí es amiga semilla de Ana). */
function seedDemoSingle() {
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
  authState.user = { id: generateDemoUserUUID("single@outlook.es") };
  authState.isDemo = true;
}

beforeEach(() => {
  window.localStorage.clear();
  authState.user = null;
  authState.profile = null;
  authState.isDemo = false;
  mockNavigate.mockClear();
  mockToast.mockClear();
  supabaseFromSpy.mockClear();
  chatImportSpy.mockClear();
  supabaseBehavior.mode = "reject";
});

/* ------------------------------------------------------------------ */
/* 1 — La tarjeta de /clubs usa el conteo vivo de reseñas               */
/* ------------------------------------------------------------------ */
describe("1: la tarjeta de /clubs usa el conteo vivo de reseñas", () => {
  it("con 2 reseñas de usuario y semilla 128, la tarjeta dice 130", () => {
    seedUserReviews(2);
    render(<LiveClubReviewCount clubId="demo" seedCount={128} />);
    expect(screen.getByText("130")).toBeTruthy();
    expect(screen.queryByText("128")).toBeNull();
  });

  it("publicar una reseña actualiza la tarjeta a 129 sin recargar", async () => {
    render(<LiveClubReviewCount clubId="demo" seedCount={128} />);
    expect(screen.getByText("128")).toBeTruthy();
    await act(async () => {
      seedUserReviews(1);
      window.dispatchEvent(
        new CustomEvent(USER_REVIEWS_CHANGED_EVENT, {
          detail: { clubId: "demo" },
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText("129")).toBeTruthy();
    });
    expect(screen.queryByText("128")).toBeNull();
  });

  it("la reseña de OTRO club no mueve la tarjeta del Demo", async () => {
    seedUserReviews(0);
    render(<LiveClubReviewCount clubId="demo" seedCount={128} />);
    await act(async () => {
      window.localStorage.setItem(
        "cc_club_reviews_v1:eden-noir-test",
        JSON.stringify([
          {
            id: "r1",
            userId: "current-user",
            userName: "Sofía",
            rating: 5,
            comment: "Reseña en otro club.",
            checkInDate: new Date().toISOString(),
            helpfulCount: 0,
            isVerified: false,
            createdAt: new Date().toISOString(),
          },
        ]),
      );
      window.dispatchEvent(
        new CustomEvent(USER_REVIEWS_CHANGED_EVENT, {
          detail: { clubId: "eden-noir-test" },
        }),
      );
    });
    expect(screen.getByText("128")).toBeTruthy();
  });

  it("la tarjeta fija del Club Demo en /clubs dice 130 con 2 reseñas", async () => {
    seedUserReviews(2);
    authState.user = { id: "demo-user-1" };
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Clubs />
      </MemoryRouter>,
    );
    const headings = await screen.findAllByText(
      "Club Demo CómplicesConecta",
      {},
      // Timeout amplio (defecto 1000 ms): con la VM cargada el montaje
      // de /clubs tarda más de 1 s y el find se agota sin que nada esté
      // roto (visto en la corrida completa de la ronda 17).
      { timeout: 5000 },
    );
    // La tarjeta fija va primera en el grid (el catálogo de fallback
    // trae además su propia entrada con el mismo nombre).
    const heading = headings[0]!;
    // La celda "Reseñas" vive en la misma tarjeta (p-6) que el título:
    // su hermana anterior es el nº. Ronda 17 (stream B): "Ratings" es
    // el MISMO contador que "Reseñas" (cada reseña lleva 1–5★), así
    // que con 2 reseñas publicadas ambas celdas dicen 130; la
    // expectativa anterior (Ratings quieto en 128) era el bug que la
    // ronda 17 corrige.
    const cardBody = heading.parentElement as HTMLElement;
    const statsGrid = cardBody.querySelector(".grid.grid-cols-3");
    expect(statsGrid).not.toBeNull();
    const reviewsLabel = Array.from(
      statsGrid!.querySelectorAll("div"),
    ).find((el) => el.textContent === "Reseñas");
    expect(reviewsLabel).toBeTruthy();
    expect(reviewsLabel!.previousElementSibling?.textContent).toBe("130");
    const ratingsLabel = Array.from(
      statsGrid!.querySelectorAll("div"),
    ).find((el) => el.textContent === "Ratings");
    expect(ratingsLabel!.previousElementSibling?.textContent).toBe("130");
  });
});

/* ------------------------------------------------------------------ */
/* 2 — Sin toast de notificaciones en demo ni en fallo de carga         */
/* ------------------------------------------------------------------ */
describe("2: la campana no pinta el toast de error de carga", () => {
  it("usuario demo SIN `is_demo` en `user` (como el mock real de useAuth): usa las demo, sin consultar Supabase ni toast", async () => {
    // El `user` que entrega useAuth en demo es un `User` de Supabase
    // sin `is_demo` (solo `profile` la lleva): la guarda vieja no lo
    // veía y lanzaba la consulta real. Aquí `isDemo()` es la señal.
    authState.user = { id: "demo-user-1", email: "single@outlook.es" };
    authState.profile = null;
    authState.isDemo = true;
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    // Distintivo de las 2 demo (sin esperar a Supabase).
    const bellButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "2");
    expect(bellButton).toBeTruthy();
    // La consulta real nunca se lanzó aunque Supabase esté en "reject".
    expect(supabaseFromSpy).not.toHaveBeenCalledWith("notifications");
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("usuario real con la consulta rechazada: sin toast, campana en vacío", async () => {
    authState.user = { id: "real-user-1", email: "real@outlook.es" };
    authState.profile = null;
    authState.isDemo = false;
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    // La carga se lanzó de verdad y falló (modo "reject").
    await waitFor(() => {
      expect(supabaseFromSpy).toHaveBeenCalledWith("notifications");
    });
    // Ni un toast de error por una carga en segundo plano…
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        description: "No se pudieron cargar las notificaciones",
      }),
    );
    // …y la campana abre el centro en vacío, sin distintivo. La
    // pestaña por defecto ("No leídas") dice "No hay notificaciones
    // nuevas".
    const bellButton = screen.getAllByRole("button")[0]!;
    fireEvent.click(bellButton);
    expect(
      await screen.findByText(
        "No hay notificaciones nuevas",
        {},
        { timeout: 5000 },
      ),
    ).toBeTruthy();
  });

  it("publicar una reseña en /clubs/demo no dispara el toast (regresión cruzada)", async () => {
    authState.user = { id: "demo-user-1", email: "single@outlook.es" };
    authState.isDemo = true;
    render(
      <MemoryRouter>
        <NotificationBell />
        <ClubProfileReviews
          reviews={[]}
          averageRating={4.8}
          totalReviews={128}
          clubId="demo"
          currentUserName="Sofía"
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Segunda visita, todo excelente." },
    });
    fireEvent.click(screen.getByText("Publicar reseña"));
    await waitFor(() => {
      expect(screen.getByText(/Gracias por tu reseña/)).toBeTruthy();
    });
    expect(mockToast).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* 3 — "Enviar mensaje" funciona al primer click (perfil de Ana)        */
/* ------------------------------------------------------------------ */
describe("3: 'Enviar mensaje' funciona al primer click (perfil de Ana)", () => {
  const renderAna = () => {
    seedDemoSingle();
    return render(
      <MemoryRouter initialEntries={["/profile/3"]}>
        <Routes>
          <Route path="/profile/:id" element={<ProfileDetailInner />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("el hover sobre el botón precarga el chunk de chat (sin navegar)", async () => {
    renderAna();
    const button = await screen.findByText("Enviar mensaje", {}, { timeout: 5000 });
    expect(chatImportSpy).not.toHaveBeenCalled();
    fireEvent.mouseEnter(button);
    // El import dinámico resuelve en microtarea: esperar a que la
    // factoría mockeada corra.
    await waitFor(() => {
      expect(chatImportSpy).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("el PRIMER click navega a /chat/3 con flushSync (sin reintento)", async () => {
    renderAna();
    const button = await screen.findByText("Enviar mensaje", {}, { timeout: 5000 });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/chat/3",
      expect.objectContaining({ flushSync: true }),
    );
  });
});
