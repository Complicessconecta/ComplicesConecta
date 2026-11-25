import { useEffect, useRef, useState } from "react";
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
  };
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProfileDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [resolving, setResolving] = useState(false);
  const attemptedRef = useRef<string | null>(null);

  // Si ya viene por state (navegación desde Discover/Matches), el
  // interno lo resuelve solo: no hace falta resolver por URL.
  const hasStateProfile = Boolean(location.state?.profile);

  useEffect(() => {
    if (hasStateProfile) return;
    if (!id || attemptedRef.current === id) return;
    attemptedRef.current = id;
    let cancelled = false;
    setResolving(true);

    void (async () => {
      let resolved: ResolvedProfile | null = null;
      try {
        // 1. Roster demo de Discover (ids deterministas por seed).
        const demos = generateDemoProfiles(20);
        const demo = demos.find((p) => p.id === id);
        if (demo) {
          resolved = fromDemoProfile(demo);
        }

        // 1b. Ids numéricos legacy 1-4 (misma fuente que el detalle
        // interno): /profile/3 es Ana siempre, navegando o directo.
        // Antes el wrapper no resolvía "3" y el interno lo hacía por
        // parseInt solo cuando NO había state, así que la misma URL
        // mostraba personas distintas según el origen.
        if (!resolved) {
          const legacyNumeric = LEGACY_NUMERIC_PROFILES.find(
            (p) => String(p.id) === id,
          );
          if (legacyNumeric) {
            resolved = {
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
        }

        // 2. Lista demo legacy (demo-1, demo-2, demo-couple-1...).
        if (!resolved) {
          const legacy = (
            demoProfiles as unknown as Record<string, unknown>[]
          ).find((p) => String(p.id) === id);
          if (legacy) resolved = fromLegacyDemo(legacy);
        }

        // 2b. Pareja demo propia (Carmen & Roberto, punto 13): su ficha
        // en ProfileCouple usa el id "demo-couple-456" y Compartir
        // construye /profile/demo-couple-456 con él, pero ese id no
        // existe en el roster (sus ids son generateDemoUUID
        // "demo-profile-N"), ni en la lista legacy (que trae
        // "demo-couple-1" = María & Juan, otra pareja), ni es UUID:
        // la URL daba "Perfil no encontrado". Se resuelve aquí con los
        // datos canónicos de la pareja demo (mismo nombre, edades y
        // foto que su perfil propio).
        if (!resolved && id === "demo-couple-456") {
          resolved = {
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
        if (!resolved && id === generateDemoUserUUID("single@outlook.es")) {
          resolved = {
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
        if (!resolved && id === generateDemoUserUUID("pareja@outlook.es")) {
          resolved = {
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
        if (!resolved) {
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
              if (match?.profile) resolved = fromDemoUser(match.profile);
            }
          } catch {
            // Registro local corrupto: seguir a Supabase.
          }
        }

        // 3. Sesión demo guardada (perfil propio).
        if (!resolved) {
          try {
            const raw = localStorage.getItem("demo_user");
            if (raw) {
              const user = JSON.parse(raw) as Record<string, unknown>;
              if (
                String(user.id ?? "") === id ||
                String(user.user_id ?? "") === id
              ) {
                resolved = fromDemoUser(user);
              }
            }
          } catch {
            // demo_user corrupto: seguir a Supabase.
          }
        }

        // 4. Perfil real en Supabase (solo ids con forma UUID).
        if (!resolved && UUID_RE.test(id) && supabase) {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select(
                "id, display_name, first_name, last_name, age, bio, avatar_url, city, location, is_verified",
              )
              .eq("id", id)
              .maybeSingle();
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
          } catch (err) {
            logger.error("ProfileDetail: excepción buscando perfil real:", {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      } finally {
        if (cancelled) return;
        setResolving(false);
        if (resolved) {
          // Inyectar el perfil en location.state (replace, sin tocar
          // el historial): el interno lo lee de ahí.
          navigate(location.pathname, {
            replace: true,
            state: { profile: resolved },
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Solo al entrar con un id sin state; el navigate con replace
    // vuelve a renderizar con state y este efecto ya no corre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasStateProfile]);

  if (hasStateProfile) {
    return <ProfileDetailInner />;
  }

  if (resolving) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando perfil…</p>
        </div>
      </div>
    );
  }

  // Sin state y sin perfil resuelto: el interno muestra su
  // "Perfil no encontrado" con botón a /profiles.
  return <ProfileDetailInner />;
}
