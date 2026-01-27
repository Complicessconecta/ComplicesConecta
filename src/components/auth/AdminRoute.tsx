import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { isProductionAdmin } from "@/lib/app-config";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      await checkAdminAccess(0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!isMounted) return;
      void checkAdminAccess(0);
    });

    void run();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminAccess = async (attempt: number) => {
    try {
      // Demo mode: permitir acceso admin sin sesión Supabase
      try {
        if (typeof window !== "undefined") {
          const demoAuth = window.localStorage.getItem("demo_authenticated");
          const demoUserRaw = window.localStorage.getItem("demo_user");
          if (demoAuth === "true" && demoUserRaw) {
            let parsedDemoUser: { accountType?: string; role?: string } | null = null;
            try {
              parsedDemoUser = JSON.parse(demoUserRaw) as {
                accountType?: string;
                role?: string;
              };
            } catch {
              parsedDemoUser = null;
            }

            const isDemoAdmin =
              parsedDemoUser?.accountType === "admin" || parsedDemoUser?.role === "admin";

            if (isDemoAdmin) {
              logger.info("✅ AdminRoute: acceso demo admin autorizado");
              setIsAdmin(true);
              setLoading(false);
              return;
            }

            logger.info("🚫 AdminRoute: usuario demo sin permisos admin");
            setIsAdmin(false);
            setLoading(false);
            return;
          }
        }
      } catch {
        // no-op: seguir validación normal
      }

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
        // Race condition común: recién logueado pero auth aún no hidrata la sesión
        if (attempt < 2) {
          setTimeout(() => {
            void checkAdminAccess(attempt + 1);
          }, 350);
          return;
        }

        logger.info("🚫 No hay sesión activa - acceso denegado");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Fallback por email (admins definidos por ENV/whitelist). Esto evita bloqueos
      // cuando rpc:is_admin o admin_users no están disponibles/configurados.
      const sessionEmail = session.user.email?.toLowerCase();
      if (sessionEmail && isProductionAdmin(sessionEmail)) {
        logger.info("✅ AdminRoute: acceso admin por email autorizado", {
          email: sessionEmail,
        });
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Validación segura: backend decide si el usuario es admin (función SECURITY DEFINER)
      // Evita depender de variables VITE_* (expuestas en frontend)
      try {
        const { data, error } = await supabase.rpc("is_admin");
        if (error) {
          logger.error("❌ Error en rpc:is_admin:", { error: error.message });
          throw error;
        }

        if (data === true) {
          logger.info("✅ Acceso de admin verificado (rpc:is_admin)");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        logger.info("🚫 Usuario no es admin (rpc:is_admin)");
      } catch (error) {
        logger.error("⚠️ Error verificando admin via rpc:is_admin, usando fallback", {
          error: error instanceof Error ? error.message : String(error),
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
    } catch (error) {
      logger.error("❌ Error inesperado al verificar admin:", {
        error: error instanceof Error ? error.message : String(error),
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
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
