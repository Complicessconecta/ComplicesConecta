/**
 * RONDA 28 (bloque O3) — Modal "Reserva tu Experiencia VIP".
 *
 * Captura 433020_22 (04:19 CST): el modal sobre /profile-single (la
 * captura es del perfil propio, no de /tokens) con "Solicitar Acceso"
 * SIN onClick — botón muerto, sin acción de reservar.
 *
 * Fix: en demo, "Solicitar Acceso" guarda una solicitud SIMULADA en
 * localStorage (`cc_demo_vip_requests_v1`, helper
 * src/lib/demo-vip.ts) y muestra confirmación visible; en real no hay
 * backend para reservar una experiencia VIP de plataforma (la tabla
 * `reservations` del repo es de clubes, `club_id NOT NULL`, y la
 * migración no está aplicada en producción) y el modal dice
 * "próximamente" sin guardar nada. El helper se prueba en unit; el
 * cableado en los dos perfiles (ProfileSingle y ProfileCouple, copias
 * inline del modal) se verifica por assertions estáticas — renderizar
 * las páginas completas es trabajo del test dirigido en vivo.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  saveDemoVipRequest,
  getDemoVipRequests,
  DEMO_VIP_REQUESTS_KEY,
} from "@/lib/demo-vip";

const readSource = (rel: string) =>
  readFileSync(path.resolve(__dirname, rel), "utf-8");

describe("R28-O3: solicitudes VIP demo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda la solicitud simulada en localStorage con su origen", () => {
    const saved = saveDemoVipRequest("profile-single");
    expect(saved).toHaveLength(1);
    expect(saved[0].source).toBe("profile-single");
    expect(saved[0].requestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const raw = localStorage.getItem(DEMO_VIP_REQUESTS_KEY);
    expect(raw).toContain("profile-single");
    expect(getDemoVipRequests()).toHaveLength(1);
  });

  it("acumula solicitudes de ambos perfiles sin borrar las anteriores", () => {
    saveDemoVipRequest("profile-single");
    const saved = saveDemoVipRequest("profile-couple");
    expect(saved).toHaveLength(2);
    expect(saved.map((r) => r.source)).toEqual([
      "profile-single",
      "profile-couple",
    ]);
  });

  it("sin solicitudes guardadas devuelve lista vacía", () => {
    expect(getDemoVipRequests()).toEqual([]);
  });

  it("ProfileSingle cablea el botón: guarda demo + confirmación visible", () => {
    const src = readSource(
      "../../pages/profiles/single/ProfileSingle.tsx",
    );
    expect(src).toContain('saveDemoVipRequest("profile-single")');
    expect(src).toContain("onClick={handleVipRequest}");
    expect(src).toContain("Solicitud demo registrada");
    expect(src).toContain("Reservas VIP próximamente");
    expect(src).toContain("Demo: la solicitud es simulada");
  });

  it("ProfileCouple cablea el botón igual (espejo)", () => {
    const src = readSource(
      "../../pages/profiles/couple/ProfileCouple.tsx",
    );
    expect(src).toContain('saveDemoVipRequest("profile-couple")');
    expect(src).toContain("onClick={handleVipRequest}");
    expect(src).toContain("Solicitud demo registrada");
    expect(src).toContain("Reservas VIP próximamente");
    expect(src).toContain("Demo: la solicitud es simulada");
  });
});
