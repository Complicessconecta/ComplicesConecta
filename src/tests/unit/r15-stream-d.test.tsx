/**
 * Ronda 15, stream D.
 *
 * (i) PERSISTENCIA DE INTERESES — BUG, no por diseño (hallazgo del
 * test dirigido del PR #74, 2026-11-26 02:27–02:44 CST: los intereses
 * editados volvían a los 3 títulos demo al reingresar, mientras la
 * concesión de fotos y el saldo de la wallet sí persistían).
 *
 * Causa raíz: el editor guarda la selección SOLO dentro de
 * `demo_user`. Al cerrar sesión `clearDemoAuth` borra `demo_user` y
 * al volver a entrar el re-seed demo (`handleDemoAuth` +
 * `demoProfileData` de `useAuth.signIn`) reconstruye `demo_user`
 * desde cero, sin campo `interests`. No hay nada que preservar en el
 * re-seed: la sesión anterior ya no existe. El fix es una clave
 * durable por cuenta (`profile_interests:<id>`, mismo patrón que el
 * saldo `cc_demo_wallet_balances_v1` y que `friend_requests_demo`):
 * sobrevive al logout y el perfil la prefiere sobre `demo_user`.
 *
 * (ii) NFTs minteados: NO se toca. Por diseño, `demo_nfts:<uid>` se
 * borra al cerrar sesión (lo promete /demo; demo-wallet.ts:51). El
 * test "el logout barre demo_nfts pero no profile_interests" pinea
 * esa diferencia sin cambiar el comportamiento.
 *
 * (iii) Verificación en código (para el próximo test en vivo): la
 * regla del dock (`showDock = isOwnProfileRoute`, MainLayout) y el
 * tema oscuro del perfil público se pinean a nivel de fuente; el
 * Eliminar de la sesión canónica Single/Pareja ya está cubierto por
 * r14-stream-b (deleteActiveDemoSession + diálogo en /demo).
 *
 * (iv) D2: la guía y el copy ya no prometen un gate de check-in que
 * no existe — la regla pasa a PLANEADO/próximamente (decisión por
 * delegación de Wacko, 2026-11-26).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// El cliente real de Supabase no se puede importar en vitest (misma
// convención que r10/r13/r14): ClubProfileReviews lo alcanza vía
// `@/lib/anonymous` → `@/lib/friends`.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
      unsubscribe: () => ({}),
    }),
    functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
  },
  isSupabaseConfigured: false,
  isDemoMode: true,
}));

import { render, screen } from "@testing-library/react";
import { ClubProfileReviews } from "@/components/clubs/ClubProfileReviews";
import { clearDemoAuth } from "@/lib/app-config";
import {
  createLocalDemoAccount,
  deleteLocalDemoAccount,
} from "@/lib/demo-registration";
import {
  DEMO_INTERESTS_KEY_PREFIX,
  demoInterestsKey,
  readSingleDemoInterests,
  readCoupleDemoInterests,
  saveSingleDemoInterests,
  saveCoupleDemoInterests,
  resolveSavedSingleDemoInterests,
  resolveSavedCoupleDemoInterests,
} from "@/lib/profile-interests";

const SOFIA_ID = "sofia-demo-user-id";
const COUPLE_ID = "pareja-demo-user-id";
// Ronda 17, stream C: los fixtures son títulos del vocabulario
// conocido (SAFE_INTERESTS + títulos demo), en orden de vocabulario:
// el sanitizador de `profile-interests.ts` solo persiste títulos
// conocidos y los guarda en ese orden. Los títulos fuera de
// vocabulario se prueban aparte en r17-stream-c.test.tsx.
const SAVED_SINGLE = [
  "Lifestyle Swinger",
  "Eventos Lifestyle",
  "Viajes en Pareja",
];
const FALLBACK_TITLES = [
  "Lifestyle Exclusivo",
  "Privacidad Total",
  "Chat Encriptado",
];

beforeEach(() => {
  window.localStorage.clear();
});

/** demo_user tal como lo deja el editor single al guardar. */
function seedDemoUserWithInterests(
  userId: string,
  interests: string[],
): void {
  window.localStorage.setItem(
    "demo_user",
    JSON.stringify({ id: userId, email: "single@outlook.es", interests }),
  );
  window.localStorage.setItem("demo_authenticated", "true");
}

/** demo_user tal como lo reconstruye el re-seed del login demo: sin intereses. */
function seedFreshDemoUserAfterLogin(userId: string): void {
  window.localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: userId,
      email: "single@outlook.es",
      role: "user",
      accountType: "single",
      first_name: "Sofía",
      is_demo: true,
      created_at: new Date().toISOString(),
    }),
  );
  window.localStorage.setItem("demo_authenticated", "true");
  window.localStorage.setItem("userType", "single");
}

describe("(i) Clave durable de intereses (single)", () => {
  it("round-trip: lo guardado se lee tal cual", () => {
    saveSingleDemoInterests(SOFIA_ID, SAVED_SINGLE);
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual(SAVED_SINGLE);
    expect(
      window.localStorage.getItem(demoInterestsKey(SOFIA_ID)),
    ).toBe(JSON.stringify(SAVED_SINGLE));
  });

  it("la clave no usa prefijo demo_: el barrido de logout no la toca", () => {
    expect(DEMO_INTERESTS_KEY_PREFIX).toBe("profile_interests:");
    expect(demoInterestsKey(SOFIA_ID).startsWith("demo_")).toBe(false);
    expect(demoInterestsKey(SOFIA_ID).startsWith("demo-")).toBe(false);
  });

  it("guardar [] borra la clave: 'sin selección' y el perfil cae al fallback", () => {
    saveSingleDemoInterests(SOFIA_ID, SAVED_SINGLE);
    saveSingleDemoInterests(SOFIA_ID, []);
    expect(readSingleDemoInterests(SOFIA_ID)).toBeNull();
    expect(window.localStorage.getItem(demoInterestsKey(SOFIA_ID))).toBeNull();
  });

  it("JSON corrupto o de otro usuario no se lee como selección", () => {
    window.localStorage.setItem(demoInterestsKey(SOFIA_ID), "{no-json");
    expect(readSingleDemoInterests(SOFIA_ID)).toBeNull();
    window.localStorage.setItem(
      demoInterestsKey(SOFIA_ID),
      JSON.stringify("no-es-un-array"),
    );
    expect(readSingleDemoInterests(SOFIA_ID)).toBeNull();
    expect(readSingleDemoInterests("otro-usuario")).toBeNull();
  });

  it("la durable manda sobre demo_user; sin durable, manda demo_user", () => {
    seedDemoUserWithInterests(SOFIA_ID, ["Desde demo_user"]);
    // Sin durable: lo de demo_user.
    expect(
      resolveSavedSingleDemoInterests(SOFIA_ID, {
        interests: ["Desde demo_user"],
      }),
    ).toEqual(["Desde demo_user"]);
    // Con durable: la durable, aunque demo_user diga otra cosa.
    saveSingleDemoInterests(SOFIA_ID, SAVED_SINGLE);
    expect(
      resolveSavedSingleDemoInterests(SOFIA_ID, {
        interests: ["Desde demo_user"],
      }),
    ).toEqual(SAVED_SINGLE);
    // Sin nada: null (el perfil cae a los títulos demo).
    window.localStorage.removeItem(demoInterestsKey(SOFIA_ID));
    expect(resolveSavedSingleDemoInterests(SOFIA_ID, {})).toBeNull();
    expect(resolveSavedSingleDemoInterests(SOFIA_ID, { interests: [] })).toBeNull();
  });
});

describe("(i) Clave durable de intereses (pareja)", () => {
  it("round-trip por campo (couple/his/her)", () => {
    saveCoupleDemoInterests(COUPLE_ID, {
      couple: ["Viajes en Pareja", "Eventos VIP"],
      his: ["Música Ambiente"],
      her: ["Cenas Temáticas"],
    });
    expect(readCoupleDemoInterests(COUPLE_ID)).toEqual({
      couple: ["Viajes en Pareja", "Eventos VIP"],
      his: ["Música Ambiente"],
      her: ["Cenas Temáticas"],
    });
  });

  it("los tres vacíos borran la clave; un campo vacío no borra los demás", () => {
    saveCoupleDemoInterests(COUPLE_ID, {
      couple: ["Eventos VIP"],
      his: [],
      her: [],
    });
    expect(readCoupleDemoInterests(COUPLE_ID)).toEqual({
      couple: ["Eventos VIP"],
      his: null,
      her: null,
    });
    saveCoupleDemoInterests(COUPLE_ID, { couple: [], his: [], her: [] });
    expect(readCoupleDemoInterests(COUPLE_ID)).toBeNull();
  });

  it("el resolver mezcla por campo: durable donde hay, demo_user donde no", () => {
    saveCoupleDemoInterests(COUPLE_ID, { his: ["Música Ambiente"] });
    const resolved = resolveSavedCoupleDemoInterests(COUPLE_ID, {
      interests: ["Couple desde demo_user"],
      partner1: { interests: ["His desde demo_user"] },
      partner2: { interests: ["Her desde demo_user"] },
    });
    expect(resolved).toEqual({
      couple: ["Couple desde demo_user"],
      his: ["Música Ambiente"],
      her: ["Her desde demo_user"],
    });
  });
});

describe("(i) Ciclo logout → re-login (el bug del PR #74)", () => {
  it("los intereses editados sobreviven al logout y al re-seed del login", () => {
    // 1. La usuaria edita sus intereses (el editor escribe demo_user
    //    y la clave durable).
    seedDemoUserWithInterests(SOFIA_ID, SAVED_SINGLE);
    saveSingleDemoInterests(SOFIA_ID, SAVED_SINGLE);
    expect(
      resolveSavedSingleDemoInterests(SOFIA_ID, {
        interests: SAVED_SINGLE,
      }),
    ).toEqual(SAVED_SINGLE);

    // 2. Logout real: clearDemoAuth borra demo_user y las claves demo.
    clearDemoAuth();
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    // ...pero la clave durable sobrevive, como el saldo de la wallet.
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual(SAVED_SINGLE);

    // 3. Re-login: el re-seed reconstruye demo_user SIN intereses
    //    (handleDemoAuth + demoProfileData de useAuth.signIn).
    seedFreshDemoUserAfterLogin(SOFIA_ID);
    const freshDemoUser = JSON.parse(
      window.localStorage.getItem("demo_user")!,
    );
    expect(freshDemoUser.interests).toBeUndefined();

    // 4. El perfil vuelve a mostrar la selección guardada, no los
    //    3 títulos demo. Antes del fix, aquí caía al fallback.
    expect(resolveSavedSingleDemoInterests(SOFIA_ID, freshDemoUser)).toEqual(
      SAVED_SINGLE,
    );
  });

  it("sin edición previa, tras el re-login sigue el fallback demo (3 títulos)", () => {
    seedFreshDemoUserAfterLogin(SOFIA_ID);
    const freshDemoUser = JSON.parse(
      window.localStorage.getItem("demo_user")!,
    );
    expect(resolveSavedSingleDemoInterests(SOFIA_ID, freshDemoUser)).toBeNull();
    // El perfil resuelve null → fallback (ProfileSingle: 3 títulos).
    expect(FALLBACK_TITLES).toHaveLength(3);
  });
});

describe("(ii) NFTs minteados: el logout SÍ los borra (por diseño, no se toca)", () => {
  it("clearDemoAuth barre demo_nfts:<uid> pero no profile_interests:<id>", () => {
    saveSingleDemoInterests(SOFIA_ID, SAVED_SINGLE);
    window.localStorage.setItem(
      `demo_nfts:${SOFIA_ID}`,
      JSON.stringify([{ id: "nft-1" }]),
    );
    clearDemoAuth();
    // Los NFTs minteados se restablecen al cerrar sesión: por diseño
    // (demo-wallet.ts:51; /demo lo promete). Solo el saldo sobrevive.
    expect(window.localStorage.getItem(`demo_nfts:${SOFIA_ID}`)).toBeNull();
    // Los intereses, en cambio, persisten (fix ronda 15).
    expect(readSingleDemoInterests(SOFIA_ID)).toEqual(SAVED_SINGLE);
  });
});

describe("(i) Baja de cuenta: la durable se borra con la cuenta (no en logout)", () => {
  it("deleteLocalDemoAccount elimina profile_interests:<id>", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr15@demo.local",
      nickname: "TestR15",
      accountType: "single",
      interests: ["Viajes"],
    });
    saveSingleDemoInterests(userId, ["Cenas Temáticas", "Viajes en Pareja"]);
    expect(readSingleDemoInterests(userId)).toEqual([
      "Cenas Temáticas",
      "Viajes en Pareja",
    ]);
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    expect(readSingleDemoInterests(userId)).toBeNull();
    expect(window.localStorage.getItem(demoInterestsKey(userId))).toBeNull();
  });
});

describe("(iv) D2: la guía y el copy dicen la verdad de hoy", () => {
  const read = (rel: string) =>
    readFileSync(join(process.cwd(), rel), "utf8");

  it("GUIA_CLUBS.md: el gate pasa a PLANEADO; ya no se afirma como implementado", () => {
    const guide = read("docs/Clubs/GUIA_CLUBS.md");
    expect(guide).toContain("PLANEADO");
    expect(guide).toContain("las reseñas están abiertas");
    // Las afirmaciones viejas como regla vigente ya no están.
    expect(guide).not.toContain(
      "- **Reseñas:** Reseñas verificadas solo de usuarios con check-in real",
    );
    expect(guide).not.toContain(
      "- **Reseñas:** Solo usuarios con check-in real pueden reseñar",
    );
    expect(guide).not.toContain("cuenta con un sistema de clubs verificados con check-ins geolocalizados, reseñas verificadas");
  });

  it("Clubs.tsx y ClubsComingSoon.tsx: sin promesa de gate; gate como próximamente", () => {
    for (const rel of [
      "src/pages/Clubs.tsx",
      "src/pages/ClubsComingSoon.tsx",
    ]) {
      const src = read(rel);
      expect(src).not.toContain(
        "Solo usuarios con check-in real pueden reseñar",
      );
      expect(src).not.toContain(
        "Sistema de check-in geolocalizado (radio 50m)",
      );
      expect(src).not.toContain(
        "Sistema geolocalizado (radio 50m) con WorldID para verificación auténtica",
      );
      expect(src).toContain("próximamente");
      expect(src).toContain("las reseñas están abiertas");
    }
  });

  it("el formulario de reseñas dice que en beta están abiertas y el gate llega próximamente", () => {
    render(
      <ClubProfileReviews reviews={[]} averageRating={4.5} totalReviews={10} />,
    );
    expect(screen.getByText("Escribe una reseña")).toBeTruthy();
    expect(
      screen.getByText(
        "En beta, las reseñas están abiertas a todos los usuarios. La reseña verificada con check-in real llega próximamente.",
      ),
    ).toBeTruthy();
    // El formulario no promete ningún gate: no hay texto de check-in
    // como requisito para publicar.
    expect(
      screen.queryByText(/solo usuarios con check-in real pueden reseñar/i),
    ).toBeNull();
  });
});

describe("(iii) Pines en código para el próximo test en vivo", () => {
  const read = (rel: string) =>
    readFileSync(join(process.cwd(), rel), "utf8");

  it("dock solo en el perfil PROPIO: /profile/<id> no lleva dock (MainLayout)", () => {
    const src = read("src/components/layout/MainLayout.tsx");
    // La regla de Wacko (ronda 5): showDock = isOwnProfileRoute, y
    // isOwnProfileRoute solo cubre /profile, /profile-single y
    // /profile-couple — /profile/<id> (perfil de OTRO usuario)
    // queda fuera a propósito y lleva la fila superior con Volver.
    expect(src).toContain("const showDock = isOwnProfileRoute;");
    expect(src).toContain('pathname === "/profile"');
    expect(src).toContain('pathname === "/profile-single"');
    expect(src).toContain('pathname === "/profile-couple"');
    expect(src).not.toMatch(
      /const isOwnProfileRoute =[\s\S]*?pathname\.startsWith\("\/profile\/"\)/,
    );
  });

  it("perfil público en tema oscuro: sin texto blanco sobre fondo claro", () => {
    const src = read("src/components/profiles/shared/ProfileDetail.tsx");
    const lines = src.split("\n");
    const bareWhite = lines.filter((line) => {
      if (!line.includes("text-white")) return false;
      // Vale: par con dark: (texto oscuro en claro, blanco en oscuro)
      // o blanco sobre botón/fondo de color saturado.
      if (/dark:text-white/.test(line)) return false;
      if (/bg-linear-to-[a-z]+ from-[a-z]+-\d+/.test(line)) return false;
      if (/bg-(blue|fuchsia|purple|red|slate)-\d+/.test(line)) return false;
      if (/from-purple-400 to-fuchsia-400/.test(line)) return false;
      return true;
    });
    expect(bareWhite).toEqual([]);
    // Raíces y tarjetas siguen el tema en ambos modos.
    expect(src).toContain("bg-white dark:bg-linear-to-br");
    expect(src).toContain("text-slate-900 dark:text-white");
  });
});
