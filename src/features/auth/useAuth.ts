// ✅ AUTO-FIX aplicado por Auditoría ComplicesConecta v2.1.2
// Fecha: 2025-01-06

import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  getAppConfig,
  DEMO_CREDENTIALS,
  getDemoPassword,
  handleDemoAuth,
  clearDemoAuth,
  isProductionAdmin,
} from "@/lib/app-config";
import { StorageManager } from "@/lib/storage-manager";
import { logger } from "@/lib/logger";
import { usePersistedState } from "@/hooks/usePersistedState";
import { setDatadogUser, clearDatadogUser } from "@/config/datadog-rum.config";
import { Profile } from "@/types/supabase-custom";



export const useAuth = () => {
  // Migración a usePersistedState para tokens y sesión
  const [_authTokens, _setAuthTokens] = usePersistedState<{
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }>("auth_tokens", {});

  // Usar usePersistedState para demo_user directamente
  const [demoUser, _setDemoUser] = usePersistedState<Profile | null>("demo_user", null);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const config = getAppConfig();
  const initialized = useRef(false);
  const profileLoaded = useRef(false);

  const effectiveUser = user ?? session?.user ?? null;

  // Función para cargar perfil

  const loadProfile = useCallback(async (userId: string) => {
    if (profileLoaded.current) {
      logger.info("⚠️ Perfil ya cargado, evitando recarga", { userId });
      return;
    }

    // Cache deshabilitado - cargar siempre desde Supabase

    // CRÍTICO: Verificar modo demo PRIMERO antes de cargar perfil
    const sessionFlags = StorageManager.getSessionFlags();
    if (sessionFlags.demo_authenticated && demoUser) {
      try {
        const parsedDemoUser =
          typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
        const demoProfile = {
          id: parsedDemoUser.id || "demo-user-1",
          first_name: parsedDemoUser.first_name || "Demo User",
          last_name: "",
          display_name:
            parsedDemoUser.displayName ||
            parsedDemoUser.first_name ||
            "Demo User",
          email: parsedDemoUser.email,
          role: parsedDemoUser.role || "user",
          profile_type: parsedDemoUser.accountType || "single",
          is_demo: true,
          is_verified: true,
          is_premium: false,
        };

        logger.info("🎭 Perfil demo cargado en useAuth:", {
          displayName: demoProfile.display_name,
        });
        setProfile(demoProfile);
        profileLoaded.current = true;
        return;
      } catch (error) {
        logger.error("❌ Error parseando usuario demo en loadProfile:", {
          error,
        });
      }
    }

    // Cache deshabilitado - cargar siempre desde Supabase
    // if (cachedProfile) {
    //   logger.info('✅ Perfil cargado exitosamente', { userId: cachedProfile.id });
    //   setProfile(cachedProfile);
    //   profileLoaded.current = true;
    //   return;
    // }

    try {
      logger.info("🔍 Iniciando verificación de autenticación", { userId });

      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      logger.info("🔍 Consulta ejecutada", { userId });
      logger.info("🔍 Resultado data", { data });

      if (error) {
        logger.error("❌ Error fetching profile:", error);
        // Si no se encuentra el perfil, crear uno básico
        if (error.code === "PGRST116") {
          logger.info("🆆 Perfil no encontrado - creando perfil básico");
          const basicProfile = {
            id: userId,
            user_id: userId,
            first_name: "Usuario",
            role: "user",
            is_demo: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(basicProfile);
        }
        return;
      }

      if (data) {
        // Manejar tanto array como objeto único
        const profileData = Array.isArray(data) ? data[0] : data;

        logger.info("📋 Contenido detallado del perfil", {
          isArray: Array.isArray(data),
          id: profileData?.id,
          firstName: profileData?.first_name,
          lastName: profileData?.last_name,
          displayName: profileData?.display_name,
          role: profileData?.role,
          email: profileData?.email,
          fullData: JSON.stringify(data, null, 2),
        });

        logger.info("✅ Perfil real cargado", {
          firstName: profileData?.first_name,
        });
        logger.info("📋 Datos completos del perfil", { profile: profileData });
        profileLoaded.current = true;
        setProfile(profileData);

        // PERFIL CARGADO
        logger.info("🔍 Perfil cargado", { id: profileData?.id });

        // Actualizar usuario en Datadog RUM
        try {
          setDatadogUser(
            profileData?.id || userId,
            profileData?.email,
            profileData?.display_name ||
              profileData?.first_name,
          );
        } catch (error) {
          logger.error("❌ Error actualizando usuario en Datadog RUM:", {
            error,
          });
        }
      } else {
        logger.info("⚠️ No se encontró perfil para el usuario", { userId });
        setProfile(null);
      }
    } catch (error) {
      logger.error("❌ Error in loadProfile", {
        error: error instanceof Error ? error.message : String(error),
      });
      setProfile(null);
    }
  }, [demoUser?.id]);

  useEffect(() => {
    if (initialized.current) return () => {};
    initialized.current = true;

    logger.info("🔗 Configuración de app detectada", { mode: config.mode });

    // CRÍTICO: Verificar sesión demo PRIMERO y cargar perfil inmediatamente
    const sessionFlags = StorageManager.getSessionFlags();

    if (sessionFlags.demo_authenticated && demoUser) {
      logger.info("🎭 Usuario demo detectado", { demoUser });
      // Reset profileLoaded para permitir carga
      profileLoaded.current = false;

      // CARGAR PERFIL DEMO INMEDIATAMENTE para evitar user: false
      try {
        const parsedDemoUser =
          typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
        const mockUser: User = {
          id: parsedDemoUser.id || "demo-user-1",
          email: parsedDemoUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          aud: 'authenticated',
        };

        setUser(mockUser);
        setLoading(false);

        // Cargar perfil demo
        loadProfile(mockUser.id);

        logger.info("✅ Usuario demo inicializado:", { email: mockUser.email });
      } catch (error) {
        logger.error("❌ Error inicializando usuario demo:", { error });
        setLoading(false);
      }
      return () => {};
    }

    // Solo configurar Supabase si debemos usar conexión real
    if (shouldUseRealSupabase()) {
      logger.info("🔗 Configurando autenticación Supabase real...");

      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        setLoading(false);
        return;
      }

      // Obtener sesión actual de Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        }
        setLoading(false);
      });

      // DESHABILITAR onAuthStateChange para prevenir logout automático
      logger.info(
        "🚫 onAuthStateChange DESHABILITADO para prevenir auto-logout",
      );

      // Solo mantener la sesión inicial, sin escuchar cambios
      const subscription = { unsubscribe: () => {} };

      return () => subscription.unsubscribe();
    } else {
      logger.info("🎭 Modo demo - Supabase deshabilitado");
      setLoading(false);
      return () => {};
    }
  }, []);

  const signOut = async () => {
    try {
      logger.info("🚪 Cerrando sesión...");

      // Verificar si es sesión demo usando StorageManager
      const sessionFlags = StorageManager.getSessionFlags();

      if (sessionFlags.demo_authenticated) {
        // Limpiar sesión demo
        clearDemoAuth();
        logger.info("✅ Sesión demo cerrada");
      } else {
        // Cerrar sesión real de Supabase
        logger.info("🔗 Cerrando sesión real de Supabase...");
        if (!supabase) {
          logger.error("❌ Supabase no está disponible");
          return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("❌ Error during sign out:", { error: error.message });
        } else {
          logger.info("✅ Sesión real cerrada");
        }
      }

      // Limpiar estado local
      setUser(null);
      setSession(null);
      setProfile(null);

      // Limpiar usuario en Datadog RUM
      try {
        clearDatadogUser();
      } catch (error) {
        logger.error("❌ Error limpiando usuario en Datadog RUM:", {
          error,
        });
      }
    } catch (error) {
      logger.error("❌ Error en signOut", { error });
    }
  };

  const signIn = async (
    email: string,
    password: string,
    accountType: string = "single",
  ) => {
    try {
      setLoading(true);
      logger.info("🔐 Intentando iniciar sesión", { email, mode: config.mode });

      // Verificar si es credencial de producción (complicesconectasw@outlook.es)
      if (isProductionAdmin(email)) {
        logger.info(
          "🏢 Credencial de producción detectada - limpiando demo y usando Supabase real",
        );

        // IMPORTANTE: Limpiar cualquier sesión demo antes de autenticar producción
        clearDemoAuth();

        if (!supabase) {
          logger.error("❌ Supabase no está disponible");
          setLoading(false);
          throw new Error("Supabase no está disponible");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await loadProfile(data.user.id);
          logger.info("✅ Sesión de producción iniciada", { email });
        }

        return data;
      }

      // Verificar si es una credencial demo
      if (DEMO_CREDENTIALS.includes(email)) {
        logger.info("🎭 Credencial demo detectada");
        const demoPassword = getDemoPassword(email);

        if (password !== demoPassword) {
          throw new Error("Contraseña incorrecta para usuario demo");
        }

        // Manejar autenticación demo
        const demoAuth = handleDemoAuth(email, accountType);
        if (demoAuth) {
          // CRÍTICO: Persistir demo_user antes de loadProfile para que loadProfile entre en la rama demo
          const mockUser: User = {
            ...(demoAuth.user as object),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            aud: 'authenticated',
          } as User;

          const mockSession: Session = {
            ...(demoAuth.session as object),
            user: mockUser,
            expires_in: 3600,
            token_type: 'bearer',
            refresh_token: 'demo-refresh-token',
          } as Session;

          _setDemoUser(mockUser as unknown as Profile);
          setUser(mockUser);
          setSession(mockSession);
          await loadProfile(demoAuth.user.id);
          logger.info("✅ Sesión demo iniciada", { email });
          return { user: demoAuth.user, session: demoAuth.session };
        }
      }

      // Intentar con Supabase para usuarios reales (siempre en producción)
      logger.info("🔗 Intentando autenticación real con Supabase", { email });

      // Limpiar cualquier sesión demo antes de autenticar
      clearDemoAuth();

      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        setLoading(false);
        throw new Error("Supabase no está disponible");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("❌ Error de autenticación Supabase", {
          error: error.message,
        });
        throw error;
      }

      if (data.user) {
        logger.info("✅ Usuario autenticado con Supabase", {
          email: data.user.email,
        });
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user.id);
        logger.info("✅ Sesión real iniciada", { email });
      }

      return data;
    } catch (error) {
      logger.error("❌ Error signing in", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si está autenticado
  const isAuthenticated = () => {
    // Verificar sesión demo usando StorageManager
    const sessionFlags = StorageManager.getSessionFlags();

    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser =
        typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
      logger.info("🎭 Demo admin check:", {
        email: parsedDemoUser?.email,
        accountType: parsedDemoUser?.accountType,
        role: parsedDemoUser?.role,
        isDemoAdmin:
          parsedDemoUser?.email === "complicesconectasw@outlook.es" &&
          parsedDemoUser?.role === "admin",
      });
      return true;
    }

    // Verificar sesión real
    return Boolean(effectiveUser) || Boolean(session);
  };

  const getProfileType = () => {
    if (demoUser) {
      const parsedDemoUser =
        typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
      return parsedDemoUser?.accountType || "single";
    }
    return profile?.profile_type || "single";
  };

  // Función para verificar si un usuario es administrador
  const isAdmin = () => {
    // Demo admin check usando demoUser directo
    const sessionFlags = StorageManager.getSessionFlags();

    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser =
        typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
      const isDemoAdmin =
        parsedDemoUser.accountType === "admin" ||
        parsedDemoUser.role === "admin";

      logger.info("🎭 Demo admin check:", {
        email: parsedDemoUser.email,
        accountType: parsedDemoUser.accountType,
        role: parsedDemoUser.role,
        isDemoAdmin,
      });

      return isDemoAdmin;
    }

    // CRÍTICO: Verificar admin basado en EMAIL DE AUTENTICACIÓN, no perfil
    const userEmail = user?.email?.toLowerCase();

    // Lista de emails admin - INCLUIR djwacko28@gmail.com
    const adminEmails = [
      "admin", // Admin demo solamente
      "complicesconectasw@outlook.es", // Admin principal
      "djwacko28@gmail.com", // Admin secundario
    ];

    // PRIORIDAD: Email de autenticación determina admin status
    const isAdminByEmail = userEmail && adminEmails.includes(userEmail);

    // SECUNDARIO: Role del perfil (solo si email no es admin)
    const profileRole = profile?.role;
    const isAdminByRole = !isAdminByEmail && profileRole === "admin";

    const isAdminReal = isAdminByEmail || isAdminByRole;

    if (userEmail) {
      logger.info("🔐 Admin real check:", {
        authEmail: userEmail,
        profileEmail: profile?.email,
        profileRole,
        isAdminByEmail,
        isAdminByRole,
        finalResult: isAdminReal,
      });
    }

    return isAdminReal;
  };

  const isDemo = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    const isDemoActive = sessionFlags.demo_authenticated && demoUser;

    // Solo log una vez por sesión para evitar spam
    if (isDemoActive && !(window as any).__demoLoggedOnce) {
      const parsedDemoUser =
        typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
      logger.info("🎭 Demo mode active", {
        email: parsedDemoUser?.email,
        role: parsedDemoUser?.role,
      });
      (window as any).__demoLoggedOnce = true;
    }
    return isDemoActive;
  };

  const shouldUseProductionAdmin = () => {
    const sessionFlags = StorageManager.getSessionFlags();

    // Si es demo admin, usar panel de producción
    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser =
        typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
      return (
        parsedDemoUser.accountType === "admin" ||
        parsedDemoUser.role === "admin"
      );
    }

    // Si es admin real, usar panel de producción
    const userEmail = user?.email?.toLowerCase();
    const isRealAdmin = userEmail === "complicesconectasw@outlook.es";

    logger.info("🏭 shouldUseProductionAdmin check", {
      userEmail,
      isRealAdmin,
      demoAuth: sessionFlags.demo_authenticated,
    });

    return isRealAdmin;
  };

  const isDemoMode = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    return sessionFlags.demo_authenticated;
  };

  const shouldUseRealSupabase = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    return !sessionFlags.demo_authenticated;
  };

  return {
    user: effectiveUser,
    session,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin,
    isDemo,
    isAuthenticated,
    getProfileType,
    loadProfile,
    shouldUseProductionAdmin,
    isDemoMode,
    shouldUseRealSupabase,
    appMode: "production" as const,
  };
};
