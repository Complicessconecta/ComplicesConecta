/**
 * Ronda 10, stream C: C1 (solicitudes demo: el merge de la ronda 9 no se
 * veía en runtime) y C2 (visibilidad persistente tras logout).
 *
 * C1 — hechos del test de verificación ronda 9 (2026-11-25 06:22–06:51
 * CST, veredicto DO NOT MERGE): la solicitud anónimo→pareja EXISTE del
 * lado del remitente (Enviadas: "Carmen & Roberto, Pendiente") pero
 * NUNCA aparece en Recibidas de la pareja; la bandeja es la misma en
 * todas las sesiones (las 3 fijas). Causa raíz: la UI envía con el id
 * de FICHA ("demo-couple-456", /profile-couple) o de TARJETA de Discover
 * (`generateDemoUUID("demo-profile-6")`), pero /requests buscaba con el
 * id de SESIÓN (`generateDemoUserUUID("pareja@outlook.es")`). La ronda 9
 * probó solo con el id de sesión, así que sus tests pasaban y el runtime
 * fallaba. Estos tests envían con los ids que usa la UI real.
 *
 * C2 — hechos del mismo test: la pareja invisible desaparece del
 * Discover de Sofía en sesión (20→19) pero al volver a entrar el
 * encabezado vuelve a "👁️ Visible". Causa raíz: el logout
 * (`clearDemoAuth` / `StorageManager.clearDemoSession`) barría las
 * claves `single_privacy:` / `couple_privacy:`. Estos tests simulan el
 * logout y verifican que la visibilidad por cuenta sobrevive.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// El cliente real de Supabase no se puede importar en vitest:
// `AppConfig.supabase.url` es undefined y `normalizeSupabaseUrl`
// revienta al importar el módulo. Misma convención que el resto de
// tests unitarios: mock del cliente (sin backend, como el preview).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: null, error: null }),
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

import { createLocalDemoAccount } from "@/lib/demo-registration";
import {
  areFriendsSync,
  canonicalDemoOwnerId,
  countFriendRequestsSentToday,
  getFriendStatus,
  getPhotoAccessStatusSync,
  hasPhotoAccess,
  listFriendsSync,
  listIncomingRequestsSync,
  listSentRequestsSync,
  respondFriendRequest,
  resolveDemoProfileName,
  sendFriendRequest,
  sendPhotoAccessRequest,
} from "@/lib/friends";
import { canViewFullProfile } from "@/lib/profileVisibility";
import { generateDemoUUID, generateDemoUserUUID } from "@/lib/demo-uuid";
import { generateDemoProfiles } from "@/demo/demoData";
import {
  DEFAULT_PRIVACY_SETTINGS,
  getVisibilityBadge,
  privacyStorageKey,
  readDemoProfilePrivacySettings,
  readPrivacySettingsSync,
  shouldShowInDiscover,
} from "@/lib/visibility";
import { clearDemoAuth } from "@/lib/app-config";
import { StorageManager } from "@/lib/storage-manager";

beforeEach(() => {
  window.localStorage.clear();
});

function seedAccounts() {
  const couple = createLocalDemoAccount({
    email: "pareja@outlook.es",
    nickname: "Carmen & Roberto",
    accountType: "couple",
    firstName: "Carmen",
    partnerFirstName: "Roberto",
  });
  const anon = createLocalDemoAccount({
    email: "anonr8test@demo.local",
    nickname: "anonr8test",
    accountType: "single",
    isAnonymous: true,
  });
  const single = createLocalDemoAccount({
    email: "single@outlook.es",
    nickname: "Sofía",
    accountType: "single",
    firstName: "Sofía",
  });
  return { couple, anon, single };
}

describe("C1: canonización de ids demo", () => {
  it("los tres ids de la pareja resuelven al id de sesión", () => {
    const { couple } = seedAccounts();
    const coupleId = couple.userId;
    expect(coupleId).toBe("48bb1f12-ff99-4ff9-a900-0000ff99c6cb");
    // La tarjeta 6 del roster es Carmen & Roberto.
    const roster = generateDemoProfiles(20);
    expect(roster[5]?.name).toBe("Carmen & Roberto");
    const cardId = roster[5]?.id as string;
    expect(cardId).toBe(generateDemoUUID("demo-profile-6"));

    expect(canonicalDemoOwnerId(coupleId)).toBe(coupleId);
    expect(canonicalDemoOwnerId("demo-couple-456")).toBe(coupleId);
    expect(canonicalDemoOwnerId(cardId)).toBe(coupleId);
    // Sofía: ficha y tarjeta 1 (la primera del roster es Ana; Sofía no
    // está en el roster, solo su ficha y su id de sesión).
    const singleId = generateDemoUserUUID("single@outlook.es");
    expect(canonicalDemoOwnerId("demo-single-1")).toBe(singleId);
    expect(canonicalDemoOwnerId(singleId)).toBe(singleId);
    // Cuentas locales y perfiles sin dueño canónico no cambian.
    const { anon } = seedAccounts();
    expect(canonicalDemoOwnerId(anon.userId)).toBe(anon.userId);
    expect(canonicalDemoOwnerId(roster[0]?.id as string)).toBe(
      roster[0]?.id as string,
    );
    expect(canonicalDemoOwnerId("")).toBe("");
  });

  it("enviar con el id de TARJETA llega a Recibidas del destinatario (ruta Discover/ProfileDetail)", async () => {
    const { couple, anon } = seedAccounts();
    const cardId = generateDemoUUID("demo-profile-6");

    expect(areFriendsSync(anon.userId, couple.userId)).toBe(false);
    const sent = await sendFriendRequest(
      anon.userId,
      cardId,
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);

    // El remitente la ve en Enviadas con el nombre resuelto.
    const sentList = listSentRequestsSync(anon.userId);
    expect(sentList).toHaveLength(1);
    expect(sentList[0]?.toId).toBe(couple.userId);
    expect(resolveDemoProfileName(sentList[0]?.toId ?? "")).toBe(
      "Carmen & Roberto",
    );
    // Y la destinataria la ve en Recibidas con su id de sesión.
    const incoming = listIncomingRequestsSync(couple.userId);
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.fromId).toBe(anon.userId);
    expect(incoming[0]?.toId).toBe(couple.userId);
    expect(resolveDemoProfileName(incoming[0]?.fromId ?? "")).toBe(
      "anonr8test",
    );
    // El estado que lee el botón en el perfil es "enviada".
    expect(await getFriendStatus(anon.userId, cardId, true)).toBe(
      "pending_sent",
    );
  });

  it("enviar con el id de FICHA llega a Recibidas (ruta /profile-couple)", async () => {
    const { couple, anon } = seedAccounts();
    const sent = await sendFriendRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    const incoming = listIncomingRequestsSync(couple.userId);
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.fromId).toBe(anon.userId);
    expect(await getFriendStatus(anon.userId, "demo-couple-456", true)).toBe(
      "pending_sent",
    );
  });

  it("ficha y tarjeta son la misma solicitud: la segunda se rechaza como duplicada", async () => {
    const { anon } = seedAccounts();
    expect(
      (await sendFriendRequest(anon.userId, "demo-couple-456", undefined, true))
        .ok,
    ).toBe(true);
    const dup = await sendFriendRequest(
      anon.userId,
      generateDemoUUID("demo-profile-6"),
      undefined,
      true,
    );
    expect(dup.ok).toBe(false);
    expect(dup.error).toBe("Ya enviaste una solicitud");
    expect(countFriendRequestsSentToday(anon.userId, "friendship")).toBe(1);
  });

  it("una solicitud ya guardada con el id de tarjeta (legado, ronda 9) se rescata en Recibidas", async () => {
    const { couple, anon } = seedAccounts();
    const cardId = generateDemoUUID("demo-profile-6");
    // Así quedó guardada en el navegador del test de la ronda 9: toId
    // con el id de tarjeta, sin canonizar.
    window.localStorage.setItem(
      "friend_requests_demo",
      JSON.stringify([
        {
          id: "demo-req-legacy",
          fromId: anon.userId,
          toId: cardId,
          kind: "friendship",
          status: "pending",
          message: null,
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    const incoming = listIncomingRequestsSync(couple.userId);
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.id).toBe("demo-req-legacy");
    expect(resolveDemoProfileName(incoming[0]?.fromId ?? "")).toBe(
      "anonr8test",
    );
    // Aceptarla crea la amistad aunque el registro sea legado.
    expect(
      (await respondFriendRequest("demo-req-legacy", "accepted", true)).ok,
    ).toBe(true);
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(true);
  });

  it("aceptar levanta el gate de perfil privado para el remitente (extremo a extremo)", async () => {
    const { couple, anon } = seedAccounts();
    const cardId = generateDemoUUID("demo-profile-6");
    await sendFriendRequest(anon.userId, cardId, undefined, true);
    const incoming = listIncomingRequestsSync(couple.userId);
    expect(incoming).toHaveLength(1);

    // Antes de aceptar: perfil privado cerrado para el anónimo.
    expect(
      canViewFullProfile({
        visibility: "private",
        isOwner: false,
        isFriend: areFriendsSync(anon.userId, cardId),
      }),
    ).toBe(false);

    expect(
      (await respondFriendRequest(incoming[0]!.id, "accepted", true)).ok,
    ).toBe(true);

    // Después de aceptar: amigos por los tres ids, gate levantado.
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(true);
    expect(areFriendsSync(anon.userId, cardId)).toBe(true);
    expect(areFriendsSync(anon.userId, "demo-couple-456")).toBe(true);
    expect(await getFriendStatus(anon.userId, cardId, true)).toBe("friends");
    expect(
      canViewFullProfile({
        visibility: "private",
        isOwner: false,
        isFriend: areFriendsSync(anon.userId, cardId),
      }),
    ).toBe(true);
    expect(listIncomingRequestsSync(couple.userId)).toHaveLength(0);
    // La amistad aparece en la lista de amigos de la pareja.
    expect(
      listFriendsSync(couple.userId).some((f) => f.id === anon.userId),
    ).toBe(true);
  });

  it("rechazar no crea amistad y el gate sigue cerrado", async () => {
    const { couple, anon } = seedAccounts();
    await sendFriendRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    const incoming = listIncomingRequestsSync(couple.userId);
    expect(
      (await respondFriendRequest(incoming[0]!.id, "declined", true)).ok,
    ).toBe(true);
    expect(areFriendsSync(anon.userId, couple.userId)).toBe(false);
    expect(
      canViewFullProfile({
        visibility: "private",
        isOwner: false,
        isFriend: areFriendsSync(anon.userId, couple.userId),
      }),
    ).toBe(false);
  });

  it("la solicitud de ver fotos con id de ficha llega al gestor del destinatario", async () => {
    const { couple, anon } = seedAccounts();
    const sent = await sendPhotoAccessRequest(
      anon.userId,
      "demo-couple-456",
      undefined,
      true,
    );
    expect(sent.ok).toBe(true);
    const incoming = listIncomingRequestsSync(couple.userId, "photo_access");
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.kind).toBe("photo_access");
    expect(getPhotoAccessStatusSync(anon.userId, couple.userId)).toBe(
      "pending",
    );
    expect(
      (await respondFriendRequest(incoming[0]!.id, "accepted", true)).ok,
    ).toBe(true);
    expect(await hasPhotoAccess(anon.userId, couple.userId, true)).toBe(true);
    expect(getPhotoAccessStatusSync(anon.userId, couple.userId)).toBe(
      "accepted",
    );
  });
});

describe("C2: la visibilidad sobrevive al logout", () => {
  function seedInvisibleCouple() {
    const { couple } = seedAccounts();
    window.localStorage.setItem(
      privacyStorageKey(couple.userId, "couple"),
      JSON.stringify({ ...DEFAULT_PRIVACY_SETTINGS, invisible: true }),
    );
    return couple.userId;
  }

  it("invisible se lee con el id de sesión, con el de tarjeta y en Discover", () => {
    const coupleId = seedInvisibleCouple();
    const settings = readPrivacySettingsSync(coupleId, "couple");
    expect(settings.invisible).toBe(true);
    const cardId = generateDemoUUID("demo-profile-6");
    expect(
      readDemoProfilePrivacySettings(cardId, "couple", "Carmen & Roberto")
        .invisible,
    ).toBe(true);
    expect(
      shouldShowInDiscover(
        { id: cardId, isVerified: true, privacySettings: settings },
        null,
      ),
    ).toBe(false);
    expect(getVisibilityBadge(settings, false).label).toBe("👻 Invisible");
  });

  it("clearDemoAuth (logout) conserva la privacidad y borra sesión, NFTs y chats", () => {
    const coupleId = seedInvisibleCouple();
    // Sesión demo + datos que SÍ deben borrarse al cerrar sesión.
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", JSON.stringify({ id: coupleId }));
    window.localStorage.setItem("demo_nfts:xyz", "[]");
    window.localStorage.setItem("chat_messages:1", "[]");

    clearDemoAuth();

    expect(
      readPrivacySettingsSync(coupleId, "couple").invisible,
    ).toBe(true);
    expect(
      readDemoProfilePrivacySettings(
        generateDemoUUID("demo-profile-6"),
        "couple",
        "Carmen & Roberto",
      ).invisible,
    ).toBe(true);
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(window.localStorage.getItem("demo_user")).toBeNull();
    expect(window.localStorage.getItem("demo_nfts:xyz")).toBeNull();
    expect(window.localStorage.getItem("chat_messages:1")).toBeNull();
  });

  it("StorageManager.clearDemoSession (logout) conserva la privacidad", () => {
    const coupleId = seedInvisibleCouple();
    window.localStorage.setItem("demo_authenticated", "true");
    window.localStorage.setItem("demo_user", JSON.stringify({ id: coupleId }));
    window.localStorage.setItem("demo_nfts:xyz", "[]");

    StorageManager.clearDemoSession();

    expect(
      readPrivacySettingsSync(coupleId, "couple").invisible,
    ).toBe(true);
    expect(window.localStorage.getItem("demo_authenticated")).toBeNull();
    expect(window.localStorage.getItem("demo_nfts:xyz")).toBeNull();
  });

  it("la visibilidad es por cuenta: cambiar de sesión no contamina a la otra", () => {
    const { couple, single } = seedAccounts();
    window.localStorage.setItem(
      privacyStorageKey(couple.userId, "couple"),
      JSON.stringify({ ...DEFAULT_PRIVACY_SETTINGS, invisible: true }),
    );
    window.localStorage.setItem(
      privacyStorageKey(single.userId, "single"),
      JSON.stringify({ ...DEFAULT_PRIVACY_SETTINGS, invisible: false }),
    );

    clearDemoAuth();

    expect(
      readPrivacySettingsSync(couple.userId, "couple").invisible,
    ).toBe(true);
    expect(
      readPrivacySettingsSync(single.userId, "single").invisible,
    ).toBe(false);
    expect(
      getVisibilityBadge(
        readPrivacySettingsSync(couple.userId, "couple"),
        false,
      ).label,
    ).toBe("👻 Invisible");
    expect(
      getVisibilityBadge(
        readPrivacySettingsSync(single.userId, "single"),
        false,
      ).label,
    ).toBe("👁️ Visible");
  });

  it("sin clave guardada el estado final por defecto no cambia: Pública/visible", () => {
    const { couple } = seedAccounts();
    const settings = readPrivacySettingsSync(couple.userId, "couple");
    expect(settings.invisible).toBe(false);
    expect(getVisibilityBadge(settings, false).label).toBe("👁️ Visible");
    expect(
      shouldShowInDiscover(
        {
          id: generateDemoUUID("demo-profile-6"),
          isVerified: true,
          privacySettings: settings,
        },
        null,
      ),
    ).toBe(true);
  });
});
