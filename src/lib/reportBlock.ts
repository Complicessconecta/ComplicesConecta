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
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

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

export function getReportReason(id: string): ReportReason | null {
  return REPORT_REASONS.find((r) => r.id === id) ?? null;
}

/** Envía el reporte a revisión del administrador (`reports`). */
export async function submitProfileReport(input: {
  reporterId: string;
  reportedId: string;
  reasonId: string;
  description?: string;
  isDemo?: boolean;
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
    const { data } = await supabase
      .from("profile_blocks")
      .select("id")
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId)
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
    const { error } = await supabase.from("profile_blocks").insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
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
    const { error } = await supabase
      .from("profile_blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);
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
  bannedBy: string;
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
      banned_by: input.bannedBy,
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
