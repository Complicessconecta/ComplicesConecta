/**
 * Reglas del perfil ANÓNIMO (ronda 9, stream A).
 *
 * Wacko aprobó las 7 sugerencias para el perfil anónimo. Este módulo
 * concentra la DECISIÓN (pura y testeable); el cableado vive en cada
 * superficie (friends.ts, visibility.ts, chatLimits.ts, demo-wallet,
 * Discover, ProfileContent, ProfileSingle).
 *
 * Reglas:
 * 1. Galería limitada: pocas fotos visibles; el resto exige solicitud
 *    de acceso, 1 acceso que expira a las 24 h (TTL en friends.ts) y
 *    re-solicitud al expirar.
 * 2. Privado por defecto: solo una tarjeta pública mínima; el resto
 *    exige solicitud + aceptación (ver profileVisibility.ts y
 *    visibility.ts).
 * 3. Solo visible para cuentas verificadas en Discover/búsquedas, con
 *    insignia "Anónimo" (ver visibility.ts + Discover.tsx).
 * 4. Sin chat ni media hasta que el otro lado acepte la amistad;
 *    límite diario de solicitudes de amistad desde cuentas anónimas.
 * 5. Reseñas moderadas y etiquetadas "Reseña anónima"; sin reseñar a
 *    alguien sin interacción previa.
 * 6. Expiración (30 días) o conversión a perfil verificado (World ID /
 *    KYC) para desbloquear todo. Una sola cuenta anónima por
 *    dispositivo/navegador (registro local cc_local_demo_accounts_v1).
 * 7. Sin billetera (sin compra/recibo de CMPX, sin recompensas, sin
 *    staking) hasta verificar; reportar/bloquear como cualquier perfil,
 *    con identidad retenida para que no se re-registre con otro nombre
 *    (ver reportBlock.ts, almacén demo `retained_identities_demo`).
 *
 * Todo demo-only: no toca rutas reales de Supabase más allá de los
 * flags que ya existen (`is_anonymous`).
 */
import {
  ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT,
  countFriendRequestsSentToday,
  getAnonymousPhotoAccessRemainingMs,
  listSentRequestsSync,
} from "@/lib/friends";
import {
  findLocalAnonymousAccount,
  isAnonymousDemoProfile,
} from "@/lib/demo-registration";

/** Vigencia de una cuenta anónima: 30 días desde su creación. */
export const ANONYMOUS_ACCOUNT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Solicitudes de amistad que una cuenta anónima puede enviar por día. */
export const ANONYMOUS_FRIEND_REQUESTS_PER_DAY =
  ANONYMOUS_FRIEND_REQUESTS_DAILY_LIMIT;

/** Fotos públicas visibles de un perfil anónimo sin acceso concedido. */
export const ANONYMOUS_PUBLIC_GALLERY_LIMIT = 3;

/** Etiqueta obligatoria de toda reseña escrita por un anónimo. */
export const ANONYMOUS_REVIEW_LABEL = "Reseña anónima";

/** Motivo que se muestra cuando la billetera está bloqueada. */
export const ANONYMOUS_WALLET_BLOCKED_REASON =
  "La billetera está desactivada en cuentas anónimas: verifica tu perfil (World ID / KYC) para comprar y recibir CMPX, ganar recompensas y hacer staking.";

/** Mensaje cuando una cuenta anónima intenta dar like (A8). */
export const ANONYMOUS_LIKE_BLOCKED_MESSAGE =
  "Las cuentas anónimas no pueden dar like: solo pueden crear reseñas. Verifica tu perfil (World ID / KYC) para dar likes.";

/**
 * ¿Puede esta cuenta dar like? El anónimo NO: su única interacción
 * permitida es crear reseñas (moderadas, "Reseña anónima"). El
 * bloqueo se decide ANTES de alternar el estado del botón: si no,
 * el botón queda en "Te Gusta" aunque el like no se registró (test
 * ronda 9) y el error llega después como toast.
 */
export function canAnonymousLike(isAnonymous: boolean): {
  allowed: boolean;
  reason?: string;
} {
  if (!isAnonymous) return { allowed: true };
  return { allowed: false, reason: ANONYMOUS_LIKE_BLOCKED_MESSAGE };
}

/* ------------------------------------------------------------------ */
/* 6. Expiración / conversión                                          */
/* ------------------------------------------------------------------ */

export interface AnonymousExpiryInfo {
  /** Ms (epoch) en que expira la cuenta; null si no hay fecha. */
  expiresAtMs: number | null;
  /** Días enteros restantes (0 si expira hoy); -1 si no hay fecha. */
  daysRemaining: number;
  /** ¿Ya expiró? */
  expired: boolean;
  /** ¿Quedan 7 días o menos? (aviso de conversión). */
  expiringSoon: boolean;
}

/**
 * Vigencia de la cuenta anónima desde su `created_at`. Sin fecha no
 * hay expiración calculable (perfiles legacy sin created_at).
 */
export function getAnonymousExpiryInfo(
  createdAt: string | null | undefined,
  nowMs: number = Date.now(),
): AnonymousExpiryInfo {
  const createdMs = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(createdMs)) {
    return {
      expiresAtMs: null,
      daysRemaining: -1,
      expired: false,
      expiringSoon: false,
    };
  }
  const expiresAtMs = createdMs + ANONYMOUS_ACCOUNT_TTL_MS;
  const remainingMs = expiresAtMs - nowMs;
  const daysRemaining = Math.max(
    0,
    Math.floor(remainingMs / (24 * 60 * 60 * 1000)),
  );
  return {
    expiresAtMs,
    daysRemaining,
    expired: remainingMs <= 0,
    expiringSoon: remainingMs > 0 && remainingMs <= 7 * 24 * 60 * 60 * 1000,
  };
}

/** ¿Esta cuenta anónima ya expiró (30 días desde su creación)? */
export function isAnonymousAccountExpired(
  profile: unknown,
  nowMs: number = Date.now(),
): boolean {
  if (!isAnonymousDemoProfile(profile)) return false;
  const createdAt = (profile as { created_at?: unknown }).created_at;
  return getAnonymousExpiryInfo(
    typeof createdAt === "string" ? createdAt : null,
    nowMs,
  ).expired;
}

/**
 * ¿Se puede crear OTRA cuenta anónima en este dispositivo? No: una
 * sola por navegador (el registro local ya trae una anónima).
 */
export function canCreateAnonymousAccountOnDevice(): {
  allowed: boolean;
  reason?: string;
} {
  const existing = findLocalAnonymousAccount();
  if (!existing) return { allowed: true };
  return {
    allowed: false,
    reason:
      "Ya existe una cuenta anónima en este dispositivo. Solo se permite una por navegador: verifica esa cuenta o elimínala antes de crear otra.",
  };
}

/* ------------------------------------------------------------------ */
/* 4. Límite diario de solicitudes + chat/media hasta aceptar          */
/* ------------------------------------------------------------------ */

export interface AnonymousFriendRequestCheck {
  allowed: boolean;
  reason?: string;
  sentToday: number;
  limit: number;
}

/**
 * ¿Puede esta cuenta anónima enviar otra solicitud de amistad hoy?
 * Cuenta las de amistad enviadas hoy (local, demo) y corta en el
 * límite diario. Las no anónimas no tienen límite por esta regla.
 */
export function canSendFriendRequestAsAnonymous(
  viewerId: string,
  nowMs: number = Date.now(),
): AnonymousFriendRequestCheck {
  const sentToday = countFriendRequestsSentToday(viewerId, "friendship", nowMs);
  if (sentToday >= ANONYMOUS_FRIEND_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      reason: `Límite diario alcanzado: las cuentas anónimas pueden enviar hasta ${ANONYMOUS_FRIEND_REQUESTS_PER_DAY} solicitudes de amistad por día. Inténtalo mañana.`,
      sentToday,
      limit: ANONYMOUS_FRIEND_REQUESTS_PER_DAY,
    };
  }
  return {
    allowed: true,
    sentToday,
    limit: ANONYMOUS_FRIEND_REQUESTS_PER_DAY,
  };
}

/** ¿El espectador (por id) es una cuenta anónima en este navegador? */
export function isViewerAnonymous(viewerId: string): boolean {
  if (!viewerId) return false;
  const registered = findLocalAnonymousAccount();
  if (registered && registered.userId === viewerId) return true;
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("demo_user");
    if (!raw) return false;
    const demoUser: unknown = JSON.parse(raw);
    if (
      demoUser &&
      typeof demoUser === "object" &&
      (demoUser as { id?: unknown }).id === viewerId
    ) {
      return isAnonymousDemoProfile(demoUser);
    }
    return false;
  } catch {
    return false;
  }
}

export interface AnonymousChatCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * ¿Puede haber chat/media entre estos dos perfiles? Si ALGUNO es
 * anónimo, solo con amistad aceptada: primero la solicitud de
 * amistad, y sin fotos/audio hasta que el otro lado acepte.
 */
export function canAnonymousChat(input: {
  senderIsAnonymous: boolean;
  recipientIsAnonymous: boolean;
  areFriends: boolean;
}): AnonymousChatCheck {
  const { senderIsAnonymous, recipientIsAnonymous, areFriends } = input;
  if (!senderIsAnonymous && !recipientIsAnonymous) return { allowed: true };
  if (areFriends) return { allowed: true };
  return {
    allowed: false,
    reason:
      "Las cuentas anónimas solo pueden chatear con amigos aceptados. Envía primero una solicitud de amistad y espera a que la acepten.",
  };
}

/* ------------------------------------------------------------------ */
/* 5. Reseñas                                                          */
/* ------------------------------------------------------------------ */

export interface AnonymousReviewCheck {
  allowed: boolean;
  reason?: string;
  /** Etiqueta que debe llevar la reseña si se publica. */
  label: string;
}

/**
 * ¿Puede un anónimo reseñar a este perfil? Solo con interacción
 * previa (amistad aceptada o acceso a fotos concedido y vigente):
 * sin interacción no hay reseña, y toda reseña anónima va moderada
 * y etiquetada "Reseña anónima". La moderación en sí la hace el flujo
 * de reportes/moderación existente; aquí se decide si se puede
 * publicar y con qué etiqueta.
 */
export function canAnonymousReview(input: {
  hasInteraction: boolean;
}): AnonymousReviewCheck {
  if (!input.hasInteraction) {
    return {
      allowed: false,
      reason:
        "No puedes reseñar a este perfil sin haber interactuado con él antes (amistad aceptada o acceso a fotos concedido).",
      label: ANONYMOUS_REVIEW_LABEL,
    };
  }
  return { allowed: true, label: ANONYMOUS_REVIEW_LABEL };
}

/* ------------------------------------------------------------------ */
/* 1. Galería limitada (TTL 24 h)                                     */
/* ------------------------------------------------------------------ */

/**
 * Ms restantes del acceso concedido a la galería de un perfil
 * anónimo; null si no hay acceso vigente. Reutiliza el TTL de 24 h
 * de friends.ts (ANONYMOUS_PHOTO_ACCESS_TTL_MS).
 */
export function getAnonymousGalleryAccessRemainingMs(
  viewerId: string,
  ownerId: string,
  nowMs: number = Date.now(),
): number | null {
  return getAnonymousPhotoAccessRemainingMs(viewerId, ownerId, nowMs);
}

/** "23 h 12 min" / "45 min" / "expirado" para el aviso de vigencia. */
export function formatAnonymousPhotoAccessRemaining(
  remainingMs: number | null,
): string {
  if (remainingMs === null) return "sin acceso";
  if (remainingMs <= 0) return "expirado";
  const minutes = Math.floor(remainingMs / 60000);
  if (minutes < 60) return `${minutes} min restantes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min restantes` : `${hours} h restantes`;
}

/**
 * Ronda 11 (stream A, 1f): "23:59:41" / "00:45:12" / "00:00:45" para
 * la cuenta atrás EN VIVO (tick de 1 s) del acceso de 24 h. El formato
 * anterior ("23 h 12 min") solo cambia cada minuto: en un test corto
 * parecía texto estático y el test de la ronda 10 lo reportó como "sin
 * cuenta atrás visible". HH:MM:SS cambia cada segundo y se ve tickear.
 */
export function formatRemainingHHMMSS(remainingMs: number | null): string {
  if (remainingMs === null) return "sin acceso";
  if (remainingMs <= 0) return "expirado";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/* ------------------------------------------------------------------ */
/* 7. Billetera bloqueada hasta verificar                              */
/* ------------------------------------------------------------------ */

/** ¿Puede esta cuenta usar la billetera (comprar/recibir/recompensas/staking)? */
export function canAnonymousUseWallet(isAnonymous: boolean): boolean {
  return !isAnonymous;
}

/**
 * Solicitudes de amistad enviadas hoy por un usuario (para el aviso
 * del límite en la UI). Re-export de conveniencia para no duplicar
 * la lectura del almacén demo.
 */
export function listAnonymousSentRequestsToday(
  viewerId: string,
  nowMs: number = Date.now(),
): ReturnType<typeof listSentRequestsSync> {
  const startOfDay = new Date(nowMs);
  startOfDay.setHours(0, 0, 0, 0);
  return listSentRequestsSync(viewerId, "friendship").filter(
    (r) => Date.parse(r.createdAt) >= startOfDay.getTime(),
  );
}
