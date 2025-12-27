// âœ… AUTO-FIX aplicado por AuditorÃ­a ComplicesConecta v2.1.2
// Fecha: 2025-01-06

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  getAppConfig, 
  DEMO_CREDENTIALS, 
  getDemoPassword, 
  handleDemoAuth, 
  clearDemoAuth, 
  isProductionAdmin
} from '@/lib/app-config';
import { StorageManager } from '@/lib/storage-manager';
import { logger } from '@/lib/logger';
import { usePersistedState } from '@/hooks/usePersistedState';
import { setDatadogUser, clearDatadogUser } from '@/config/datadog-rum.config';

interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  age?: number | null;
  role?: string;
  email?: string | null;
  profile_type?: string | null;
  is_demo?: boolean | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  [key: string]: unknown;
}

interface _AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
}

export const useAuth = () => {
  // MigraciÃ³n a usePersistedState para tokens y sesiÃ³n
  const [_authTokens, _setAuthTokens] = usePersistedState<{
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }>('auth_tokens', {});
  
  // Usar usePersistedState para demo_user directamente
  const [demoUser, _setDemoUser] = usePersistedState<any>('demo_user', null);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const config = getAppConfig();
  const initialized = useRef(false);
  const profileLoaded = useRef(false);

  // FunciÃ³n para cargar perfil
  
  const loadProfile = useCallback(async (userId: string) => {
    if (profileLoaded.current) {
      logger.info('âš ï¸ Perfil ya cargado, evitando recarga', { userId });
      return;
    }
    
    // Cache deshabilitado - cargar siempre desde Supabase
    
    // CRÃTICO: Verificar modo demo PRIMERO antes de cargar perfil
    const sessionFlags = StorageManager.getSessionFlags();
    if (sessionFlags.demo_authenticated && demoUser) {
      try {
        const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
        const demoProfile = {
          id: parsedDemoUser.id || 'demo-user-1',
          first_name: parsedDemoUser.first_name || 'Demo User',
          last_name: '',
          display_name: parsedDemoUser.displayName || parsedDemoUser.first_name || 'Demo User',
          email: parsedDemoUser.email,
          role: parsedDemoUser.role || 'user',
          profile_type: parsedDemoUser.accountType || 'single',
          is_demo: true,
          is_verified: true,
          is_premium: false
        };
        
        logger.info('ðŸŽ­ Perfil demo cargado en useAuth:', { displayName: demoProfile.display_name });
        setProfile(demoProfile);
        profileLoaded.current = true;
        return;
      } catch (error) {
        logger.error('âŒ Error parseando usuario demo en loadProfile:', { error });
      }
    }
    
    // Cache deshabilitado - cargar siempre desde Supabase
    // if (cachedProfile) {
    //   logger.info('âœ… Perfil cargado exitosamente', { userId: cachedProfile.id });
    //   setProfile(cachedProfile);
    //   profileLoaded.current = true;
    //   return;
    // }
    
    try {
      logger.info('ðŸ” Iniciando verificaciÃ³n de autenticaciÃ³n', { userId });
      
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      logger.info('ðŸ” Consulta ejecutada', { userId });
      logger.info('ðŸ” Resultado data', { data });
      logger.info('ðŸ” Error (si existe)', error ? { error: error.message } : undefined);
      
      if (error) {
        logger.error('âŒ Error fetching profile:', error);
        // Si no se encuentra el perfil, crear uno bÃ¡sico
        if (error.code === 'PGRST116') {
          logger.info('ðŸ†† Perfil no encontrado - creando perfil bÃ¡sico');
          const basicProfile = {
            id: userId,
            user_id: userId,
            first_name: 'Usuario',
            role: 'user',
            is_demo: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(basicProfile);
        }
        return;
      }
      
      if (data) {
        // Manejar tanto array como objeto Ãºnico
        const profileData = Array.isArray(data) ? data[0] : data;
        
        logger.info('ðŸ“‹ Contenido detallado del perfil', {
          isArray: Array.isArray(data),
          id: (profileData as any)?.id,
          firstName: (profileData as any)?.first_name,
          lastName: (profileData as any)?.last_name,
          displayName: (profileData as any)?.display_name,
          role: (profileData as any)?.role,
          email: (profileData as any)?.email,
          fullData: JSON.stringify(data, null, 2)
        });
        
        logger.info('âœ… Perfil real cargado', { firstName: (profileData as any)?.first_name });
        logger.info('ðŸ“‹ Datos completos del perfil', { profile: profileData });
        profileLoaded.current = true;
        setProfile(profileData);
        
        // PERFIL CARGADO
        logger.info('ðŸ” Perfil cargado', { id: (profileData as any)?.id });
        
        // Actualizar usuario en Datadog RUM
        try {
          setDatadogUser(
            (profileData as any)?.id || userId,
            (profileData as any)?.email,
            (profileData as any)?.display_name || (profileData as any)?.first_name
          );
        } catch {
          // Silenciar errores de Datadog en desarrollo
        }
      } else {
        logger.info('âš ï¸ No se encontrÃ³ perfil para el usuario', { userId });
        setProfile(null);
      }
    } catch (error) {
      logger.error('âŒ Error in loadProfile', { error: error instanceof Error ? error.message : String(error) });
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    logger.info('ðŸ”— ConfiguraciÃ³n de app detectada', { mode: config.mode });
    
    // CRÃTICO: Verificar sesiÃ³n demo PRIMERO y cargar perfil inmediatamente
    const sessionFlags = StorageManager.getSessionFlags();
    
    if (sessionFlags.demo_authenticated && demoUser) {
      logger.info('ðŸŽ­ Usuario demo detectado', { demoUser });
      // Reset profileLoaded para permitir carga
      profileLoaded.current = false;
      
      // CARGAR PERFIL DEMO INMEDIATAMENTE para evitar user: false
      try {
        const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
        const mockUser = {
          id: parsedDemoUser.id || 'demo-user-1',
          email: parsedDemoUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {}
        };
        
        setUser(mockUser as any);
        setLoading(false);
        
        // Cargar perfil demo
        loadProfile(mockUser.id);
        
        logger.info('âœ… Usuario demo inicializado:', { email: mockUser.email });
      } catch (error) {
        logger.error('âŒ Error inicializando usuario demo:', { error });
        setLoading(false);
      }
      return;
    }
    
    // Solo configurar Supabase si debemos usar conexiÃ³n real
    if (shouldUseRealSupabase()) {
      logger.info('ðŸ”— Configurando autenticaciÃ³n Supabase real...');
      
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible');
        setLoading(false);
        return;
      }
      
      // Obtener sesiÃ³n actual de Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        }
        setLoading(false);
      });
      
      // DESHABILITAR onAuthStateChange para prevenir logout automÃ¡tico
      logger.info('ðŸš« onAuthStateChange DESHABILITADO para prevenir auto-logout');
      
      // Solo mantener la sesiÃ³n inicial, sin escuchar cambios
      const subscription = { unsubscribe: () => {} };
      
      return () => subscription.unsubscribe();
    } else {
      logger.info('ðŸŽ­ Modo demo - Supabase deshabilitado');
      setLoading(false);
    }
  }, [loadProfile]);


  const signOut = async () => {
    try {
      logger.info('ðŸšª Cerrando sesiÃ³n...');
      
      // Verificar si es sesiÃ³n demo usando StorageManager
      const sessionFlags = StorageManager.getSessionFlags();
      
      if (sessionFlags.demo_authenticated) {
        // Limpiar sesiÃ³n demo
        clearDemoAuth();
        logger.info('âœ… SesiÃ³n demo cerrada');
      } else {
        // Cerrar sesiÃ³n real de Supabase
        logger.info('ðŸ”— Cerrando sesiÃ³n real de Supabase...');
        if (!supabase) {
          logger.error('âŒ Supabase no estÃ¡ disponible');
          return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.info('ðŸ” Estado de carga de perfil', { loading });
        } else {
          logger.info('âœ… SesiÃ³n real cerrada');
        }
      }
      
      // Limpiar estado local
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Limpiar usuario en Datadog RUM
      try {
        clearDatadogUser();
      } catch {
        // Silenciar errores de Datadog
      }
    } catch (error) {
      logger.error('âŒ Error en signOut', { error });
    }
  };

  const signIn = async (email: string, password: string, accountType: string = 'single') => {
    try {
      setLoading(true);
      logger.info('ðŸ” Intentando iniciar sesiÃ³n', { email, mode: config.mode });
      
      // Verificar si es credencial de producciÃ³n (complicesconectasw@outlook.es)
      if (isProductionAdmin(email)) {
        logger.info('ðŸ¢ Credencial de producciÃ³n detectada - limpiando demo y usando Supabase real');
        
        // IMPORTANTE: Limpiar cualquier sesiÃ³n demo antes de autenticar producciÃ³n
        clearDemoAuth();
        
        if (!supabase) {
          logger.error('âŒ Supabase no estÃ¡ disponible');
          setLoading(false);
          throw new Error('Supabase no estÃ¡ disponible');
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
          logger.info('âœ… SesiÃ³n de producciÃ³n iniciada', { email });
        }
        
        return data;
      }
      
      // Verificar si es una credencial demo
      if (DEMO_CREDENTIALS.includes(email)) {
        logger.info('ðŸŽ­ Credencial demo detectada');
        const demoPassword = getDemoPassword(email);
        
        if (password !== demoPassword) {
          throw new Error('ContraseÃ±a incorrecta para usuario demo');
        }
        
        // Manejar autenticaciÃ³n demo
        const demoAuth = handleDemoAuth(email, accountType);
        if (demoAuth) {
          setUser(demoAuth.user as any);
          setSession(demoAuth.session as any);
          await loadProfile(demoAuth.user.id);
          logger.info('âœ… SesiÃ³n demo iniciada', { email });
          return { user: demoAuth.user, session: demoAuth.session };
        }
      }
      
      // Intentar con Supabase para usuarios reales (siempre en producciÃ³n)
      logger.info('ðŸ”— Intentando autenticaciÃ³n real con Supabase', { email });
      
      // Limpiar cualquier sesiÃ³n demo antes de autenticar
      clearDemoAuth();
      
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible');
        setLoading(false);
        throw new Error('Supabase no estÃ¡ disponible');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('âŒ Error de autenticaciÃ³n Supabase', { error: error.message });
        throw error;
      }
      
      if (data.user) {
        logger.info('âœ… Usuario autenticado con Supabase', { email: data.user.email });
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user.id);
        logger.info('âœ… SesiÃ³n real iniciada', { email });
      }
      
      return data;
    } catch (error) {
      logger.error('âŒ Error signing in', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // FunciÃ³n para verificar si estÃ¡ autenticado
  const isAuthenticated = () => {
    // Verificar sesiÃ³n demo usando StorageManager
    const sessionFlags = StorageManager.getSessionFlags();
    
    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
      logger.info('ðŸŽ­ Demo admin check:', {
        email: parsedDemoUser?.email,
        accountType: parsedDemoUser?.accountType,
        role: parsedDemoUser?.role,
        isDemoAdmin: parsedDemoUser?.email === 'complicesconectasw@outlook.es' && parsedDemoUser?.role === 'admin'
      });
      return true;
    }
    
    // Verificar sesiÃ³n real
    return !!(user && session);
  };

  const getProfileType = () => {
    if (demoUser) {
      const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
      return parsedDemoUser?.accountType || 'single';
    }
    return profile?.profile_type || 'single';
  };

  // FunciÃ³n para verificar si un usuario es administrador
  const isAdmin = () => {
    // Demo admin check usando demoUser directo
    const sessionFlags = StorageManager.getSessionFlags();
    
    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
      const isDemoAdmin = parsedDemoUser.accountType === 'admin' || parsedDemoUser.role === 'admin';
      
      logger.info('ðŸŽ­ Demo admin check:', {
        email: parsedDemoUser.email,
        accountType: parsedDemoUser.accountType,
        role: parsedDemoUser.role,
        isDemoAdmin
      });
      
      return isDemoAdmin;
    }
    
    // CRÃTICO: Verificar admin basado en EMAIL DE AUTENTICACIÃ“N, no perfil
    const userEmail = user?.email?.toLowerCase();
    
    // Lista de emails admin - INCLUIR djwacko28@gmail.com
    const adminEmails = [
      'admin',                      // Admin demo solamente
      'complicesconectasw@outlook.es',  // Admin principal
      'djwacko28@gmail.com'        // Admin secundario
    ];
    
    // PRIORIDAD: Email de autenticaciÃ³n determina admin status
    const isAdminByEmail = userEmail && adminEmails.includes(userEmail);
    
    // SECUNDARIO: Role del perfil (solo si email no es admin)
    const profileRole = profile?.role;
    const isAdminByRole = !isAdminByEmail && profileRole === 'admin';
    
    const isAdminReal = isAdminByEmail || isAdminByRole;
    
    if (userEmail) {
      logger.info('ðŸ” Admin real check:', {
        authEmail: userEmail,
        profileEmail: profile?.email,
        profileRole,
        isAdminByEmail,
        isAdminByRole,
        finalResult: isAdminReal
      });
    }
    
    return isAdminReal;
  };

  const isDemo = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    const isDemoActive = sessionFlags.demo_authenticated && demoUser;
    
    // Solo log una vez por sesiÃ³n para evitar spam
    if (isDemoActive && !(window as any).__demoLoggedOnce) {
      const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
      logger.info('ðŸŽ­ Demo mode active', { email: parsedDemoUser?.email, role: parsedDemoUser?.role });
      (window as any).__demoLoggedOnce = true;
    }
    return isDemoActive;
  };

  const shouldUseProductionAdmin = () => {
    const sessionFlags = StorageManager.getSessionFlags();
    
    // Si es demo admin, usar panel de producciÃ³n
    if (sessionFlags.demo_authenticated && demoUser) {
      const parsedDemoUser = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
      return parsedDemoUser.accountType === 'admin' || parsedDemoUser.role === 'admin';
    }
    
    // Si es admin real, usar panel de producciÃ³n
    const userEmail = user?.email?.toLowerCase();
    const isRealAdmin = userEmail === 'complicesconectasw@outlook.es';
    
    logger.info('ðŸ­ shouldUseProductionAdmin check', {
      userEmail,
      isRealAdmin,
      demoAuth: sessionFlags.demo_authenticated
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
    user,
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
    appMode: 'production' as const
  };
};
