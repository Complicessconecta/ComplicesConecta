import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";

export const ChatRouteGate = () => {
  const { isAuthenticated } = useAuth();

  const hasSession =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : Boolean(isAuthenticated);

  if (hasSession) {
    return <Navigate to="/chat" replace />;
  } else {
    return <Navigate to="/chat-info" replace />;
  }
};
