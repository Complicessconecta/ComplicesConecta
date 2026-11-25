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
import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { sendPhotoAccessRequest } from "@/lib/friends";

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

  if (isOwnProfile || !viewerId || !profileId || viewerId === profileId) {
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
      window.alert(result.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setSent(true);
    onSent?.();
  };

  if (sent) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white/80 border border-white/25 px-4 py-2.5 text-sm ${className}`}
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
      className={`inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl px-4 py-2.5 text-sm disabled:opacity-50 ${className}`}
      title={`Pedir a ${profileName} acceso para ver sus fotos`}
    >
      <ImagePlus className="w-4 h-4" aria-hidden="true" />
      {busy ? "Enviando…" : "Solicitar ver fotos"}
    </button>
  );
}
