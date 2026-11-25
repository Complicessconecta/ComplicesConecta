import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { useAuth } from "@/features/auth/useAuth";

interface ChatFabProps {
  onOpen?: () => void;
}

export const ChatFab: React.FC<ChatFabProps> = ({ onOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // No mostrar en la página de chat para evitar duplicidad
  if (location.pathname.startsWith("/chat")) {
    return null;
  }

  // Solo mostrar si el usuario está autenticado
  if (!user) {
    return null;
  }

  // RONDA 5: ya NO es un botón flotante (`fixed bottom-24 right-4`):
  // seguía al hacer scroll y tapaba textos/fotos en perfil, Discover,
  // /faq, /tokens-legal, clubs, Matches y video-chat. Ahora es un botón
  // en flujo: MainLayout lo renderiza en una franja al final del
  // contenido de la página, donde nunca se solapa con nada. El panel
  // ChatDock que abre sigue siendo un overlay bajo demanda (lo abre el
  // usuario y tiene su botón Cerrar), eso no es un flotante pasivo.
  // RONDA 6 (punto 2): además ya NO es una burbuja redonda abajo a la
  // derecha: en páginas cortas (404, /matches) esa burbuja se seguía
  // leyendo como flotante fijo. Ahora es una píldora centrada con texto
  // "Abrir Chat", imposible de confundir con un FAB.
  return (
    <Button
      onClick={() => {
        if (onOpen) {
          onOpen();
        } else {
          navigate("/chat");
        }
      }}
      className="relative rounded-full h-11 px-5 shadow-lg bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
      aria-label="Abrir Chat"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold">Abrir Chat</span>
      {/* Indicador de estado (opcional, por ahora estático) */}
      <span className="w-2.5 h-2.5 bg-green-400 border border-white rounded-full"></span>
    </Button>
  );
};
