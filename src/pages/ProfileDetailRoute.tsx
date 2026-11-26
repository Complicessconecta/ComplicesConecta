import React, {
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { isChunkLoadError, lazyWithTimeout } from "@/utils/lazyWithTimeout";

/**
 * Ruta /profile/:id — elemento de ruta con tope de carga del chunk.
 *
 * Ronda 18, stream B — QUÉ LOADER SE ATASCABA (test dirigido ronda 17,
 * PR #77, DO NOT MERGE, 2026-11-26 06:46–07:02 CST, device browser
 * 886 px, una pestaña): el `PageLoader` de MainLayout
 * (`src/components/layout/MainLayout.tsx:32-44`, "Cargando..."), fallback
 * del `<Suspense key={pathname}>` que envuelve al `<Outlet />`
 * (MainLayout.tsx:345). Cadena de evidencia (el timeout de 10 s de la
 * ronda 17 NO es este camino):
 *
 * 1. En /profile/:id el ÚNICO Suspense es el de MainLayout y el único
 *    texto "Cargando..." en esa ruta es PageLoader: ProtectedRoute dice
 *    "Verificando autenticación...", el wrapper de ProfileDetail dice
 *    "Cargando perfil…" (otro texto, y YA tiene tope de 10 s desde la
 *    ronda 17), el dock dice "Cargando chat…" (ni siquiera se monta en
 *    rutas de perfil: `showChatFab` es falso ahí), LoadingScreen solo
 *    vive en Index (/). El texto observado ("Cargando…", sin "perfil")
 *    solo puede ser PageLoader.
 * 2. ProfileDetail era un `React.lazy` pelado (`App.tsx:65-67`), sin
 *    timeout, sin reintento y sin error boundary propio; nada precarga
 *    ese chunk (preloadRoutes solo precarga Chat; Navigation solo
 *    Settings). Un `import()` que no resuelve ni rechaza deja el
 *    fallback para siempre: no hay ningún otro mecanismo que lo corte.
 * 3. El timeout de 10 s de la ronda 17 corre DESPUÉS de que el chunk
 *    cargue (es la consulta Supabase del paso 4 del wrapper) y Ana
 *    resuelve en síncrono en render sin tocar Supabase: ese timeout no
 *    puede explicar ni acotar el atasco observado.
 * 4. El chunk `pages-profiles` mide 52,38 kB (13,47 kB gzip, build
 *    baseline 52497f1): no es tamaño, es una descarga que se queda
 *    colgada (red móvil / hilo ocupado). Los 4 casos (45–90 s, 2 con
 *    recarga manual, 1 que resolvió solo a ~45–60 s) cuadran con una
 *    descarga lenta que a veces llega y a veces no, no con un rechazo
 *    (que habría ido al ErrorBoundary raíz) ni con la consulta.
 *
 * El fix: el chunk se carga con `lazyWithTimeout` (tope de 15 s, ver
 * PROFILE_DETAIL_CHUNK_TIMEOUT_MS) y un error boundary propio que solo
 * atiende errores de descarga del chunk: al vencer el tope (o si el
 * fetch del chunk rechaza) muestra "No se pudo cargar el perfil" con
 * Reintentar (que recrea el lazy — remontar el boundary solo NO
 * reintenta, `React.lazy` cachea el rechazo) y "Volver a perfiles".
 * Un error de RENDER del perfil no se traga aquí: se propaga al
 * ErrorBoundary raíz (que en producción redirige a /404), como antes.
 *
 * OJO — el lazy vive a NIVEL DE MÓDULO, no en estado de React. El
 * primer intento lo puso en `useState` (patrón del dock de chat) y el
 * test lo cazó: con el chunk colgado el temporizador disparaba una y
 * otra vez (4 carreras de 500 ms en 1800 ms) sin que apareciera el
 * error. La ruta se renderiza DENTRO del Suspense de MainLayout, así
 * que mientras el chunk está pendiente el render inicial se descarta
 * y con él cualquier estado de React: cada reintento de React volvía
 * a crear el lazy con un temporizador nuevo y el fallback no salía
 * nunca. En el dock no pasa porque ChatDock es ANCESTRO de su
 * Suspense (su render commitea con el fallback y el estado persiste).
 * A nivel de módulo la identidad del lazy sobrevive a los reintentos
 * de React; el reintento del usuario recrea el lazy y remonta el
 * boundary con otra key.
 *
 * El timeout de 10 s de la consulta Supabase del wrapper se mantiene
 * intacto (no se toca `ProfileDetail.tsx`): son dos topes distintos en
 * dos capas distintas (chunk → 15 s, consulta → 10 s).
 */
export const PROFILE_DETAIL_CHUNK_TIMEOUT_MS = 15_000;

/**
 * 15 s: mismo orden de magnitud que el tope de 10 s de la consulta y
 * por encima del de 6 s del chat (un chunk de página pesa más que el
 * del dock), pero muy por debajo de los 45–90 s de atasco observados.
 * En esa red, incluso tras recargar, el perfil tardaba 20–50 s en
 * aparecer: un tope de 6–10 s daría error en casi cada carga en frío.
 * Con 15 s el usuario ve el error y reintenta en vez de un spinner
 * muerto; el reintento se engancha a la descarga en curso (el
 * navegador deduplica el fetch del módulo), así que no pierde lo ya
 * descargado.
 */
const PROFILE_DETAIL_CHUNK_NAME = "pages-profiles";

const loadProfileDetailChunk = () =>
  import("@/pages/profiles/shared/ProfileDetail");

export type ProfileDetailChunkImporter = () => Promise<{
  default: ComponentType<unknown>;
}>;

export interface ProfileDetailRouteProps {
  /**
   * Costura de test: tope en ms (por defecto
   * PROFILE_DETAIL_CHUNK_TIMEOUT_MS). App.tsx no lo pasa.
   */
  chunkTimeoutMs?: number;
  /**
   * Costura de test: importador del chunk (por defecto el `import()`
   * real). Permite probar un chunk que rechaza de inmediato sin
   * mockear el módulo (la factoría de `vi.doMock` no puede devolver
   * una promesa rechazada: vitest lo trata como error del mock).
   */
  importer?: ProfileDetailChunkImporter;
}

// Panel de error de carga del chunk: mismo texto y botones que el
// error del dock de chat (ChatDockLoadError) y la misma pareja de
// acciones que el "Perfil no encontrado" del wrapper (Reintentar /
// Volver), con botones nativos como el dock (sin framer-motion).
function ProfileDetailChunkLoadError({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900">
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          No se pudo cargar el perfil
        </h1>
        <p className="text-slate-500 dark:text-white/70 text-sm mb-6">
          La descarga tardó demasiado. Revisa tu conexión e inténtalo de nuevo.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => navigate("/profiles")}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/20 dark:text-white dark:hover:bg-white/20"
          >
            Volver a perfiles
          </button>
        </div>
      </main>
    </div>
  );
}

interface ProfileDetailChunkErrorBoundaryProps {
  onRetry: () => void;
  children: React.ReactNode;
}

interface ProfileDetailChunkErrorBoundaryState {
  hasError: boolean;
}

// Solo errores de descarga del chunk: si `getDerivedStateFromError`
// devuelve null, React propaga el error al boundary superior (aquí el
// ErrorBoundary raíz, que en producción redirige a /404), así que un
// error de render del perfil NO cambia de comportamiento con este fix.
class ProfileDetailChunkErrorBoundary extends React.Component<
  ProfileDetailChunkErrorBoundaryProps,
  ProfileDetailChunkErrorBoundaryState
> {
  state: ProfileDetailChunkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(
    error: unknown,
  ): ProfileDetailChunkErrorBoundaryState | null {
    if (!isChunkLoadError(error)) return null;
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error("ProfileDetailRoute: no se pudo cargar el chunk del perfil:", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  render() {
    if (this.state.hasError) {
      return <ProfileDetailChunkLoadError onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
}

// Caché del lazy a nivel de módulo (ver nota del encabezado): la
// identidad del lazy tiene que sobrevivir a los reintentos de React
// sobre el render inicial descartado. La clave es el tope (en
// producción siempre es PROFILE_DETAIL_CHUNK_TIMEOUT_MS; los tests
// usan topes cortos y cada test reimporta el módulo, así que el caché
// no se cruza entre tests).
let cachedLazy: LazyExoticComponent<ComponentType<unknown>> | undefined;
let cachedImporter: ProfileDetailChunkImporter | undefined;
let cachedTimeoutMs: number | undefined;

function getDetailLazy(
  importer: ProfileDetailChunkImporter,
  timeoutMs: number,
): LazyExoticComponent<ComponentType<unknown>> {
  if (
    cachedLazy === undefined ||
    cachedImporter !== importer ||
    cachedTimeoutMs !== timeoutMs
  ) {
    cachedImporter = importer;
    cachedTimeoutMs = timeoutMs;
    cachedLazy = lazyWithTimeout(
      importer,
      timeoutMs,
      PROFILE_DETAIL_CHUNK_NAME,
    );
  }
  return cachedLazy;
}

function recreateDetailLazy(
  importer: ProfileDetailChunkImporter,
  timeoutMs: number,
): LazyExoticComponent<ComponentType<unknown>> {
  // React.lazy guarda el rechazo del `import()` en el payload del
  // componente y remontar el boundary con otra `key` NO reintenta el
  // chunk (vuelve a lanzar el mismo error y "Reintentar" era un botón
  // muerto). Recrearlo sí vuelve a descargar (el navegador reutiliza
  // la descarga en curso / en caché si ya llegó).
  cachedImporter = importer;
  cachedTimeoutMs = timeoutMs;
  cachedLazy = lazyWithTimeout(importer, timeoutMs, PROFILE_DETAIL_CHUNK_NAME);
  return cachedLazy;
}

export function ProfileDetailRoute({
  chunkTimeoutMs = PROFILE_DETAIL_CHUNK_TIMEOUT_MS,
  importer = loadProfileDetailChunk,
}: ProfileDetailRouteProps = {}) {
  const [retryKey, setRetryKey] = useState(0);
  const DetailLazy = getDetailLazy(importer, chunkTimeoutMs);

  const handleRetry = () => {
    recreateDetailLazy(importer, chunkTimeoutMs);
    setRetryKey((prev) => prev + 1);
  };

  return (
    <ProfileDetailChunkErrorBoundary key={retryKey} onRetry={handleRetry}>
      <DetailLazy />
    </ProfileDetailChunkErrorBoundary>
  );
}

export default ProfileDetailRoute;
