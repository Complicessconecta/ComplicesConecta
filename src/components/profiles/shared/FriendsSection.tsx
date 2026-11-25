/**
 * Sección de amistades del perfil (punto 2).
 *
 * Muestra la lista de amigos con su estado: en línea ("En línea",
 * punto verde) o fuera de línea ("Última conexión hace 5 min /
 * 2 h / 3 días / 2 meses"). En el perfil propio cada amigo tiene
 * "Eliminar de amigos"; si el perfil eliminado es privado, el
 * eliminado tendrá que enviar de nuevo la solicitud para verlo.
 *
 * En demo la lista sale de `socialDemoData` + los pares locales que
 * se crean al aceptar solicitudes en esta sesión. En real, la lista
 * la sirve `friendships` (ver `src/lib/friends.ts`).
 */
import { useEffect, useState } from "react";
import { UserMinus, Users } from "lucide-react";
import {
  formatLastSeen,
  listFriendsFromSupabase,
  listFriendsSync,
  removeFriend,
  type Friend,
} from "@/lib/friends";
import { getCountryByCode } from "@/lib/countries";

interface FriendsSectionProps {
  profileId: string;
  profileName: string;
  /** Solo el dueño ve "Eliminar de amigos". */
  isOwnProfile: boolean;
  isDemo?: boolean;
}

export function FriendsSection({
  profileId,
  profileName,
  isOwnProfile,
  isDemo = false,
}: FriendsSectionProps) {
  // En demo la identidad estable es el NOMBRE (los ids demo son UUID
  // generados en cada carga); en real es el id del perfil.
  const lookupKey = isDemo ? profileName : profileId || profileName;
  const [friends, setFriends] = useState<Friend[]>(() =>
    listFriendsSync(lookupKey),
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setFriends(listFriendsSync(lookupKey));
    // En real, la lista viene de `friendships` en Supabase; si trae
    // filas, reemplaza el respaldo demo/local.
    if (!isDemo) {
      let cancelled = false;
      void listFriendsFromSupabase(profileId).then((real) => {
        if (!cancelled && real.length > 0) setFriends(real);
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [lookupKey, isDemo, profileId]);

  const handleRemove = async (friend: Friend) => {
    if (!window.confirm(`¿Eliminar a ${friend.name} de tus amigos?`)) return;
    setRemovingId(friend.id);
    const result = await removeFriend(lookupKey, friend.id, isDemo);
    setRemovingId(null);
    if (!result.ok) {
      window.alert(result.error ?? "No se pudo eliminar de amigos");
      return;
    }
    setFriends((prev) => prev.filter((f) => f.id !== friend.id));
  };

  return (
    <section
      aria-label={`Amistades de ${profileName}`}
      className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-4 sm:p-5"
    >
      <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
        <Users className="w-5 h-5" aria-hidden="true" />
        Amistades
        <span className="text-white/60 text-sm font-normal">
          ({friends.length})
        </span>
      </h3>
      <p className="text-white/60 text-xs mb-4">
        Quién está en línea ahora y cuándo se conectó cada amigo por última vez.
      </p>
      {friends.length === 0 ? (
        <p className="text-white/70 text-sm">
          {profileName} aún no tiene amigos agregados.
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => {
            const country = getCountryByCode(friend.countryCode);
            const status = formatLastSeen(friend.isOnline, friend.lastSeenAt);
            return (
              <li
                key={friend.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      friend.isOnline ? "bg-emerald-400" : "bg-white/30"
                    }`}
                    title={friend.isOnline ? "En línea" : "Fuera de línea"}
                    aria-label={friend.isOnline ? "En línea" : "Fuera de línea"}
                  />
                  <span className="text-white font-medium truncate">
                    {friend.name}
                  </span>
                  {country && (
                    <span
                      className="text-sm shrink-0"
                      title={country.name}
                      aria-label={country.name}
                    >
                      {country.flag}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs ${
                      friend.isOnline ? "text-emerald-300" : "text-white/60"
                    }`}
                  >
                    {status}
                  </span>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(friend)}
                      disabled={removingId === friend.id}
                      className="inline-flex items-center gap-1 text-xs text-red-200 hover:text-red-100 border border-red-400/40 rounded-full px-2 py-1 disabled:opacity-50"
                      title="Eliminar de amigos"
                    >
                      <UserMinus className="w-3 h-3" aria-hidden="true" />
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
