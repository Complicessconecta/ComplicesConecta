/**
 * Botón de solicitud de amistad (puntos 2 y 4).
 *
 * Estados: sin relación → "Enviar solicitud de amistad"; enviada →
 * "Solicitud enviada"; recibida → Aceptar / Rechazar; amigos →
 * "Amigos ✓". Pensado para el perfil ajeno y para el CHAT (ver
 * cableado en docs/FLUJO_AMISTAD_PRIVACIDAD_PERFILES.md): en el chat
 * se usa el mismo botón junto al nombre del interlocutor.
 *
 * No se muestra en el perfil propio ni sin espectador.
 */
import { useEffect, useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import {
  getFriendStatus,
  respondFriendRequest,
  sendFriendRequest,
  listIncomingRequestsSync,
  canonicalDemoOwnerId,
  type FriendStatus,
} from "@/lib/friends";
import { isViewerAnonymous } from "@/lib/anonymous";

interface FriendRequestButtonProps {
  profileId: string;
  profileName: string;
  viewerId: string;
  viewerName?: string | undefined;
  isOwnProfile: boolean;
  isDemo?: boolean;
  className?: string;
  /**
   * Texto del botón cuando no hay relación. Por defecto
   * "Enviar solicitud de amistad"; el gate de perfil privado lo usa
   * como "Solicitar ver perfil" (ronda 8, punto 11): la solicitud ES
   * la de amistad del sistema existente, solo cambia la etiqueta.
   */
  ctaLabel?: string;
}

export function FriendRequestButton({
  profileId,
  profileName,
  viewerId,
  viewerName,
  isOwnProfile,
  isDemo = false,
  className = "",
  ctaLabel = "Enviar solicitud de amistad",
}: FriendRequestButtonProps) {
  const [status, setStatus] = useState<FriendStatus>("none");
  const [incomingId, setIncomingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getFriendStatus(
      viewerId,
      profileId,
      isDemo,
      viewerName,
      profileName,
    ).then((value) => {
      if (cancelled) return;
      setStatus(value);
      if (value === "pending_received") {
        // Ronda 10, stream C (C1): la solicitud puede venir de la
        // ficha/tarjeta del remitente, no de su id de sesión.
        const incoming = listIncomingRequestsSync(viewerId).find(
          (r) =>
            canonicalDemoOwnerId(r.fromId) === canonicalDemoOwnerId(profileId),
        );
        setIncomingId(incoming?.id ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [viewerId, profileId, isDemo, viewerName, profileName]);

  if (isOwnProfile || !viewerId || !profileId || viewerId === profileId) {
    return null;
  }

  const handleSend = async () => {
    setBusy(true);
    const result = await sendFriendRequest(
      viewerId,
      profileId,
      undefined,
      isDemo,
      // Ronda 9 (stream A, punto 4): límite diario de solicitudes
      // para cuentas anónimas (5/día, friends.ts).
      { isAnonymousSender: isViewerAnonymous(viewerId) },
    );
    setBusy(false);
    if (!result.ok) {
      window.alert(result.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setStatus("pending_sent");
  };

  const handleRespond = async (response: "accepted" | "declined") => {
    if (!incomingId) {
      // Sin id local (p. ej. solicitud real sin caché): recargar estado.
      setStatus("none");
      return;
    }
    setBusy(true);
    const result = await respondFriendRequest(incomingId, response, isDemo);
    setBusy(false);
    if (!result.ok) {
      window.alert(result.error ?? "No se pudo responder la solicitud");
      return;
    }
    setStatus(response === "accepted" ? "friends" : "none");
    setIncomingId(null);
  };

  if (status === "friends") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-4 py-2.5 text-sm ${className}`}
        title={`Tú y ${profileName} son amigos`}
      >
        <Check className="w-4 h-4" aria-hidden="true" />
        Amigos
      </span>
    );
  }

  if (status === "pending_sent") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white/80 border border-white/25 px-4 py-2.5 text-sm ${className}`}
        title="Solicitud de amistad enviada, pendiente de respuesta"
      >
        <UserPlus className="w-4 h-4" aria-hidden="true" />
        Solicitud enviada
      </span>
    );
  }

  if (status === "pending_received") {
    return (
      <span className={`inline-flex gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => void handleRespond("accepted")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          Aceptar amistad
        </button>
        <button
          type="button"
          onClick={() => void handleRespond("declined")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Rechazar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSend()}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2.5 text-sm disabled:opacity-50 ${className}`}
      title={`${ctaLabel} a ${profileName}`}
    >
      <UserPlus className="w-4 h-4" aria-hidden="true" />
      {busy ? "Enviando…" : ctaLabel}
    </button>
  );
}
