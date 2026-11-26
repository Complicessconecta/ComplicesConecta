/**
 * Ronda 11, stream D: suites de los comportamientos que tocan código
 * compartido con los demás streams (lo que se puede probar desde este
 * worktree, sin sus cambios todavía en el árbol).
 *
 * D1. Eliminar cuenta demo (extiende A7 de ronda 10): borrar la sesión
 *     activa limpia las claves de sesión y libera el hueco anónimo;
 *     casos borde (id vacío, doble borrado, pareja, cuenta normal).
 * D2. Cuenta atrás de 24 h de la galería limitada: formato
 *     (formatAnonymousPhotoAccessRemaining) y cálculo
 *     (getAnonymousPhotoAccessRemainingMs /
 *     listAnonymousPhotoAccessGrantedBy) con sus bordes.
 * D3. Visibilidad, una sola fuente de verdad: prioridad de
 *     resolveProfileVisibility (anónimo > BD > local > semilla),
 *     gate (canViewFullProfile / isProfileGated) y coherencia al
 *     nacer entre los dos almacenes locales (single_privacy:* y
 *     profile_visibility:*). La contradicción entre los dos controles
 *     (toggle invisible vs selector de visibilidad) se documenta
 *     como límite conocido, no como comportamiento deseado.
 * D4. Resolución de nombres en amigos/solicitudes
 *     (resolveDemoProfileName / listFriendsSync): canónicos, registro
 *     local, roster; sin coincidencia devuelve el id tal cual.
 * D5. Tema claro, parte unit-testeable: etiquetas localizadas
 *     (profileLabels) sin crudo en inglés, con mayúsculas y listas.
 * D6. Píldora CMPX del grid "Mis NFTs" (punto v): en TokenDashboard
 *     (misma arte y misma píldora que el grid de Sofía en
 *     ProfileSingle) la píldora ya no va arriba a la izquierda
 *     (tapaba el texto "Cómplices Conecta" del arte) sino abajo.
 *
 * Solapes con otros streams (el coordinador puede dedupar en la
 * integración): D1 cubre lo mismo que el stream A de ronda 11
 * (eliminar cuenta demo) desde el lado de la librería; D2 cubre la
 * cuenta atrás que el stream B/C renderiza en la galería; D3 cubre
 * la fuente única de visibilidad que toca el stream C.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Misma convención que r8-stream-c.test.ts / r10-stream-a.test.tsx:
// el cliente real de Supabase no se puede importar en vitest.
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
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
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

vi.mock("@/hooks/useTokens", () => ({
  useTokens: () => ({
    balance: {
      cmpxBalance: 1450,
      gtkBalance: 850,
      cmpxStaked: 0,
      gtkStaked: 0,
      cmpxAvailable: 1450,
      gtkAvailable: 850,
      monthlyEarned: 0,
      monthlyLimit: 1000,
      monthlyRemaining: 1000,
      referralCode: "DEMO2026",
      totalReferrals: 0,
    },
    transactions: [],
    stakingRecords: [],
    pendingRewards: [],
    loading: false,
    error: null,
    claimWorldIdReward: vi.fn(),
    startStaking: vi.fn(),
    completeStaking: vi.fn(),
    refreshTokens: vi.fn(),
    hasActiveStaking: false,
    hasPendingRewards: false,
    isWorldIdEligible: false,
    // La sesión del test NO es anónima: el grid de NFTs se renderiza.
    isAnonymousWalletBlocked: false,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  canCreateAnonymousAccountOnDevice,
  formatAnonymousPhotoAccessRemaining,
  getAnonymousGalleryAccessRemainingMs,
} from "@/lib/anonymous";
import {
  createLocalDemoAccount,
  deleteLocalDemoAccount,
  findLocalAnonymousAccount,
  listLocalDemoAccounts,
  restoreLocalDemoSession,
  seedAnonymousPrivacyDefaults,
} from "@/lib/demo-registration";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import {
  ANONYMOUS_PHOTO_ACCESS_TTL_MS,
  canonicalDemoOwnerId,
  getAnonymousPhotoAccessRemainingMs,
  listAnonymousPhotoAccessGrantedBy,
  listFriendsSync,
  resolveDemoProfileName,
} from "@/lib/friends";
import {
  canViewFullProfile,
  isProfileGated,
  readVisibilityLocal,
  readVisibilityLocalOrNull,
  resolveProfileVisibility,
  writeVisibilityLocal,
} from "@/lib/profileVisibility";
import {
  ANONYMOUS_DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  hasStoredPrivacySettings,
  readPrivacySettingsSync,
  savePrivacySettings,
} from "@/lib/visibility";
import {
  formatGenderLabel,
  formatInterestedInLabel,
} from "@/lib/profileLabels";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TokenDashboard } from "@/components/tokens/TokenDashboard";

const NOW = Date.now();
const HOUR_MS = 60 * 60 * 1000;
const SOFIA_ID = generateDemoUserUUID("single@outlook.es");
const COUPLE_ID = generateDemoUserUUID("pareja@outlook.es");

function seedRequests(requests: Array<Record<string, unknown>>): void {
  window.localStorage.setItem(
    "friend_requests_demo",
    JSON.stringify(requests),
  );
}

function seedFriendships(pairs: Array<[string, string]>): void {
  window.localStorage.setItem("friendships_demo", JSON.stringify(pairs));
}

beforeEach(() => {
  window.localStorage.clear();
});

/* ------------------------------------------------------------------ */
/* D1. Eliminar cuenta demo                                            */
/* ------------------------------------------------------------------ */

describe("D1. Eliminar cuenta demo (extiende A7 ronda 10)", () => {
  it("eliminar la anónima con sesión activa limpia la sesión y libera el hueco", () => {
    const { userId, profile } = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    restoreLocalDemoSession(profile);
    expect(window.localStorage.getItem("demo_authenticated")).toBe("true");
    expect(window.localStorage.getItem("demo_user")).toContain(userId);
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(false);

    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });

    // Sin fantasma: la sesión ya no existe.
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    expect(window.localStorage.getItem("userType")).toBeNull();
    // Y el hueco anónimo queda libre para la siguiente cuenta.
    expect(findLocalAnonymousAccount()).toBeNull();
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
    expect(() =>
      createLocalDemoAccount({
        email: "anonr9test@demo.local",
        nickname: "anonr9test",
        accountType: "single",
        isAnonymous: true,
      }),
    ).not.toThrow();
  });

  it("eliminar con id vacío o solo espacios no borra nada", () => {
    createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    expect(deleteLocalDemoAccount("").deleted).toBe(false);
    expect(deleteLocalDemoAccount("   ").deleted).toBe(false);
    expect(listLocalDemoAccounts()).toHaveLength(1);
  });

  it("eliminar dos veces: la segunda no borra y no rompe", () => {
    const { userId } = createLocalDemoAccount({
      email: "anonr8test@demo.local",
      nickname: "anonr8test",
      accountType: "single",
      isAnonymous: true,
    });
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    const second = deleteLocalDemoAccount(userId);
    expect(second.deleted).toBe(false);
    expect(second.reason).toMatch(/no existe/i);
    expect(listLocalDemoAccounts()).toHaveLength(0);
  });

  it("eliminar una cuenta de pareja borra sus ajustes couple_privacy", () => {
    const { userId } = createLocalDemoAccount({
      email: "pareja-test@demo.local",
      nickname: "ParejaTest",
      accountType: "couple",
    });
    expect(hasStoredPrivacySettings(userId, "couple")).toBe(false);
    // La pareja guarda sus ajustes al editar su privacidad.
    savePrivacySettings(userId, "couple", {
      ...DEFAULT_PRIVACY_SETTINGS,
      invisible: true,
    });
    expect(hasStoredPrivacySettings(userId, "couple")).toBe(true);
    writeVisibilityLocal(userId, "private");
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    expect(hasStoredPrivacySettings(userId, "couple")).toBe(false);
    expect(readVisibilityLocalOrNull(userId)).toBeNull();
  });

  it("eliminar una cuenta normal no afecta al hueco anónimo", () => {
    const { userId } = createLocalDemoAccount({
      email: "testr7@demo.local",
      nickname: "TestR7",
      accountType: "single",
    });
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
    expect(deleteLocalDemoAccount(userId)).toEqual({ deleted: true });
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
  });

  it("eliminar la Sofía canónica por su id se rechaza", () => {
    window.localStorage.setItem(
      "cc_local_demo_accounts_v1",
      JSON.stringify([
        {
          email: "single@outlook.es",
          nickname: "Sofía",
          userId: SOFIA_ID,
          profile: { id: SOFIA_ID, email: "single@outlook.es" },
        },
      ]),
    );
    const result = deleteLocalDemoAccount(SOFIA_ID);
    expect(result.deleted).toBe(false);
    expect(result.reason).toMatch(/no se pueden eliminar/i);
    expect(listLocalDemoAccounts()).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* D2. Cuenta atrás 24 h                                               */
/* ------------------------------------------------------------------ */

describe("D2. Cuenta atrás de 24 h de la galería limitada", () => {
  describe("formatAnonymousPhotoAccessRemaining", () => {
    it("sin acceso → 'sin acceso'", () => {
      expect(formatAnonymousPhotoAccessRemaining(null)).toBe("sin acceso");
    });

    it("0 o negativo → 'expirado'", () => {
      expect(formatAnonymousPhotoAccessRemaining(0)).toBe("expirado");
      expect(formatAnonymousPhotoAccessRemaining(-1000)).toBe("expirado");
    });

    it("menos de una hora → solo minutos", () => {
      expect(formatAnonymousPhotoAccessRemaining(45 * 60 * 1000)).toBe(
        "45 min restantes",
      );
      expect(formatAnonymousPhotoAccessRemaining(60 * 1000)).toBe(
        "1 min restantes",
      );
    });

    it("horas exactas → sin minutos", () => {
      expect(formatAnonymousPhotoAccessRemaining(60 * 60 * 1000)).toBe(
        "1 h restantes",
      );
      expect(formatAnonymousPhotoAccessRemaining(24 * HOUR_MS)).toBe(
        "24 h restantes",
      );
    });

    it("horas y minutos → '23 h 12 min restantes'", () => {
      expect(
        formatAnonymousPhotoAccessRemaining(23 * HOUR_MS + 12 * 60 * 1000),
      ).toBe("23 h 12 min restantes");
    });
  });

  describe("getAnonymousPhotoAccessRemainingMs (friends.ts)", () => {
    const viewer = "viewer-1";
    const owner = "anon-1";

    it("concedido hace 1 h → quedan ~23 h", () => {
      seedRequests([
        {
          id: "r1",
          fromId: viewer,
          toId: owner,
          kind: "photo_access",
          status: "accepted",
          createdAt: new Date(NOW - HOUR_MS).toISOString(),
          respondedAt: new Date(NOW - HOUR_MS).toISOString(),
        },
      ]);
      const remaining = getAnonymousPhotoAccessRemainingMs(viewer, owner, NOW);
      expect(remaining).not.toBeNull();
      expect(remaining as number).toBeGreaterThan(22 * HOUR_MS);
      expect(remaining as number).toBeLessThanOrEqual(23 * HOUR_MS);
      // Y el formateo que ve el usuario es la cuenta atrás visible.
      expect(
        formatAnonymousPhotoAccessRemaining(remaining),
      ).toMatch(/^23 h/);
    });

    it("concedido hace 25 h → expirado (null, hay que volver a pedir)", () => {
      seedRequests([
        {
          id: "r1",
          fromId: viewer,
          toId: owner,
          kind: "photo_access",
          status: "accepted",
          createdAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
          respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
        },
      ]);
      expect(getAnonymousPhotoAccessRemainingMs(viewer, owner, NOW)).toBeNull();
    });

    it("pendiente o declinado no es acceso vigente", () => {
      seedRequests([
        {
          id: "r1",
          fromId: viewer,
          toId: owner,
          kind: "photo_access",
          status: "pending",
          createdAt: new Date(NOW - HOUR_MS).toISOString(),
        },
        {
          id: "r2",
          fromId: "viewer-2",
          toId: owner,
          kind: "photo_access",
          status: "declined",
          createdAt: new Date(NOW - HOUR_MS).toISOString(),
          respondedAt: new Date(NOW - HOUR_MS).toISOString(),
        },
      ]);
      expect(getAnonymousPhotoAccessRemainingMs(viewer, owner, NOW)).toBeNull();
      expect(
        getAnonymousPhotoAccessRemainingMs("viewer-2", owner, NOW),
      ).toBeNull();
    });

    it("sin concesión → null; el propio dueño no tiene cuenta atrás", () => {
      expect(getAnonymousPhotoAccessRemainingMs(viewer, owner, NOW)).toBeNull();
      expect(getAnonymousPhotoAccessRemainingMs(owner, owner, NOW)).toBeNull();
    });

    it("el TTL es exactamente 24 h", () => {
      expect(ANONYMOUS_PHOTO_ACCESS_TTL_MS).toBe(24 * HOUR_MS);
    });
  });

  describe("listAnonymousPhotoAccessGrantedBy (lo que renderiza el perfil propio)", () => {
    it("lista el acceso vigente con su cuenta atrás y su nombre", () => {
      seedRequests([
        {
          id: "r1",
          fromId: "viewer-1",
          toId: "anon-1",
          kind: "photo_access",
          status: "accepted",
          createdAt: new Date(NOW - HOUR_MS).toISOString(),
          respondedAt: new Date(NOW - HOUR_MS).toISOString(),
        },
      ]);
      const granted = listAnonymousPhotoAccessGrantedBy("anon-1", NOW);
      expect(granted).toHaveLength(1);
      expect(granted[0]?.remainingMs).toBeGreaterThan(22 * HOUR_MS);
      expect(formatAnonymousPhotoAccessRemaining(granted[0]?.remainingMs ?? null)).toMatch(
        /^23 h/,
      );
      // La misma cuenta atrás por el helper de anonymous.ts.
      expect(
        getAnonymousGalleryAccessRemainingMs("viewer-1", "anon-1", NOW),
      ).toBe(granted[0]?.remainingMs);
    });

    it("el acceso expirado (25 h) ya no se lista", () => {
      seedRequests([
        {
          id: "r1",
          fromId: "viewer-1",
          toId: "anon-1",
          kind: "photo_access",
          status: "accepted",
          createdAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
          respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
        },
      ]);
      expect(listAnonymousPhotoAccessGrantedBy("anon-1", NOW)).toHaveLength(0);
    });
  });
});

/* ------------------------------------------------------------------ */
/* D3. Visibilidad: una sola fuente de verdad                          */
/* ------------------------------------------------------------------ */

describe("D3. Visibilidad: una sola fuente de verdad", () => {
  describe("resolveProfileVisibility: prioridad anónimo > BD > local > semilla", () => {
    it("anónimo siempre 'private', aunque la BD diga 'public'", () => {
      expect(
        resolveProfileVisibility({
          dbVisibility: "public",
          storedVisibility: "public",
          seedVisibility: "public",
          isAnonymous: true,
        }),
      ).toBe("private");
    });

    it("BD manda sobre local y semilla", () => {
      expect(
        resolveProfileVisibility({
          dbVisibility: "private",
          storedVisibility: "public",
          seedVisibility: "public",
        }),
      ).toBe("private");
      expect(
        resolveProfileVisibility({
          dbVisibility: "public",
          storedVisibility: "private",
          seedVisibility: "private",
        }),
      ).toBe("public");
    });

    it("sin BD, el local explícito manda sobre la semilla", () => {
      expect(
        resolveProfileVisibility({
          storedVisibility: "private",
          seedVisibility: "public",
        }),
      ).toBe("private");
    });

    it("sin ninguna fuente, público (comportamiento histórico)", () => {
      expect(resolveProfileVisibility({})).toBe("public");
      expect(
        resolveProfileVisibility({ seedVisibility: undefined }),
      ).toBe("public");
    });

    it("valores de BD desconocidos no tapan el local", () => {
      expect(
        resolveProfileVisibility({
          dbVisibility: "raro",
          storedVisibility: "private",
        }),
      ).toBe("private");
    });
  });

  describe("almacén local de visibilidad", () => {
    it("write/read round-trip y valor basura → público", () => {
      writeVisibilityLocal("u-1", "private");
      expect(readVisibilityLocal("u-1")).toBe("private");
      expect(readVisibilityLocalOrNull("u-1")).toBe("private");
      window.localStorage.setItem("profile_visibility:u-1", "basura");
      expect(readVisibilityLocal("u-1")).toBe("public");
      expect(readVisibilityLocalOrNull("u-1")).toBe("public");
    });

    it("sin valor guardado: null (no tapa BD ni semilla) y default público", () => {
      expect(readVisibilityLocalOrNull("u-sin-valor")).toBeNull();
      expect(readVisibilityLocal("u-sin-valor")).toBe("public");
    });
  });

  describe("canViewFullProfile / isProfileGated", () => {
    it("dueño siempre ve el perfil completo", () => {
      expect(
        canViewFullProfile({
          visibility: "private",
          isOwner: true,
          isFriend: false,
        }),
      ).toBe(true);
    });

    it("público: cualquiera; privado: solo amigos aceptados", () => {
      expect(
        canViewFullProfile({
          visibility: "public",
          isOwner: false,
          isFriend: false,
        }),
      ).toBe(true);
      expect(
        canViewFullProfile({
          visibility: "private",
          isOwner: false,
          isFriend: true,
        }),
      ).toBe(true);
      expect(
        canViewFullProfile({
          visibility: "private",
          isOwner: false,
          isFriend: false,
        }),
      ).toBe(false);
      expect(
        isProfileGated({
          visibility: "private",
          isOwner: false,
          isFriend: false,
        }),
      ).toBe(true);
    });
  });

  describe("coherencia al nacer entre los dos almacenes locales", () => {
    it("el anónimo nace invisible Y private en ambos almacenes", () => {
      const { userId } = createLocalDemoAccount({
        email: "anonr8test@demo.local",
        nickname: "anonr8test",
        accountType: "single",
        isAnonymous: true,
      });
      seedAnonymousPrivacyDefaults(userId, "single");
      expect(readPrivacySettingsSync(userId, "single").invisible).toBe(true);
      expect(readVisibilityLocalOrNull(userId)).toBe("private");
      expect(
        resolveProfileVisibility({
          storedVisibility: readVisibilityLocalOrNull(userId),
          isAnonymous: true,
        }),
      ).toBe("private");
      expect(ANONYMOUS_DEFAULT_PRIVACY_SETTINGS.invisible).toBe(true);
    });

    it("una cuenta normal nace visible y pública", () => {
      const { userId } = createLocalDemoAccount({
        email: "testr7@demo.local",
        nickname: "TestR7",
        accountType: "single",
      });
      expect(readPrivacySettingsSync(userId, "single").invisible).toBe(false);
      expect(readVisibilityLocalOrNull(userId)).toBeNull();
      expect(
        resolveProfileVisibility({
          storedVisibility: readVisibilityLocalOrNull(userId),
        }),
      ).toBe("public");
    });

    it("LÍMITE CONOCIDO (test ronda 10): cambiar solo el selector de visibilidad no toca el toggle invisible, y viceversa", () => {
      // Hoy los dos controles escriben en almacenes distintos y
      // nada los sincroniza: el test documenta la contradicción
      // para que la fuente única la resuelva en otro stream.
      // Si este test falla, la sincronización ya existe: actualizar
      // el reporte y quitar el marcador de límite.
      const { userId } = createLocalDemoAccount({
        email: "testr7@demo.local",
        nickname: "TestR7",
        accountType: "single",
      });
      writeVisibilityLocal(userId, "private");
      expect(readPrivacySettingsSync(userId, "single").invisible).toBe(false);
      expect(
        resolveProfileVisibility({
          storedVisibility: readVisibilityLocalOrNull(userId),
        }),
      ).toBe("private");
    });
  });
});

/* ------------------------------------------------------------------ */
/* D4. Resolución de nombres en amigos/solicitudes                     */
/* ------------------------------------------------------------------ */

describe("D4. Resolución de nombres en amigos/solicitudes", () => {
  describe("resolveDemoProfileName", () => {
    it("resuelve los canónicos Sofía y Carmen & Roberto por su UUID", () => {
      expect(resolveDemoProfileName(SOFIA_ID)).toBe("Sofía");
      expect(resolveDemoProfileName(COUPLE_ID)).toBe("Carmen & Roberto");
    });

    it("resuelve una cuenta del registro local por su id", () => {
      const { userId } = createLocalDemoAccount({
        email: "testr7@demo.local",
        nickname: "TestR7",
        accountType: "single",
      });
      expect(resolveDemoProfileName(userId)).toBe("TestR7");
    });

    it("resuelve un id de ficha demo a su dueño canónico", () => {
      expect(canonicalDemoOwnerId("demo-couple-456")).toBe(COUPLE_ID);
    });

    it("sin coincidencia devuelve el id tal cual, nunca inventa un nombre", () => {
      expect(resolveDemoProfileName("usuario-desconocido-123")).toBe(
        "usuario-desconocido-123",
      );
      expect(canonicalDemoOwnerId("usuario-desconocido-123")).toBe(
        "usuario-desconocido-123",
      );
    });

    it("vacío pasa tal cual", () => {
      expect(resolveDemoProfileName("")).toBe("");
    });
  });

  describe("listFriendsSync", () => {
    it("una amistad local resuelve los nombres de ambos lados", () => {
      seedFriendships([[SOFIA_ID, "manuel"]]);
      const friends = listFriendsSync(SOFIA_ID);
      const manuel = friends.find((f) => f.name === "Manuel");
      expect(manuel).toBeDefined();
      expect(manuel?.id).toBe("manuel");
    });

    it("la amistad local se ve desde ambos perfiles", () => {
      seedFriendships([[SOFIA_ID, "manuel"]]);
      const fromSofia = listFriendsSync(SOFIA_ID).map((f) => f.name);
      const fromManuel = listFriendsSync("manuel").map((f) => f.name);
      expect(fromSofia).toContain("Manuel");
      expect(fromManuel).toContain("Sofía");
    });

    it("no duplica al amigo que viene por nombre semilla y por id local", () => {
      // Sofía ya tiene a Manuel entre sus friendNames semilla.
      seedFriendships([[SOFIA_ID, "manuel"]]);
      const names = listFriendsSync(SOFIA_ID).map((f) => f.name);
      expect(names.filter((n) => n === "Manuel")).toHaveLength(1);
    });

    it("un id de ficha se canoniza antes de buscar amistades", () => {
      seedFriendships([[COUPLE_ID, "manuel"]]);
      const friends = listFriendsSync("demo-couple-456");
      expect(friends.map((f) => f.name)).toContain("Manuel");
    });
  });
});

/* ------------------------------------------------------------------ */
/* D5. Tema claro, parte unit-testeable: etiquetas localizadas         */
/* ------------------------------------------------------------------ */

describe("D5. Tema claro (unit-testeable): etiquetas sin crudo en inglés", () => {
  it("formatInterestedInLabel no distingue mayúsculas", () => {
    expect(formatInterestedInLabel("Men")).toBe("Hombres");
    expect(formatInterestedInLabel("WOMEN")).toBe("Mujeres");
    expect(formatInterestedInLabel("MALE")).toBe("Hombres");
  });

  it("listas con espacios o punto y coma también se localizan", () => {
    expect(formatInterestedInLabel("men,  women")).toBe("Ambos");
    expect(formatInterestedInLabel("men; women")).toBe("Ambos");
    expect(formatInterestedInLabel("women, men")).toBe("Ambos");
  });

  it("ningún valor conocido sale crudo en inglés", () => {
    for (const raw of [
      "men",
      "women",
      "male",
      "female",
      "both",
      "couple",
      "all",
      "everyone",
      "non-binary",
      "trans",
    ]) {
      expect(formatInterestedInLabel(raw)).not.toBe(raw);
    }
  });

  it("formatGenderLabel no distingue mayúsculas ni espacios", () => {
    expect(formatGenderLabel("Male")).toBe("Hombre");
    expect(formatGenderLabel(" FEMALE ")).toBe("Mujer");
    expect(formatGenderLabel("COUPLE")).toBe("Pareja");
  });
});

/* ------------------------------------------------------------------ */
/* D6. Píldora CMPX del grid "Mis NFTs" (punto v)                      */
/* ------------------------------------------------------------------ */

describe("D6. Píldora CMPX del grid Mis NFTs (punto v)", () => {
  it("la píldora CMPX va abajo del arte, no arriba a la izquierda", () => {
    render(
      <BrowserRouter>
        <TokenDashboard isDemoMode />
      </BrowserRouter>,
    );
    // Las 4 píldoras de valor de los NFTs demo canónicos
    // (5000 / 2000 / 750 / 100 CMPX): el resto de "N CMPX" de la
    // página son estadísticas y no son la píldora sobre el arte.
    const badges = screen.getAllByText(/^(5000|2000|750|100) CMPX$/);
    expect(badges).toHaveLength(4);
    for (const badge of badges) {
      const pill = badge.parentElement;
      expect(pill).not.toBeNull();
      expect(pill?.className).toContain("bottom-");
      expect(pill?.className).not.toContain("top-");
    }
    // La píldora de token_id sigue arriba a la derecha.
    const tokenIds = screen.getAllByText(/^#\d+$/);
    expect(tokenIds.length).toBeGreaterThanOrEqual(4);
    for (const tokenId of tokenIds) {
      expect(tokenId.parentElement?.className).toContain("top-");
    }
  });
});
