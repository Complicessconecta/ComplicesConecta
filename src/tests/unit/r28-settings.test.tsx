/**
 * Ronda 28, bloques H/I/J/K: /settings — contraste, botones con acción,
 * capturas y geolocalización.
 *
 * H — causa raíz del texto perdido: los tokens semánticos de
 * `@theme inline` en src/styles/index.css eran tripletes HSL crudos
 * (`--card: 222.2 84% 4.9%`) sin hsl(), así que el CSS compilado era
 * `background-color: var(--card)` — inválido, declaración descartada —
 * y `bg-card`, `bg-background`, `bg-muted`, `bg-primary`,
 * `text-foreground`... quedaban transparentes en TODA la app (verificado
 * en el CSS compilado de `vite build`). Las tarjetas de /settings
 * flotaban sobre las partículas. El arreglo envuelve cada token en
 * hsl() (excepto chart-1..5, cuyas variables no existen).
 * I — Avisos no persistía nada (handleSave era solo un log); Detectar
 * Ubicación perdía el resultado al cambiar de pestaña (estado solo en
 * memoria del hook); el PIN mentía con defaults de producción.
 * J — "Bloquear capturas de pantalla" eliminado de /settings (nativo y
 * siempre activo; explicación en el FAQ).
 * K — "Activar geolocalización" eliminado (siempre activa; la decisión
 * del usuario es la precisión, no si hay ubicación).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// FAQ usa useLocation y NotificationSettings usa useNavigate: necesitan Router.
const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isDemo: () => true }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { LocationSettings } from "@/components/settings/LocationSettings";
import { PinSettings } from "@/components/settings/PinSettings";
import { BiometricSettings } from "@/components/settings/BiometricSettings";
import FAQ from "@/pages/FAQ";

const SETTINGS_KEY = "app_settings:user-1";

beforeEach(() => {
  window.localStorage.clear();
  // Sin esto, isDemoMode() es false en vitest (VITE_APP_MODE no está
  // definido → mode "production") y load/saveSettingsState toman la
  // rama REAL de Supabase contra la URL dummy — lenta e inestable en
  // tests. Estos tests ejercitan la ruta DEMO: la bandera la activa.
  window.localStorage.setItem("demo_authenticated", "true");
});

describe("R28-H: tokens semánticos resuelven a colores válidos", () => {
  it("cada --color-* del @theme inline va envuelto en hsl() (salvo chart-*)", () => {
    const cssPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../styles/index.css",
    );
    const css = readFileSync(cssPath, "utf8");
    const themeBlock = css.match(/@theme inline \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(themeBlock).not.toBe("");
    const mappings = [...themeBlock.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)];
    expect(mappings.length).toBeGreaterThan(20);
    for (const [, name, value] of mappings) {
      if (name.startsWith("chart-")) continue; // vars inexistentes: fuera de alcance
      expect(
        value.trim(),
        `--color-${name} debe ser hsl(var(--...)), no un triplete crudo`,
      ).toMatch(/^hsl\(var\(--[a-z0-9-]+\)\)$/);
    }
  });
});

describe("R28-J: bloqueo de capturas fuera de /settings, explicado en el FAQ", () => {
  it("PrivacySettings ya no muestra el interruptor", () => {
    render(<PrivacySettings />);
    expect(
      screen.queryByText("Bloquear capturas de pantalla"),
    ).not.toBeInTheDocument();
  });

  it("el FAQ explica el bloqueo nativo de capturas", async () => {
    renderWithRouter(<FAQ />);
    fireEvent.click(screen.getByText("Privacidad y Seguridad"));
    expect(
      await screen.findByText("¿Pueden hacer capturas de pantalla de mi perfil?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /La APK no permite grabar ni capturar pantalla: el bloqueo es nativo y siempre está activo/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/excepto con la herramienta de recorte de pantalla del sistema/),
    ).toBeInTheDocument();
  });

  it("el FAQ dice que la ubicación es requisito indispensable (sin prometer cierre en web)", async () => {
    renderWithRouter(<FAQ />);
    fireEvent.click(screen.getByText("Privacidad y Seguridad"));
    expect(
      await screen.findByText("¿Por qué la app necesita mi ubicación?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /La ubicación es un requisito indispensable para usar la app/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/En la APK, si no aceptas la ubicación, la app no continúa/),
    ).toBeInTheDocument();
  });
});

describe("R28-I: Avisos persiste como Privacidad/Ubicación", () => {
  it("Guardar persiste los avisos y sobreviven a remontar", async () => {
    const { unmount } = renderWithRouter(<NotificationSettings />);
    const marketingSwitch = screen.getByLabelText("Emails promocionales");
    fireEvent.click(marketingSwitch);
    fireEvent.click(screen.getByRole("button", { name: "Guardar Configuración" }));

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(SETTINGS_KEY) ?? "{}",
      );
      expect(stored.notif_marketing).toBe(true);
    });

    unmount();
    renderWithRouter(<NotificationSettings />);
    await waitFor(() => {
      expect(screen.getByLabelText("Emails promocionales")).toBeChecked();
    });
  });
});

describe("R28-I/K: Ubicación persistente y sin interruptor para quitarla", () => {
  it("no existe interruptor para desactivar la geolocalización", () => {
    render(<LocationSettings />);
    expect(
      screen.queryByText("Activar geolocalización"),
    ).not.toBeInTheDocument();
  });

  it("el deslizador de precisión y los controles siguen disponibles", async () => {
    render(<LocationSettings />);
    expect(screen.getByText(/Precisión de ubicación: Nivel/)).toBeInTheDocument();
    expect(screen.getByText(/Radio de búsqueda:/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ubicación precisa")).not.toBeDisabled();
    expect(screen.getByLabelText("Historial de ubicaciones")).not.toBeDisabled();
  });

  it("la última ubicación guardada se muestra al entrar (no desaparece)", async () => {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        last_latitude: 19.43,
        last_longitude: -99.13,
        last_location_at: 1764300000000,
        location_denied: false,
      }),
    );
    render(<LocationSettings />);
    expect(
      await screen.findByText("Última ubicación detectada"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Latitud: 19.430000/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver a detectar" }),
    ).toBeInTheDocument();
  });

  it("Detectar Ubicación activa la geolocalización y persiste el resultado", async () => {
    const getCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 19.4326,
          longitude: -99.1332,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
      });
    });
    Object.defineProperty(window.navigator, "geolocation", {
      value: {
        getCurrentPosition,
        watchPosition: vi.fn(() => 42),
        clearWatch: vi.fn(),
      },
      configurable: true,
    });
    render(<LocationSettings />);
    fireEvent.click(
      screen.getByRole("button", { name: "Detectar Ubicación" }),
    );
    expect(
      await screen.findByText("Ubicación detectada"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Latitud: 19.432600/)).toBeInTheDocument();
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(SETTINGS_KEY) ?? "{}",
      );
      expect(stored.last_latitude).toBeCloseTo(19.4326);
      expect(stored.last_longitude).toBeCloseTo(-99.1332);
    });
  });
});

describe("R28-H/I: PIN sin mentiras y biometría deshabilitada de forma honesta", () => {
  it("sin PIN no hay aviso de 'PIN Requerido' ni fecha inventada", () => {
    render(<PinSettings />);
    expect(screen.getByText("Sin PIN configurado")).toBeInTheDocument();
    expect(screen.queryByText(/PIN Requerido/)).not.toBeInTheDocument();
    expect(screen.getByText(/Última actualización: —/)).toBeInTheDocument();
    expect(screen.getByText(/Expira: —/)).toBeInTheDocument();
  });

  it("el encabezado del PIN es legible en tema oscuro", () => {
    render(<PinSettings />);
    const heading = screen.getByText("PIN de Seguridad");
    expect(heading.className).toContain("dark:text-white");
  });

  it("el encabezado de Biometría es legible en tema oscuro", async () => {
    render(<BiometricSettings />);
    // La pantalla inicial es "Cargando configuración biométrica..." (la
    // detección es asíncrona): esperar al contenido.
    const heading = await screen.findByText("Autenticación Biométrica");
    expect(heading.className).toContain("dark:text-white");
  });

  it("el interruptor de biometría está deshabilitado en web (sin fingir)", async () => {
    render(<BiometricSettings />);
    expect(
      await screen.findByText("Biometría no disponible"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activar autenticación biométrica" }),
    ).toBeDisabled();
  });
});
