import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";

/**
 * ChatRouteGate - Wrapper para redirect inteligente de /chat
 * 
 * Comportamiento:
 * - Si el usuario tiene sesión → redirige a /chat (chat autenticado)
 * - Si el usuario NO tiene sesión → redirige a /chat-info (landing pública)
 * 
 * Uso en router:
 * <Route path="/chat" element={<ChatRouteGate />} />
 * <Route path="/chat-info" element={<ChatInfo />} />
 * <Route path="/chat-authenticated" element={<ChatAuthenticated />} />
 */
export const ChatRouteGate: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Determinar si el usuario tiene sesión
  const hasSession =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);

  // Redirect inteligente según estado de autenticación
  return hasSession ? (
    <Navigate to="/chat-authenticated" replace />
  ) : (
    <Navigate to="/chat-info" replace />
  );
};

export default ChatRouteGate;
