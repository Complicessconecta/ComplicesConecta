/**
 * Ronda 13, stream D: verificación de D1–D3.
 *
 * D1. El diálogo de eliminar cuenta demo en /demo es opaco en tema
 *     claro: el `className` del call-site (`bg-white dark:bg-slate-950`)
 *     reemplaza el `bg-background` del default, que en Tailwind v4 es
 *     transparente (`--background: 350 20% 99%` sin hsl() + `@theme
 *     inline` → `background-color: var(--background)` inválido).
 * D2. El formulario de reseña vive en `ClubProfileReviews` y funciona
 *     (sin cambio de código en esta ronda): se persiste por club y la
 *     reseña aparece en la lista. La ausencia de formulario en
 *     /clubs-public y en la lista /clubs es por diseño (público sin
 *     check-in; la lista no es un detalle de club).
 * D3. La marca de agua: el toggle persiste y las galerías la leen de
 *     localStorage (`readWatermarkForProfile`); en modo real el guardado
 *     en Supabase ahora también espeja local, porque todos los lectores
 *     en vivo son locales y sin espejo la marca nunca se aplicaba.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdateEq = vi.hoisted(() => vi.fn(() => Promise.resolve({ error: null })));

// Misma convención que r10-stream-a.test.tsx: el cliente real de
// Supabase no se puede importar en vitest.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
          single: () =>
            Promise.resolve({
              data: { privacy_settings: {} },
              error: null,
            }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: mockUpdateEq,
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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClubProfileReviews } from "@/components/clubs/ClubProfileReviews";
import { SinglePrivacySection } from "@/components/profiles/single/SinglePrivacySection";
import { readWatermarkForProfile } from "@/lib/visibility";

describe("D1. Diálogo de eliminar cuenta demo en /demo", () => {
  it("el className del call-site deja el diálogo opaco (sin bg-background)", () => {
    render(
      <BrowserRouter>
        <AlertDialog open>
          <AlertDialogContent className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <AlertDialogTitle>¿Eliminar cuenta demo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta demo.
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </BrowserRouter>,
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toContain("bg-white");
    expect(dialog.className).toContain("dark:bg-slate-950");
    expect(dialog.className).toContain("text-slate-900");
    expect(dialog.className).toContain("dark:text-slate-50");
    // El default roto (`bg-background`) lo elimina tailwind-merge al
    // resolver el conflicto con `bg-white`; si vuelve a aparecer, el
    // diálogo vuelve a ser transparente en tema claro.
    expect(dialog.className).not.toContain("bg-background");
  });
});

describe("D2. Formulario de reseña del club", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("publica la reseña y la persiste por club", () => {
    render(
      <BrowserRouter>
        <ClubProfileReviews
          reviews={[]}
          averageRating={4.9}
          totalReviews={186}
          clubId="eden-noir"
          currentUserName="Sofía"
        />
      </BrowserRouter>,
    );
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.change(screen.getByLabelText("Tu reseña"), {
      target: { value: "Ambiente increíble, muy buen trato." },
    });
    fireEvent.click(screen.getByText("Publicar reseña"));
    expect(
      screen.getByText("Ambiente increíble, muy buen trato."),
    ).toBeTruthy();
    expect(screen.getByText("Gracias por tu reseña.")).toBeTruthy();
    const stored = window.localStorage.getItem(
      "cc_club_reviews_v1:eden-noir",
    );
    expect(stored).toContain("Ambiente increíble, muy buen trato.");
  });
});

describe("D3. Marca de agua", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockUpdateEq.mockClear();
  });

  it("readWatermarkForProfile: apagada por defecto, lee el toggle guardado", () => {
    const userId = "r13d-user-1";
    expect(readWatermarkForProfile(userId)).toBe(false);
    window.localStorage.setItem(
      `single_privacy:${userId}`,
      JSON.stringify({ watermark: true }),
    );
    expect(readWatermarkForProfile(userId)).toBe(true);
    window.localStorage.removeItem(`single_privacy:${userId}`);
    window.localStorage.setItem(
      `couple_privacy:${userId}`,
      JSON.stringify({ watermark: true }),
    );
    expect(readWatermarkForProfile(userId)).toBe(true);
  });

  it("en modo real el toggle ON espeja local tras guardar en Supabase", async () => {
    const userId = "r13d-user-2";
    render(
      <BrowserRouter>
        <SinglePrivacySection
          userId={userId}
          isDemoMode={false}
          isAnonymous={false}
        />
      </BrowserRouter>,
    );
    // La sección carga (en real, lee privacy_settings de la BD).
    await screen.findByText("Privacidad");
    const toggle = document.getElementById(
      "single-privacy-watermark",
    ) as HTMLElement | null;
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle as HTMLElement);
    await waitFor(() => {
      const raw = window.localStorage.getItem(`single_privacy:${userId}`);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string).watermark).toBe(true);
    });
    expect(mockUpdateEq).toHaveBeenCalled();
    // Y el lector de las galerías ya ve la marca activa.
    expect(readWatermarkForProfile(userId)).toBe(true);
  });
});
