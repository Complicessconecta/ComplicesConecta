/**
 * Ronda 28, bloques D y E: animaciones del modal de bienvenida y copy
 * de moderadores en futuro.
 *
 * Bloque D — diagnóstico probado: las animaciones de entrada de un solo
 * disparo (`animate-slide-up` 0.6s, `animate-fade-in` 0.3s, ambas
 * `forwards` en src/index.css) solo se reproducen al montar el nodo.
 * Al avanzar de diapositiva React actualizaba el mismo nodo en su sitio
 * y la entrada nunca se repetía: los slides 3, 7 y 8 se veían planos
 * frente al 2 (que además tiene el pulso infinito del enlace FAQ y el
 * distintivo con rebote). El arreglo remonta el contenido del slide en
 * cada cambio (`key={currentStep}` en WelcomeModal), así cada slide
 * entra con la misma animación que el primero. Además el subtítulo
 * tenía dos clases que escriben la misma propiedad `animation`
 * (`animate-fade-in animate-bounce`): una se perdía en cascada; queda
 * solo el fundido de entrada.
 *
 * Bloque E — el slide 7 afirmaba en presente que ya hay moderadores
 * ("Contamos con un equipo..."), y aún no los hay: el copy pasa a
 * futuro/próximamente.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "@/components/modals/WelcomeModal";

function goToStep(step: number) {
  for (let i = 0; i < step; i++) {
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
  }
}

describe("R28-D: el contenido del slide se remonta al avanzar", () => {
  it("reproduce la animación de entrada en cada diapositiva (nodo nuevo)", () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    // Slide 1: título y subtítulo iniciales.
    const titleStep0 = screen.getByRole("heading", {
      name: "👋 ¡Bienvenido",
    });
    const subtitleStep0 = screen.getByText("Tu nueva aventura comienza aquí");

    // Avanzar al slide 2 (tokens): el contenido debe ser un nodo NUEVO,
    // no el mismo con el texto cambiado (eso es lo que impedía que
    // `animate-slide-up` / `animate-fade-in` se repitieran).
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    const titleStep1 = screen.getByRole("heading", {
      name: "🪙 Sistema de Tokens CMPX",
    });
    const subtitleStep1 = screen.getByText(
      "Gana recompensas por invitar amigos",
    );
    expect(titleStep1).not.toBe(titleStep0);
    expect(subtitleStep1).not.toBe(subtitleStep0);

    // Avanzar al slide 3 (Beta Exclusiva): mismo remonte.
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    const titleStep2 = screen.getByRole("heading", {
      name: "Versión Beta Exclusiva",
    });
    expect(titleStep2).not.toBe(titleStep1);
    expect(screen.getByText("BETA EXCLUSIVA")).toBeInTheDocument();

    // Avanzar hasta el slide 8 (Interactivo): mismo remonte.
    goToStep(5);
    const titleStep7 = screen.getByRole("heading", {
      name: "🎯 ¡Todo es Interactivo!",
    });
    expect(titleStep7).not.toBe(titleStep2);
    expect(screen.getByText("🎯 EXPLORA TODO")).toBeInTheDocument();
    expect(
      screen.getByText("Cada elemento tiene vida propia"),
    ).toBeInTheDocument();
  });

  it("el subtítulo tiene una sola animación (sin conflicto de cascada)", () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    const subtitle = screen.getByText("Tu nueva aventura comienza aquí");
    expect(subtitle.className).toContain("animate-fade-in");
    expect(subtitle.className).not.toContain("animate-bounce");
  });
});

describe("R28-E: slide de moderación en futuro (aún no hay moderadores)", () => {
  it("habla de los moderadores en futuro, no en presente", () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    goToStep(6);

    expect(screen.getByText("🛡️ Sistema de Moderación")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Próximamente contaremos con un equipo de moderadores dedicados que mantendrán la comunidad segura. ¿Interesado en ayudar? Podrás aplicar para ser moderador y contribuir a crear un ambiente positivo para todos.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Contamos con un equipo de moderadores/),
    ).not.toBeInTheDocument();
  });

  it("mantiene el distintivo y la navegación del slide de moderación", () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    goToStep(6);

    expect(screen.getByText("🛡️ MODERACIÓN SEGURA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Anterior/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Siguiente/ }),
    ).toBeInTheDocument();
  });
});
