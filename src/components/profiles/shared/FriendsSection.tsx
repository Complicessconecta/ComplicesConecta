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
  // Ronda 11, stream C (v): la lista se pide con id Y nombre: el par
  // aceptado se encuentra mire por donde se mire (ficha, tarjeta,
  // nombre o apodo de cuenta local) y los nombres se resuelven en
  // `listFriendsSync`, no aquí. En real solo va el id (el nombre como
  // candidato podría casar con un par demo residual del mismo
  // navegador).
  const [friends, setFriends] = useState<Friend[]>(() =>
    listFriendsSync(profileId || lookupKey, isDemo ? profileName : undefined),
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setFriends(
      listFriendsSync(profileId || lookupKey, isDemo ? profileName : undefined),
    );
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
  }, [lookupKey, isDemo, profileId, profileName]);

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
      className="rounded-2xl border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5"
    >
      <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2 mb-1">
        <Users className="w-5 h-5" aria-hidden="true" />
        Amistades
        <span className="text-slate-500 dark:text-white/60 text-sm font-normal">
          ({friends.length})
        </span>
      </h3>
      <p className="text-slate-500 dark:text-white/60 text-xs mb-4">
        Quién está en línea ahora y cuándo se conectó cada amigo por última vez.
      </p>
      {friends.length === 0 ? (
        <p className="text-slate-500 dark:text-white/70 text-sm">
          {profileName} aún no tiene amigos agregados.
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => {
            const country = getCountryByCode(friend.countryCode);
            const status = formatLastSeen(friend.isOnline, friend.lastSeenAt);
            return (
              // Fila con wrap: el nombre NUNCA se tapa. Antes la fila era
              // un flex de una línea con el estado a la derecha en
              // shrink-0: con nombres largos ("Carmen & Roberto") y el
              // estado largo de fuera de línea ("Última conexión hace
              // 5 horas") el bloque del nombre se encogía a casi cero y
              // solo se veían la bandera y la última conexión. Ahora el
              // nombre tiene un mínimo garantizado (basis 9rem) y el
              // estado + "Eliminar" bajan a una segunda línea antes que
              // tapar el nombre.
              <li
                key={friend.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 basis-36 items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      friend.isOnline
                        ? "bg-emerald-400"
                        : "bg-slate-400 dark:bg-white/30"
                    }`}
                    title={friend.isOnline ? "En línea" : "Fuera de línea"}
                    aria-label={friend.isOnline ? "En línea" : "Fuera de línea"}
                  />
                  <span className="text-slate-900 dark:text-white font-medium truncate">
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
                    className={`text-xs whitespace-nowrap ${
                      friend.isOnline
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-500 dark:text-white/60"
                    }`}
                  >
                    {status}
                  </span>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(friend)}
                      disabled={removingId === friend.id}
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-800 border border-red-500/40 dark:text-red-200 dark:hover:text-red-100 dark:border-red-400/40 rounded-full px-2 py-1 disabled:opacity-50"
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
