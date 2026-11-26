/**
 * Ronda 17, stream B — 3 menores del test dirigido ronda 16 sobre el
 * PR #76 (2026-11-26 05:29–05:45 CST, navegador del teléfono de Wacko,
 * 886 px, preview BnFMiFEv2aqH87cEXbRMfZD4EDEK, head bfdde09; veredicto
 * DO NOT MERGE):
 *
 * 1. "Ratings" quieto en 128 mientras "Reseñas" subía 128→129 al
 *    publicar una reseña 5★ en la tarjeta del Club Demo. La nota de
 *    la ronda 16 decía que Ratings era "otra métrica", pero no hay
 *    segunda fuente en ningún sitio: el formulario exige 1–5★, así
 *    que cada reseña ES un rating; la BD guarda el total en
 *    `rating_count` / `review_count` / `total_reviews` y el catálogo
 *    los rellena los tres con `c.reviews`. Ambas celdas usan ahora el
 *    mismo conteo vivo (`useLiveReviewCount`).
 * 2. El chat se veía morado oscuro con el tema claro activo: Chat.tsx
 *    tenía todo el degradado `from-purple-900 via-purple-800
 *    to-blue-900` y el texto blanco fijos, sin variantes `dark:`.
 *    Ahora es light-first con `dark:` restaurando el aspecto oscuro.
 * 3. "Cargando perfil…" sin timeout en la consulta a Supabase del
 *    wrapper de /profile/:id: una red colgada dejaba el spinner para
 *    siempre (solo salía con recarga manual). Ahora la consulta corre
 *    contra un timeout de 10 s y cae a "Perfil no encontrado" con
 *    Reintentar. NOTA: esto NO explica el caso de Ana del test ronda
 *    16 — Ana es la primera del roster y resuelve en síncrono en
 *    render, sin tocar Supabase (ver r12-stream-c); su caso cuadra
 *    con el problema transversal de vista rancia de la ronda 16
 *    (ámbito del stream A de esta ronda).
 *
 * Convención de mocks: misma que r15/r16-stream-c (Supabase con
 * modos, useAuth con estado hoisted, useToast, useNavigate mockeado)
 * + los mocks de src/tests/components/Chat.test.tsx para el Chat real.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  user: null as unknown,
  profile: null as unknown,
  isDemo: false,
}));
const supabaseBehavior = vi.hoisted(() => ({
  mode: "reject" as "reject" | "hang",
}));
const supabaseFromSpy = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => {
  const stubError = () =>
    Promise.reject(
      new Error("Supabase not configured - using stub client"),
    );
  const neverSettles = () => new Promise(() => {});
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
      supabaseBehavior.mode === "hang"
        ? neverSettles()
        : Promise.resolve({ data: null, error: null });
    q.maybeSingle = () =>
      supabaseBehavior.mode === "hang"
        ? neverSettles()
        : Promise.resolve({ data: null, error: null });
    q.then = (onFulfilled: unknown, onRejected: unknown) =>
      (supabaseBehavior.mode === "hang"
        ? neverSettles()
        : supabaseBehavior.mode === "reject"
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
      channel: () => {
        // Encadenable y con la superficie que usa useRealtimeChat al
        // abrir un hilo: .on(...).on(...).subscribe(), .presenceState(),
        // .track() y .unsubscribe() en el cleanup.
        const ch: Record<string, unknown> = {};
        ch.on = () => ch;
        ch.subscribe = () => ({ unsubscribe: vi.fn() });
        ch.presenceState = () => ({});
        ch.track = () => Promise.resolve("ok");
        ch.unsubscribe = vi.fn();
        return ch;
      },
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

vi.mock("@/hooks/useFeatures", () => ({
  useFeatures: () => ({
    features: { chat: true },
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast, toasts: [], dismiss: vi.fn() }),
  toast: mockToast,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Clubs } from "@/pages/Clubs";
import Chat from "@/pages/Chat";
import ProfileDetail from "@/pages/profiles/shared/ProfileDetail";
import {
  USER_REVIEWS_CHANGED_EVENT,
} from "@/components/clubs/ClubProfileReviews";

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

const publishUserReview = async (clubId = "demo") => {
  await act(async () => {
    seedUserReviews(1);
    window.dispatchEvent(
      new CustomEvent(USER_REVIEWS_CHANGED_EVENT, { detail: { clubId } }),
    );
  });
};

/** Nº de la celda con una etiqueta dada dentro de la tarjeta fija del
 *  Club Demo (la primera con ese título; el catálogo trae otra entrada
 *  con el mismo nombre e id "demo"). */
const statForLabel = async (label: string): Promise<string | null> => {
  // Timeout amplio (defecto 1000 ms): con la VM cargada (varias suites
  // a la vez) el montaje de /clubs + el fallback de catálogo tarda más
  // de 1 s y el findAllByText se agota sin que nada esté roto (visto
  // en la corrida completa de la ronda 17: 4 fallos por timeout que
  // pasan en aislado). Lo que se fija es el valor, no la espera.
  const headings = await screen.findAllByText(
    "Club Demo CómplicesConecta",
    {},
    { timeout: 5000 },
  );
  const cardBody = headings[0]!.parentElement as HTMLElement;
  const statsGrid = cardBody.querySelector(".grid.grid-cols-3");
  expect(statsGrid).not.toBeNull();
  const labelEl = Array.from(statsGrid!.querySelectorAll("div")).find(
    (el) => el.textContent === label,
  );
  expect(labelEl).toBeTruthy();
  return labelEl!.previousElementSibling?.textContent ?? null;
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  authState.user = null;
  authState.profile = null;
  authState.isDemo = false;
  mockNavigate.mockClear();
  mockToast.mockClear();
  supabaseFromSpy.mockClear();
  supabaseBehavior.mode = "reject";
});

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/* 1 — "Ratings" y "Reseñas" son el mismo conteo vivo                  */
/* ------------------------------------------------------------------ */
describe("1: Ratings y Reseñas se mueven juntas al publicar", () => {
  it("con 2 reseñas de usuario, la tarjeta fija dice 130 en AMBAS celdas", async () => {
    seedUserReviews(2);
    authState.user = { id: "demo-user-1" };
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Clubs />
      </MemoryRouter>,
    );
    expect(await statForLabel("Reseñas")).toBe("130");
    expect(await statForLabel("Ratings")).toBe("130");
  });

  it("publicar una reseña mueve AMBAS de 128 a 129 sin recargar", async () => {
    authState.user = { id: "demo-user-1" };
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Clubs />
      </MemoryRouter>,
    );
    expect(await statForLabel("Reseñas")).toBe("128");
    expect(await statForLabel("Ratings")).toBe("128");
    await publishUserReview("demo");
    await waitFor(
      async () => {
        expect(await statForLabel("Reseñas")).toBe("129");
      },
      { timeout: 5000 },
    );
    expect(await statForLabel("Ratings")).toBe("129");
  });

  it("la reseña de OTRO club no mueve ninguna de las dos celdas del Demo", async () => {
    authState.user = { id: "demo-user-1" };
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <Clubs />
      </MemoryRouter>,
    );
    expect(await statForLabel("Reseñas")).toBe("128");
    expect(await statForLabel("Ratings")).toBe("128");
    await publishUserReview("eden-noir");
    expect(await statForLabel("Reseñas")).toBe("128");
    expect(await statForLabel("Ratings")).toBe("128");
  });
});

/* ------------------------------------------------------------------ */
/* 2 — El chat sigue el tema claro (light-first, dark: en oscuro)      */
/* ------------------------------------------------------------------ */
describe("2: el chat se ve claro con el tema claro activo", () => {
  const renderChat = () => {
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem(
      "demo_user",
      JSON.stringify({ id: "demo-user-1", first_name: "Usuario" }),
    );
    authState.user = { id: "demo-user-1" };
    return render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Chat />
      </MemoryRouter>,
    );
  };

  it("la raíz es clara en tema claro y guarda el morado oscuro solo tras dark:", async () => {
    const { container } = renderChat();
    await screen.findByText("Conversaciones");
    const root = container.firstElementChild as HTMLElement;
    const classes = root.getAttribute("class") ?? "";
    // Base clara (sin prefijo dark:).
    expect(classes).toContain("from-purple-100");
    expect(classes).toContain("via-violet-50");
    expect(classes).toContain("to-blue-100");
    // El morado oscuro sigue existiendo, solo como variante dark:.
    expect(classes).toContain("dark:from-purple-900");
    expect(classes).toContain("dark:via-purple-800");
    expect(classes).toContain("dark:to-blue-900");
    // Sin fondo oscuro pelado como base.
    expect(classes).not.toMatch(/(^| )from-purple-900( |$)/);
  });

  it("la lista lateral es clara (bg blanco) con su morado solo en dark:", async () => {
    const { container } = renderChat();
    const title = await screen.findByText("Conversaciones");
    const sidebar = title.closest(".sm\\:w-80") as HTMLElement;
    expect(sidebar).not.toBeNull();
    const classes = sidebar.getAttribute("class") ?? "";
    expect(classes).toContain("bg-white/80");
    expect(classes).toContain("dark:from-purple-900/40");
    expect(classes).not.toMatch(/(^| )from-purple-900\/40( |$)/);
    expect(title.getAttribute("class") ?? "").toContain("text-slate-900");
  });

  it("al abrir un hilo, la burbuja entrante es clara y la propia sigue púrpura", async () => {
    const { container } = renderChat();
    const chatItem = await screen.findByText("Anabella & Julio");
    fireEvent.click(chatItem);
    const incoming = await screen.findByText("Hola! Cómo están?");
    const incomingBubble = incoming.closest("div[class*='rounded-2xl']") as HTMLElement;
    expect(incomingBubble).not.toBeNull();
    const incomingClasses = incomingBubble.getAttribute("class") ?? "";
    expect(incomingClasses).toContain("bg-white");
    expect(incomingClasses).toContain("dark:from-blue-500/95");
    expect(incoming.getAttribute("class") ?? "").toContain("text-slate-900");
    const own = await screen.findByText("Muy bien! Y ustedes?");
    const ownBubble = own.closest("div[class*='rounded-2xl']") as HTMLElement;
    const ownClasses = ownBubble.getAttribute("class") ?? "";
    expect(ownClasses).toContain("from-purple-500");
    expect(own.getAttribute("class") ?? "").toContain("text-white");
    // El compositor también es claro.
    const input = container.querySelector(
      'input[placeholder="Escribe tu mensaje..."]',
    ) as HTMLElement;
    expect(input).not.toBeNull();
    const inputClasses = input.getAttribute("class") ?? "";
    expect(inputClasses).toContain("bg-white");
    expect(inputClasses).toContain("dark:bg-white/10");
    expect(inputClasses).toContain("text-slate-900");
  });
});

/* ------------------------------------------------------------------ */
/* 3 — La consulta de perfil no deja "Cargando perfil…" para siempre   */
/* ------------------------------------------------------------------ */
describe("3: timeout de 10 s en la consulta de perfil real", () => {
  const UNKNOWN_UUID = "11111111-2222-3333-4444-555555555555";

  const renderProfile = (id: string) =>
    render(
      <MemoryRouter initialEntries={[`/profile/${id}`]}>
        <Routes>
          <Route path="/profile/:id" element={<ProfileDetail />} />
        </Routes>
      </MemoryRouter>,
    );

  it("con la consulta colgada, a los 10 s aparece 'Perfil no encontrado' con Reintentar (no spinner infinito)", async () => {
    supabaseBehavior.mode = "hang";
    vi.useFakeTimers();
    renderProfile(UNKNOWN_UUID);
    expect(screen.getByText("Cargando perfil…")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    await act(async () => {});
    expect(screen.queryByText("Cargando perfil…")).toBeNull();
    expect(screen.getByText("Perfil no encontrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("antes de los 10 s el spinner sigue (el timeout no corta antes)", async () => {
    supabaseBehavior.mode = "hang";
    vi.useFakeTimers();
    renderProfile(UNKNOWN_UUID);
    await act(async () => {
      vi.advanceTimersByTime(9_000);
    });
    await act(async () => {});
    expect(screen.getByText("Cargando perfil…")).toBeTruthy();
    expect(screen.queryByText("Perfil no encontrado")).toBeNull();
  });
});
