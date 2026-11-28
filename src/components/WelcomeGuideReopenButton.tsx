/**
 * Ronda 25, stream B: reabrir la guía de bienvenida bajo demanda.
 *
 * El WelcomeModal solo aparece en la primera visita: Index.tsx lo muestra
 * cuando !isAuthenticated() && !hasVisited, y al cerrarlo pone
 * hasVisitedComplicesConecta=true en localStorage. Después no había ningún
 * control para volver a verlo, así que el test dirigido no pudo citar el
 * texto de la diapositiva 2/8.
 *
 * Este botón discreto vive solo en /faq (Centro de Ayuda, página pública)
 * y abre el mismo WelcomeModal con estado local. El onClose SOLO hace
 * setShowWelcome(false): NO toca hasVisitedComplicesConecta, así que
 * reabrir (y cerrar) la guía no cambia el comportamiento de primera
 * entrada. El modal se resetea solo a la diapositiva 1 en cada apertura
 * (WelcomeModal resetea currentStep cuando isOpen pasa a true).
 */
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { WelcomeModal } from "@/components/modals/WelcomeModal";

export const WelcomeGuideReopenButton = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowWelcome(true)}
        aria-label="Ver guía de bienvenida"
      >
        <Sparkles className="h-4 w-4" />
        Ver guía de bienvenida
      </Button>
      <WelcomeModal
        isOpen={showWelcome}
        // Intencionado: solo estado local. No se escribe
        // hasVisitedComplicesConecta aquí; la primera visita la
        // gobierna Index.tsx (handleWelcomeChange).
        onClose={() => setShowWelcome(false)}
      />
    </>
  );
};
