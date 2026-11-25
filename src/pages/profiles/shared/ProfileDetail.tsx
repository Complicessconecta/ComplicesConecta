import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProfileDetailInner from "@/components/profiles/shared/ProfileDetail";
import {
  generateDemoProfiles,
  demoProfiles,
  type DemoProfile,
} from "@/demo/demoData";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

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
 * Discover), lista demo legacy, sesión demo guardada y, por último,
 * Supabase (perfil real por uuid). Si lo encuentra, re-navega con
 * replace inyectando el perfil en location.state, que es lo que el
 * componente interno ya sabe leer. Si no aparece en ninguna fuente, se
 * renderiza el interno tal cual y muestra su "Perfil no encontrado".
 */

interface ResolvedProfile {
  id: string | number;
  name: string;
  age?: number | undefined;
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

        // 2. Lista demo legacy (demo-1, demo-2, demo-couple-1...).
        if (!resolved) {
          const legacy = (
            demoProfiles as unknown as Record<string, unknown>[]
          ).find((p) => String(p.id) === id);
          if (legacy) resolved = fromLegacyDemo(legacy);
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
