/**
 * RONDA 28 (bloque L) — lógica de precisión de ubicación.
 *
 * El mapeo nivel → área estaba mal implementado en dos sitios a la
 * vez, y se contradecían entre sí:
 * - S2Service.getCellArea solo tenía 6 niveles (10, 11, 13, 15, 17,
 *   20) y el fallback `Math.pow(2, 20 - level)` era NO monótono
 *   (nivel 12 → 256 km², MAYOR que el nivel 10; nivel 14 → 64).
 * - El rótulo de LocationSettings usaba un ternario de 3 cubetas
 *   para 11 niveles (13 y 15 mostraban el mismo "~1km²"; 16–20 el
 *   mismo "~0.1km²") y contradecía a las etiquetas de extremos
 *   (nivel 20: ~0.1 en el rótulo vs ~0.01 en el extremo).
 * El video de Wacko lo muestra: niveles 13 y 15 con el mismo
 * "~1km²", y el nivel 20 con ~0.1km² en una captura y ~0.01km²
 * en otra.
 *
 * La tabla corregida es una escala logarítmica limpia (×10^-0.4 ≈
 * ÷2.5 por nivel): monótona decreciente, sin duplicados, extremos
 * 100 km² (nivel 10) y 0.01 km² (nivel 20).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  s2Service,
  formatCellAreaKm2,
} from "@/services/geo/S2Service";
import { LocationSettings } from "@/components/settings/LocationSettings";

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "single@demo.local" },
    isDemo: () => true,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Tabla corregida (la que debe quedar en código).
const EXPECTED_AREA_KM2: Record<number, number> = {
  10: 100,
  11: 40,
  12: 16,
  13: 6.3,
  14: 2.5,
  15: 1,
  16: 0.4,
  17: 0.16,
  18: 0.063,
  19: 0.025,
  20: 0.01,
};

describe("R28-L: mapeo nivel S2 → área (km²)", () => {
  it("cada nivel 10–20 tiene el área de la tabla corregida", () => {
    for (const [level, area] of Object.entries(EXPECTED_AREA_KM2)) {
      expect(s2Service.getCellArea(Number(level))).toBe(area);
    }
  });

  it("es monótono decreciente y sin duplicados", () => {
    const areas = Array.from({ length: 11 }, (_, i) =>
      s2Service.getCellArea(10 + i),
    );
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i]).toBeLessThan(areas[i - 1]);
    }
    expect(new Set(areas).size).toBe(11);
  });

  it("extremos: nivel 10 = 100 km², nivel 20 = 0.01 km²", () => {
    expect(s2Service.getCellArea(10)).toBe(100);
    expect(s2Service.getCellArea(20)).toBe(0.01);
  });

  it("fuera de rango se sujeta al extremo más cercano", () => {
    expect(s2Service.getCellArea(9)).toBe(100);
    expect(s2Service.getCellArea(21)).toBe(0.01);
  });

  it("el formateo no deja ceros de más", () => {
    expect(formatCellAreaKm2(100)).toBe("~100km²");
    expect(formatCellAreaKm2(6.3)).toBe("~6.3km²");
    expect(formatCellAreaKm2(1)).toBe("~1km²");
    expect(formatCellAreaKm2(0.063)).toBe("~0.063km²");
    expect(formatCellAreaKm2(0.01)).toBe("~0.01km²");
  });
});

describe("R28-L: el rótulo de /settings usa el mapeo único", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Modo demo (ver r28-settings.test.tsx): sin esto la carga toma
    // la rama real de Supabase y es lenta en tests.
    window.localStorage.setItem("demo_authenticated", "true");
  });

  it("nivel 15 por defecto: '~1km² — más alto = más preciso y menos privado'", async () => {
    render(<LocationSettings />);
    await screen.findByText(
      /Nivel 15: ~1km² — más alto = más preciso y menos privado/,
    );
  });

  it("las etiquetas de extremos coinciden con el rótulo dinámico", async () => {
    render(<LocationSettings />);
    await screen.findByText(/Nivel 10 \(menos preciso · ~100km²\)/);
    await screen.findByText(/Nivel 20 \(más preciso · ~0\.01km²\)/);
  });

  it("nivel 20 guardado: el rótulo dinámico dice ~0.01km², no ~0.1km²", async () => {
    window.localStorage.setItem(
      "app_settings:user-1",
      JSON.stringify({ s2_level: 20 }),
    );
    render(<LocationSettings />);
    await screen.findByText(/Nivel 20: ~0\.01km²/);
    expect(
      screen.queryByText(/Nivel 20: ~0\.1km²/),
    ).not.toBeInTheDocument();
  });
});
