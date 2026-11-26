/**
 * Reportar y bloquear perfiles (punto 5).
 *
 * - Reportar: motivos desglosados por grupo (términos y condiciones,
 *   conducta, material prohibido). El reporte va a la tabla existente
 *   `reports` (content_type 'profile', status 'pending') para que el
 *   administrador lo revise y decida: habilitar el perfil, bloquearlo
 *   o darlo de baja. NO se crea una tabla nueva de reportes: ya
 *   existe y `ProfileReportService` la usa.
 * - Bloquear: como en Twitter — el bloqueado NO puede buscar al que
 *   lo bloqueó ni ver su perfil. Tabla nueva `profile_blocks`
 *   (migración 20261124050000) + respaldo demo en localStorage.
 * - Retención de identidad: cuando un administrador da de baja un
 *   perfil reportado, el correo, el nombre de usuario (su ID) y el
 *   motivo SE QUEDAN en `retained_identities` para que esa persona
 *   no pueda registrarse después con otro nombre. Esa tabla NUNCA
 *   se borra desde la app; solo un administrador la consulta en el
 *   registro (ver docs/FLUJO_AMISTAD_PRIVACIDAD_PERFILES.md).
 *
 * OJO: el checkbox "bloquear" de `ReportDialog` hoy solo muestra un
 * toast: NO bloquea de verdad. El botón real de bloquear es
 * `ReportBlockButtons` (usa `blockProfile` de aquí). Cablear ese
 * checkbox queda como pendiente del coordinador (ver reporte).
 *
 * Menú visible (ronda 5, punto 15a): el diálogo `ReportDialog.tsx`
 * trae su propia lista fija (Perfil falso, Contenido inapropiado,
 * Acoso, Spam, Menor de edad, Estafa, Otro) SIN "términos" ni
 * "suplantación"; ese archivo está fuera del alcance de este stream
 * y hay que agregarle las dos opciones allí (ver reporte). Aquí el
 * catálogo canónico SÍ las trae desde la ronda 4
 * ("terms-violation" y "impersonation"), y `getReportReason` además
 * resuelve los ids del diálogo (`spam`, `scam`) a su motivo canónico
 * ("spam-scam"), para que `submitProfileReport` acepte reportes
 * vengan de donde vengan. "inappropriate-content" también es ya un
 * motivo canónico aquí (el diálogo lo usaba y antes se rechazaba).
 *
 * Espacio de ids REAL (ronda 5, punto 19): `profile_blocks` referencia
 * `profiles(id)` y sus RLS resuelven `auth.uid()` vía
 * `profiles.user_id` (migración 20261124050002). Los caminos reales
 * pasan los ids por `resolveOwnProfileId` de `src/lib/friends.ts`
 * (auth uid -> profiles.id, con fallback) antes de consultar o
 * insertar; sin eso el insert violaría la FK y la RLS negaría la
 * lectura.
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { resolveOwnProfileId } from "@/lib/friends";

/** Motivo de reporte, agrupado como pide Wacko. */
export interface ReportReason {
  id: string;
  group: "terms" | "conduct" | "prohibited";
  label: string;
  description: string;
  /** Severidad que se guarda en `reports.severity`. */
  severity: "low" | "medium" | "high" | "critical";
}

export const REPORT_REASONS: ReportReason[] = [
  {
    id: "terms-violation",
    group: "terms",
    label: "Infringe los términos y condiciones",
    description: "Viola las reglas de uso de ComplicesConecta",
    severity: "medium",
  },
  {
    id: "fake-profile",
    group: "terms",
    label: "Perfil falso",
    description: "Fotos falsas o información engañosa",
    severity: "high",
  },
  {
    id: "impersonation",
    group: "conduct",
    label: "Suplantación de identidad",
    description: "Se hace pasar por otra persona",
    severity: "high",
  },
  {
    id: "inappropriate-content",
    group: "conduct",
    label: "Contenido inapropiado",
    description: "Fotos o descripción ofensiva",
    severity: "high",
  },
  {
    id: "harassment",
    group: "conduct",
    label: "Acoso",
    description: "Mensajes ofensivos, amenazas o acoso",
    severity: "high",
  },
  {
    id: "hate-conduct",
    group: "conduct",
    label: "Conducta de odio o discriminatoria",
    description: "Insultos o discriminación por origen, género u orientación",
    severity: "high",
  },
  {
    id: "spam-scam",
    group: "conduct",
    label: "Spam, estafa o fraude",
    description: "Promoción no deseada o intento de estafa / pedir dinero",
    severity: "high",
  },
  {
    id: "underage",
    group: "prohibited",
    label: "Menor de edad",
    description: "Material prohibido: parece menor de 18 años",
    severity: "critical",
  },
  {
    id: "prohibited-content",
    group: "prohibited",
    label: "Material prohibido",
    description: "Contenido prohibido por las normas de la comunidad",
    severity: "critical",
  },
  {
    id: "non-consensual",
    group: "prohibited",
    label: "Contenido íntimo sin consentimiento",
    description: "Material prohibido (Ley Olimpia): fotos o videos sin permiso",
    severity: "critical",
  },
  {
    id: "other",
    group: "conduct",
    label: "Otro motivo",
    description: "Otro motivo no listado arriba",
    severity: "low",
  },
];

export const REPORT_REASON_GROUPS: Array<{
  id: ReportReason["group"];
  label: string;
}> = [
  { id: "terms", label: "Términos y condiciones" },
  { id: "conduct", label: "Conducta" },
  { id: "prohibited", label: "Material prohibido" },
];

/**
 * Ids que usan los diálogos de reporte y su motivo canónico de
 * `REPORT_REASONS`. `ReportDialog.tsx` (lista fija propia) usa
 * "spam" / "scam" para lo que aquí es "spam-scam"; sin este mapa,
 * `submitProfileReport` los rechazaba como "Motivo no válido".
 * "inappropriate-content", "fake-profile", "harassment", "underage"
 * y "other" ya son ids canónicos y no necesitan alias.
 */
export const REPORT_REASON_ALIASES: Record<string, string> = {
  spam: "spam-scam",
  scam: "spam-scam",
};

export function getReportReason(id: string): ReportReason | null {
  return (
    REPORT_REASONS.find((r) => r.id === id) ??
    REPORT_REASONS.find((r) => r.id === REPORT_REASON_ALIASES[id]) ??
    null
  );
}

/** Envía el reporte a revisión del administrador (`reports`). */
export async function submitProfileReport(input: {
  reporterId: string;
  reportedId: string;
  reasonId: string;
  description?: string;
  isDemo?: boolean;
  /**
   * Ronda 9 (stream A, punto 7): datos del reportado para retener su
   * identidad en demo cuando es anónimo (correo + apodo). En real la
   * retención la hace el administrador con `retainIdentityAfterBan`;
   * en demo no hay administrador, así que el reporte de un anónimo
   * retiene su identidad local para que no se re-registre con otro
   * nombre en este dispositivo.
   */
  reportedEmail?: string;
  reportedUsername?: string;
  reportedIsAnonymous?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const reason = getReportReason(input.reasonId);
  if (!reason) return { ok: false, error: "Motivo de reporte no válido" };
  if (input.reporterId === input.reportedId) {
    return { ok: false, error: "No puedes reportarte a ti mismo" };
  }
  if (input.isDemo || !supabase) {
    // Demo: no hay revisión real; se guarda el reporte local para
    // que el flujo sea visible y comprobable en el perfil demo.
    try {
      const key = "profile_reports_demo";
      const raw = window.localStorage.getItem(key);
      const list: unknown[] = raw ? JSON.parse(raw) : [];
      list.push({
        reporterId: input.reporterId,
        reportedId: input.reportedId,
        reason: reason.id,
        description: input.description ?? null,
        severity: reason.severity,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      window.localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // Sin almacenamiento: el reporte demo no persiste.
    }
    // Ronda 9 (stream A, punto 7): en demo no hay administrador que
    // dé de baja al reportado, así que el reporte de un perfil
    // ANÓNIMO retiene su identidad local (correo + apodo) para que no
    // pueda re-registrarse con otro nombre en este dispositivo
    // (ver `isIdentityRetainedDemo`, consultado en el registro demo).
    if (
      input.reportedIsAnonymous &&
      input.reportedEmail &&
      input.reportedUsername
    ) {
      retainIdentityDemo({
        email: input.reportedEmail,
        username: input.reportedUsername,
        userId: input.reportedId,
        reason: reason.id,
      });
    }
    return { ok: true };
  }
  try {
    const { error } = await supabase.from("reports").insert({
      reporter_user_id: input.reporterId,
      reported_user_id: input.reportedId,
      content_type: "profile",
      report_type: "profile",
      reported_content_id: input.reportedId,
      reason: reason.id,
      description: input.description ?? null,
      severity: reason.severity,
      status: "pending",
    } as never);
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
/* Bloqueos                                                            */
/* ------------------------------------------------------------------ */

const BLOCKS_KEY = "profile_blocks_demo";

export interface ProfileBlock {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

function readLocalBlocks(): ProfileBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BLOCKS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is ProfileBlock =>
        !!b && typeof (b as ProfileBlock).blockerId === "string",
    );
  } catch {
    return [];
  }
}

function writeLocalBlocks(blocks: ProfileBlock[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

/** ¿A bloqueó a B? (demo: local; real: `profile_blocks`). */
export async function isBlockedBy(
  blockerId: string,
  blockedId: string,
  isDemo = false,
): Promise<boolean> {
  if (!blockerId || !blockedId) return false;
  if (isDemo || !supabase) {
    return readLocalBlocks().some(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId,
    );
  }
  try {
    const [blockerProfileId, blockedProfileId] = await Promise.all([
      resolveOwnProfileId(blockerId),
      resolveOwnProfileId(blockedId),
    ]);
    const { data } = await supabase
      .from("profile_blocks")
      .select("id")
      .eq("blocker_id", blockerProfileId)
      .eq("blocked_id", blockedProfileId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return readLocalBlocks().some(
      (b) => b.blockerId === blockerId && b.blockedId === blockedId,
    );
  }
}

/** Bloquea un perfil (el bloqueado no podrá buscarte ni verte). */
export async function blockProfile(
  blockerId: string,
  blockedId: string,
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (!blockerId || !blockedId || blockerId === blockedId) {
    return { ok: false, error: "No puedes bloquearte a ti mismo" };
  }
  if (isDemo || !supabase) {
    const blocks = readLocalBlocks();
    if (
      !blocks.some(
        (b) => b.blockerId === blockerId && b.blockedId === blockedId,
      )
    ) {
      blocks.push({
        blockerId,
        blockedId,
        createdAt: new Date().toISOString(),
      });
      writeLocalBlocks(blocks);
    }
    return { ok: true };
  }
  try {
    const [blockerProfileId, blockedProfileId] = await Promise.all([
      resolveOwnProfileId(blockerId),
      resolveOwnProfileId(blockedId),
    ]);
    const { error } = await supabase.from("profile_blocks").insert({
      blocker_id: blockerProfileId,
      blocked_id: blockedProfileId,
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

/** Desbloquea un perfil. */
export async function unblockProfile(
  blockerId: string,
  blockedId: string,
  isDemo = false,
): Promise<{ ok: boolean; error?: string }> {
  if (isDemo || !supabase) {
    writeLocalBlocks(
      readLocalBlocks().filter(
        (b) => !(b.blockerId === blockerId && b.blockedId === blockedId),
      ),
    );
    return { ok: true };
  }
  try {
    const [blockerProfileId, blockedProfileId] = await Promise.all([
      resolveOwnProfileId(blockerId),
      resolveOwnProfileId(blockedId),
    ]);
    const { error } = await supabase
      .from("profile_blocks")
      .delete()
      .eq("blocker_id", blockerProfileId)
      .eq("blocked_id", blockedProfileId);
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
 * ¿Puede el espectador BUSCAR / ver en listados a este perfil?
 * Regla Twitter: si el dueño del perfil listado bloqueó al
 * espectador, el espectador no lo encuentra (ni en Discover ni en
 * búsquedas). El chequeo síncrono demo cubre el listado demo;
 * el chequeo real debe hacerse con `isBlockedBy` antes de mostrar
 * resultados de búsqueda (ver docs del flujo).
 */
export function isSearchBlockedSync(
  profileOwnerId: string,
  viewerId: string,
): boolean {
  if (!profileOwnerId || !viewerId) return false;
  return readLocalBlocks().some(
    (b) => b.blockerId === profileOwnerId && b.blockedId === viewerId,
  );
}

export interface BlockedProfileIds {
  /** Perfiles que el espectador bloqueó (no deben aparecerle). */
  blockedByMe: Set<string>;
  /** Perfiles que bloquearon al espectador (no deben encontrarlo). */
  blockedMe: Set<string>;
}

/**
 * Bloqueos del espectador, solo local (demo). Es la lectura síncrona
 * que Discover usa al primer render para no mostrar perfiles
 * bloqueados ni un instante; el refresco real llega después con
 * `getBlockedProfileIds`.
 */
export function getBlockedProfileIdsSync(viewerId: string): BlockedProfileIds {
  const blockedByMe = new Set<string>();
  const blockedMe = new Set<string>();
  if (!viewerId) return { blockedByMe, blockedMe };
  for (const b of readLocalBlocks()) {
    if (b.blockerId === viewerId) blockedByMe.add(b.blockedId);
    if (b.blockedId === viewerId) blockedMe.add(b.blockerId);
  }
  return { blockedByMe, blockedMe };
}

/**
 * Bloqueos del espectador (punto 15b): unión local + Supabase
 * (`profile_blocks`, migración 20261124050000; RLS corregida en
 * 20261124050002). En real el id del espectador se resuelve a su
 * `profiles.id` (ver `resolveOwnProfileId`). Si Supabase falla, se
 * devuelve al menos el conjunto local. Discover oculta la unión de
 * ambos conjuntos: ni los que el usuario bloqueó ni los que lo
 * bloquearon aparecen en sus resultados.
 */
export async function getBlockedProfileIds(
  viewerId: string,
  isDemo = false,
): Promise<BlockedProfileIds> {
  const local = getBlockedProfileIdsSync(viewerId);
  if (!viewerId || isDemo || !supabase) return local;
  try {
    const viewerProfileId = await resolveOwnProfileId(viewerId);
    const { data, error } = await supabase
      .from("profile_blocks")
      .select("blocker_id,blocked_id")
      .or(`blocker_id.eq.${viewerProfileId},blocked_id.eq.${viewerProfileId}`);
    if (error || !data) return local;
    const blockedByMe = new Set(local.blockedByMe);
    const blockedMe = new Set(local.blockedMe);
    for (const row of data as Array<{
      blocker_id: string;
      blocked_id: string;
    }>) {
      if (row.blocker_id === viewerProfileId) {
        blockedByMe.add(row.blocked_id);
      }
      if (row.blocked_id === viewerProfileId) {
        blockedMe.add(row.blocker_id);
      }
    }
    return { blockedByMe, blockedMe };
  } catch {
    return local;
  }
}

/**
 * Retención de identidad tras baja por reporte (solo administradores).
 * Guarda correo + nombre de usuario (ID) + motivo para que la persona
 * no se registre después con otro nombre. La fila queda en
 * `retained_identities` y NO hay borrado desde la app.
 */
export async function retainIdentityAfterBan(input: {
  email: string;
  username: string;
  userId: string;
  reason: string;
  reportId?: string;
  // Quién dio la baja, en espacio `profiles.id` (FK de
  // `retained_identities.banned_by`). Nullable: quien llama puede no
  // haber resuelto el id de perfil del moderador; en ese caso se
  // guarda NULL antes que un auth uid que violaría la FK.
  bannedBy?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    return { ok: false, error: "Supabase no está disponible" };
  }
  try {
    const { error } = await supabase.from("retained_identities").insert({
      email: input.email.toLowerCase().trim(),
      username: input.username,
      user_id: input.userId,
      ban_reason: input.reason,
      report_id: input.reportId ?? null,
      banned_by: input.bannedBy ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    logger.error("Error reteniendo identidad tras baja:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * ¿Este correo o apodo está retenido tras una baja por reporte?
 * (ronda 12, stream D). Consulta real de `retained_identities` en
 * el registro, vía la RPC `check_identity_retained` (migración
 * 20261124050004): el cliente anon no puede leer la tabla directo
 * por RLS, igual que el apodo usa `check_nickname_available`.
 *
 * DECISIÓN EXPLÍCITA — fail OPEN: si la RPC falta (migración sin
 * aplicar en producción) o da error, se devuelve `checked: false`
 * y el registro CONTINÚA. Bloquear el alta por un error de
 * infraestructura dejaría fuera a usuarios legítimos; el chequeo
 * solo cierra el registro cuando la RPC responde `retained: true`
 * de forma positiva. Es el mismo patrón best-effort del validador
 * de apodo (veredicto provisional cuando la RPC no está). Los
 * errores se registran con warning para que no pasen en silencio.
 * En demo no se usa: ahí manda `isIdentityRetainedDemo` (abajo).
 */
export async function checkIdentityRetained(
  email: string,
  username: string,
): Promise<{ retained: boolean; checked: boolean }> {
  if (!supabase) return { retained: false, checked: false };
  try {
    const { data, error } = await supabase.rpc("check_identity_retained", {
      p_email: email,
      p_username: username,
    });
    if (error) {
      logger.warn(
        "checkIdentityRetained: RPC no disponible, registro sin chequeo de retención",
        { error: error.message },
      );
      return { retained: false, checked: false };
    }
    return { retained: data === true, checked: true };
  } catch (err) {
    logger.warn(
      "checkIdentityRetained: error, registro sin chequeo de retención",
      { error: err instanceof Error ? err.message : String(err) },
    );
    return { retained: false, checked: false };
  }
}

/* ------------------------------------------------------------------ */
/* Retención de identidad en demo (ronda 9, stream A, punto 7)        */
/* ------------------------------------------------------------------ */

/**
 * Espejo local de `retained_identities` para demo: en demo no hay
 * administrador que dé de baja al reportado, así que el reporte de
 * un perfil anónimo retiene su identidad AQUÍ (correo + apodo +
 * motivo) y el registro demo la consulta (`isIdentityRetainedDemo`)
 * para que esa persona no se re-registre con otro nombre en este
 * dispositivo. Como la tabla real, este almacén NUNCA se borra desde
 * la app: no hay función de borrado.
 */
export const RETAINED_IDENTITIES_DEMO_KEY = "retained_identities_demo";

export interface RetainedIdentityDemo {
  email: string;
  username: string;
  userId: string;
  reason: string;
  createdAt: string;
}

function readRetainedIdentitiesDemo(): RetainedIdentityDemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RETAINED_IDENTITIES_DEMO_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RetainedIdentityDemo =>
        !!r &&
        typeof r === "object" &&
        typeof (r as RetainedIdentityDemo).email === "string" &&
        typeof (r as RetainedIdentityDemo).username === "string",
    );
  } catch {
    return [];
  }
}

/** Guarda una identidad retenida en demo (sin duplicar por correo). */
export function retainIdentityDemo(input: {
  email: string;
  username: string;
  userId: string;
  reason: string;
}): void {
  if (typeof window === "undefined") return;
  const email = input.email.toLowerCase().trim();
  if (!email || !input.username) return;
  try {
    const list = readRetainedIdentitiesDemo().filter((r) => r.email !== email);
    list.push({
      email,
      username: input.username,
      userId: input.userId,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    });
    window.localStorage.setItem(
      RETAINED_IDENTITIES_DEMO_KEY,
      JSON.stringify(list),
    );
  } catch {
    // Sin almacenamiento: la retención solo vive en esta sesión.
  }
}

/**
 * ¿Está retenida esta identidad (correo o apodo)? Lo consulta el
 * registro demo antes de crear una cuenta anónima.
 */
export function isIdentityRetainedDemo(
  email: string,
  username?: string,
): boolean {
  const needleEmail = email.trim().toLowerCase();
  const needleUsername = username?.trim().toLowerCase() ?? "";
  if (!needleEmail && !needleUsername) return false;
  return readRetainedIdentitiesDemo().some(
    (r) =>
      (needleEmail !== "" && r.email === needleEmail) ||
      (needleUsername !== "" &&
        r.username.trim().toLowerCase() === needleUsername),
  );
}
