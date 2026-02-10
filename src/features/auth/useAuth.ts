
// ✅ AUTO-FIX aplicado por Auditoría ComplicesConecta v2.1.2
// Fecha: 2025-01-06

import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAppConfig, DEMO_CREDENTIALS, getDemoPassword, handleDemoAuth, clearDemoAuth, isProductionAdmin } from "@/lib/app-config";
import { StorageManager } from "@/lib/storage-manager";
import { logger } from "@/lib/logger";
import { usePersistedState } from "@/hooks/usePersistedState";
import { setDatadogUser } from "@/config/datadog-rum.config";
import { Profile } from "@/types/supabase-custom";
import type { DatadogRUM } from "@/types/datadog";



// Interfaces para tipos extendidos
interface WindowWithDemoFlags extends Window {
  __demoLoggedOnce?: boolean;
}

// Función segura para parsear demoUser con validación
function safeParseDemoUser<T>(data: T): Profile | null {
  if (!data) return null;
  
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Validar estructura mínima
    if (!parsed || typeof parsed !== 'object') return null;
    
    const required = ['id', 'email'];
    for (const field of required) {
      if (!(field in parsed)) return null;
    }
    
    return parsed as Profile;
  } catch (error) {
    logger.error("❌ Error parseando demoUser:", { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

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

    // CRÍTICO: Verificar modo demo PRIMERO antes de cargar perfil
    const sessionFlags = StorageManager.getSessionFlags();
    const currentDemoUser = demoUser; // Capturar valor actual en lugar de depender de él

    if (sessionFlags.demo_authenticated && currentDemoUser) {
      const parsedDemoUser = safeParseDemoUser(currentDemoUser); // VALIDADO
      
      if (!parsedDemoUser) {
        logger.error("❌ demoUser corrupto o inválido");
        // Recuperación automática: limpiar sesión demo corrupta
        clearDemoAuth();
        _setDemoUser(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        profileLoaded.current = false;
        return;
      }
      
      const demoProfile = {
          id: parsedDemoUser.id || "demo-user-1",
          first_name: parsedDemoUser.first_name || "Demo User",
          last_name: "",
          display_name:
            (parsedDemoUser.displayName ||
            parsedDemoUser.first_name ||
            "Demo User") as string,
          email: (parsedDemoUser.email || "") as string | null,
          role: parsedDemoUser.role || "user",
          profile_type: (parsedDemoUser.accountType || "single") as string,
          is_demo: true,
          is_verified: true,
          is_premium: false,
        };

        logger.info("🎭 Perfil demo cargado en useAuth:", {
          displayName: demoProfile.display_name,
          email: demoProfile.email,
          role: demoProfile.role,
          accountType: demoProfile.profile_type,
        });
        setProfile(demoProfile);
        profileLoaded.current = true;
        return;
    }

    // Cache deshabilitado - cargar siempre desde Supabase
    // if (cachedProfile) {
    //   logger.info('✅ Perfil cargado exitosamente', { userId: cachedProfile.id });
    //   setProfile(cachedProfile);
    //   profileLoaded.current = true;
    //   return;
    // }

    // CRÍTICO: NO intentar cargar desde Supabase si es usuario demo
    // Ya verificado arriba, pero doble verificación por seguridad
    if (sessionFlags.demo_authenticated) {
      logger.info("🎭 Usuario demo - evitando carga desde Supabase", { userId });
      return;
    }

    // CRÍTICO: Verificar si el userId es un UUID demo generado
    // Los UUIDs demo tienen formato específico que no existen en Supabase
    // Verificar si el userId está en la lista de usuarios demo conocidos
    const demoUUIDs = [
      "0830e194-17e3-417e-a300-00017e3eb04f", // djwacko28@gmail.com
      // Agregar más UUIDs demo según sea necesario
    ];
    const isDemoUUID = userId.startsWith("demo-") ||
                      userId.includes("demo") ||
                      demoUUIDs.includes(userId);
    if (isDemoUUID) {
      logger.info("🎭 UUID demo detectado - evitando carga desde Supabase", { userId });
      return;
    }

    try {
      logger.info("🔍 Iniciando verificación de autenticación", { userId });

      if (!supabase) {
        logger.error("❌ Supabase no está disponible");
        return;
      }

      // Usar raw SQL para consultar la vista unificada (vw_profiles_unified no está en tipos generados)
      const { data, error } = await supabase.rpc('get_profile_by_user_id', {
        p_user_id: userId
      });

      // Fallback: si no existe la función RPC, usar consulta directa
      if (error && error.message?.includes('function get_profile_by_user_id')) {
        logger.warn("RPC get_profile_by_user_id no existe, usando consulta directa a profiles");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (fallbackError) {
          logger.error("❌ Error en fallback query:", { error: fallbackError.message });
          setProfile(null);
          return;
        }

        data = fallbackData;
        error = fallbackError;
      } else if (error) {
        logger.error("❌ Error en RPC get_profile_by_user_id:", { error: error.message });
        setProfile(null);
        return;
      }

      logger.info("🔍 Consulta ejecutada", { userId });
      logger.info("🔍 Resultado data", { count: Array.isArray(data) ? data.length : 1 });

      if (error) {
        logger.error("❌ Error fetching profile:", { error: error.message, details: error.details });
        if (error.code === "PGRST116") {
          setProfile(null);
        }
        return;
      }

      if (data) {
        // Manejar tanto array como objeto único
        const profileData = Array.isArray(data) ? data[0] : data;

        // CORRECCIÓN: Validar campos requeridos
        if (!profileData || (Array.isArray(data) && data.length === 0)) {
          logger.info("🔍 Perfil no encontrado o vacío", { userId });
          setProfile(null);
          return;
        }

        // Validar campos requeridos
        const requiredFields = ['id', 'first_name', 'email'];
        for (const field of requiredFields) {
          if (!(field in profileData)) {
            logger.error(`❌ Campo requerido faltante: ${field}`, { profileData });
            setProfile(null);
            return;
          }
        }

        logger.info("📋 Contenido detallado del perfil", {
          id: profileData?.id,
          firstName: profileData?.first_name,
          email: profileData?.email,
        });
        let resolvedRole = profileData?.role;
        try {
          const { data: isAdminRpc, error: adminError } = await supabase.rpc("is_admin");
          if (adminError) {
            logger.error("❌ Error verificando admin en loadProfile:", {
              error: adminError.message,
            });
          } else if (isAdminRpc === true) {
            resolvedRole = "admin";
          }
        } catch (error) {
          logger.error("❌ Error inesperado al verificar admin:", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        const resolvedProfile = {
          ...profileData,
          role: resolvedRole,
        };

        logger.info("✅ Perfil real cargado", {
          firstName: resolvedProfile?.first_name,
          role: resolvedProfile?.role,
        });
        profileLoaded.current = true;
        setProfile(resolvedProfile);

        // Actualizar usuario en Datadog RUM
        try {
          setDatadogUser(
            resolvedProfile?.id || userId,
            resolvedProfile?.email,
            resolvedProfile?.display_name ||
              resolvedProfile?.first_name,
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
  }, [demoUser, supabase]); // Agregar dependencias correctas

  // Función auxiliar para determinar si usar Supabase real
  const shouldUseRealSupabase = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    return !sessionFlags.demo_authenticated;
  };

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
      (async () => {
        try {
          const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
          
          if (!parsedDemoUser) {
            logger.error("❌ demoUser corrupto o inválido en init");
            // Recuperación automática: limpiar sesión demo corrupta
            clearDemoAuth();
            _setDemoUser(null);
            setUser(null);
            setSession(null);
            setProfile(null);
            profileLoaded.current = false;
            setLoading(false);
            return;
          }
          
          const mockUser: User = {
            id: parsedDemoUser.id || "demo-user-1",
            email: parsedDemoUser.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            aud: 'authenticated',
          };

          setUser(mockUser);
          await loadProfile(mockUser.id); // Esperar carga completa
          setLoading(false); // Solo después de que profile esté cargado

          logger.info("✅ Usuario demo inicializado:", { email: mockUser.email });
        } catch (error) {
          logger.error("❌ Error inicializando usuario demo:", { error });
          setLoading(false);
        }
      })();
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
      // CORRECCIÓN: Esperar carga completa de sesión y perfil
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadProfile(session.user.id); // Esperar carga completa
          }
          
          setLoading(false); // Solo después de que profile esté cargado
        } catch (error) {
          logger.error("❌ Error cargando sesión:", { error });
          setLoading(false);
        }
      })();

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
      logger.info("🚪 Iniciando cierre de sesión seguro");

      // Verificar si es sesión demo
      const sessionFlags = StorageManager.getSessionFlags();

      if (sessionFlags.demo_authenticated) {
        // Cerrar sesión demo
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

      // CORRECCIÓN: Esperar limpieza completa antes de redirigir
      try {
        // Limpieza de seguridad completa
        const cleanupPromises = [];

        // Limpiar datos seguros
        cleanupPromises.push(
          (async () => {
            try {
              const { SecurityHelpers } = await import("@/integrations/supabase/security-helpers");
              SecurityHelpers.clearAllSecureData();
              logger.info("🧹 Limpieza de seguridad completada");
            } catch (error) {
              logger.error("❌ Error en limpieza de seguridad:", {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          })()
        );

        // Limpiar usuario en Datadog RUM
        cleanupPromises.push(
          (async () => {
            try {
              const ddRum = window.DD_RUM as DatadogRUM | undefined;
              if (typeof window !== 'undefined' && ddRum) {
                ddRum.clearUser();
              }
            } catch (error) {
              logger.error("❌ Error limpiando usuario en Datadog RUM:", {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          })()
        );

        // Esperar todas las promesas de limpieza
        await Promise.all(cleanupPromises);

        // Redirigir solo después de limpieza completa
        window.location.href = "/";
      } catch (error) {
        logger.error("❌ Error en signOut", {
          error: error instanceof Error ? error.message : String(error),
        });
        // CORRECCIÓN: Forzar limpieza incluso con error
        try {
          const { SecurityHelpers } = await import("@/integrations/supabase/security-helpers");
          SecurityHelpers.clearAllSecureData();
        } catch (cleanupError) {
          logger.error("❌ Error en limpieza forzada:", {
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }
        // Redirigir incluso si hay error
        window.location.href = "/";
      }
    } catch (error) {
      logger.error("❌ Error en signOut", {
        error: error instanceof Error ? error.message : String(error),
      });
      // CORRECCIÓN: Forzar limpieza incluso con error
      try {
        const { SecurityHelpers } = await import("@/integrations/supabase/security-helpers");
        SecurityHelpers.clearAllSecureData();
      } catch (cleanupError) {
        logger.error("❌ Error en limpieza forzada:", {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }
      // Redirigir incluso si hay error
      window.location.href = "/";
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

      // EN MODO DEMO: Permitir cualquier correo como demo
      if (config.mode === "demo") {
        logger.info("🎭 Modo demo detectado - permitiendo cualquier correo");

        // Verificar si es una credencial demo específica (para contraseña correcta)
        if (DEMO_CREDENTIALS.includes(email)) {
          const demoPassword = getDemoPassword(email);

          if (demoPassword && password !== demoPassword) {
            logger.error("🚫 Contraseña incorrecta para usuario demo - acceso denegado");
            throw new Error("Contraseña incorrecta para usuario demo");
          }
        } else {
          // Para cualquier otro correo en modo demo, aceptar cualquier contraseña
          logger.info("🎭 Correo genérico en modo demo - aceptando cualquier contraseña");
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

          const demoProfileData: Profile = {
            id: demoAuth.user.id,
            first_name: demoAuth.user.first_name || "Demo",
            last_name: "",
            name: demoAuth.user.first_name || "Demo",
            age: 25,
            bio: null,
            gender: "female",
            interested_in: "men",
            is_premium: false,
            is_verified: true,
            relationship_type: demoAuth.user.accountType || "single",
            profile_type: demoAuth.user.accountType || "single",
            role: demoAuth.user.role || "user",
            display_name: demoAuth.user.first_name || "Demo User",
            avatar_url: null,
            email: demoAuth.user.email || "",
            location: null,
            is_online: false,
            privateImages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: demoAuth.user.id,
            latitude: null,
            longitude: null,
            share_location: false,
          };

          _setDemoUser(demoProfileData); // Sin cast inseguro
          setUser(mockUser);
          setSession(mockSession);
          await loadProfile(demoAuth.user.id);
          logger.info("✅ Sesión demo iniciada", { email });
          return { user: demoAuth.user, session: demoAuth.session };
        }
      }

      // Verificar si es credencial de producción (admin)
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

      // Usuario real (no demo, no admin especial) - intentar autenticación con Supabase
      logger.info("🔗 Usuario real detectado - intentando autenticación con Supabase", { email });

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

    if (sessionFlags.demo_authenticated) {
      return true;
    }

    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
      
      if (!parsedDemoUser) {
        return false;
      }
      
      logger.info("🎭 Demo authenticated check:", {
        email: parsedDemoUser.email,
        accountType: parsedDemoUser.accountType,
        role: parsedDemoUser.role,
        isAdmin: parsedDemoUser.accountType === "admin" ||
                parsedDemoUser.role === "admin",
      });
      return true;
    }

    // Verificar sesión real
    return Boolean(effectiveUser) || Boolean(session);
  };

  const getProfileType = () => {
    if (demoUser) {
      const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
      return parsedDemoUser?.accountType || "single";
    }
    return profile?.profile_type || "single";
  };

  // Función para verificar si un usuario es administrador
  const isAdmin = () => {
    // Demo admin check usando demoUser directo
    const sessionFlags = StorageManager.getSessionFlags();

    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
      
      if (!parsedDemoUser) {
        return false;
      }
      
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

    // PRIORIDAD: Email de autenticación determina admin status (admins de producción vienen de ENV)
    const isAdminByEmail = Boolean(userEmail && isProductionAdmin(userEmail));

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
    if (isDemoActive && !(window as WindowWithDemoFlags).__demoLoggedOnce) {
      const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
      
      if (!parsedDemoUser) {
        return isDemoActive;
      }
      
      logger.info("🎭 Demo mode active", {
        email: parsedDemoUser.email,
        role: parsedDemoUser.role,
      });
      (window as WindowWithDemoFlags).__demoLoggedOnce = true;
    }
    return isDemoActive;
  };

  const shouldUseProductionAdmin = () => {
    const sessionFlags = StorageManager.getSessionFlags();

    // Si es demo admin, usar panel de producción
    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = safeParseDemoUser(demoUser); // VALIDADO
      
      if (!parsedDemoUser) {
        return false;
      }
      
      return (
        parsedDemoUser.accountType === "admin" ||
        parsedDemoUser.role === "admin"
      );
    }

    // Si es admin real, usar panel de producción
    const userEmail = user?.email?.toLowerCase();
    const isRealAdmin = userEmail === (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase();

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
