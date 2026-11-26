import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, test, expect } from "vitest";
import { SinglePreferencesSection } from "@/components/profiles/single/SinglePreferencesSection";
import { CouplePreferencesSection } from "@/components/profiles/couple/CouplePreferencesSection";
import { PrivateImageRequestsManager } from "@/components/profiles/shared/PrivateImageRequestsManager";
import { TokenAiChat } from "@/components/tokens/TokenAiChat";
import { ClubsPublic } from "@/pages/ClubsPublic";

// Ronda 13 (stream A): contraste en tema claro. Las tarjetas iban con
// cristal `bg-white/10` + `text-white` sobre fondo lavanda pálido
// (ilegible). El patrón de la ronda 12 es fondo explícito
// `bg-white dark:bg-white/10` + texto `text-slate-900 dark:text-white`.

vi.mock("@/lib/friends", () => ({
  ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT: 5,
  countFriendRequestsSentToday: () => 0,
  getAnonymousPhotoAccessRemainingMs: () => null,
  listAnonymousPhotoAccessGrantedBy: () => [],
  listIncomingRequestsSync: () => [],
  listPhotoAccessGrantedTo: () => [],
  listSentRequestsSync: () => [],
  respondFriendRequest: vi.fn(),
  resolveDemoDisplayName: (id: string) => id,
}));

vi.mock("@/services/clubs/clubContentService", () => ({
  loadClubEvents: vi.fn().mockResolvedValue({ items: [] }),
  loadClubDiscounts: vi.fn().mockResolvedValue({ items: [] }),
}));

/** El nombre no debe llevar `text-white` sin variante (blanco sobre claro). */
function expectLightLegible(el: HTMLElement) {
  expect(el).toHaveClass("text-slate-900");
  expect(el).toHaveClass("dark:text-white");
  expect(el.className.split(/\s+/)).not.toContain("text-white");
}

describe("R13 A1 — Mis Intereses: nombre legible en tema claro", () => {
  test("SinglePreferencesSection: el nombre usa texto oscuro en claro", () => {
    render(
      <SinglePreferencesSection
        name="anonr12test"
        likes={["Música", "Viajes"]}
      />,
    );
    const name = screen.getByText("anonr12test");
    expectLightLegible(name);
    expect(screen.getByText("Mis Intereses")).toHaveClass("text-slate-900");
  });

  test("CouplePreferencesSection: el nombre de cada miembro usa texto oscuro en claro", () => {
    render(
      <CouplePreferencesSection
        members={[
          { name: "Ana", likes: ["Cine"] },
          { name: "Luis", likes: [] },
        ]}
      />,
    );
    expectLightLegible(screen.getByText("Ana"));
    expectLightLegible(screen.getByText("Luis"));
  });
});

describe("R13 A2 — Solicitudes de Acceso: tarjeta legible en tema claro", () => {
  test("título, pill, nombres y mensajes usan texto oscuro en claro", async () => {
    const { container } = render(
      <PrivateImageRequestsManager profileId="profile-1" profileName="Test" />,
    );
    expect(await screen.findByText("María García")).toBeInTheDocument();
    expect(await screen.findByText("Carlos López")).toBeInTheDocument();

    const card = container.querySelector(".bg-white");
    expect(card).not.toBeNull();
    expect(card?.className).toContain("dark:bg-white/10");

    expect(screen.getByText("Solicitudes de Acceso")).toHaveClass(
      "text-slate-900",
    );
    expect(screen.getByText("2 pendientes")).toHaveClass("text-purple-800");
    expectLightLegible(screen.getByText("María García"));
    expectLightLegible(screen.getByText("Carlos López"));
    expect(
      screen.getByText(
        "Hola, me gustaría ver tus fotos privadas para conocerte mejor.",
      ),
    ).toHaveClass("text-slate-600");
  });
});

describe("R13 A3 — Eden Noir en /clubs-public: página legible en tema claro", () => {
  test("detalle eden-noir: título, dirección, stats, Galería y Volver", async () => {
    render(
      <MemoryRouter initialEntries={["/clubs-public/eden-noir"]}>
        <Routes>
          <Route path="/clubs-public/:slug" element={<ClubsPublic />} />
        </Routes>
      </MemoryRouter>,
    );

    const title = await screen.findByText("Eden Noir Club");
    expectLightLegible(title);
    // La dirección aparece dos veces (hero y sección de detalles); el
    // color legible va en el padre inmediato (div en hero, p en contacto).
    const addresses = screen.getAllByText(/Av\. Reforma 245/);
    expect(addresses.length).toBe(2);
    addresses.forEach((a) =>
      expect(a.parentElement).toHaveClass("text-slate-600"),
    );
    expect(screen.getByText("980")).toHaveClass("text-slate-900");
    expect(screen.getByText("186")).toHaveClass("text-slate-900");
    expect(screen.getByText("4.9")).toHaveClass("text-slate-900");
    expect(screen.getByText("Galería")).toHaveClass("text-slate-900");
    // "Volver" es texto directo del Button; el componente envuelve el
    // contenido en un span, así que la clase vive en el botón.
    expect(screen.getByText("Volver").closest("button")).toHaveClass(
      "text-slate-900",
    );
  });
});

describe("R13 A4 — Asistente Token IA: tarjeta legible y campo que envuelve", () => {
  test("título oscuro en claro y el campo es un textarea de 2 filas", () => {
    const { container } = render(<TokenAiChat />);
    expect(screen.getByText("Asistente Token IA")).toHaveClass(
      "text-slate-900",
    );

    const card = container.querySelector(".bg-white");
    expect(card).not.toBeNull();
    expect(card?.className).toContain("dark:from-indigo-900/40");

    // El placeholder completo ya no se trunca: el campo envuelve.
    const input = screen.getByLabelText("Pregunta al asistente de tokens");
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute(
      "placeholder",
      "Pregunta sobre tus tokens o NFTs...",
    );
    expect(input).toHaveAttribute("rows", "2");
  });

  test("Enter envía el mensaje (el textarea no rompe el envío)", async () => {
    render(<TokenAiChat />);
    const input = screen.getByLabelText("Pregunta al asistente de tokens");
    fireEvent.change(input, { target: { value: "¿Cuál es mi saldo?" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    expect(await screen.findByText("¿Cuál es mi saldo?")).toBeInTheDocument();
  });
});
