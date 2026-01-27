/**
 * Botón de Cerrar Sesión Unificado
 * Componente para cerrar sesión con Supabase Auth
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { LogOut, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";
import { cn } from "@/shared/lib/cn";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "lg";
  showText?: boolean;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "ghost",
  size = "sm",
  showText = true,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      // Redirigir al index después de cerrar sesión
      window.location.href = "/";
    } catch (error) {
      logger.error("Error inesperado al cerrar sesión:", { error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant={variant}
        size={size}
        onClick={handleLogout}
        disabled={isLoading}
        className={cn(
          "text-white hover:bg-destructive/20 hover:text-destructive transition-all duration-300 flex items-center gap-2",
          className,
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {showText && (
          <span className="hidden sm:inline">
            {isLoading ? "Cerrando..." : "Cerrar Sesión"}
          </span>
        )}
      </Button>
    </motion.div>
  );
};
