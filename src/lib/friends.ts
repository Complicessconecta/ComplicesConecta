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
import { generateDemoProfiles } from "@/demo/demoData";
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import { findLocalDemoAccountById } from "@/lib/demo-registration";
import { resolveDemoOwnerIdentity } from "@/lib/visibility";

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
  /**
   * Ronda 8 (punto 14): cuándo se respondió la solicitud. El acceso
   * a la galería de un perfil ANÓNIMO dura 24 h desde la aceptación
   * (no desde la solicitud): sin este sello no hay desde dónde contar.
   */
  respondedAt?: string;
}

/**
 * Ronda 8 (punto 14): vigencia del acceso a la galería de un perfil
 * anónimo: UN acceso que expira a las 24 h de concedido; expirado, el
 * espectador debe volver a pedirlo (el flujo de solicitud ya existe:
 * `sendPhotoAccessRequest` solo bloquea si hay una pendiente).
 */
export const ANONYMOUS_PHOTO_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Ronda 9 (stream A, punto 4): solicitudes de amistad que una cuenta
 * anónima puede enviar por día. Vive aquí (no en anonymous.ts) para
 * no crear un ciclo de imports: anonymous.ts importa de friends.ts.
 */
export const ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT = 5;

/** ¿Expiró un acceso a fotos concedido (solo aplica a anónimos)? */
function isPhotoAccessExpired(
  req: FriendRequest,
  nowMs: number = Date.now(),
): boolean {
  const grantedAt = Date.parse(req.respondedAt ?? req.createdAt);
  if (Number.isNaN(grantedAt)) return false;
  return nowMs - grantedAt >= ANONYMOUS_PHOTO_ACCESS_TTL_MS;
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
    // Ronda 10, stream C (C1): la lista se keyea por id canonizado
    // (ver canonicalDemoOwnerId): la eliminación hecha desde una
    // ficha/tarjeta no debe reaparecer al leer con el id de usuario.
    const list = (parsed as Record<string, unknown>)[
      canonicalDemoOwnerId(profileKey)
    ];
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
    // Ronda 10, stream C (C1): llave y valor canonizados (mismo
    // motivo que readLocalRemoved).
    const key = canonicalDemoOwnerId(profileKey);
    const list = new Set(map[key] ?? []);
    list.add(canonicalDemoOwnerId(friendId));
    map[key] = [...list];
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
  // Ronda 10, stream C (C1): el par se guarda con ids canonizados:
  // una amistad creada desde la ficha ("demo-couple-456") o la tarjeta
  // de Discover es la misma que la creada con el id de usuario.
  const x = canonicalDemoOwnerId(a);
  const y = canonicalDemoOwnerId(b);
  return x < y ? [x, y] : [y, x];
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
    const pending = readLocalRequests().find((r) => {
      if (r.kind !== "friendship" || r.status !== "pending") return false;
      // Ronda 10, stream C (C1): la solicitud puede estar guardada con
      // el id de ficha/tarjeta del destinatario (o del remitente): se
      // compara canonizado, no el id crudo.
      const from = canonicalDemoOwnerId(r.fromId);
      const to = canonicalDemoOwnerId(r.toId);
      const viewer = canonicalDemoOwnerId(viewerId);
      const other = canonicalDemoOwnerId(profileId);
      return (
        (from === viewer && to === other) || (from === other && to === viewer)
      );
    });
    if (!pending) return "none";
    return canonicalDemoOwnerId(pending.fromId) ===
      canonicalDemoOwnerId(viewerId)
      ? "pending_sent"
      : "pending_received";
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
  opts?: { isAnonymousSender?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  if (!viewerId || !profileId || viewerId === profileId) {
    return { ok: false, error: "No puedes enviarte una solicitud a ti mismo" };
  }
  // Ronda 9 (stream A, punto 4): una cuenta anónima tiene límite
  // diario de solicitudes de amistad (5/día). Se aplica en demo y
  // en real (la cuenta es local en demo; en real el flag viaja con
  // el perfil). Sin el flag no hay límite por esta regla.
  if (opts?.isAnonymousSender) {
    const sentToday = countFriendRequestsSentToday(
      viewerId,
      "friendship",
      Date.now(),
    );
    if (sentToday >= ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT) {
      return {
        ok: false,
        error: `Límite diario alcanzado: las cuentas anónimas pueden enviar hasta ${ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT} solicitudes de amistad por día. Inténtalo mañana.`,
      };
    }
  }
  if (isDemo || !supabase) {
    // Ronda 10, stream C (C1): la UI pasa el id de ficha
    // ("demo-couple-456") o de tarjeta de Discover, no el id de
    // usuario de la sesión del destinatario: se guarda canonizado
    // para que /requests lo encuentre con el id de sesión. Sin esto
    // la solicitud existía pero nunca aparecía en Recibidas del otro
    // (test de verificación ronda 9).
    const fromId = canonicalDemoOwnerId(viewerId);
    const toId = canonicalDemoOwnerId(profileId);
    const requests = readLocalRequests();
    const existing = requests.find(
      (r) =>
        r.kind === "friendship" &&
        r.status === "pending" &&
        r.fromId === fromId &&
        r.toId === toId,
    );
    if (existing) return { ok: false, error: "Ya enviaste una solicitud" };
    requests.push({
      id: `demo-req-${Date.now()}`,
      fromId,
      toId,
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
    // Ronda 8 (punto 14): sello de aceptación (base de la vigencia
    // de 24 h del acceso a la galería de un perfil anónimo).
    req.respondedAt = new Date().toISOString();
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

/**
 * Ronda 10, stream C (C1): id de USUARIO canónico del dueño de un
 * perfil demo. CAUSA RAÍZ del fallo del merge de la ronda 9.
 *
 * Un mismo perfil demo canónico tiene TRES ids distintos según dónde
 * se mire y ninguno es el del otro lado (mismo problema que
 * `resolveDemoOwnerIdentity` documenta para privacidad/visibilidad,
 * pero que nunca se aplicó a las solicitudes):
 * - La sesión demo (`demo_user.id`) usa
 *   `generateDemoUserUUID("<email>")` (Sofía / Carmen & Roberto).
 * - La ficha demo / Compartir usa `demo-single-1` / `demo-couple-456`.
 * - La tarjeta de Discover (`generateDemoProfiles`) usa
 *   `generateDemoUUID("demo-profile-N")` (Carmen & Roberto es la 6).
 *
 * La UI envía la solicitud con el id de ficha o de tarjeta
 * (`FriendRequestButton profileId={profile?.id}`), pero /requests
 * buscaba con el id de sesión: la solicitud existía en el almacén y
 * el remitente la veía en Enviadas, pero jamás aparecía en Recibidas
 * del destinatario. Esta función es el puente: cualquier alias
 * conocido se resuelve a su id de usuario canónico; cualquier otro
 * id se devuelve tal cual (nunca se inventa un dueño).
 */
export function canonicalDemoOwnerId(profileId: string): string {
  if (!profileId) return profileId;
  // Id de ficha ("demo-couple-456") o el propio id de usuario.
  const direct = resolveDemoOwnerIdentity(profileId);
  if (direct) return direct.userId;
  // Id de tarjeta del roster: el nombre resuelve el dueño (la misma
  // convención que `getSocialDemoData`, que keyea por nombre).
  const name = resolveDemoProfileName(profileId);
  if (name && name !== profileId) {
    const byName = resolveDemoOwnerIdentity("", name);
    if (byName) return byName.userId;
  }
  return profileId;
}

/**
 * Ronda 9, stream D: id de perfil demo → nombre visible.
 *
 * Las solicitudes locales (`friend_requests_demo`) solo guardan ids,
 * y /requests mostraba el id crudo o "Perfil" cuando no lo resolvía:
 * una solicitud de anonr8test a la pareja era invisible como tal.
 * Orden: cuentas demo canónicas (Sofía / Carmen & Roberto) →
 * registro local de cuentas (`cc_local_demo_accounts_v1`, p. ej.
 * TestR7, anonr8test) → roster de Discover → datos sociales demo.
 * Sin coincidencia devuelve el id tal cual (nunca inventa un nombre).
 */
export function resolveDemoProfileName(profileId: string): string {
  if (!profileId) return profileId;
  if (profileId === generateDemoUserUUID("single@outlook.es")) return "Sofía";
  if (profileId === generateDemoUserUUID("pareja@outlook.es"))
    return "Carmen & Roberto";
  const local = findLocalDemoAccountById(profileId);
  if (local) {
    const display =
      (typeof local.profile.display_name === "string" &&
        local.profile.display_name.trim()) ||
      (typeof local.profile.name === "string" && local.profile.name.trim()) ||
      local.nickname;
    if (display) return display;
  }
  const roster = generateDemoProfiles(20).find((p) => p.id === profileId);
  if (roster?.name) return roster.name;
  const social = getSocialDemoData(profileId);
  if (social.displayName && social.displayName !== profileId) {
    return social.displayName;
  }
  return profileId;
}

/** Amigos de un perfil (demo: datos semilla + pares locales). */
export function listFriendsSync(profileId: string): Friend[] {
  const demo = getSocialDemoData(profileId);
  const removed = new Set(readLocalRemoved(profileId));
  const names = new Set<string>(demo.friendNames);
  const ids = new Set<string>();
  // Ronda 10, stream C (C1): los pares locales se guardan
  // canonizados; el id que llega puede ser ficha/tarjeta.
  const ownerId = canonicalDemoOwnerId(profileId);
  for (const [a, b] of readLocalFriendships()) {
    if (a === ownerId) ids.add(b);
    if (b === ownerId) ids.add(a);
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
  // Ronda 10, stream C (C1): se compara canonizado — una solicitud
  // guardada con el id de ficha/tarjeta del destinatario (o con el
  // id de sesión) es la misma solicitud. Sin esto, el merge de /requests
  // de la ronda 9 nunca veía la solicitud del anónimo a la pareja.
  const ownerId = canonicalDemoOwnerId(userId);
  return readLocalRequests().filter(
    (r) =>
      canonicalDemoOwnerId(r.toId) === ownerId &&
      r.kind === kind &&
      r.status === "pending",
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
  // Ronda 10, stream C (C1): remitente canonizado (mismo motivo que
  // listIncomingRequestsSync).
  const senderId = canonicalDemoOwnerId(userId);
  return readLocalRequests()
    .filter(
      (r) =>
        canonicalDemoOwnerId(r.fromId) === senderId &&
        (kind === undefined || r.kind === kind),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Ronda 9 (stream A, punto 4): solicitudes de un tipo enviadas por
 * el usuario HOY (día local del navegador). Base del límite diario
 * de solicitudes de amistad de las cuentas anónimas.
 */
export function countFriendRequestsSentToday(
  userId: string,
  kind: FriendRequestKind = "friendship",
  nowMs: number = Date.now(),
): number {
  const startOfDay = new Date(nowMs);
  startOfDay.setHours(0, 0, 0, 0);
  // Ronda 10, stream C (C1): remitente canonizado.
  const senderId = canonicalDemoOwnerId(userId);
  return readLocalRequests().filter(
    (r) =>
      canonicalDemoOwnerId(r.fromId) === senderId &&
      r.kind === kind &&
      Date.parse(r.createdAt) >= startOfDay.getTime(),
  ).length;
}

/**
 * Ronda 9 (stream A, punto 1): ms restantes del acceso concedido a
 * la galería de un perfil anónimo (24 h desde la aceptación,
 * `respondedAt`); null si no hay acceso vigente (nunca concedido,
 * pendiente, declinado o ya expirado). Es lo que lee la superficie
 * de galería limitada del perfil anónimo para mostrar la cuenta
 * atrás y pedir de nuevo al expirar.
 */
export function getAnonymousPhotoAccessRemainingMs(
  viewerId: string,
  ownerId: string,
  nowMs: number = Date.now(),
): number | null {
  if (!viewerId || !ownerId || viewerId === ownerId) return null;
  // Ronda 10, stream C (C1): la concesión puede estar guardada con
  // el id de ficha/tarjeta del dueño (o del espectador).
  const viewer = canonicalDemoOwnerId(viewerId);
  const owner = canonicalDemoOwnerId(ownerId);
  const accepted = readLocalRequests()
    .filter(
      (r) =>
        r.kind === "photo_access" &&
        r.status === "accepted" &&
        canonicalDemoOwnerId(r.fromId) === viewer &&
        canonicalDemoOwnerId(r.toId) === owner,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const latest = accepted[0];
  if (!latest) return null;
  const grantedAt = Date.parse(latest.respondedAt ?? latest.createdAt);
  if (Number.isNaN(grantedAt)) return null;
  const remaining = grantedAt + ANONYMOUS_PHOTO_ACCESS_TTL_MS - nowMs;
  return remaining > 0 ? remaining : null;
}

export interface GrantedAnonymousPhotoAccess {
  viewerId: string;
  viewerName: string;
  /** Ms restantes del acceso (24 h desde la aceptación). */
  remainingMs: number;
  grantedAtMs: number;
}

/**
 * Ronda 10 (stream A, punto A6): accesos a la galería limitada que
 * el dueño (perfil anónimo) ya concedió y siguen vigentes, con su
 * cuenta atrás. Es lo que renderiza el perfil propio del anónimo:
 * sin esto, el temporizador no existía en ninguna superficie — la
 * cuenta atrás solo vivía como helper (`anonymous.ts`) sin UI.
 * Un acceso por espectador (el último concedido); los expirados no
 * se listan: al expirar hay que volver a pedir acceso.
 */
export function listAnonymousPhotoAccessGrantedBy(
  ownerId: string,
  nowMs: number = Date.now(),
): GrantedAnonymousPhotoAccess[] {
  if (!ownerId) return [];
  const byViewer = new Map<string, FriendRequest>();
  for (const req of readLocalRequests()) {
    if (
      req.kind !== "photo_access" ||
      req.status !== "accepted" ||
      req.toId !== ownerId
    ) {
      continue;
    }
    const prev = byViewer.get(req.fromId);
    if (!prev || req.createdAt > prev.createdAt) {
      byViewer.set(req.fromId, req);
    }
  }
  const granted: GrantedAnonymousPhotoAccess[] = [];
  for (const req of byViewer.values()) {
    const grantedAt = Date.parse(req.respondedAt ?? req.createdAt);
    if (Number.isNaN(grantedAt)) continue;
    const remainingMs = grantedAt + ANONYMOUS_PHOTO_ACCESS_TTL_MS - nowMs;
    if (remainingMs <= 0) continue;
    granted.push({
      viewerId: req.fromId,
      viewerName:
        findLocalDemoAccountById(req.fromId)?.nickname ??
        resolveDemoProfileName(req.fromId),
      remainingMs,
      grantedAtMs: grantedAt,
    });
  }
  return granted.sort((a, b) => a.remainingMs - b.remainingMs);
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
  opts?: { ownerIsAnonymous?: boolean },
): Promise<boolean> {
  if (!viewerId || !ownerId || viewerId === ownerId) return true;
  if (isDemo || !supabase) {
    // Ronda 10, stream C (C1): ids canonizados (mismo motivo que
    // hasPhotoAccess/getPhotoAccessStatusSync).
    const viewer = canonicalDemoOwnerId(viewerId);
    const owner = canonicalDemoOwnerId(ownerId);
    return readLocalRequests().some(
      (r) =>
        r.kind === "photo_access" &&
        r.status === "accepted" &&
        canonicalDemoOwnerId(r.fromId) === viewer &&
        canonicalDemoOwnerId(r.toId) === owner &&
        // Ronda 8 (punto 14): en un perfil anónimo el acceso concedido
        // expira a las 24 h; expirado se trata como si no existiera.
        !(opts?.ownerIsAnonymous && isPhotoAccessExpired(r)),
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
  opts?: { ownerIsAnonymous?: boolean },
): Promise<PhotoAccessStatus> {
  if (!viewerId || !ownerId || viewerId === ownerId) return "none";
  if (isDemo || !supabase) {
    return getPhotoAccessStatusSync(viewerId, ownerId, opts);
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
  opts?: { ownerIsAnonymous?: boolean },
): PhotoAccessStatus {
  if (!viewerId || !ownerId || viewerId === ownerId) return "none";
  // Ronda 10, stream C (C1): la solicitud puede estar guardada con
  // el id de ficha/tarjeta del dueño (o del espectador).
  const viewer = canonicalDemoOwnerId(viewerId);
  const owner = canonicalDemoOwnerId(ownerId);
  const matches = readLocalRequests()
    .filter(
      (r) =>
        r.kind === "photo_access" &&
        canonicalDemoOwnerId(r.fromId) === viewer &&
        canonicalDemoOwnerId(r.toId) === owner,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const latest = matches[0];
  if (!latest) return "none";
  // Ronda 8 (punto 14): acceso concedido a un perfil anónimo y ya
  // expirado (24 h) se lee como "none": el espectador debe pedirlo
  // de nuevo en vez de conservar acceso indefinido.
  if (
    latest.status === "accepted" &&
    opts?.ownerIsAnonymous &&
    isPhotoAccessExpired(latest)
  )
    return "none";
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
    // Ronda 10, stream C (C1): se guarda canonizado (mismo motivo
    // que sendFriendRequest: la UI pasa ficha/tarjeta, /requests y
    // el gestor de solicitudes leen con el id de sesión).
    const fromId = canonicalDemoOwnerId(viewerId);
    const toId = canonicalDemoOwnerId(ownerId);
    const requests = readLocalRequests();
    if (
      requests.some(
        (r) =>
          r.kind === "photo_access" &&
          r.status === "pending" &&
          r.fromId === fromId &&
          r.toId === toId,
      )
    ) {
      return { ok: false, error: "Ya pediste acceso a las fotos" };
    }
    requests.push({
      id: `demo-photo-${Date.now()}`,
      fromId,
      toId,
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
