import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { SecureMediaService } from "@/lib/secureMediaService";

/**
 * C6 — Media privada vía Supabase Storage (URLs firmadas).
 *
 * Hallazgo C6 (ANALISIS_FORENSE.md §2): las 62 imágenes bajo
 * `public/assets/people/<single|couple>/privado/` se servían como archivos
 * estáticos sin autenticación. El blur CSS de la galería "bloqueada" no
 * protegía nada: el navegador ya había descargado la imagen completa.
 *
 * A partir de este parche ningún componente construye una URL pública hacia
 * esas imágenes. Las rutas de Storage (`people/...`, sin el prefijo
 * `/assets/`) solo se resuelven a URLs firmadas temporales (bucket `media`,
 * expiración 1 h) cuando la galería está desbloqueada Y hay un usuario
 * autenticado. En cualquier otro caso — galería bloqueada, sin sesión,
 * permiso denegado, bucket/ruta inexistente o cualquier error — se devuelve
 * el placeholder genérico `/placeholder.svg`.
 *
 * NO hay fallback a la ruta pública: un fallback silencioso anularía el
 * arreglo. Si la URL firmada no se puede generar, la imagen simplemente no
 * se muestra (placeholder).
 *
 * Estado de la migración física (2026-11-19): el bucket privado, las
 * políticas RLS y la subida de las 62 imágenes a Storage todavía NO existen;
 * las imágenes siguen en `public/` hasta la limpieza final del propietario
 * (ver C6_FIX_SUMMARY.md). Mientras tanto, con este código, la app ya no las
 * referencia: en modo demo / sin sesión real solo se ven placeholders.
 */

/** Bucket privado de Supabase Storage (mismo que SecureMediaService). */
export const PRIVATE_MEDIA_BUCKET = "media";

/** Expiración de las URLs firmadas, en segundos (1 h, igual que SecureMediaService). */
export const PRIVATE_MEDIA_SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * Placeholder genérico que se muestra cuando el contenido privado no puede
 * resolverse. Es un asset público sin contenido personal (`public/placeholder.svg`).
 */
export const PRIVATE_MEDIA_PLACEHOLDER = "/placeholder.svg";

/**
 * Convierte una ruta pública legacy (`/assets/people/...`) a su ruta dentro
 * del bucket privado de Storage (`people/...`, sin el prefijo `/assets/`).
 *
 * Ejemplos:
 * - `/assets/people/single/privado/aprivadosingle1.jpg`
 *   → `people/single/privado/aprivadosingle1.jpg`
 * - `assets/people/couple/privado/privadocouple1.jpg`
 *   → `people/couple/privado/privadocouple1.jpg`
 * - `people/single/privado/aprivadosingle1.jpg` (ya es ruta de Storage)
 *   → `people/single/privado/aprivadosingle1.jpg` (sin cambios)
 *
 * Devuelve `null` si la entrada está vacía o no produce una ruta válida.
 * Nunca devuelve una URL pública: el resultado solo sirve para
 * `supabase.storage.from("media").createSignedUrl()`.
 */
export function toPrivateStoragePath(publicPath: string): string | null {
  if (typeof publicPath !== "string") return null;

  let path = publicPath.trim();
  if (!path) return null;

  // Aceptar URLs absolutas (p. ej. con BASE_URL) y quedarnos con el pathname.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }

  // Quitar query string / hash si los hubiera.
  path = path.split(/[?#]/)[0] ?? "";
  // Quitar barras iniciales y el prefijo `assets/` de `public/`. El prefijo
  // puede venir precedido de un base path (p. ej. `/app/assets/people/...`
  // en URLs absolutas), así que se corta por el primer `assets/` siempre
  // que lo que sigue sea una ruta `people/...` (rutas de Storage que ya
  // contengan `assets/` en otra posición no se tocan).
  path = path.replace(/^\/+/, "");
  const assetsMarker = "assets/";
  const assetsIdx = path.indexOf(assetsMarker);
  if (assetsIdx !== -1) {
    const rest = path.slice(assetsIdx + assetsMarker.length);
    if (rest.startsWith("people/")) {
      path = rest;
    }
  }

  if (!path || path === "assets" || path === "assets/") return null;
  return path;
}

/**
 * Resuelve una lista de rutas de Storage a URLs firmadas temporales.
 *
 * Puerta de acceso (fail-closed, en este orden):
 * 1. Sin `userId` (sin usuario autenticado) → placeholders.
 * 2. Verificación de permisos por perfil con
 *    `SecureMediaService.checkMediaPermissions(userId, ownerId)` — mismo
 *    patrón que `SecureMediaService.getSecureMediaUrl`. Sin `ownerId` o con
 *    permiso denegado → placeholders.
 * 3. Una URL firmada por ruta (`bucket "media"`, 1 h). Cada ruta que falle
 *    (no existe en el bucket, bucket sin crear, error de red) queda en
 *    placeholder individual; nunca se devuelve la ruta pública.
 *
 * Esta función no lanza: cualquier error inesperado devuelve placeholders.
 */
export async function resolvePrivateMediaUrls(
  storagePaths: string[],
  userId: string | null | undefined,
  ownerId: string | null | undefined,
): Promise<string[]> {
  const placeholders = storagePaths.map(() => PRIVATE_MEDIA_PLACEHOLDER);

  if (!userId) {
    return placeholders;
  }

  if (!ownerId) {
    logger.warn("Media privada: sin ownerId, acceso denegado (fail-closed)", {
      userId,
    });
    return placeholders;
  }

  try {
    const permissions = await SecureMediaService.checkMediaPermissions(
      userId,
      ownerId,
    );
    if (!permissions.canView) {
      logger.warn("Media privada: permiso denegado por perfil", {
        userId,
        ownerId,
        role: permissions.role,
      });
      return placeholders;
    }
  } catch (error) {
    logger.error("Media privada: error verificando permisos", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      ownerId,
    });
    return placeholders;
  }

  if (!supabase || !supabase.storage) {
    logger.error("Media privada: Supabase Storage no está disponible");
    return placeholders;
  }

  const resolved = await Promise.all(
    storagePaths.map(async (storagePath) => {
      try {
        const { data, error } = await supabase.storage
          .from(PRIVATE_MEDIA_BUCKET)
          .createSignedUrl(
            storagePath,
            PRIVATE_MEDIA_SIGNED_URL_EXPIRY_SECONDS,
          );

        if (error || !data?.signedUrl) {
          logger.warn("Media privada: no se pudo firmar la URL", {
            storagePath,
            error: error?.message,
          });
          return PRIVATE_MEDIA_PLACEHOLDER;
        }
        return data.signedUrl;
      } catch (error) {
        logger.error("Media privada: excepción firmando URL", {
          error: error instanceof Error ? error.message : String(error),
          storagePath,
        });
        return PRIVATE_MEDIA_PLACEHOLDER;
      }
    }),
  );

  return resolved;
}

export interface UsePrivateMediaUrlsOptions {
  /**
   * La galería ya pasó su propio control de acceso (perfil propio + PIN /
   * biométrico, o solicitud aprobada). El hook NO desbloquea nada por sí
   * mismo: solo resuelve URLs cuando la página dice que está desbloqueado.
   */
  unlocked: boolean;
  /** Id del usuario autenticado (`user?.id` de `useAuth`); `null` sin sesión. */
  userId: string | null | undefined;
  /** Id del perfil dueño del contenido (`profile?.id`); `null` si aún no cargó. */
  ownerId?: string | null | undefined;
}

/**
 * Hook para galerías privadías (C6).
 *
 * Devuelve un array de la misma longitud y en el mismo orden que
 * `storagePaths`: URLs firmadas (1 h) solo cuando `unlocked` es `true` Y hay
 * un `userId` autenticado Y el perfil tiene permiso; en cualquier otro caso,
 * el placeholder genérico `/placeholder.svg` en cada posición.
 *
 * - Llamada incondicional en el top-level del componente (sin early returns
 *   antes), para respetar las reglas de los hooks.
 * - El primer render siempre devuelve placeholders; las URLs firmadas se
 *   resuelven en un `useEffect` y se actualizan al desbloquear / cambiar de
 *   usuario / cargar el perfil dueño.
 * - No hay fallback a la ruta pública en ningún caso.
 */
export function usePrivateMediaUrls(
  storagePaths: string[],
  options: UsePrivateMediaUrlsOptions,
): string[] {
  const { unlocked, userId, ownerId } = options;

  // Clave estable para comparar el contenido del array sin depender de su identidad.
  const pathsKey = useMemo(() => storagePaths.join("\n"), [storagePaths]);

  const placeholders = useMemo(
    () => storagePaths.map(() => PRIVATE_MEDIA_PLACEHOLDER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathsKey],
  );

  const [urls, setUrls] = useState<string[]>(placeholders);

  useEffect(() => {
    if (!unlocked || !userId) {
      setUrls(placeholders);
      return;
    }

    let cancelled = false;
    const paths = pathsKey.split("\n").filter((p) => p.length > 0);

    void resolvePrivateMediaUrls(paths, userId, ownerId).then((resolved) => {
      if (!cancelled) {
        setUrls(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [unlocked, userId, ownerId, pathsKey, placeholders]);

  return urls;
}
