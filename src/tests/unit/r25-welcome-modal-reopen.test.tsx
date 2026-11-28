/**
 * Ronda 25, stream B: la guía de bienvenida se puede reabrir bajo demanda.
 *
 * Problema probado: el WelcomeModal solo aparece en la primera visita
 * (Index.tsx: !isAuthenticated() && !hasVisited) y al cerrarlo pone
 * hasVisitedComplicesConecta=true; después no había ningún control para
 * reabrirlo, así que el test dirigido no pudo citar la diapositiva 2/8.
 *
 * DISCRIMINACIÓN: este test FALLA en el árbol viejo — el componente
 * WelcomeGuideReopenButton no existe (falla el import) y /faq no tiene
 * ninguna acción de reapertura — y PASA con el fix.
 *
 * El botón vive solo en /faq y abre el WelcomeModal con estado local:
 * cerrarlo NO escribe hasVisitedComplicesConecta, así que la primera
 * visita sigue intacta.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeGuideReopenButton } from "@/components/WelcomeGuideReopenButton";

const HAS_VISITED_KEY = "hasVisitedComplicesConecta";

function countCmpx() {
  return (document.body.textContent?.match(/CMPX/g) ?? []).length;
}

function goToStep(step: number) {
  for (let i = 0; i < step; i++) {
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
  }
}

describe("R25-B: reapertura de la guía de bienvenida", () => {
  beforeEach(() => {
    window.localStorage.removeItem(HAS_VISITED_KEY);
  });

  it("muestra el botón de reapertura y el modal está cerrado al inicio", () => {
    render(<WelcomeGuideReopenButton />);

    expect(
      screen.getByRole("button", { name: /Ver guía de bienvenida/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre el modal en la diapositiva 1 y navega a la 2/8 con el distintivo Recompensas", async () => {
    render(<WelcomeGuideReopenButton />);

    fireEvent.click(
      screen.getByRole("button", { name: /Ver guía de bienvenida/ }),
    );

    // Diapositiva 1 al abrir.
    expect(
      await screen.findByText("👋 ¡Bienvenido"),
    ).toBeInTheDocument();
    expect(screen.queryByText("🎁 Recompensas")).not.toBeInTheDocument();

    // Diapositiva 2/8: contenido de la ronda 24, sin cambiar el texto.
    goToStep(1);
    expect(
      screen.getByText("🪙 Sistema de Tokens CMPX"),
    ).toBeInTheDocument();
    expect(countCmpx()).toBe(1);
    expect(screen.getByText("🎁 Recompensas")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Invita amigos y gana 50 por cada uno; ellos reciben 50 de bienvenida. Úsalos en regalos, chats privados y funciones premium durante la beta.",
      ),
    ).toBeInTheDocument();
  });

  it("cerrar el modal reabierto NO marca hasVisitedComplicesConecta", async () => {
    render(<WelcomeGuideReopenButton />);

    fireEvent.click(
      screen.getByRole("button", { name: /Ver guía de bienvenida/ }),
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Cerrar con "Saltar introducción": la primera visita sigue intacta.
    fireEvent.click(
      screen.getByRole("button", { name: /Saltar introducción/ }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HAS_VISITED_KEY)).toBeNull();
  });

  it("cerrar con la X tampoco marca hasVisitedComplicesConecta", async () => {
    render(<WelcomeGuideReopenButton />);

    fireEvent.click(
      screen.getByRole("button", { name: /Ver guía de bienvenida/ }),
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HAS_VISITED_KEY)).toBeNull();
  });

  it("reabrir el modal arranca de nuevo en la diapositiva 1", async () => {
    render(<WelcomeGuideReopenButton />);

    const openButton = () =>
      screen.getByRole("button", { name: /Ver guía de bienvenida/ });

    fireEvent.click(openButton());
    expect(await screen.findByText("👋 ¡Bienvenido")).toBeInTheDocument();
    goToStep(1);
    expect(screen.getByText("🎁 Recompensas")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Saltar introducción/ }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Segunda apertura: otra vez la diapositiva 1.
    fireEvent.click(openButton());
    expect(await screen.findByText("👋 ¡Bienvenido")).toBeInTheDocument();
    expect(screen.queryByText("🎁 Recompensas")).not.toBeInTheDocument();
  });
});
