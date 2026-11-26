import { Component, Suspense, lazy, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { loadChatModule } from "@/lib/intimateChat";

// Ruta /chat-intimo (antes 404): la función no existía en la interfaz
// porque /requests no tenía ninguna entrada al chat íntimo y no había
// ruta. Reutiliza el mismo Chat del dock ("Chat Íntimo" de MainLayout)
// a pantalla completa, con su "Cerrar" que vuelve a /requests.
// El lazy NO vive a nivel de módulo (ver ChatIntimo abajo): React.lazy
// cachea el rechazo del `import()` y remontar el boundary no reintenta.

/**
 * Si el chunk del Chat falla al cargar, sin boundary el error subía
 * hasta el boundary de la app (o la dejaba en blanco) y la página se
 * quedaba en "Cargando chat…" para siempre. Aquí se muestra el error
 * con "Reintentar" y "Volver"; el encabezado con "Cerrar" queda fuera
 * del boundary y siempre funciona (ronda 7, punto 6).
 */
class ChatIntimoErrorBoundary extends Component<
  { onRetry: () => void; onClose: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ChatIntimo] no se pudo cargar el chat:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm font-semibold text-white">
            No se pudo cargar el chat
          </p>
          <p className="text-xs text-white/70">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.props.onRetry}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatIntimo() {
  const navigate = useNavigate();
  // El lazy vive en ESTADO, no a nivel de módulo: React.lazy guarda el
  // rechazo del `import()` en el payload del componente y remontar el
  // boundary con otra `key` NO reintenta el chunk (vuelve a lanzar el
  // mismo error y "Reintentar" era un botón muerto). Recrear el lazy
  // en el reintento sí vuelve a descargar el chunk.
  const [ChatLazy, setChatLazy] = useState(() => lazy(loadChatModule));
  // `key` del boundary: al reintentar se remonta y limpia `hasError`.
  const [errorKey, setErrorKey] = useState(0);
  const goRequests = () => navigate("/requests");
  const retryLoad = () => {
    setChatLazy(() => lazy(loadChatModule));
    setErrorKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-purple-900 via-purple-800 to-blue-900">
      {/* `relative z-10`: el encabezado es el único de la página
          (MainLayout ya no pone su fila superior en /chat-intimo) y
          debe quedar por encima del contenido del Chat. */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <span className="text-sm font-semibold text-white">Chat Íntimo</span>
        <button
          type="button"
          onClick={goRequests}
          className="text-white/70 hover:text-white text-sm px-2 py-1 rounded-md hover:bg-white/10"
        >
          Cerrar
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/70">Cargando chat…</p>
            </div>
          }
        >
          <ChatIntimoErrorBoundary
            key={errorKey}
            onRetry={retryLoad}
            onClose={goRequests}
          >
            <ChatLazy embedded />
          </ChatIntimoErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
