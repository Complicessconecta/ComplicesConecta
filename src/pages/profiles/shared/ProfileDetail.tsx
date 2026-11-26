import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProfileDetailInner, {
  LEGACY_NUMERIC_PROFILES,
} from "@/components/profiles/shared/ProfileDetail";
import {
  generateDemoProfiles,
  demoProfiles,
  DEMO_COUPLE_CARMEN_ROBERTO,
  formatCoupleAgeLabel,
  type DemoProfile,
} from "@/demo/demoData";
import { generateRandomProfiles } from "@/utils/discover/generateRandomProfiles";
import type { Profile as RandomProfile } from "@/types/discover.types";
import { Button } from "@/components/ui/buttons/Button";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { generateDemoUserUUID } from "@/lib/demo-uuid";

/**
 * Wrapper de /profile/:id.
 *
 * Causa raíz del "Perfil no encontrado" en recarga directa: el
 * componente interno solo resolvía el perfil desde
 * `location.state.profile` (lo que Discover pasa al navegar) o desde su
 * lista local de 4 ids numéricos (1-4). Al entrar directo por URL no
 * hay state y los ids demo son UUID (p. ej. Carmen & Roberto), así que
 * `parseInt(id)` no coincidía con nada.
 *
 * Este wrapper resuelve el perfil por el id de la URL antes de
 * renderizar el detalle: demo roster (mismos ids deterministas que
 * Discover), lista demo legacy, cuentas demo canónicas (Sofía /
 * Carmen & Roberto, ids deterministas por email y por tanto
 * resolvibles sin localStorage), registro local de cuentas demo,
 * sesión demo guardada y, por último, Supabase (perfil real por uuid).
 * Si lo encuentra, re-navega con replace inyectando el perfil en
 * location.state, que es lo que el componente interno ya sabe leer.
 * Si no aparece en ninguna fuente, se renderiza el interno tal cual
 * y muestra su "Perfil no encontrado".
 *
 * Ronda 12, stream C — dos defectos más en este mismo camino, ambos
 * visibles en el test de verificación ronda 11 (2026-11-25
 * 19:35–20:00 CST): la primera carga en frío de la pareja
 * (/profile/20e31658-1f0b-41f0-ab00-0001f0bd29f5, id de tarjeta del
 * roster) mostró "Perfil no encontrado" y solo cargó tras recargar.
 * 1. Primera pintura: `resolving` nacía en `false`, así que el
 *    primer render montaba el interno SIN perfil y pintaba "Perfil
 *    no encontrado" antes de que el efecto corriera. En un móvil
 *    lento esa pantalla se quedaba visible lo bastante para juzgarla
 *    como fallo.
 * 2. Sin reintento: si la resolución fallaba (o el efecto se
 *    cancelaba), `attemptedRef` bloqueaba cualquier nuevo intento
 *    para ese id: la única salida era recargar la página.
 * La resolución síncrona (`resolveProfileSync`, pasos 1–3) ahora
 * corre en render (useMemo): un id del roster resuelve en la
 * primera pintura, sin parpadeo y sin esperar al efecto. La
 * primera pintura sin state es el spinner, nunca "no encontrado".
 * Y si ni lo síncrono ni Supabase resuelven, la pantalla de "no
 * encontrado" del wrapper ofrece Reintentar (nuevo intento real,
 * no solo recargar).
 */

interface ResolvedProfile {
  id: string | number;
  name: string;
  age?: number | undefined;
  /** "25 y 28 años" en parejas con dos edades. */
  ageLabel?: string | undefined;
  location?: string | undefined;
  interests?: string[] | undefined;
  image?: string | undefined;
  images?: string[] | undefined;
  isOnline?: boolean | undefined;
  bio?: string | undefined;
  profession?: string | undefined;
  rating?: number | undefined;
  isVerified?: boolean | undefined;
  /**
   * Ronda 9 (stream A, punto 2): marca de cuenta anónima. El detalle
   * interno la usa para resolver visibilidad privada por defecto.
   */
  is_anonymous?: boolean | undefined;
}

const fromDemoProfile = (p: DemoProfile): ResolvedProfile => ({
  id: p.id,
  name: p.name,
  age: p.age,
  ageLabel:
    p.partnerAge !== undefined
      ? formatCoupleAgeLabel(p.age, p.partnerAge)
      : undefined,
  location: p.location,
  interests: p.interests,
  image: p.image,
  images: [p.image],
  isOnline: p.isOnline,
  bio: p.bio,
  profession: "Miembro de la comunidad",
  rating: p.rating,
  isVerified: p.isVerified,
  is_anonymous: p.isAnonymous === true,
});

const fromRandomProfile = (p: RandomProfile): ResolvedProfile => ({
  id: p.id,
  name: p.name,
  age: p.age,
  ageLabel:
    p.partnerAge !== undefined
      ? formatCoupleAgeLabel(p.age, p.partnerAge)
      : undefined,
  location: p.location,
  interests: p.interests,
  image: p.image,
  images: [p.image],
  isOnline: p.isOnline,
  bio: p.bio,
  profession: "Miembro de la comunidad",
  rating: p.rating,
  isVerified: p.isVerified,
  is_anonymous: p.isAnonymous === true,
});

const fromLegacyDemo = (p: Record<string, unknown>): ResolvedProfile => {
  const name =
    (typeof p.display_name === "string" && p.display_name) ||
    [p.first_name, p.last_name]
      .filter((v) => typeof v === "string" && v)
      .join(" ") ||
    "Usuario demo";
  const avatar =
    typeof p.avatar_url === "string" && p.avatar_url ? p.avatar_url : undefined;
  return {
    id: String(p.id ?? ""),
    name,
    age: typeof p.age === "number" ? p.age : undefined,
    location: typeof p.location === "string" ? p.location : "Ciudad de México",
    interests: Array.isArray(p.interests)
      ? (p.interests as string[])
      : undefined,
    image: avatar,
    images: avatar ? [avatar] : undefined,
    isOnline: true,
    bio: typeof p.bio === "string" ? p.bio : undefined,
    profession: "Miembro de la comunidad",
    rating: 4.5,
    isVerified: p.is_verified === true,
  };
};

const fromDemoUser = (u: Record<string, unknown>): ResolvedProfile => {
  const name =
    (typeof u.name === "string" && u.name) ||
    (typeof u.display_name === "string" && u.display_name) ||
    [u.first_name, u.last_name]
      .filter((v) => typeof v === "string" && v)
      .join(" ") ||
    "Usuario demo";
  const avatar =
    (typeof u.avatar === "string" && u.avatar) ||
    (typeof u.avatar_url === "string" && u.avatar_url) ||
    undefined;
  return {
    id: String(u.id ?? ""),
    name,
    age: typeof u.age === "number" ? u.age : Number(u.age) || undefined,
    location: typeof u.location === "string" ? u.location : "Ciudad de México",
    interests: Array.isArray(u.interests)
      ? (u.interests as string[])
      : undefined,
    image: avatar,
    images: avatar ? [avatar] : undefined,
    isOnline: true,
    bio: typeof u.bio === "string" ? u.bio : undefined,
    profession: "Miembro de la comunidad",
    rating: 4.5,
    isVerified: true,
    // Ronda 9 (stream A, punto 2): la marca anónima viaja del registro
    // local al detalle, para el gate de privado por defecto.
    is_anonymous: u.is_anonymous === true,
  };
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ronda 17 (stream B): tope de espera de la consulta a Supabase del
 * paso 4. La consulta no tenía timeout: si la red se quedaba colgada
 * en frío, el `await` no resolvía nunca y "Cargando perfil…" se
 * quedaba para siempre (la única salida era recargar la página a
 * mano). Mismo patrón que el timeout de sesión de
 * `@/integrations/supabase/client` (5 s en prod / 10 s en dev): al
 * vencer, se cae al estado `failed` y la pantalla ofrece Reintentar
 * en vez de dejar el spinner infinito. La consulta tardía, si llega,
 * se descarta (el intento ya no es el vigente).
 */
const PROFILE_QUERY_TIMEOUT_MS = 10_000;

/**
 * Resolución SÍNCRONA por id de URL (pasos 1–3 del wrapper): roster
 * demo de Discover, ids numéricos legacy, lista demo legacy, pareja
 * demo propia, cuentas demo canónicas, registro local de cuentas
 * demo y sesión demo guardada. Pura y testeable sin router: es lo
 * que permite resolver en frío en la primera pintura.
 *
 * Devuelve null si el id no está en ninguna fuente síncrona (el
 * llamador cae entonces a Supabase, paso 4, que es async).
 */
export function resolveProfileSync(id: string): ResolvedProfile | null {
  if (!id) return null;

  // 1. Roster demo de Discover (ids deterministas por seed).
  const demos = generateDemoProfiles(20);
  const demo = demos.find((p) => p.id === id);
  if (demo) return fromDemoProfile(demo);

  // 1b. Perfiles de la lista aleatoria de Discover
  // (`generateRandomProfiles`, semillas `discover-profile-N`): sus
  // tarjetas también navegan a /profile/<id> con state, así que en
  // frío (recarga directa, enlace compartido) daban "Perfil no
  // encontrado" igual que el roster antes de la ronda 8. La lista es
  // determinista (semilla fija), así que resuelve sin localStorage.
  const random = generateRandomProfiles().find((p) => p.id === id);
  if (random) return fromRandomProfile(random);

  // 1c. Ids numéricos legacy 1-4 (misma fuente que el detalle
  // interno): /profile/3 es Ana siempre, navegando o directo.
  // Antes el wrapper no resolvía "3" y el interno lo hacía por
  // parseInt solo cuando NO había state, así que la misma URL
  // mostraba personas distintas según el origen.
  const legacyNumeric = LEGACY_NUMERIC_PROFILES.find(
    (p) => String(p.id) === id,
  );
  if (legacyNumeric) {
    return {
      id: legacyNumeric.id,
      name: legacyNumeric.name,
      age: legacyNumeric.age,
      location: legacyNumeric.location,
      interests: legacyNumeric.interests,
      image: legacyNumeric.image,
      images: legacyNumeric.images,
      isOnline: legacyNumeric.isOnline,
      bio: legacyNumeric.bio,
      profession: legacyNumeric.profession,
      rating: legacyNumeric.rating,
      isVerified: true,
    };
  }

  // 2. Lista demo legacy (demo-1, demo-2, demo-couple-1...).
  const legacy = (demoProfiles as unknown as Record<string, unknown>[]).find(
    (p) => String(p.id) === id,
  );
  if (legacy) return fromLegacyDemo(legacy);

  // 2b. Pareja demo propia (Carmen & Roberto, punto 13): su ficha
  // en ProfileCouple usa el id "demo-couple-456" y Compartir
  // construye /profile/demo-couple-456 con él, pero ese id no
  // existe en el roster (sus ids son generateDemoUUID
  // "demo-profile-N"), ni en la lista legacy (que trae
  // "demo-couple-1" = María & Juan, otra pareja), ni es UUID:
  // la URL daba "Perfil no encontrado". Se resuelve aquí con los
  // datos canónicos de la pareja demo (mismo nombre, edades y
  // foto que su perfil propio).
  if (id === "demo-couple-456") {
    return {
      id: "demo-couple-456",
      name: DEMO_COUPLE_CARMEN_ROBERTO.name,
      age: DEMO_COUPLE_CARMEN_ROBERTO.partner1.age,
      ageLabel: DEMO_COUPLE_CARMEN_ROBERTO.ageLabel,
      location: "Ciudad de México",
      image: DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
      images: [DEMO_COUPLE_CARMEN_ROBERTO.mainImage],
      isOnline: true,
      bio: "Perfil de demostración. Regístrate para crear tu perfil real.",
      profession: "Miembro de la comunidad",
      rating: 4.5,
      isVerified: false,
    };
  }

  // 2c. Cuentas demo CANÓNICAS (Sofía / Carmen & Roberto): su id
  // es generateDemoUserUUID(email) — determinista por email — y
  // NO está en el roster, ni en la lista legacy, ni en demo_user
  // cuando el enlace se abre en otro navegador o tras cerrar
  // sesión. Sin esto, /profile/609dcb3b… (Sofía, el enlace que
  // construye Compartir en el perfil propio) solo resolvía si
  // demo_user seguía en ESTE localStorage: en frío, para el
  // destinatario del enlace, daba "Perfil no encontrado". Lo
  // mismo para /profile/48bb1f12… (pareja demo).
  if (id === generateDemoUserUUID("single@outlook.es")) {
    return {
      id,
      name: "Sofía",
      age: 28,
      location: "Ciudad de México",
      interests: ["Lifestyle Swinger", "Mentalidad Abierta"],
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face",
      images: [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face",
      ],
      isOnline: true,
      bio: "Perfil de demostración. Regístrate para crear tu perfil real.",
      profession: "Miembro de la comunidad",
      rating: 4.5,
      isVerified: true,
    };
  }
  if (id === generateDemoUserUUID("pareja@outlook.es")) {
    return {
      id,
      name: DEMO_COUPLE_CARMEN_ROBERTO.name,
      age: DEMO_COUPLE_CARMEN_ROBERTO.partner1.age,
      ageLabel: DEMO_COUPLE_CARMEN_ROBERTO.ageLabel,
      location: "Ciudad de México",
      image: DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
      images: [DEMO_COUPLE_CARMEN_ROBERTO.mainImage],
      isOnline: true,
      bio: "Perfil de demostración. Regístrate para crear tu perfil real.",
      profession: "Miembro de la comunidad",
      rating: 4.5,
      isVerified: false,
    };
  }

  // 2d. Cuentas demo LOCALES registradas en este navegador
  // (registro demo sin Supabase, p. ej. TestR7): sobreviven al
  // logout en `cc_local_demo_accounts_v1`, así que su /profile/<id>
  // también debe resolver en frío aquí, sin depender de que la
  // sesión siga activa. La clave NO lleva prefijo `demo_` a
  // propósito (clearDemoAuth la barrería en cada logout).
  try {
    const raw = localStorage.getItem("cc_local_demo_accounts_v1");
    if (raw) {
      const accounts = JSON.parse(raw) as Array<{
        userId?: unknown;
        profile?: Record<string, unknown>;
      }>;
      const match = Array.isArray(accounts)
        ? accounts.find((a) => String(a.userId ?? "") === id)
        : undefined;
      if (match?.profile) return fromDemoUser(match.profile);
    }
  } catch {
    // Registro local corrupto: seguir a Supabase.
  }

  // 3. Sesión demo guardada (perfil propio).
  try {
    const raw = localStorage.getItem("demo_user");
    if (raw) {
      const user = JSON.parse(raw) as Record<string, unknown>;
      if (String(user.id ?? "") === id || String(user.user_id ?? "") === id) {
        return fromDemoUser(user);
      }
    }
  } catch {
    // demo_user corrupto: seguir a Supabase.
  }

  return null;
}

export default function ProfileDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Si ya viene por state (navegación desde Discover/Matches), el
  // interno lo resuelve solo: no hace falta resolver por URL.
  const hasStateProfile = Boolean(location.state?.profile);

  // Ronda 12, stream C: resolución síncrona en render. Un id del
  // roster / de la lista aleatoria / canónico resuelve aquí, en la
  // primera pintura, sin esperar al efecto y sin parpadeo de "no
  // encontrado" (ver nota del encabezado).
  const syncResolved = useMemo(
    () => (hasStateProfile || !id ? null : resolveProfileSync(id)),
    [id, hasStateProfile],
  );

  // Primera pintura con id y sin state: se está resolviendo (antes
  // nacía en false y la primera pintura era "Perfil no encontrado").
  const [resolving, setResolving] = useState(
    () => Boolean(id) && !hasStateProfile,
  );
  // Sin perfil en ninguna fuente: la pantalla de "no encontrado" del
  // wrapper ofrece Reintentar (ver efecto).
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (hasStateProfile) return;
    if (!id) return;
    // Lo síncrono ya resolvió en render: inyectar en state y listo.
    if (syncResolved) {
      navigate(location.pathname, {
        replace: true,
        state: { profile: syncResolved },
      });
      return;
    }
    // Solo queda el perfil real en Supabase (async). Un intento por
    // id y nonce: si falla, `failed` abre el Reintentar y el nonce
    // nuevo permite un intento real (antes `attemptedRef` bloqueaba
    // cualquier reintento y solo quedaba recargar la página).
    const attemptKey = `${id}#${retryNonce}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;
    setResolving(true);
    setFailed(false);

    void (async () => {
      let resolved: ResolvedProfile | null = null;
      // 4. Perfil real en Supabase (solo ids con forma UUID).
      if (UUID_RE.test(id) && supabase) {
        try {
          // Ronda 17 (stream B): carrera contra el timeout (ver
          // PROFILE_QUERY_TIMEOUT_MS): sin él, una red colgada deja
          // "Cargando perfil…" para siempre.
          const result = await Promise.race([
            supabase
              .from("profiles")
              .select(
                "id, display_name, first_name, last_name, age, bio, avatar_url, city, location, is_verified",
              )
              .eq("id", id)
              .maybeSingle(),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), PROFILE_QUERY_TIMEOUT_MS),
            ),
          ]);
          if (result === null) {
            // Timeout: `resolved` queda en null y el flujo sigue al
            // final del intento (`setResolving(false)` + `failed`):
            // el `return` aquí dejaría el spinner colgado, que es
            // justo lo que el timeout viene a evitar.
            logger.warn(
              "ProfileDetail: timeout buscando perfil real (10 s), se ofrece Reintentar:",
              { id },
            );
          } else {
            const { data, error } = result;
            if (error) {
              logger.error("ProfileDetail: error buscando perfil real:", {
                error: error.message,
              });
            } else if (data) {
              const row = data as Record<string, unknown>;
              const name =
                (typeof row.display_name === "string" && row.display_name) ||
                [row.first_name, row.last_name]
                  .filter((v) => typeof v === "string" && v)
                  .join(" ") ||
                "Usuario";
              const avatar =
                typeof row.avatar_url === "string" && row.avatar_url
                  ? row.avatar_url
                  : undefined;
              resolved = {
                id: String(row.id),
                name,
                age: typeof row.age === "number" ? row.age : undefined,
                location:
                  (typeof row.location === "string" && row.location) ||
                  (typeof row.city === "string" && row.city) ||
                  "Ciudad de México",
                image: avatar,
                images: avatar ? [avatar] : undefined,
                isOnline: false,
                bio: typeof row.bio === "string" ? row.bio : undefined,
                profession: "Miembro de la comunidad",
                rating: 4.5,
                isVerified: row.is_verified === true,
              };
            }
          }
        } catch (err) {
          logger.error("ProfileDetail: excepción buscando perfil real:", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      // Solo vale el intento vigente: si el id cambió o se reintentó
      // mientras Supabase respondía, este resultado ya no manda.
      if (attemptedRef.current !== attemptKey) return;
      setResolving(false);
      if (resolved) {
        // Inyectar el perfil en location.state (replace, sin tocar
        // el historial): el interno lo lee de ahí.
        navigate(location.pathname, {
          replace: true,
          state: { profile: resolved },
        });
      } else {
        setFailed(true);
      }
    })();
    // Solo al entrar con un id sin state; el navigate con replace
    // vuelve a renderizar con state y este efecto ya no corre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasStateProfile, syncResolved, retryNonce]);

  if (hasStateProfile) {
    return <ProfileDetailInner />;
  }

  if (resolving) {
    return (
      <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-900 dark:text-white text-lg">
            Cargando perfil…
          </p>
        </div>
      </div>
    );
  }

  if (failed) {
    // Sin perfil en ninguna fuente y Supabase tampoco lo trae:
    // mismo "Perfil no encontrado" del interno, pero con Reintentar
    // (ronda 12, stream C): antes solo quedaba recargar la página.
    return (
      <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900">
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Perfil no encontrado
          </h1>
          <p className="text-slate-500 dark:text-white/70 text-sm mb-6">
            No pudimos cargar este perfil. Puede que el enlace esté
            desactualizado o que el perfil ya no exista.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => {
                attemptedRef.current = null;
                setFailed(false);
                setRetryNonce((n) => n + 1);
              }}
              className="text-white bg-linear-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
            >
              Reintentar
            </Button>
            <Button
              onClick={() => navigate("/profiles")}
              className="text-slate-900 dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/30 hover:bg-slate-100 dark:hover:bg-white/20"
            >
              Volver a perfiles
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Sin state y sin perfil resuelto: el interno muestra su
  // "Perfil no encontrado" con botón a /profiles.
  return <ProfileDetailInner />;
}
