import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface ModeratorRouteProps {
  children: React.ReactNode;
}

const ModeratorRoute = ({ children }: ModeratorRouteProps) => {
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkModeratorAccess();
  }, []);

  const checkModeratorAccess = async () => {
    try {
      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        setIsModerator(false);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsModerator(false);
        setLoading(false);
        return;
      }

      // Validación preferida: backend decide rol staff (admin/moderator) vía función
      // NOTA: No depender de emails hardcodeados ni VITE_*.
      try {
        const { data, error } = await supabase.rpc("is_admin_or_moderator");
        if (!error && data === true) {
          setIsModerator(true);
          return;
        }
      } catch (error: unknown) {
        logger.error("⚠️ Error verificando staff via rpc:is_admin_or_moderator", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Fallback: Verificar rol vía tabla user_roles (existe en schema local)
      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleError) {
        logger.error("❌ Error consultando user_roles", {
          error: roleError.message,
        });
        setIsModerator(false);
        return;
      }

      const isActive = roleRow?.role === "moderator" || roleRow?.role === "admin";
      setIsModerator(isActive);
    } catch (error) {
      logger.error("❌ Error checking moderator access", {
        error: error instanceof Error ? error.message : String(error),
      });
      setIsModerator(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (isModerator === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ModeratorRoute;
