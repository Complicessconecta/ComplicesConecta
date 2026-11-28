/**
 * RONDA 28 (bloque O3) — Solicitudes VIP demo.
 *
 * La "Reserva tu Experiencia VIP" de los perfiles propios
 * (/profile-single y /profile-couple, sección "Próximas experiencias
 * lifestyle") tenía el botón "Solicitar Acceso" SIN onClick: no hacía
 * nada. En demo, la solicitud es SIMULADA y se guarda solo en este
 * dispositivo (localStorage, misma convención `cc_demo_*` que el
 * saldo demo y la marca del toast de bienvenida). En producción no
 * hay backend para reservar una experiencia VIP de plataforma: la
 * tabla `reservations` del repo (migración
 * 20260124013400_create_reservations.sql, NO aplicada en producción)
 * es de clubes (`club_id NOT NULL`) y una experiencia VIP de
 * plataforma no tiene club; hace falta el campo/tabla en Supabase
 * (ver reporte de la ronda 28) antes de prometer una reserva real.
 * Por eso en real el modal dice "próximamente" y NO guarda nada.
 */

/** Clave localStorage de las solicitudes VIP simuladas (demo). */
export const DEMO_VIP_REQUESTS_KEY = "cc_demo_vip_requests_v1";

export interface DemoVipRequest {
  /** De qué perfil propio salió la solicitud. */
  source: "profile-single" | "profile-couple";
  /** ISO de cuándo se registró. */
  requestedAt: string;
}

function readRequests(): DemoVipRequest[] {
  try {
    const raw = localStorage.getItem(DEMO_VIP_REQUESTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoVipRequest[]) : [];
  } catch {
    return [];
  }
}

/** Guarda una solicitud VIP simulada (demo) y devuelve la lista. */
export function saveDemoVipRequest(
  source: DemoVipRequest["source"],
): DemoVipRequest[] {
  const next = [
    ...readRequests(),
    { source, requestedAt: new Date().toISOString() },
  ];
  try {
    localStorage.setItem(DEMO_VIP_REQUESTS_KEY, JSON.stringify(next));
  } catch {
    // localStorage lleno o bloqueado: la confirmación en pantalla ya
    // se mostró; no romper el flujo por el guardado.
  }
  return next;
}

/** Lee las solicitudes VIP simuladas guardadas (demo). */
export function getDemoVipRequests(): DemoVipRequest[] {
  return readRequests();
}
