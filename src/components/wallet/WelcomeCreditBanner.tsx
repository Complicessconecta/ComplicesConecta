// SPDX-License-Identifier: MIT
// ComplicesConecta v3.9.35 - WelcomeCreditBanner (ronda 28)
// Descripción: banner persistente y descartable del crédito de
// bienvenida +50 CMPX. Garantía de entrega cuando el toast no se vio.

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  DEMO_WELCOME_CREDIT_EVENT,
  DEMO_WELCOME_TOAST_FRESHNESS_MS,
  clearPendingWelcomeToast,
  peekPendingWelcomeToast,
  takePendingWelcomeToast,
  type DemoWelcomeToastPending,
} from "@/lib/demo-wallet";

/**
 * Ronda 28 — ventana tras la cual el banner puede aparecer.
 *
 * El toast de +50 CMPX tiene un diferido de 4 s
 * (`DEMO_WELCOME_CREDIT_TOAST_DELAY_MS`, MainLayout) y una vida
 * visible de 3,5 s (`TOAST_REMOVE_DELAY`, useToast): 7,5 s desde el
 * crédito hasta que el toast ya no puede estar visible. El banner
 * espera 8 s (7,5 s + 0,5 s de margen) antes de mirar la marca, para
 * que el toast — primer intento y segunda oportunidad, ambos con el
 * mismo diferido de 4 s — tenga su oportunidad primero y el banner
 * nunca duplique un aviso que sí se mostró.
 *
 * Si el componente monta cuando la marca ya tiene más de 8 s (reload
 * tardío, navegación tardía al perfil), el retardo es 0: la ventana
 * del toast ya pasó y el banner aparece de inmediato. El retardo
 * nunca supera la frescura restante de la marca (60 s): un chequeo
 * programado más allá de la caducidad no encontraría nada.
 */
export const WELCOME_CREDIT_BANNER_DELAY_MS = 8000;

/**
 * Ronda 28 — banner persistente del crédito de bienvenida.
 *
 * El toast de +50 CMPX falló 3 rondas seguidas en vivo en el primer
 * inicio como Single (tests dirigidos de las PR #87, #88 y #89: toast
 * de demo sí, +50 no, saldo correcto 1,300; la segunda oportunidad
 * de la ronda 27 tampoco funcionó al recargar en el test del PR #89)
 * mientras la Pareja sí lo veía. La entrega está probada en unit
 * tests con discriminación dos veces, pero en vivo el toast no llega
 * al DOM en el primer inicio — y un aviso que se puede perder por
 * tiempos es el UI equivocado para un crédito que el usuario acaba
 * de ganar. Este banner es la garantía: si el toast no se mostró,
 * el usuario VE su crédito aquí, en la billetera, hasta que lo
 * descarta.
 *
 * Token exactamente-una-vez: la marca persistente
 * `cc_demo_welcome_toast_pending_v1` (demo-wallet.ts). El banner
 * solo aparece si la marca sigue presente tras la ventana del toast
 * (8 s), y la CONSUME AL MOSTRAR — no al descartar — porque si
 * solo se consumiera al descartar, una navegación con el banner
 * visible reprogramaría la segunda oportunidad del toast y el
 * usuario vería el aviso dos veces (banner + toast). El descarte
 * solo cierra la UI (y vuelve a limpiar la marca por seguridad,
 * sin efecto si ya se consumió). Un remontaje o una reentrada nunca
 * repiten: la marca ya está consumida y un crédito reclamado no
 * vuelve a escribirla. Marca caduca (>60 s) o corrupta: `peek`
 * la borra en silencio y no hay banner. Anonymous: nunca se
 * escribe la marca (sin billetera hasta verificar) y además
 * DemoWallet ni siquiera renderiza este componente en su rama
 * anónima — doble guarda.
 *
 * El toast como primer intento (diferido 4 s + segunda oportunidad,
 * rondas 26/27) queda INTACTO: el banner es la garantía, no el
 * reemplazo. Si el toast se mostró, la marca ya está consumida y
 * este componente no renderiza nada.
 */
export function WelcomeCreditBanner() {
  const [detail, setDetail] = useState<DemoWelcomeToastPending | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleCheck = useCallback(() => {
    clearTimer();
    const pending = peekPendingWelcomeToast();
    if (!pending) return;
    const age = Date.now() - pending.claimedAt;
    const delay = Math.max(
      0,
      Math.min(
        WELCOME_CREDIT_BANNER_DELAY_MS - age,
        DEMO_WELCOME_TOAST_FRESHNESS_MS - age,
      ),
    );
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const taken = takePendingWelcomeToast();
      if (!taken) return;
      // Ronda 28, bloque B: diagnóstico del pipeline del toast.
      // (no-console está en "off" en eslint.config.ts: el log va
      // directo a consola para que sea visible en el preview.)
      console.info(
        "[toast-diag] banner shown",
        taken.accountType,
        taken.balance,
      );
      setDetail(taken);
    }, delay);
  }, [clearTimer]);

  useEffect(() => {
    scheduleCheck();
    // El crédito puede dispararse con el perfil ya montado
    // (restauración de sesión al arrancar): reprogramar el chequeo.
    const onCredit = () => scheduleCheck();
    window.addEventListener(DEMO_WELCOME_CREDIT_EVENT, onCredit);
    return () => {
      clearTimer();
      window.removeEventListener(DEMO_WELCOME_CREDIT_EVENT, onCredit);
    };
  }, [scheduleCheck, clearTimer]);

  if (!detail) return null;

  const handleDismiss = () => {
    // Ronda 28, bloque B: diagnóstico del pipeline del toast.
    console.info("[toast-diag] banner dismissed", detail.accountType);
    // Defensa: la marca ya se consumió al mostrar; esto es no-op
    // si no queda nada.
    clearPendingWelcomeToast();
    setDetail(null);
  };

  return (
    <div
      role="status"
      className="flex items-start gap-3 p-4 bg-emerald-500/15 border border-emerald-400/50 rounded-lg shadow-lg"
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
          🎁 +50 CMPX de bienvenida
        </p>
        <p className="text-sm text-emerald-800 dark:text-emerald-200/90 mt-1">
          {detail.balance !== null
            ? `Tu saldo ahora es de ${detail.balance} CMPX.`
            : "Se acreditaron 50 CMPX a tu cartera."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm font-semibold text-emerald-900 dark:text-emerald-100 bg-emerald-500/25 hover:bg-emerald-500/40 rounded-md transition-colors"
        >
          Entendido
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso de bienvenida"
          className="p-1.5 text-emerald-800 dark:text-emerald-200/90 hover:bg-emerald-500/25 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
