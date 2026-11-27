import React, { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { PageLoader } from "@/components/layout/MainLayout";
import { isChunkLoadError, raceChunkLoad } from "@/utils/lazyWithTimeout";

/**
 * Ronda 21, stream A — wrapper reutilizable con el patrón imperativo
 * de `ProfileDetailRoute.tsx` (ronda 19).
 *
 * Las rutas lazy de `App.tsx` comparten la exposición al retry
 * perdido del Suspense en navegación SPA: el chunk puede resolver y
 * el boundary quedarse en `PageLoader` para siempre. Este wrapper
 * carga el chunk de forma IMPERATIVA en un `useEffect` (nunca
 * suspende), con tope de 15 s y panel de error con Reintentar — el
 * mismo texto y botones que `ProfileDetailChunkLoadError`. El
 * `import()` dinámico se conserva: el chunk sigue siendo lazy.
 *
 * Se usa para /admin/dashboard (FAIL 2) y /ley-olimpia (FAIL 5).
 */
export const IMPERATIVE_LAZY_CHUNK_TIMEOUT_MS = 15_000;

/**
 * El importador devuelve el módulo tal cual: se acepta `default` o,
 * si no hay (p. ej. `Admin.tsx` solo exporta el nombrado `Admin`),
 * el primer export que sea un componente — mismo criterio que
 * `lazyWithDefault`.
 */
export type ImperativeLazyImporter = () => Promise<unknown>;

export interface ImperativeLazyRouteProps {
  importer: ImperativeLazyImporter;
  /** Nombre del chunk para el mensaje de timeout (p. ej. "pages-admin"). */
  chunkName: string;
  /**
   * Costura de test: tope en ms (por defecto
   * IMPERATIVE_LAZY_CHUNK_TIMEOUT_MS). App.tsx no lo pasa.
   */
  chunkTimeoutMs?: number;
  /** Título del panel de error. */
  errorTitle?: string;
  /** Ruta del botón "Volver" del panel de error. */
  fallbackPath?: string;
  /** Etiqueta del botón "Volver" del panel de error. */
  fallbackLabel?: string;
}

function resolveModuleComponent(
  mod: unknown,
  chunkName: string,
): ComponentType<unknown> {
  if (mod && typeof mod === "object") {
    const m = mod as Record<string, unknown>;
    if (typeof m.default === "function") {
      return m.default as ComponentType<unknown>;
    }
    const first = Object.values(m).find((v) => typeof v === "function");
    if (first) return first as ComponentType<unknown>;
  }
  throw new Error(
    `ImperativeLazyRoute: el módulo "${chunkName}" no exporta un componente`,
  );
}

// Panel de error de carga del chunk: mismo texto y botones que
// ProfileDetailChunkLoadError (Reintentar / Volver), con botones
// nativos (sin framer-motion).
function ImperativeLazyChunkLoadError({
  title,
  fallbackPath,
  fallbackLabel,
  onRetry,
}: {
  title: string;
  fallbackPath: string;
  fallbackLabel: string;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900">
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          {title}
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
            onClick={() => navigate(fallbackPath)}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/20 dark:text-white dark:hover:bg-white/20"
          >
            {fallbackLabel}
          </button>
        </div>
      </main>
    </div>
  );
}

interface ImperativeLazyChunkErrorBoundaryProps {
  title: string;
  fallbackPath: string;
  fallbackLabel: string;
  onRetry: () => void;
  children: React.ReactNode;
}

interface ImperativeLazyChunkErrorBoundaryState {
  hasError: boolean;
}

// Solo errores de descarga del chunk: si `getDerivedStateFromError`
// devuelve null, React propaga el error al boundary superior (aquí el
// ErrorBoundary raíz, que en producción redirige a /404), así que un
// error de render de la página NO cambia de comportamiento con este
// fix — igual que ProfileDetailRoute.
class ImperativeLazyChunkErrorBoundary extends React.Component<
  ImperativeLazyChunkErrorBoundaryProps,
  ImperativeLazyChunkErrorBoundaryState
> {
  state: ImperativeLazyChunkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(
    error: unknown,
  ): ImperativeLazyChunkErrorBoundaryState | null {
    if (!isChunkLoadError(error)) return null;
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error("ImperativeLazyRoute: no se pudo cargar el chunk:", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ImperativeLazyChunkLoadError
          title={this.props.title}
          fallbackPath={this.props.fallbackPath}
          fallbackLabel={this.props.fallbackLabel}
          onRetry={this.props.onRetry}
        />
      );
    }
    return this.props.children;
  }
}

type ImperativeLazyLoadState =
  | { status: "loading" }
  | { status: "loaded"; Component: ComponentType<unknown> }
  | { status: "error"; error: unknown };

export function ImperativeLazyRoute({
  importer,
  chunkName,
  chunkTimeoutMs = IMPERATIVE_LAZY_CHUNK_TIMEOUT_MS,
  errorTitle = "No se pudo cargar la página",
  fallbackPath = "/",
  fallbackLabel = "Volver al inicio",
}: ImperativeLazyRouteProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [loadState, setLoadState] = useState<ImperativeLazyLoadState>({
    status: "loading",
  });

  // Carga IMPERATIVA del chunk (ronda 19): este componente nunca
  // suspende, así que su render commitea y el estado/efecto
  // sobreviven. Al resolver el import, el setState ordinario muestra
  // la página sin depender del retry del Suspense. `cancelled`
  // descarta la carrera anterior al desmontar o reintentar.
  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading" });
    raceChunkLoad(
      () => importer().then((mod) => resolveModuleComponent(mod, chunkName)),
      chunkTimeoutMs,
      chunkName,
    ).then(
      (Component) => {
        if (cancelled) return;
        setLoadState({ status: "loaded", Component });
      },
      (error) => {
        if (cancelled) return;
        logger.error("ImperativeLazyRoute: no se pudo cargar el chunk:", {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoadState({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [importer, chunkName, chunkTimeoutMs, retryKey]);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  if (loadState.status === "error") {
    // Un rechazo que NO es de descarga del chunk (p. ej. el módulo
    // tira al evaluarse) no es panel: se propaga al ErrorBoundary
    // raíz, igual que un error de render (selectividad de la ronda 18).
    if (!isChunkLoadError(loadState.error)) throw loadState.error;
    return (
      <ImperativeLazyChunkLoadError
        title={errorTitle}
        fallbackPath={fallbackPath}
        fallbackLabel={fallbackLabel}
        onRetry={handleRetry}
      />
    );
  }

  if (loadState.status === "loaded") {
    const LoadedComponent = loadState.Component;
    return (
      <ImperativeLazyChunkErrorBoundary
        key={retryKey}
        title={errorTitle}
        fallbackPath={fallbackPath}
        fallbackLabel={fallbackLabel}
        onRetry={handleRetry}
      >
        <LoadedComponent />
      </ImperativeLazyChunkErrorBoundary>
    );
  }

  // Mismo loader que el fallback del Suspense de MainLayout: la UX
  // de carga no cambia, solo el mecanismo que la saca de ahí.
  return <PageLoader />;
}

export default ImperativeLazyRoute;
