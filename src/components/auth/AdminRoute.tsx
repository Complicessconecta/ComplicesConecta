import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verificar si hay sesión activa
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.error("❌ Error al verificar sesión:", {
          error: sessionError.message,
        });
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        logger.info("🚫 No hay sesión activa - acceso denegado");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Validación segura: backend decide si el usuario es admin (función SECURITY DEFINER)
      // Evita depender de variables VITE_* (expuestas en frontend)
      try {
        const { data, error } = await supabase.rpc("is_admin");
        if (error) {
          throw error;
        }

        if (data === true) {
          logger.info("✅ Acceso de admin verificado (rpc:is_admin)");
          setIsAdmin(true);
          return;
        }

        logger.info("🚫 Usuario no es admin (rpc:is_admin)");
        setIsAdmin(false);
        return;
      } catch (error: any) {
        logger.error("⚠️ Error verificando admin via rpc:is_admin, usando fallback", {
          error: error?.message,
        });
      }

      // Fallback: consultar admin_users (RLS debe permitir ver solo si es admin)
      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("id, user_id, role, is_active")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError) {
        logger.error("❌ Error consultando admin_users", {
          error: adminError.message,
        });
        setIsAdmin(false);
        return;
      }

      const hasAdminAccess = Boolean(adminRow?.id);
      if (hasAdminAccess) {
        logger.info("✅ Acceso de admin verificado (admin_users)", {
          role: adminRow?.role,
        });
      } else {
        logger.info("🚫 Usuario no es admin (admin_users)");
      }
      setIsAdmin(hasAdminAccess);
    } catch (error: any) {
      logger.error("❌ Error inesperado al verificar admin:", {
        error: error.message,
      });
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    logger.info("🔄 Redirigiendo a página principal - acceso denegado");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
