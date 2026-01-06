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

  return (
    <Button
      onClick={() => {
        if (onOpen) {
          onOpen();
        } else {
          navigate("/chat");
        }
      }}
      className="fixed bottom-24 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-0 flex items-center justify-center transition-transform hover:scale-110"
      aria-label="Abrir Chat"
    >
      <MessageCircle className="w-8 h-8" />
      <span className="sr-only">Chat</span>
      {/* Indicador de estado (opcional, por ahora estático) */}
      <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
    </Button>
  );
};
