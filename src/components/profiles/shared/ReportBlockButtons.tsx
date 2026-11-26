/**
 * Botones Reportar + Bloquear (punto 5).
 *
 * - Reportar: abre el diálogo de reporte existente del perfil
 *   (el padre pasa `onReport` y muestra su `ReportDialog`, que ya
 *   trae los motivos). Los motivos desglosados (términos / conducta /
 *   material prohibido) viven en `REPORT_REASONS` de
 *   `src/lib/reportBlock.ts`.
 * - Bloquear / Desbloquear: bloqueo REAL (tabla `profile_blocks` en
 *   real; localStorage en demo). Como en Twitter: el bloqueado no
 *   puede buscar a quien lo bloqueó ni ver su perfil. El checkbox
 *   "bloquear" de `ReportDialog` hoy solo muestra un toast y NO
 *   bloquea: este es el botón que sí lo hace.
 *
 * No se muestra nada en el perfil propio.
 */
import { useEffect, useState } from "react";
import { Ban, Flag } from "lucide-react";
import { blockProfile, isBlockedBy, unblockProfile } from "@/lib/reportBlock";

interface ReportBlockButtonsProps {
  profileId: string;
  profileName: string;
  /** Id del espectador (quien reporta / bloquea). */
  viewerId: string;
  /** ¿Es el perfil propio? Si sí, no se muestra nada. */
  isOwnProfile: boolean;
  isDemo?: boolean;
  /** El padre abre su ReportDialog con esto. */
  onReport: () => void;
  /** Mostrar el botón Reportar (false si el padre ya tiene el suyo). */
  showReport?: boolean;
  className?: string;
}

export function ReportBlockButtons({
  profileId,
  profileName,
  viewerId,
  isOwnProfile,
  isDemo = false,
  onReport,
  showReport = true,
  className = "",
}: ReportBlockButtonsProps) {
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isBlockedBy(viewerId, profileId, isDemo).then((value) => {
      if (!cancelled) setBlocked(value);
    });
    return () => {
      cancelled = true;
    };
  }, [viewerId, profileId, isDemo]);

  if (isOwnProfile || !viewerId || !profileId) return null;

  const handleBlockToggle = async () => {
    setBusy(true);
    const result = blocked
      ? await unblockProfile(viewerId, profileId, isDemo)
      : await blockProfile(viewerId, profileId, isDemo);
    setBusy(false);
    if (!result.ok) {
      window.alert(result.error ?? "No se pudo completar el bloqueo");
      return;
    }
    setBlocked(!blocked);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showReport && (
        <button
          type="button"
          onClick={onReport}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-red-200 border border-red-400/40 backdrop-blur-xl px-4 py-2.5 text-sm"
          title={`Reportar a ${profileName}`}
        >
          <Flag className="w-4 h-4" aria-hidden="true" />
          Reportar
        </button>
      )}
      <button
        type="button"
        onClick={() => void handleBlockToggle()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl px-4 py-2.5 text-sm disabled:opacity-50"
        title={
          blocked
            ? `${profileName} está bloqueado: no puede buscarte ni ver tu perfil. Toca para desbloquear.`
            : `Bloquear a ${profileName}: no podrá buscarte ni ver tu perfil.`
        }
      >
        <Ban className="w-4 h-4" aria-hidden="true" />
        {busy ? "…" : blocked ? "Desbloquear" : "Bloquear"}
      </button>
      {blocked && (
        <span className="self-center text-xs text-white/70">
          {profileName} no puede buscarte ni ver tu perfil.
        </span>
      )}
    </div>
  );
}
