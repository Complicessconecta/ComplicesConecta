import { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";

// Ruta /chat-intimo (antes 404): la función no existía en la interfaz
// porque /requests no tenía ninguna entrada al chat íntimo y no había
// ruta. Reutiliza el mismo Chat del dock ("Chat Intimo" de MainLayout)
// a pantalla completa, con su "Cerrar" que vuelve a /requests.
const ChatLazy = lazy(() => import("@/pages/Chat"));

export default function ChatIntimo() {
  const navigate = useNavigate();

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-purple-900 via-purple-800 to-blue-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <span className="text-sm font-semibold text-white">Chat Íntimo</span>
        <button
          type="button"
          onClick={() => navigate("/requests")}
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
          <ChatLazy embedded />
        </Suspense>
      </div>
    </div>
  );
}
