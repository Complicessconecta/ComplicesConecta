/**
 * Ronda 24, stream B: el slide de tokens del modal de bienvenida no
 * repite el nombre CMPX. El nombre aparece solo en el título; el
 * distintivo es "Recompensas" y el cuerpo habla de qué HACEN los
 * tokens (regalos, chats privados, funciones premium) sin repetir el
 * nombre. El enlace FAQ y la navegación del carrusel quedan intactos.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "@/components/modals/WelcomeModal";

function countCmpx() {
  return (document.body.textContent?.match(/CMPX/g) ?? []).length;
}

function goToStep(step: number) {
  for (let i = 0; i < step; i++) {
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
  }
}

describe("R24-B: slide de tokens del modal de bienvenida", () => {
  it("menciona CMPX solo en el título del slide de tokens", async () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    goToStep(1);

    // Título con el nombre (única mención permitida en el slide).
    expect(
      await screen.findByText("🪙 Sistema de Tokens CMPX"),
    ).toBeInTheDocument();
    expect(countCmpx()).toBe(1);

    // Distintivo sin el nombre.
    expect(screen.getByText("🎁 Recompensas")).toBeInTheDocument();
    expect(screen.queryByText(/TOKENS CMPX/)).not.toBeInTheDocument();

    // Cuerpo: qué hacen los tokens, sin repetir el nombre.
    expect(
      screen.getByText(
        "Invita amigos y gana 50 por cada uno; ellos reciben 50 de bienvenida. Úsalos en regalos, chats privados y funciones premium durante la beta.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("mantiene intacta la navegación del carrusel en el slide de tokens", async () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    goToStep(1);

    expect(
      screen.getByRole("button", { name: /Anterior/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Siguiente/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Saltar introducción/ }),
    ).toBeInTheDocument();
  });

  it("los demás slides que mencionan CMPX lo hacen una sola vez", async () => {
    render(<WelcomeModal isOpen onClose={vi.fn()} />);

    // Slide 3: "tus tokens CMPX" (una mención).
    goToStep(3);
    expect(countCmpx()).toBe(1);

    // Slide 4: "100 CMPX adicionales" (una mención).
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(countCmpx()).toBe(1);
  });
});
