/**
 * Ronda 9, stream A: perfil anónimo — las 7 sugerencias aprobadas.
 *
 * 1. Galería limitada con TTL de 24 h (superficie en ProfileContent;
 *    aquí la decisión: ms restantes del acceso concedido).
 * 2. Privado por defecto (resolveProfileVisibility + visitas recientes).
 * 3. Visible solo para verificados en Discover, con insignia "Anónimo".
 * 4. Sin chat/media hasta aceptar + límite diario de solicitudes.
 * 5. Reseñas moderadas y etiquetadas "Reseña anónima", solo con
 *    interacción previa.
 * 6. Expiración a 30 días / conversión + una sola cuenta anónima por
 *    dispositivo.
 * 7. Sin billetera hasta verificar + identidad retenida tras reporte.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Misma convención que r8-stream-c.test.ts: el cliente real de
// Supabase no se puede importar en vitest.
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

import {
  ANONYMOUS_ACCOUNT_TTL_MS,
  ANONYMOUS_FRIEND_REQUESTS_PER_DAY,
  ANONYMOUS_REVIEW_LABEL,
  canAnonymousChat,
  canAnonymousReview,
  canAnonymousUseWallet,
  canCreateAnonymousAccountOnDevice,
  canSendFriendRequestAsAnonymous,
  formatAnonymousPhotoAccessRemaining,
  getAnonymousExpiryInfo,
  getAnonymousGalleryAccessRemainingMs,
  isAnonymousAccountExpired,
} from "@/lib/anonymous";
import {
  countFriendRequestsSentToday,
  getAnonymousPhotoAccessRemainingMs,
  sendFriendRequest,
} from "@/lib/friends";
import {
  createLocalDemoAccount,
  findLocalAnonymousAccount,
  hasLocalAnonymousAccount,
} from "@/lib/demo-registration";
import {
  isIdentityRetainedDemo,
  retainIdentityDemo,
  submitProfileReport,
} from "@/lib/reportBlock";
import {
  ANONYMOUS_BADGE_LABEL,
  isAnonymousDiscoverProfile,
  shouldShowInDiscover,
  shouldShowInRecentVisits,
} from "@/lib/visibility";
import { resolveProfileVisibility } from "@/lib/profileVisibility";
import {
  canSendMessageTo,
  canStartVideoCall,
} from "@/lib/chatLimits";

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function seedRequests(
  requests: Array<Record<string, unknown>>,
): void {
  window.localStorage.setItem(
    "friend_requests_demo",
    JSON.stringify(requests),
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("6. Expiración / conversión (30 días)", () => {
  it("una cuenta creada hace 29 días expira en 1 día y avisa", () => {
    const created = new Date(NOW - 29 * DAY_MS).toISOString();
    const info = getAnonymousExpiryInfo(created, NOW);
    expect(info.expired).toBe(false);
    expect(info.daysRemaining).toBe(1);
    expect(info.expiringSoon).toBe(true);
    expect(info.expiresAtMs).toBe(Date.parse(created) + ANONYMOUS_ACCOUNT_TTL_MS);
  });

  it("una cuenta creada hace 31 días está expirada", () => {
    const created = new Date(NOW - 31 * DAY_MS).toISOString();
    const info = getAnonymousExpiryInfo(created, NOW);
    expect(info.expired).toBe(true);
    expect(info.daysRemaining).toBe(0);
    expect(
      isAnonymousAccountExpired(
        { is_anonymous: true, created_at: created },
        NOW,
      ),
    ).toBe(true);
  });

  it("sin fecha de creación no hay expiración calculable", () => {
    const info = getAnonymousExpiryInfo(null, NOW);
    expect(info.expiresAtMs).toBeNull();
    expect(info.expired).toBe(false);
  });

  it("un perfil no anónimo nunca expira por esta regla", () => {
    expect(
      isAnonymousAccountExpired(
        { is_anonymous: false, created_at: new Date(2020, 0, 1).toISOString() },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("6. Una sola cuenta anónima por dispositivo", () => {
  it("la primera anónima se crea; la segunda con otro email falla", () => {
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(true);
    createLocalDemoAccount({
      email: "anon1@demo.local",
      nickname: "anon1",
      accountType: "single",
      isAnonymous: true,
    });
    expect(hasLocalAnonymousAccount()).toBe(true);
    expect(findLocalAnonymousAccount()?.email).toBe("anon1@demo.local");
    expect(canCreateAnonymousAccountOnDevice().allowed).toBe(false);
    expect(() =>
      createLocalDemoAccount({
        email: "anon2@demo.local",
        nickname: "anon2",
        accountType: "single",
        isAnonymous: true,
      }),
    ).toThrow(/una cuenta anónima en este dispositivo/i);
  });

  it("re-crear la MISMA cuenta anónima no falla", () => {
    createLocalDemoAccount({
      email: "anon1@demo.local",
      nickname: "anon1",
      accountType: "single",
      isAnonymous: true,
    });
    expect(() =>
      createLocalDemoAccount({
        email: "anon1@demo.local",
        nickname: "anon1",
        accountType: "single",
        isAnonymous: true,
      }),
    ).not.toThrow();
  });

  it("las cuentas normales no las bloquea la anónima existente", () => {
    createLocalDemoAccount({
      email: "anon1@demo.local",
      nickname: "anon1",
      accountType: "single",
      isAnonymous: true,
    });
    expect(() =>
      createLocalDemoAccount({
        email: "normal@demo.local",
        nickname: "normal",
        accountType: "single",
      }),
    ).not.toThrow();
  });
});

describe("1. Galería limitada: TTL de 24 h del acceso concedido", () => {
  it("acceso concedido hace 23 h: queda ~1 h", () => {
    seedRequests([
      {
        id: "r1",
        fromId: "viewer-1",
        toId: "anon-1",
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 23 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 23 * HOUR_MS).toISOString(),
      },
    ]);
    const remaining = getAnonymousPhotoAccessRemainingMs(
      "viewer-1",
      "anon-1",
      NOW,
    );
    expect(remaining).not.toBeNull();
    expect(remaining as number).toBeGreaterThan(0);
    expect(remaining as number).toBeLessThanOrEqual(HOUR_MS + 1000);
    expect(getAnonymousGalleryAccessRemainingMs("viewer-1", "anon-1", NOW)).toBe(
      remaining,
    );
    expect(formatAnonymousPhotoAccessRemaining(remaining)).toMatch(/restantes/);
  });

  it("acceso concedido hace 25 h: expirado, hay que pedirlo de nuevo", () => {
    seedRequests([
      {
        id: "r1",
        fromId: "viewer-1",
        toId: "anon-1",
        kind: "photo_access",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
        respondedAt: new Date(NOW - 25 * HOUR_MS).toISOString(),
      },
    ]);
    expect(
      getAnonymousPhotoAccessRemainingMs("viewer-1", "anon-1", NOW),
    ).toBeNull();
    expect(formatAnonymousPhotoAccessRemaining(null)).toBe("sin acceso");
    expect(formatAnonymousPhotoAccessRemaining(0)).toBe("expirado");
  });

  it("sin solicitud: no hay acceso", () => {
    expect(
      getAnonymousPhotoAccessRemainingMs("viewer-1", "anon-1", NOW),
    ).toBeNull();
  });
});

describe("4. Límite diario de solicitudes de amistad (anónimo)", () => {
  function seedSentToday(viewerId: string, count: number): void {
    seedRequests(
      Array.from({ length: count }, (_, i) => ({
        id: `sent-${i}`,
        fromId: viewerId,
        toId: `target-${i}`,
        kind: "friendship",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - i * HOUR_MS).toISOString(),
      })),
    );
  }

  it("con 4 enviadas hoy, la 5ª pasa; con 5, la 6ª se bloquea", async () => {
    seedSentToday("anon-1", 4);
    expect(countFriendRequestsSentToday("anon-1", "friendship", NOW)).toBe(4);
    const check = canSendFriendRequestAsAnonymous("anon-1", NOW);
    expect(check.allowed).toBe(true);
    expect(check.limit).toBe(ANONYMOUS_FRIEND_REQUESTS_PER_DAY);

    const sent = await sendFriendRequest("anon-1", "target-9", undefined, true, {
      isAnonymousSender: true,
    });
    expect(sent.ok).toBe(true);

    const blocked = await sendFriendRequest(
      "anon-1",
      "target-10",
      undefined,
      true,
      { isAnonymousSender: true },
    );
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toMatch(/Límite diario/);
  });

  it("el límite no aplica a remitentes no anónimos", async () => {
    seedSentToday("normal-1", 5);
    const sent = await sendFriendRequest(
      "normal-1",
      "target-9",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
  });

  it("las solicitudes de ayer no cuentan para hoy", () => {
    seedRequests([
      {
        id: "old",
        fromId: "anon-1",
        toId: "target-0",
        kind: "friendship",
        status: "accepted",
        message: null,
        createdAt: new Date(NOW - 2 * DAY_MS).toISOString(),
      },
    ]);
    expect(countFriendRequestsSentToday("anon-1", "friendship", NOW)).toBe(0);
    expect(canSendFriendRequestAsAnonymous("anon-1", NOW).allowed).toBe(true);
  });
});

describe("4. Sin chat/media hasta que el otro lado acepte", () => {
  it("anónimo sin amistad aceptada: bloqueado", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: false,
      }).allowed,
    ).toBe(false);
    expect(
      canAnonymousChat({
        senderIsAnonymous: false,
        recipientIsAnonymous: true,
        areFriends: false,
      }).allowed,
    ).toBe(false);
  });

  it("anónimo con amistad aceptada: permitido; sin anónimos: permitido", () => {
    expect(
      canAnonymousChat({
        senderIsAnonymous: true,
        recipientIsAnonymous: false,
        areFriends: true,
      }).allowed,
    ).toBe(true);
    expect(
      canAnonymousChat({
        senderIsAnonymous: false,
        recipientIsAnonymous: false,
        areFriends: false,
      }).allowed,
    ).toBe(true);
  });

  it("canSendMessageTo aplica la misma regla (Chat.tsx)", () => {
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: false,
        senderIsAnonymous: true,
        areFriends: false,
      }).allowed,
    ).toBe(false);
    expect(
      canSendMessageTo({
        recipientPrivacy: null,
        senderIsVerified: false,
        senderIsAnonymous: true,
        areFriends: true,
      }).allowed,
    ).toBe(true);
  });

  it("la videollamada con un anónimo exige amistad aceptada", () => {
    expect(
      canStartVideoCall({
        recipientPrivacy: null,
        hasMatch: false,
        recipientIsAnonymous: true,
      }).allowed,
    ).toBe(false);
    expect(
      canStartVideoCall({
        recipientPrivacy: null,
        hasMatch: true,
        recipientIsAnonymous: true,
      }).allowed,
    ).toBe(true);
  });
});

describe("5. Reseñas moderadas y etiquetadas", () => {
  it("sin interacción no se puede reseñar; con interacción sí, etiquetada", () => {
    const blocked = canAnonymousReview({ hasInteraction: false });
    expect(blocked.allowed).toBe(false);
    expect(blocked.label).toBe("Reseña anónima");
    const allowed = canAnonymousReview({ hasInteraction: true });
    expect(allowed.allowed).toBe(true);
    expect(allowed.label).toBe(ANONYMOUS_REVIEW_LABEL);
    expect(ANONYMOUS_REVIEW_LABEL).toBe("Reseña anónima");
  });
});

describe("2. Privado por defecto", () => {
  it("un anónimo resuelve siempre privado, aunque la BD diga público", () => {
    expect(
      resolveProfileVisibility({
        dbVisibility: "public",
        isAnonymous: true,
      }),
    ).toBe("private");
    expect(
      resolveProfileVisibility({ dbVisibility: "public" }),
    ).toBe("public");
  });

  it("un anónimo nunca aparece en visitas recientes", () => {
    expect(shouldShowInRecentVisits({ is_anonymous: true })).toBe(false);
    expect(shouldShowInRecentVisits({})).toBe(true);
  });
});

describe("3. Visible solo para verificados, con insignia Anónimo", () => {
  it("anónimo + espectador no verificado: no aparece en Discover", () => {
    expect(shouldShowInDiscover({ is_anonymous: true }, null)).toBe(false);
    expect(
      shouldShowInDiscover(
        { is_anonymous: true },
        null,
        { viewerIsVerified: false },
      ),
    ).toBe(false);
  });

  it("anónimo + espectador verificado: aparece", () => {
    expect(
      shouldShowInDiscover(
        { is_anonymous: true },
        null,
        { viewerIsVerified: true },
      ),
    ).toBe(true);
    expect(
      shouldShowInDiscover(
        { isAnonymous: true },
        null,
        { viewerIsVerified: true },
      ),
    ).toBe(true);
  });

  it("anónimo invisible no aparece ni para verificados", () => {
    expect(
      shouldShowInDiscover(
        { is_anonymous: true, invisible: true },
        null,
        { viewerIsVerified: true },
      ),
    ).toBe(false);
  });

  it("un perfil normal no cambia por esta regla", () => {
    expect(shouldShowInDiscover({ isVerified: false }, null)).toBe(true);
    expect(isAnonymousDiscoverProfile({})).toBe(false);
    expect(isAnonymousDiscoverProfile({ is_anonymous: true })).toBe(true);
    expect(ANONYMOUS_BADGE_LABEL).toBe("Anónimo");
  });
});

describe("7. Sin billetera + identidad retenida tras reporte", () => {
  it("la billetera está bloqueada para anónimos y libre para el resto", () => {
    expect(canAnonymousUseWallet(true)).toBe(false);
    expect(canAnonymousUseWallet(false)).toBe(true);
  });

  it("una identidad retenida no puede re-registrarse como anónima", () => {
    retainIdentityDemo({
      email: "baneado@demo.local",
      username: "baneado",
      userId: "u-baneado",
      reason: "fake-profile",
    });
    expect(isIdentityRetainedDemo("baneado@demo.local")).toBe(true);
    expect(isIdentityRetainedDemo("otro@demo.local", "baneado")).toBe(true);
    expect(isIdentityRetainedDemo("otro@demo.local", "otro")).toBe(false);
    expect(() =>
      createLocalDemoAccount({
        email: "baneado@demo.local",
        nickname: "nuevo-nombre",
        accountType: "single",
        isAnonymous: true,
      }),
    ).toThrow(/dada de baja por un reporte/i);
  });

  it("reportar a un anónimo en demo retiene su identidad", async () => {
    const result = await submitProfileReport({
      reporterId: "reporter-1",
      reportedId: "anon-bad",
      reasonId: "fake-profile",
      isDemo: true,
      reportedEmail: "anon-bad@demo.local",
      reportedUsername: "anonbad",
      reportedIsAnonymous: true,
    });
    expect(result.ok).toBe(true);
    expect(isIdentityRetainedDemo("anon-bad@demo.local")).toBe(true);
  });

  it("reportar a un perfil normal en demo NO retiene identidad", async () => {
    const result = await submitProfileReport({
      reporterId: "reporter-1",
      reportedId: "normal-1",
      reasonId: "spam-scam",
      isDemo: true,
      reportedEmail: "normal@demo.local",
      reportedUsername: "normal",
      reportedIsAnonymous: false,
    });
    expect(result.ok).toBe(true);
    expect(isIdentityRetainedDemo("normal@demo.local")).toBe(false);
  });
});
