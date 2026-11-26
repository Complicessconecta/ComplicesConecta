/**
 * Ronda 11, stream C (iii), nivel UI: el toggle "Modo invisible" y el
 * select "Visibilidad del perfil" son UN solo estado. Mover cualquiera
 * de los dos actualiza al otro en vivo y a la píldora (que lee el mismo
 * estado unificado), y ambos escriben los dos almacenes locales.
 *
 * Se montan las dos secciones juntas para el mismo usuario, como en
 * /profile-single y /profile-couple.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SinglePrivacySection } from "@/components/profiles/single/SinglePrivacySection";
import { ProfileSocialSettings } from "@/components/profiles/shared/ProfileSocialSettings";
import { readVisibilityLocal } from "@/lib/profileVisibility";

const USER_ID = "11111111-2222-4333-a444-555555555555";
const ANON_ID = "22222222-3333-4444-b555-666666666666";

beforeEach(() => {
  window.localStorage.clear();
});

function renderBoth(userId: string, isAnonymous = false) {
  return render(
    <div>
      <SinglePrivacySection
        userId={userId}
        isDemoMode
        isAnonymous={isAnonymous}
      />
      <ProfileSocialSettings
        userId={userId}
        profileType="single"
        isDemo
        isAnonymous={isAnonymous}
      />
    </div>,
  );
}

function invisibleSwitch(): HTMLElement {
  const el = document.getElementById("single-privacy-invisible");
  if (!el) throw new Error("No se encontró el switch single-privacy-invisible");
  return el;
}

function visibilitySelect(): HTMLSelectElement {
  return screen.getByLabelText(
    "Visibilidad del perfil",
  ) as HTMLSelectElement;
}

function readPrivacyInvisible(userId: string): boolean | undefined {
  const raw = window.localStorage.getItem(`single_privacy:${userId}`);
  if (!raw) return undefined;
  return (JSON.parse(raw) as { invisible?: boolean }).invisible;
}

describe("(iii) toggle y select no pueden discrepar", () => {
  it("arrancan visibles y en sintonía", () => {
    renderBoth(USER_ID);
    expect(invisibleSwitch().getAttribute("aria-checked")).toBe("false");
    expect(visibilitySelect().value).toBe("public");
  });

  it("mover el select a Privado enciende el toggle y escribe ambos almacenes", async () => {
    renderBoth(USER_ID);
    fireEvent.change(visibilitySelect(), { target: { value: "private" } });
    await waitFor(() =>
      expect(invisibleSwitch().getAttribute("aria-checked")).toBe("true"),
    );
    expect(readPrivacyInvisible(USER_ID)).toBe(true);
    expect(readVisibilityLocal(USER_ID)).toBe("private");
  });

  it("apagar el toggle pone el select en Público y escribe ambos almacenes", async () => {
    renderBoth(USER_ID);
    // Primero a privado por el select (sincroniza el toggle).
    fireEvent.change(visibilitySelect(), { target: { value: "private" } });
    await waitFor(() =>
      expect(invisibleSwitch().getAttribute("aria-checked")).toBe("true"),
    );
    // Ahora el toggle a OFF.
    fireEvent.click(invisibleSwitch());
    await waitFor(() => expect(visibilitySelect().value).toBe("public"));
    expect(readPrivacyInvisible(USER_ID)).toBe(false);
    expect(readVisibilityLocal(USER_ID)).toBe("public");
  });

  it("el anónimo arranca con toggle ON y select en Privado (nada guardado)", () => {
    renderBoth(ANON_ID, true);
    expect(invisibleSwitch().getAttribute("aria-checked")).toBe("true");
    expect(visibilitySelect().value).toBe("private");
  });

  it("el anónimo que se pone visible queda visible en ambos controles", async () => {
    renderBoth(ANON_ID, true);
    fireEvent.change(visibilitySelect(), { target: { value: "public" } });
    await waitFor(() =>
      expect(invisibleSwitch().getAttribute("aria-checked")).toBe("false"),
    );
    expect(readPrivacyInvisible(ANON_ID)).toBe(false);
    expect(readVisibilityLocal(ANON_ID)).toBe("public");
  });
});
