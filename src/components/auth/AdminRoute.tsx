import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { isProductionAdmin } from "@/lib/app-config";
import { useAuth } from "@/features/auth/useAuth";

// Ronda 24 (stream A): tope de la verificación de sesión, igual que
// `AUTH_SESSION_TIMEOUT_MS` de useAuth (8 s). Sin él, un getSession()
// colgado dejaba «Verificando permisos...» para siempre; al vencer,
// la verificación niega fail-closed (el catch pone isAdmin=false).
const ADMIN_CHECK_TIMEOUT_MS = 8_000;

const withCheckTimeout = <T,>(promise: Promise<T>, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_resolve, reject) =>
      setTimeout(
        () => reject(new Error(`Tiempo de espera agotado: ${label}`)),
        ADMIN_CHECK_TIMEOUT_MS,
      ),
    ),
  ]);

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isDemo } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  // Ronda 24 (stream A): «ya concedí». Si el acceso se concedió por
  // demo y `demoActive` cambia a false después (la sesión real asienta
  // tarde y `isDemo()` pasa a false), NO re-validar de inmediato
  // contra una sesión aún en hidratación: /admin y /admin/dashboard
  // discrepaban justo en esa ventana (el centro cargaba y el panel
  // rebotaba). Supuesto deliberado, igual que el `decisionRef` de
  // Admin.tsx: la concesión no se re-valida; la rama demo solo
  // muestra datos demo locales.
  const grantedRef = useRef(false);

  // En modo demo no hay sesión Supabase: la validación real siempre
  // negaba el acceso y la cadena /admin → /auth → /dashboard sacaba al
  // usuario del panel al hacer scroll (el chequeo async resolvía tarde).
  // El panel admin en demo muestra datos demo/respaldo, como el resto de
  // la app en demo; la validación real solo aplica fuera de demo.
  const demoActive = typeof isDemo === "function" ? isDemo() : Boolean(isDemo);

  useEffect(() => {
    let isMounted = true;

    // Demo: acceso directo al panel (datos demo/respaldo, sin sesión real).
    if (demoActive) {
      grantedRef.current = true;
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Ronda 24: acceso ya concedido por demo antes del flip de
    // `demoActive` — no re-validar (ver grantedRef arriba).
    if (grantedRef.current) {
      return;
    }

    const run = async () => {
      await checkAdminAccess(0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!isMounted || grantedRef.current) return;
      void checkAdminAccess(0);
    });

    void run();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [demoActive]);

  const checkAdminAccess = async (attempt: number) => {
    try {
      // C3 (2026-11-19): demo admin por localStorage ELIMINADO. Un JSON
      // demo_authenticated/demo_user en localStorage ya no concede admin.
      // Solo corre la validación real: sesión Supabase + email whitelist
      // (isProductionAdmin) + rpc("is_admin") + tabla admin_users.

      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Verificar si hay sesión activa
      // Ronda 24: con tope (ver withCheckTimeout). Si getSession()
      // se cuelga, el catch niega fail-closed en vez de dejar
      // «Verificando permisos...» para siempre.
      const {
        data: { session },
        error: sessionError,
      } = await withCheckTimeout(
        supabase.auth.getSession(),
        "supabase.auth.getSession",
      );

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
        logger.error(
          "⚠️ Error verificando admin via rpc:is_admin, usando fallback",
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
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
