/**
 * Página /friends (ronda 21, stream A — FAIL 1).
 *
 * La ruta NO existía en App.tsx ni existía este archivo, así que
 * cualquier enlace a /friends caía en el catch-all 404. La lista
 * reutiliza `FriendsSection` (misma fila: en línea / última
 * conexión, bandera, «Eliminar» solo en perfil propio); esta página
 * es siempre el perfil propio, así que `isOwnProfile` es true.
 *
 * La identidad propia y la fuente de la lista siguen el mismo
 * criterio que `FriendsSection`: en demo la identidad estable es el
 * NOMBRE (los ids demo son UUID generados en cada carga); en real
 * es el id del perfil, y la lista viene de `friendships` en
 * Supabase con el listado demo/local como respaldo.
 */
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import {
  FRIEND_REQUESTS_CHANGED_EVENT,
  listFriendsFromSupabase,
  listFriendsSync,
} from "@/lib/friends";
import { FriendsSection } from "@/components/profiles/shared/FriendsSection";

const Friends = () => {
  const { user, profile, isDemo } = useAuth();
  // Ronda 21 (coordinador): `isDemo()` devuelve
  // `boolean | Profile | null` (el `&&` de useAuth propaga el usuario
  // demo); `FriendsSection` pide `boolean`, así que se normaliza aquí.
  const demoActive = Boolean(typeof isDemo === "function" ? isDemo() : isDemo);
  const ownId = profile?.id ?? user?.id ?? "";
  const ownName = profile?.display_name ?? user?.email ?? "Tu perfil";
  // Misma clave de búsqueda que FriendsSection.
  const lookupKey = demoActive ? ownName : ownId;

  // La página solo necesita el conteo para el estado vacío: la
  // lista en sí la renderiza FriendsSection (que mantiene su propio
  // estado y se actualiza al eliminar). Se recarga con el mismo
  // evento que usa FriendsSection cuando otra vista cambia el
  // almacén de solicitudes.
  const [friendsCount, setFriendsCount] = useState<number>(
    () =>
      listFriendsSync(ownId || lookupKey, demoActive ? ownName : undefined)
        .length,
  );

  useEffect(() => {
    const reload = () =>
      setFriendsCount(
        listFriendsSync(ownId || lookupKey, demoActive ? ownName : undefined)
          .length,
      );
    reload();
    // En real, la lista viene de `friendships` en Supabase; si trae
    // filas, el conteo es el real (FriendsSection hace lo mismo con
    // la lista).
    if (!demoActive) {
      let cancelled = false;
      void listFriendsFromSupabase(ownId).then((real) => {
        if (!cancelled && real.length > 0) setFriendsCount(real.length);
      });
      window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
      return () => {
        cancelled = true;
        window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
      };
    }
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
    return () =>
      window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
  }, [lookupKey, demoActive, ownId, ownName]);

  return (
    <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900">
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7" aria-hidden="true" />
            Amigos
            {friendsCount > 0 && (
              <span className="text-slate-500 dark:text-white/60 text-xl font-normal">
                ({friendsCount})
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-white/60 text-sm mt-1">
            Quién está en línea ahora y cuándo se conectó cada amigo por última
            vez.
          </p>
        </div>

        {friendsCount === 0 ? (
          <p className="text-slate-500 dark:text-white/70 text-sm">
            Aún no tienes amigos agregados.
          </p>
        ) : (
          <FriendsSection
            profileId={ownId}
            profileName={ownName}
            isOwnProfile
            isDemo={demoActive}
          />
        )}
      </main>
    </div>
  );
};

export default Friends;
