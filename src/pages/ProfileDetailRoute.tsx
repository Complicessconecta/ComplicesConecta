import React, { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { PageLoader } from "@/components/layout/MainLayout";
import { isChunkLoadError, raceChunkLoad } from "@/utils/lazyWithTimeout";

/**
 * Ruta /profile/:id — elemento de ruta con tope de carga del chunk.
 *
 * RONDA 19, stream A — CAUSA RAÍZ 2: EL RETRY DEL SUSPENSE SE PIERDE
 * EN NAVEGACIÓN SPA (el tope de 15 s de la ronda 18 SÍ dispara, pero
 * el perfil no aparece aunque el chunk ya haya llegado).
 *
 * Evidencia (Chromium real, preview local, 886 px, build con el fix
 * de telemetría de la causa 1 ya aplicado — hilo sano, ~600
 * heartbeats de 100 ms en 60 s, 0 snapshots bloqueados):
 * - Click real en Ana (Discover): la URL cambia al instante a
 *   /profile/20e3165d-1e83-41e8-a300-0001e834eeda y el chunk
 *   `pages-profiles` se descarga en 12–18 ms (Resource Timing), pero
 *   la pantalla se queda en PageLoader "Cargando..." 60+ s. El panel
 *   de error NO aparece (correcto: el chunk resolvió, el tope de 15 s
 *   no aplica). La navegación DIRECTA al mismo id en la misma sesión
 *   renderiza a Ana en 3,3 s (chunk 12 ms).
 * - Sonda de retraso del chunk (3 s, vía `page.route`): con el chunk
 *   llegando 3 s DESPUÉS del commit del fallback, el perfil TAMPOCO
 *   aparece a T+14 s. No es una carrera con resolución rápida: el
 *   retry se pierde en SPA con independencia del momento en que
 *   resuelva el chunk.
 * - Sonda de la campana: con el perfil atascado en el loader, un
 *   click sintético en la campana de notificaciones (`setIsOpen` en
 *   MainLayout — un re-render externo, sin navegación) hace que el
 *   perfil aparezca en <3 s. El chunk YA estaba resuelto; lo que
 *   faltaba era un re-render que volviera a leer el payload.
 *
 * Mecanismo (React 19.3.1, `react-dom-client.development.js` en este
 * repo): cuando el `React.lazy` suspende, React engancha el retry a
 * la promesa con `attachPingListener` (`wakeable.then(pingCache)`); al
 * resolver, `pingSuspendedRoot` hace
 * `root.pingedLanes |= root.suspendedLanes & pingedLanes` y llama a
 * `ensureRootIsScheduled`. Si en ese momento no queda ningún lane
 * pendiente que re-renderice el boundary, el ping se consume sin
 * programar nada y el retry se pierde para siempre: el boundary se
 * queda en el fallback hasta que OTRO update cualquiera lo
 * re-renderice (la campana, un toast, un poll). En carga DIRECTA el
 * retry sí llega (el boundary se monta con el chunk ya en vuelo y
 * nada interfiere antes de que resuelva); en SPA desde Discover el
 * árbol real (efectos de MainLayout al cambiar `pathname`, campana,
 * toasts, providers) programa trabajo entre el suspend y la
 * resolución del chunk y el ping se pierde.
 *
 * Por qué jsdom NO lo reproduce (bisección medida en este stream):
 * SPA + `lazyWithTimeout` + chunk que resuelve a 300 ms renderiza
 * bien en jsdom, con build de desarrollo Y de producción
 * (`NODE_ENV=production`), y sobrevive a un update externo a 50 ms
 * tanto a DefaultLane como con `flushSync` (el perfil aparece a
 * ~360 ms y ~2020 ms con chunk a 300 ms y 2000 ms). El update exacto
 * del árbol real que mata el ping no quedó identificado; lo que está
 * probado es el contrato observable (el retry depende del ping y el
 * ping se pierde en el navegador real, no en jsdom).
 *
 * EL FIX (ronda 19): la ruta YA NO USA `React.lazy` NI SUSPENDE.
 * El chunk se carga de forma IMPERATIVA en un `useEffect` con la
 * misma carrera de `raceChunkLoad` (tope 15 s, `ChunkLoadTimeoutError`)
 * y el resultado vive en ESTADO de `ProfileDetailRoute`. Como el
 * componente nunca suspende, su render inicial COMMITTEA (muestra
 * `PageLoader`, el mismo loader que el fallback del Suspense) y el
 * estado y el efecto sobreviven: al resolver el `import()`, el
 * `setState` ordinario re-renderiza la ruta con el perfil — sin
 * depender del ping del Suspense. Al vencer el tope (o si el fetch
 * del chunk rechaza), el estado pasa a error y se muestra el mismo
 * panel "No se pudo cargar el perfil" con Reintentar / "Volver a
 * perfiles". El `import()` dinámico se conserva: el chunk
 * `pages-profiles` sigue siendo lazy (el navegador deduplica el fetch
 * del módulo, así que Reintentar se engancha a la descarga en curso
 * o en caché). El tope sigue siendo 15 s (sin evidencia de que el
 * valor sea el problema: el chunk llega en milisegundos; lo que
 * fallaba era el retry, no el tope).
 *
 * Nota de alcance (sistémico, fuera de esta ruta): las demás rutas
 * lazy de `App.tsx` siguen usando `React.lazy` bajo el mismo
 * `<Suspense key={pathname}>` de MainLayout, así que comparten la
 * misma exposición al retry perdido. Este stream fija /profile/:id
 * primero, como pide la tarea; extender el patrón imperativo a las
 * demás rutas es trabajo aparte.
 *
 * Contexto ronda 18 (sigue vigente): el `PageLoader` de MainLayout
 * (`MainLayout.tsx:34-44`, "Cargando...") es el fallback del
 * `<Suspense key={pathname}>` del `<Outlet />` (MainLayout.tsx:345);
 * el timeout de 10 s de la consulta Supabase del wrapper de
 * ProfileDetail corre DESPUÉS de que el chunk cargue y no se toca
 * (son dos topes distintos en dos capas distintas: chunk → 15 s,
 * consulta → 10 s). El error boundary propio sigue siendo SELECTIVO:
 * solo atiende errores de descarga del chunk; un error de RENDER del
 * perfil se propaga al ErrorBoundary raíz (que en producción
 * redirige a /404), como antes.
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

type ProfileDetailLoadState =
  | { status: "loading" }
  | { status: "loaded"; Component: ComponentType<unknown> }
  | { status: "error"; error: unknown };

export function ProfileDetailRoute({
  chunkTimeoutMs = PROFILE_DETAIL_CHUNK_TIMEOUT_MS,
  importer = loadProfileDetailChunk,
}: ProfileDetailRouteProps = {}) {
  const [retryKey, setRetryKey] = useState(0);
  const [loadState, setLoadState] = useState<ProfileDetailLoadState>({
    status: "loading",
  });

  // Carga IMPERATIVA del chunk (ronda 19): este componente nunca
  // suspende, así que su render commitea y el estado/efecto
  // sobreviven. Al resolver el import, el setState ordinario muestra
  // el perfil sin depender del retry del Suspense. `cancelled`
  // descarta la carrera anterior al desmontar o reintentar (en dev,
  // StrictMode invoca el efecto dos veces: la primera carrera queda
  // cancelada y gana la segunda; en producción StrictMode es inerte).
  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading" });
    raceChunkLoad(importer, chunkTimeoutMs, PROFILE_DETAIL_CHUNK_NAME).then(
      (mod) => {
        if (cancelled) return;
        setLoadState({ status: "loaded", Component: mod.default });
      },
      (error) => {
        if (cancelled) return;
        logger.error(
          "ProfileDetailRoute: no se pudo cargar el chunk del perfil:",
          { error: error instanceof Error ? error.message : String(error) },
        );
        setLoadState({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [importer, chunkTimeoutMs, retryKey]);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  if (loadState.status === "error") {
    // Un rechazo que NO es de descarga del chunk (p. ej. el módulo
    // tira al evaluarse) no es panel: se propaga al ErrorBoundary
    // raíz, igual que un error de render (selectividad de la ronda 18).
    if (!isChunkLoadError(loadState.error)) throw loadState.error;
    return <ProfileDetailChunkLoadError onRetry={handleRetry} />;
  }

  if (loadState.status === "loaded") {
    const LoadedProfileDetail = loadState.Component;
    return (
      <ProfileDetailChunkErrorBoundary key={retryKey} onRetry={handleRetry}>
        <LoadedProfileDetail />
      </ProfileDetailChunkErrorBoundary>
    );
  }

  // Mismo loader que el fallback del Suspense de MainLayout: la UX
  // de carga no cambia, solo el mecanismo que la saca de ahí.
  return <PageLoader />;
}

export default ProfileDetailRoute;
