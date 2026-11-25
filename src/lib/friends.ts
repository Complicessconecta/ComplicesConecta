/**
 * Amistades y solicitudes (puntos 2 y 4).
 *
 * - Solicitud de amistad: se envía desde la búsqueda o desde el
 *   perfil; el destinatario la acepta o la rechaza. Solo con la
 *   amistad aceptada se ven los perfiles privados y se accede a la
 *   galería por solicitud aceptada.
 * - Solicitud de ver fotos: en el chat (y en el perfil) se puede
 *   pedir acceso a la galería; si se acepta, acceso; si se declina,
 *   no se accede. En real se apoya en la tabla existente
 *   `gallery_access_requests`; aquí se modela el mismo flujo con la
 *   tabla nueva `friend_requests` (kind = 'photo_access') para que
 *   amistad y fotos compartan estados y revisión.
 * - Eliminar de amigos: si el perfil eliminado es privado, el
 *   eliminado vuelve a necesitar solicitud para verlo.
 *
 * Persistencia: tablas `friend_requests` y `friendships` (migración
 * 20261124050000, aún sin aplicar en producción). En demo —o si
 * Supabase falla— se usa localStorage (`friend_requests_demo`,
 * `friendships_demo`, `photo_access_demo`); la demo es la fuente
 * real en los perfiles demo.
 *
 * Espacio de ids REAL (ronda 5, punto 19): `profiles.id` es un UUID
 * propio, distinto de `auth.uid()`; el auth uid vive en
 * `profiles.user_id`. Las tablas sociales referencian `profiles(id)`
 * y sus RLS resuelven `auth.uid()` vía `profiles.user_id` (migración
 * 20261124050002). Por eso los caminos reales de este módulo pasan el
 * id del espectador por `resolveOwnProfileId` (auth uid ->
 * profiles.id, con caché y con fallback al id tal cual si no hay
 * fila) antes de consultar/insertar en Supabase. En demo los ids ya
 * son los del listado y no se resuelven.
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getSocialDemoData } from "@/demo/socialDemoData";

export type FriendRequestKind = "friendship" | "photo_access";
export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  kind: FriendRequestKind;
  status: FriendRequestStatus;
  message: string | null;
  createdAt: string;
}

export type FriendStatus =
  "none" | "pending_sent" | "pending_received" | "friends";

/** Estado de una solicitud de ver fotos (punto 7). */
export type PhotoAccessStatus = "none" | "pending" | "accepted" | "declined";

/* ------------------------------------------------------------------ */
/* Resolución auth uid -> profiles.id (real)                           */
/* ------------------------------------------------------------------ */

/**
 * Resuelve el `profiles.id` del usuario autenticado a partir de su
 * auth uid (`profiles.user_id`). Las tablas sociales
 * (`friend_requests`, `friendships`, `profile_blocks`) referencian
 * `profiles(id)`, no `auth.users(id)`: sin esta resolución, un
 * insert real con el auth uid violaría la FK y las RLS de
 * 20261124050000 (que comparaban `auth.uid()` directo con columnas
 * del espacio `profiles.id`) negarían la lectura. Con caché por
 * sesión; si no hay fila (el id ya era un profiles.id, o Supabase
 * falla), devuelve el id tal cual.
 */
const ownProfileIdCache = new Map<string, string | null>();

export async function resolveOwnProfileId(authUserId: string): Promise<string> {
  if (!authUserId || !supabase) return authUserId;
  if (ownProfileIdCache.has(authUserId)) {
    return ownProfileIdCache.get(authUserId) ?? authUserId;
  }
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", authUserId)
      .maybeSingle();
    const profileId = (data as { id?: string } | null)?.id ?? null;
    ownProfileIdCache.set(authUserId, profileId);
    return profileId ?? authUserId;
  } catch {
    ownProfileIdCache.set(authUserId, null);
    return authUserId;
  }
}

export interface Friend {
  /** Id del perfil amigo. */
  id: string;
  name: string;
  /** En línea ahora mismo. */
  isOnline: boolean;
  /** Última conexión ISO; null si está en línea o no se sabe. */
  lastSeenAt: string | null;
  /** Código ISO de país (para la bandera en la lista). */
  countryCode: string | null;
}

/* ------------------------------------------------------------------ */
/* Última conexión                                                     */
/* ------------------------------------------------------------------ */

/**
 * "En línea" si está activo ahora; si no, "Última conexión hace
 * 5 min / 2 h / 3 días / 2 meses". Nunca muestra hora exacta.
 */
export function formatLastSeen(
  isOnline: boolean,
  lastSeenAt: string | null | undefined,
): string {
  if (isOnline) return "En línea";
  if (!lastSeenAt) return "Sin actividad reciente";
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return "Sin actividad reciente";
  const diffMs = Date.now() - seen;
  if (diffMs < 0) return "En línea";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Activo ahora mismo";
  if (minutes < 60) return `Última conexión hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `Última conexión hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 30)
    return `Última conexión hace ${days} ${days === 1 ? "día" : "días"}`;
  const months = Math.floor(days / 30);
  return `Última conexión hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

/** ISO de "hace N minutos" (para los datos demo). */
export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Almacén demo (localStorage)                                        */
/* ------------------------------------------------------------------ */

const REQUESTS_KEY = "friend_requests_demo";
const FRIENDSHIPS_KEY = "friendships_demo";
/** Amigos semilla eliminados en demo: { perfil: [idAmigo, ...] }. */
const REMOVED_KEY = "removed_friends_demo";

function readLocalRemoved(profileKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REMOVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }
    const list = (parsed as Record<string, unknown>)[profileKey];
    return Array.isArray(list)
      ? list.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function addLocalRemoved(profileKey: string, friendId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(REMOVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const map: Record<string, string[]> =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, string[]>)
        : {};
    const list = new Set(map[profileKey] ?? []);
    list.add(friendId);
    map[profileKey] = [...list];
    window.localStorage.setItem(REMOVED_KEY, JSON.stringify(map));
  } catch {
    // Sin almacenamiento: la eliminación solo vive en esta sesión.
  }
}

function readLocalRequests(): FriendRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is FriendRequest =>
        !!r &&
        typeof r === "object" &&
        typeof (r as FriendRequest).id === "string",
    );
  } catch {
    return [];
  }
}

function writeLocalRequests(requests: FriendRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

function readLocalFriendships(): Array<[string, string]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FRIENDSHIPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is [string, string] =>
        Array.isArray(p) && p.length === 2 && typeof p[0] === "string",
    );
  } catch {
    return [];
  }
}

function writeLocalFriendships(pairs: Array<[string, string]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(pairs));
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function localAreFriends(a: string, b: string): boolean {
  const [x, y] = pairKey(a, b);
  return readLocalFriendships().some(([p, q]) => p === x && q === y);
}

function localAddFriendship(a: string, b: string): void {
  const pairs = readLocalFriendships();
  const [x, y] = pairKey(a, b);
  if (!pairs.some(([p, q]) => p === x && q === y)) {
    pairs.push([x, y]);
    writeLocalFriendships(pairs);
  }
}

function localRemoveFriendship(a: string, b: string): void {
  const [x, y] = pairKey(a, b);
  writeLocalFriendships(
    readLocalFriendships().filter(([p, q]) => !(p === x && q === y)),
  );
}

/* ------------------------------------------------------------------ */
/* Estado de amistad                                                  */
/* ------------------------------------------------------------------ */

/**
 * Estado entre el espectador y un perfil. En demo se resuelve con
 * los datos demo (`socialDemoData`: amistades semilla) + el almacén
 * local; en real, con `friend_requests` / `friendships`.
 */
export async function getFriendStatus(
  viewerId: string,
  profileId: string,
  isDemo = false,
  viewerName?: string,
  // RONDA 7 (punto 18): nombre del perfil para la semilla demo. Las
  // listas demo se keyean por NOMBRE; si aquí llega el id numérico
  // legacy ("3") o un UUID, `getSocialDemoData` cae al fallback sin
  // amigos y una amistad semilla (p. ej. Sofía con Ana) se leía como
  // "sin relación". Con el nombre, la semilla sí aplica.
  profileName?: string,
): Promise<FriendStatus> {
  if (!viewerId || !profileId || viewerId === profileId) return "none";
  const demo = getSocialDemoData(profileName ?? profileId);
  if (isDemo || !supabase) {
    // Amistad semilla demo: las listas demo se keyean por NOMBRE
    // (los ids demo son UUID generados en cada carga), así que se
    // compara también el nombre del espectador cuando se conoce.
    if (
      localAreFriends(viewerId, profileId) ||
      (viewerName &&
        demo.friendNames.some(
          (n) => n.toLowerCase() === viewerName.toLowerCase(),
        ))
    ) {
      return "friends";
    }
    const pending = readLocalRequests().find(
      (r) =>
        r.kind === "friendship" &&
        r.status === "pending" &&
        ((r.fromId === viewerId && r.toId === profileId) ||
          (r.fromId === profileId && r.toId === viewerId)),
    );
    if (!pending) return "none";
    return pending.fromId === viewerId ? "pending_sent" : "pending_received";
  }
  try {
    // Camino real: las tablas sociales usan profiles.id (ver
    // resolveOwnProfileId); el profileId del otro lado ya es un
    // profiles.id en los listados reales.
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(user_id_a.eq.${viewerProfileId},user_id_b.eq.${profileId}),and(user_id_a.eq.${profileId},user_id_b.eq.${viewerProfileId})`,
      )
      .maybeSingle();
    if (friendship) return "friends";
    const { data: request } = await supabase
      .from("friend_requests")
      .select("id,requester_id")
      .eq("kind", "friendship")
      .eq("status", "pending")
      .or(
        `and(requester_id.eq.${viewerProfileId},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${viewerProfileId})`,
      )
      .maybeSingle();
    if (!request) return "none";
    return (request as { requester_id: string }).requester_id ===
      viewerProfileId
      ? "pending_sent"
      : "pending_received";
  } catch (err) {
    logger.error("Error leyendo estado de amistad:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return localAreFriends(viewerId, profileId) ? "friends" : "none";
  }
}

/** ¿Son amigos aceptados? (atajo síncrono para el gating demo). */
export function areFriendsSync(
  viewerId: string,
  profileId: string,
  viewerName?: string,
  // RONDA 7 (punto 18): mismo problema que en getFriendStatus: la
  // semilla demo se keyea por NOMBRE y ProfileDetail pasaba el id
  // numérico legacy ("3") o el UUID del roster, así que
  // `getSocialDemoData` caía al fallback sin amigos y TODOS eran
  // "no amigos" (incluida Sofía con Ana). Con el nombre, la amistad
  // semilla sí resuelve; sin nombre, el comportamiento no cambia.
  profileName?: string,
): boolean {
  if (!viewerId || !profileId || viewerId === profileId) return false;
  if (localAreFriends(viewerId, profileId)) return true;
  if (!viewerName) return false;
  return getSocialDemoData(profileName ?? profileId).friendNames.some(
    (n) => n.toLowerCase() === viewerName.toLowerCase(),
  );
}

export async function sendFriendRequest(
  viewerId: string,
  profileId: string,
  message?: string,
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (!viewerId || !profileId || viewerId === profileId) {
    return { ok: false, error: "No puedes enviarte una solicitud a ti mismo" };
  }
  if (isDemo || !supabase) {
    const requests = readLocalRequests();
    const existing = requests.find(
      (r) =>
        r.kind === "friendship" &&
        r.status === "pending" &&
        r.fromId === viewerId &&
        r.toId === profileId,
    );
    if (existing) return { ok: false, error: "Ya enviaste una solicitud" };
    requests.push({
      id: `demo-req-${Date.now()}`,
      fromId: viewerId,
      toId: profileId,
      kind: "friendship",
      status: "pending",
      message: message ?? null,
      createdAt: new Date().toISOString(),
    });
    writeLocalRequests(requests);
    return { ok: true };
  }
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { error } = await supabase.from("friend_requests").insert({
      requester_id: viewerProfileId,
      addressee_id: profileId,
      kind: "friendship",
      status: "pending",
      message: message ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Responde una solicitud de amistad. Al aceptar se crea la fila en
 * `friendships` (en demo, el par local). Al declinar solo cambia el
 * estado: el perfil privado sigue sin verse.
 */
export async function respondFriendRequest(
  requestId: string,
  response: "accepted" | "declined",
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (isDemo || !supabase) {
    const requests = readLocalRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Solicitud no encontrada" };
    req.status = response;
    writeLocalRequests(requests);
    if (response === "accepted" && req.kind === "friendship") {
      localAddFriendship(req.fromId, req.toId);
    }
    return { ok: true };
  }
  try {
    const { data, error } = await supabase
      .from("friend_requests")
      .update({ status: response })
      .eq("id", requestId)
      .select("requester_id,addressee_id,kind")
      .single();
    if (error) return { ok: false, error: error.message };
    if (response === "accepted" && data?.kind === "friendship") {
      const { error: fError } = await supabase.from("friendships").insert({
        user_id_a: (data as { requester_id: string }).requester_id,
        user_id_b: (data as { addressee_id: string }).addressee_id,
      });
      if (fError) return { ok: false, error: fError.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Eliminar de amigos. Si el perfil eliminado es privado, el eliminado
 * tendrá que enviar de nuevo la solicitud para verlo (el gating de
 * `profileVisibility` vuelve a aplicar: ya no es amigo).
 */
export async function removeFriend(
  viewerId: string,
  profileId: string,
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (isDemo || !supabase) {
    // En demo el amigo puede venir de la semilla (por nombre): se
    // registra en la lista de eliminados para que no reaparezca.
    addLocalRemoved(viewerId, profileId);
    localRemoveFriendship(viewerId, profileId);
    return { ok: true };
  }
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(
        `and(user_id_a.eq.${viewerProfileId},user_id_b.eq.${profileId}),and(user_id_a.eq.${profileId},user_id_b.eq.${viewerProfileId})`,
      );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Listas                                                              */
/* ------------------------------------------------------------------ */

/** Amigos de un perfil (demo: datos semilla + pares locales). */
export function listFriendsSync(profileId: string): Friend[] {
  const demo = getSocialDemoData(profileId);
  const removed = new Set(readLocalRemoved(profileId));
  const names = new Set<string>(demo.friendNames);
  const ids = new Set<string>();
  for (const [a, b] of readLocalFriendships()) {
    if (a === profileId) ids.add(b);
    if (b === profileId) ids.add(a);
  }
  const fromNames: Friend[] = [...names].map((name) => {
    const d = getSocialDemoData(name);
    return {
      id: d.id,
      name: d.displayName,
      isOnline: d.isOnline,
      lastSeenAt: d.lastSeenAt,
      countryCode: d.countryCode,
    };
  });
  const fromIds: Friend[] = [...ids].map((id) => {
    const d = getSocialDemoData(id);
    return {
      id,
      name: d.displayName,
      isOnline: d.isOnline,
      lastSeenAt: d.lastSeenAt,
      countryCode: d.countryCode,
    };
  });
  const seen = new Set<string>();
  return [...fromNames, ...fromIds].filter((f) => {
    // Eliminados en demo (por id o por nombre) no reaparecen.
    if (removed.has(f.id) || removed.has(f.name)) return false;
    const key = f.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Solicitudes de amistad pendientes RECIBIDAS por el usuario. */
export function listIncomingRequestsSync(
  userId: string,
  kind: FriendRequestKind = "friendship",
): FriendRequest[] {
  return readLocalRequests().filter(
    (r) => r.toId === userId && r.kind === kind && r.status === "pending",
  );
}

/**
 * Solicitudes ENVIADAS por el usuario (ronda 7, punto 12): /requests
 * → Enviadas solo mostraba su lista demo fija y nunca leía este
 * almacén, así que una solicitud de ver fotos recién enviada no
 * dejaba rastro ahí. Sin filtro de estado: las pendientes, aceptadas
 * y declinadas enviadas también se listan (las más recientes primero).
 */
export function listSentRequestsSync(
  userId: string,
  kind?: FriendRequestKind,
): FriendRequest[] {
  return readLocalRequests()
    .filter(
      (r) => r.fromId === userId && (kind === undefined || r.kind === kind),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Amigos de un perfil REAL (tabla `friendships` + datos de `profiles`).
 * Devuelve [] si Supabase no está disponible o falla; el componente
 * usa entonces el listado demo/local como respaldo.
 */
export async function listFriendsFromSupabase(
  profileId: string,
): Promise<Friend[]> {
  if (!profileId || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("friendships")
      .select("user_id_a,user_id_b")
      .or(`user_id_a.eq.${profileId},user_id_b.eq.${profileId}`);
    if (error || !data) return [];
    const friendIds = (data as Array<{ user_id_a: string; user_id_b: string }>)
      .map((row) =>
        row.user_id_a === profileId ? row.user_id_b : row.user_id_a,
      )
      .filter(Boolean);
    if (friendIds.length === 0) return [];
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id,display_name,first_name,is_online,last_active,country_code")
      .in("id", friendIds);
    if (pError || !profiles) return [];
    return (
      profiles as Array<{
        id: string;
        display_name: string | null;
        first_name: string | null;
        is_online: boolean | null;
        last_active: string | null;
        country_code: string | null;
      }>
    ).map((p) => ({
      id: p.id,
      name: p.display_name ?? p.first_name ?? "Perfil",
      isOnline: p.is_online ?? false,
      lastSeenAt: p.last_active,
      countryCode: p.country_code,
    }));
  } catch (err) {
    logger.error("Error listando amigos desde Supabase:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Acceso a fotos (galería)                                            */
/* ------------------------------------------------------------------ */

/** ¿Este espectador tiene acceso concedido a la galería del dueño? */
export async function hasPhotoAccess(
  viewerId: string,
  ownerId: string,
  isDemo = false,
): Promise<boolean> {
  if (!viewerId || !ownerId || viewerId === ownerId) return true;
  if (isDemo || !supabase) {
    return readLocalRequests().some(
      (r) =>
        r.kind === "photo_access" &&
        r.status === "accepted" &&
        r.fromId === viewerId &&
        r.toId === ownerId,
    );
  }
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { data } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("kind", "photo_access")
      .eq("status", "accepted")
      .eq("requester_id", viewerProfileId)
      .eq("addressee_id", ownerId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Estado de la solicitud de ver fotos entre espectador y dueño
 * (punto 7): el mismo mecanismo de persistencia que la solicitud de
 * amistad (`friend_requests` kind='photo_access' en real,
 * localStorage `friend_requests_demo` en demo). Es lo que lee el
 * chat al abrir una conversación para no volver a mostrar
 * "Solicitar ver fotos" cuando ya se envió. La solicitud más
 * reciente manda (una declinada permite volver a pedir).
 */
export async function getPhotoAccessStatus(
  viewerId: string,
  ownerId: string,
  isDemo = false,
): Promise<PhotoAccessStatus> {
  if (!viewerId || !ownerId || viewerId === ownerId) return "none";
  if (isDemo || !supabase) {
    return getPhotoAccessStatusSync(viewerId, ownerId);
  }
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { data, error } = await supabase
      .from("friend_requests")
      .select("status")
      .eq("kind", "photo_access")
      .eq("requester_id", viewerProfileId)
      .eq("addressee_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return getPhotoAccessStatusSync(viewerId, ownerId);
    const status = (data as { status?: string }).status;
    return status === "pending" ||
      status === "accepted" ||
      status === "declined"
      ? status
      : "none";
  } catch {
    return getPhotoAccessStatusSync(viewerId, ownerId);
  }
}

/** Versión síncrona (demo / localStorage) de getPhotoAccessStatus. */
export function getPhotoAccessStatusSync(
  viewerId: string,
  ownerId: string,
): PhotoAccessStatus {
  if (!viewerId || !ownerId || viewerId === ownerId) return "none";
  const matches = readLocalRequests()
    .filter(
      (r) =>
        r.kind === "photo_access" &&
        r.fromId === viewerId &&
        r.toId === ownerId,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const latest = matches[0];
  if (!latest) return "none";
  return latest.status;
}

export async function sendPhotoAccessRequest(
  viewerId: string,
  ownerId: string,
  message?: string,
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (!viewerId || !ownerId || viewerId === ownerId) {
    return { ok: false, error: "No puedes pedirte acceso a ti mismo" };
  }
  if (isDemo || !supabase) {
    const requests = readLocalRequests();
    if (
      requests.some(
        (r) =>
          r.kind === "photo_access" &&
          r.status === "pending" &&
          r.fromId === viewerId &&
          r.toId === ownerId,
      )
    ) {
      return { ok: false, error: "Ya pediste acceso a las fotos" };
    }
    requests.push({
      id: `demo-photo-${Date.now()}`,
      fromId: viewerId,
      toId: ownerId,
      kind: "photo_access",
      status: "pending",
      message: message ?? null,
      createdAt: new Date().toISOString(),
    });
    writeLocalRequests(requests);
    return { ok: true };
  }
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { error } = await supabase.from("friend_requests").insert({
      requester_id: viewerProfileId,
      addressee_id: ownerId,
      kind: "photo_access",
      status: "pending",
      message: message ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
