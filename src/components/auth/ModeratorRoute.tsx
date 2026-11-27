import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";

interface ModeratorRouteProps {
  children: React.ReactNode;
}

const ModeratorRoute = ({ children }: ModeratorRouteProps) => {
  const { isDemo } = useAuth();
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Ronda 21 (coordinador, FAIL 3 — cierre): en demo no hay sesión
  // Supabase, así que la validación real siempre negaba el acceso y el
  // botón «Dashboard Demo» de /moderators rebotaba a `/` tras arreglar
  // el 404. Mismo diseño que AdminRoute: en demo el panel se concede
  // de inmediato (datos demo/respaldo); la validación real solo aplica
  // fuera de demo.
  const demoActive = typeof isDemo === "function" ? isDemo() : Boolean(isDemo);

  useEffect(() => {
    // Demo: acceso directo al panel (sin sesión real).
    if (demoActive) {
      setIsModerator(true);
      setLoading(false);
      return;
    }
    checkModeratorAccess();
  }, [demoActive]);

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
      } catch (error: any) {
        logger.error(
          "⚠️ Error verificando staff via rpc:is_admin_or_moderator",
          {
            error: error?.message,
          },
        );
      }

      // Fallback: Verificar si es moderador activo (RLS debe filtrar correctamente)
      const { data: moderatorRow, error: moderatorError } = await supabase
        .from("moderators")
        .select("id, user_id, is_active, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (moderatorError) {
        logger.error("❌ Error consultando moderators", {
          error: moderatorError.message,
        });
        setIsModerator(false);
        return;
      }

      const isActive = Boolean(
        moderatorRow?.is_active === true || moderatorRow?.status === "active",
      );
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
