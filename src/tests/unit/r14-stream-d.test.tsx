/**
 * Ronda 14, stream D (D2): verificación del formulario de reseña del
 * club por la vía demo.
 *
 * La ronda 13 no pudo verificar el formulario en vivo: en
 * /clubs-public/eden-noir y /clubs/eden-noir no hay formulario (por
 * diseño, ver abajo) y el check-in exige geolocalización a <50 m del
 * club, que un navegador de pruebas no puede satisfacer.
 *
 * Mapa de cableado verificado en código (b6524ec):
 * - /clubs/demo (App.tsx:474, sin ProtectedRoute) → ClubsDemo.tsx:525
 *   renderiza <ClubProfileReviews clubId="demo" ...> en la vista
 *   pública, SIN puerta de check-in.
 *
 * NOTA ronda 14, integración (stream E1): la ronda 3 abría /clubs/demo
 * en vista admin por defecto y había que pulsar "Ver perfil público"
 * para llegar al formulario. Wacko (2026-11-26 00:55 CST) pidió revertir
 * ese default: ahora la vista pública es el default (la admin solo se
 * abre con sesión demo de admin o con el botón "Panel Admin"). Los tests
 * de este archivo se actualizaron en consecuencia: el formulario está
 * presente al abrir, sin clic previo.
 * - /clubs/:slug (App.tsx:476, sin ProtectedRoute) → Clubs.tsx:758
 *   renderiza <ClubProfileReviews> siempre que `selectedClub` resuelve
 *   (incl. /clubs/eden-noir vía respaldo PUBLIC_CLUBS, Clubs.tsx:372),
 *   también SIN puerta de check-in: el componente no recibe ninguna
 *   prop de check-in y `handleCheckIn` (Clubs.tsx:527) es un stub que
 *   no verifica distancia ni persiste nada.
 * - /clubs-public/:slug (App.tsx:478) → ClubsPublic.tsx: NO importa ni
 *   renderiza ClubProfileReviews; solo muestra el contador de reseñas
 *   y el rating (ClubsPublic.tsx:296-312). Por diseño: público sin
 *   check-in.
 *
 * Divergencia doc↔código (NO se toca en esta fase; queda como hallazgo
 * para el coordinador): docs/Clubs/GUIA_CLUBS.md:28,41 exige "solo
 * usuarios con check-in real pueden reseñar" y check-in verificado con
 * WorldID, pero el formulario se renderiza sin ninguna comprobación de
 * check-in en /clubs/:slug ni en /clubs/demo. El formulario en sí no
 * tiene bug de cableado (sí se renderiza donde debe), así que no hay
 * cambio de código en D2.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// El cliente real de Supabase no se puede importar en vitest (misma
// convención que r10-stream-a / r13-stream-d). La cadena es thenable
// porque ClubAdminPanel hace `await supabase.from("clubs").select(...)
// .order(...)` (Promise.race contra un timeout de 3 s) y
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
import { BrowserRouter } from "react-router-dom";
import { ClubsDemo } from "@/pages/ClubsDemo";

describe("D2. Formulario de reseña por la vía demo (/clubs/demo)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("la vista pública por defecto muestra el formulario al abrir (E1)", () => {
    render(
      <BrowserRouter>
        <ClubsDemo />
      </BrowserRouter>,
    );
    // Vista pública por defecto (E1 revierte el default admin de la
    // ronda 3): el formulario está presente sin pulsar nada, y no hay
    // vista de creador/admin por defecto.
    expect(screen.queryByText("Vista de creador")).toBeNull();

    // Vista pública: el formulario de ClubProfileReviews (clubId "demo").
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    // "Reseñas" aparece en la cabecera del club y en la tarjeta de
    // reseñas; basta con que exista al menos una.
    expect(screen.getAllByText("Reseñas").length).toBeGreaterThan(0);
  });

  it("publica la reseña en /clubs/demo y la persiste por club (demo)", () => {
    render(
      <BrowserRouter>
        <ClubsDemo />
      </BrowserRouter>,
    );
    // Vista pública por defecto: el formulario ya está presente.

    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Ambiente increíble, muy buen trato." },
    });
    fireEvent.click(screen.getByText("Publicar reseña"));

    expect(
      screen.getByText("Ambiente increíble, muy buen trato."),
    ).toBeTruthy();
    expect(screen.getByText("Gracias por tu reseña.")).toBeTruthy();
    const stored = window.localStorage.getItem("cc_club_reviews_v1:demo");
    expect(stored).toContain("Ambiente increíble, muy buen trato.");
  });
});
