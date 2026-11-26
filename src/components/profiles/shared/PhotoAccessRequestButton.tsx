/**
 * Botón de solicitud de acceso a fotos / galería (punto 4).
 *
 * En el chat (y en el perfil) se puede pedir ver las fotos del
 * perfil: si el dueño acepta, se accede a la galería; si declina,
 * no se accede. En real el flujo convive con la tabla existente
 * `gallery_access_requests`; aquí usa `friend_requests` con
 * kind = 'photo_access' para compartir estados con la amistad.
 *
 * No se muestra en el perfil propio, sin espectador, ni cuando ya
 * hay acceso concedido (el padre debe ocultar el botón entonces,
 * con `hasPhotoAccess` de `src/lib/friends.ts`).
 */
import { useEffect, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import {
  getPhotoAccessStatusSync,
  sendPhotoAccessRequest,
  FRIEND_REQUESTS_CHANGED_EVENT,
  type PhotoAccessStatus,
} from "@/lib/friends";

interface PhotoAccessRequestButtonProps {
  profileId: string;
  profileName: string;
  viewerId: string;
  isOwnProfile: boolean;
  isDemo?: boolean;
  className?: string;
  /**
   * Aviso al padre cuando la solicitud quedó guardada (ronda 7, punto
   * 12): el padre (Chat) muestra entonces su píldora "Solicitud de
   * fotos enviada" desde su propio estado, que sobrevive a un
   * remontaje del botón; antes solo vivía en el useState interno.
   */
  onSent?: () => void;
}

export function PhotoAccessRequestButton({
  profileId,
  profileName,
  viewerId,
  isOwnProfile,
  isDemo = false,
  className = "",
  onSent,
}: PhotoAccessRequestButtonProps) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // Ronda 12 (stream A, punto 3b): el botón solo vivía en `useState`
  // local: al recargar volvía a "Solicitar ver fotos" aunque hubiera
  // una pendiente o una concesión viva en el almacén, y tras aceptar
  // se quedaba en "Solicitud de fotos enviada" (el padre nunca lo
  // ocultaba). Ahora lee el estado guardado al montar: pendiente →
  // píldora de enviada; concedido vigente → nada (el padre muestra la
  // cuenta atrás y el acceso); sin nada / declinado → botón.
  // En real (sin almacén demo) el estado es "none": mismo
  // comportamiento que antes.
  const [storedStatus, setStoredStatus] = useState<PhotoAccessStatus>("none");
  useEffect(() => {
    setStoredStatus(getPhotoAccessStatusSync(viewerId, profileId));
  }, [viewerId, profileId]);
  // Ronda 14 (stream F, F3): si otra vista de la misma sesión cambia el
  // almacén de solicitudes (envío/respuesta), re-leer: el estado del
  // botón no puede quedarse en la foto del montaje.
  useEffect(() => {
    const refresh = () =>
      setStoredStatus(getPhotoAccessStatusSync(viewerId, profileId));
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, refresh);
    return () =>
      window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, refresh);
  }, [viewerId, profileId]);

  if (isOwnProfile || !viewerId || !profileId || viewerId === profileId) {
    return null;
  }

  // Acceso ya concedido y vigente: el botón no debe ofrecerse (el
  // padre muestra la cuenta atrás / el acceso a las fotos).
  if (storedStatus === "accepted") {
    return null;
  }

  const handleSend = async () => {
    setBusy(true);
    const result = await sendPhotoAccessRequest(
      viewerId,
      profileId,
      undefined,
      isDemo,
    );
    setBusy(false);
    if (!result.ok) {
      // Con concesión viva el envío se rechaza en el lib: refrescar
      // el estado guardado para que el botón desaparezca en vez de
      // quedarse ofreciendo pedir lo que ya se tiene.
      setStoredStatus(getPhotoAccessStatusSync(viewerId, profileId));
      window.alert(result.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setSent(true);
    setStoredStatus("pending");
    onSent?.();
  };

  if (sent || storedStatus === "pending") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-white/80 border border-slate-300 dark:border-white/25 px-4 py-2.5 text-sm ${className}`}
        title="Solicitud para ver las fotos enviada, pendiente de respuesta"
      >
        <Camera className="w-4 h-4" aria-hidden="true" />
        Solicitud de fotos enviada
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSend()}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-300 dark:border-white/25 backdrop-blur-xl px-4 py-2.5 text-sm disabled:opacity-50 ${className}`}
      title={`Pedir a ${profileName} acceso para ver sus fotos`}
    >
      <ImagePlus className="w-4 h-4" aria-hidden="true" />
      {busy ? "Enviando…" : "Solicitar ver fotos"}
    </button>
  );
}
