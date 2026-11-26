/**
 * Pantalla de perfil privado (punto 4).
 *
 * Cuando un perfil es privado y el espectador no es amigo, no se
 * muestra el contenido del perfil: solo la portada mínima (nombre)
 * + este aviso + el botón de solicitud de amistad. Tras aceptar la
 * solicitud, el perfil completo se desbloquea.
 */
import { Lock } from "lucide-react";
import { FriendRequestButton } from "@/components/profiles/shared/FriendRequestButton";

interface PrivateProfileGateProps {
  profileId: string;
  profileName: string;
  viewerId: string;
  viewerName?: string;
  isDemo?: boolean;
}

export function PrivateProfileGate({
  profileId,
  profileName,
  viewerId,
  viewerName,
  isDemo = false,
}: PrivateProfileGateProps) {
  return (
    <section
      aria-label="Perfil privado"
      className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 backdrop-blur-md p-6 sm:p-8 text-center"
    >
      <Lock
        className="w-10 h-10 mx-auto text-slate-400 dark:text-white/70 mb-3"
        aria-hidden="true"
      />
      <h2 className="text-slate-900 dark:text-white text-xl font-semibold mb-2">
        {profileName} tiene el perfil privado
      </h2>
      <p className="text-slate-500 dark:text-white/70 text-sm mb-5 max-w-md mx-auto">
        Solo sus amigos pueden ver su perfil completo y sus fotos. Envía una
        solicitud de amistad: si la acepta, podrás verlo; si la declina, seguirá
        privado para ti.
      </p>
      <div className="flex justify-center">
        <FriendRequestButton
          profileId={profileId}
          profileName={profileName}
          viewerId={viewerId}
          viewerName={viewerName}
          isOwnProfile={false}
          isDemo={isDemo}
          // Ronda 8 (punto 11): la solicitud ES la de amistad del
          // sistema existente (friends.ts); aquí se pide ver el perfil,
          // así que la etiqueta dice lo que hace.
          ctaLabel="Solicitar ver perfil"
        />
      </div>
    </section>
  );
}
