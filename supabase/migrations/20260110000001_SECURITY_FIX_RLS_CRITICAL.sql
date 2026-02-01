-- ============================================================================
-- MIGRACIÓN DE SEGURIDAD CRÍTICA - CORRECCIÓN DE POLÍTICAS RLS
-- Fecha: January 10, 2026
-- Objetivo: Corregir todas las brechas de seguridad críticas y medias
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR TABLA admin_users CON RLS ESTRICTO
-- ============================================================================

-- Crear tabla admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admin_users
-- Solo los admins pueden ver la tabla de admins
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo super_admins pueden insertar nuevos admins
DROP POLICY IF EXISTS "Super admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Super admins can insert admin_users" ON public.admin_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Solo super_admins pueden actualizar admins
DROP POLICY IF EXISTS "Super admins can update admin_users" ON public.admin_users;
CREATE POLICY "Super admins can update admin_users" ON public.admin_users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Solo super_admins pueden eliminar admins
DROP POLICY IF EXISTS "Super admins can delete admin_users" ON public.admin_users;
CREATE POLICY "Super admins can delete admin_users" ON public.admin_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Crear índice para optimización
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- ============================================================================
-- PASO 2: CORREGIR POLÍTICA RLS DE token_analytics
-- ============================================================================

-- Eliminar política insegura
DROP POLICY IF EXISTS token_analytics_read ON public.token_analytics;
DROP POLICY IF EXISTS token_analytics_insert ON public.token_analytics;

-- Crear políticas seguras
-- Solo admins pueden ver métricas de token_analytics (tabla analítica agregada)
DROP POLICY IF EXISTS "Admins can view token analytics" ON public.token_analytics;
CREATE POLICY "Admins can view token analytics" ON public.token_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden insertar
DROP POLICY IF EXISTS "Admins can insert token analytics" ON public.token_analytics;
CREATE POLICY "Admins can insert token analytics" ON public.token_analytics
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden actualizar
DROP POLICY IF EXISTS "Admins can update token analytics" ON public.token_analytics;
CREATE POLICY "Admins can update token analytics" ON public.token_analytics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 3: CORREGIR POLÍTICA RLS DE virtual_events
-- ============================================================================

-- Eliminar política insegura
DROP POLICY IF EXISTS virtual_events_read ON public.virtual_events;
DROP POLICY IF EXISTS virtual_events_insert ON public.virtual_events;

-- Crear políticas seguras
-- Creadores ven sus eventos, admins ven todos
DROP POLICY IF EXISTS "Users can view accessible virtual events" ON public.virtual_events;
CREATE POLICY "Users can view accessible virtual events" ON public.virtual_events
    FOR SELECT
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden insertar
DROP POLICY IF EXISTS "Admins can insert virtual events" ON public.virtual_events;
CREATE POLICY "Admins can insert virtual events" ON public.virtual_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo creadores y admins pueden actualizar
DROP POLICY IF EXISTS "Creators and admins can update virtual events" ON public.virtual_events;
CREATE POLICY "Creators and admins can update virtual events" ON public.virtual_events
    FOR UPDATE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 4: CORREGIR POLÍTICA RLS DE profiles
-- ============================================================================

-- Eliminar política insegura
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Crear políticas seguras
-- Usuarios ven su propio perfil, admins ven todos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 5: CREAR POLÍTICAS RLS PARA TABLAS SENSIBLES SIN POLÍTICAS
-- ============================================================================

-- 5.1 gallery_access_requests
-- Nota: gallery_access_requests se crea en migración 20260111031129
-- Solo admins pueden ver requests
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'gallery_access_requests'
    ) THEN
        DROP POLICY IF EXISTS "Admins can view gallery requests" ON public.gallery_access_requests;
        CREATE POLICY "Admins can view gallery requests" ON public.gallery_access_requests
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );

        DROP POLICY IF EXISTS "Admins can insert gallery requests" ON public.gallery_access_requests;
        CREATE POLICY "Admins can insert gallery requests" ON public.gallery_access_requests
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );

        DROP POLICY IF EXISTS "Admins can update gallery requests" ON public.gallery_access_requests;
        CREATE POLICY "Admins can update gallery requests" ON public.gallery_access_requests
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );
    END IF;
END $$;

-- 5.2 gallery_commissions
ALTER TABLE public.gallery_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view own commissions" ON public.gallery_commissions;
CREATE POLICY "Creators can view own commissions" ON public.gallery_commissions
    FOR SELECT
    USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can insert commissions" ON public.gallery_commissions;
CREATE POLICY "Admins can insert commissions" ON public.gallery_commissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can update commissions" ON public.gallery_commissions;
CREATE POLICY "Admins can update commissions" ON public.gallery_commissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- 5.3 swinger_interests
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'swinger_interests'
    ) THEN
        ALTER TABLE public.swinger_interests ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view all interests" ON public.swinger_interests;
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'swinger_interests'
              AND column_name = 'is_active'
        ) THEN
            CREATE POLICY "Users can view all interests" ON public.swinger_interests
                FOR SELECT
                USING (
                    is_active = TRUE OR EXISTS (
                        SELECT 1 FROM public.admin_users
                        WHERE user_id = auth.uid() AND is_active = TRUE
                    )
                );
        ELSE
            CREATE POLICY "Users can view all interests" ON public.swinger_interests
                FOR SELECT
                USING (
                    EXISTS (
                        SELECT 1 FROM public.admin_users
                        WHERE user_id = auth.uid() AND is_active = TRUE
                    )
                );
        END IF;

        DROP POLICY IF EXISTS "Admins can insert interests" ON public.swinger_interests;
        CREATE POLICY "Admins can insert interests" ON public.swinger_interests
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );

        DROP POLICY IF EXISTS "Admins can update interests" ON public.swinger_interests;
        CREATE POLICY "Admins can update interests" ON public.swinger_interests
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );
    END IF;
END $$;

-- 5.4 couple_profile_likes
-- Nota: couple_profile_likes se crea en migración 20260111031120
-- Solo admins pueden ver likes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'couple_profile_likes'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own likes" ON public.couple_profile_likes;
        DROP POLICY IF EXISTS "Admins can view likes" ON public.couple_profile_likes;
        CREATE POLICY "Admins can view likes" ON public.couple_profile_likes
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );

        DROP POLICY IF EXISTS "Users can insert own likes" ON public.couple_profile_likes;
        DROP POLICY IF EXISTS "Admins can insert likes" ON public.couple_profile_likes;
        CREATE POLICY "Admins can insert likes" ON public.couple_profile_likes
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );

        DROP POLICY IF EXISTS "Users can delete own likes" ON public.couple_profile_likes;
        DROP POLICY IF EXISTS "Admins can delete likes" ON public.couple_profile_likes;
        CREATE POLICY "Admins can delete likes" ON public.couple_profile_likes
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = TRUE
                )
            );
    END IF;
END $$;

-- 5.5 biometric_auth
-- Nota: biometric_auth se crea en migración 20260111031125
-- Solo admins pueden ver datos biométricos
-- Políticas creadas condicionalmente si la tabla existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'biometric_auth'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own biometric data" ON public.biometric_auth';
        EXECUTE 'CREATE POLICY "Admins can view biometric data" ON public.biometric_auth FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = TRUE))';

        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own biometric data" ON public.biometric_auth';
        EXECUTE 'CREATE POLICY "Admins can insert biometric data" ON public.biometric_auth FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = TRUE))';

        EXECUTE 'DROP POLICY IF EXISTS "Users can update own biometric data" ON public.biometric_auth';
        EXECUTE 'CREATE POLICY "Admins can update biometric data" ON public.biometric_auth FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = TRUE))';

        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own biometric data" ON public.biometric_auth';
        EXECUTE 'CREATE POLICY "Admins can delete biometric data" ON public.biometric_auth FOR DELETE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = TRUE))';
    END IF;
END $$;

-- ============================================================================
-- PASO 6: MIGRAR ADMINISTRADORES EXISTENTES A admin_users
-- ============================================================================

-- Insertar administradores existentes basados en emails conocidos
DO $$
BEGIN
  INSERT INTO public.admin_users (user_id, role, permissions, is_active)
  SELECT
      u.id,
      CASE
          WHEN u.email = 'complicesconectasw@outlook.es' THEN 'super_admin'
          WHEN u.email = 'djwacko28@gmail.com' THEN 'admin'
          ELSE 'admin'
      END,
      '{}'::jsonb,
      TRUE
  FROM auth.users u
  WHERE (
      u.email IN ('complicesconectasw@outlook.es', 'djwacko28@gmail.com') OR
      (u.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = u.id
  );
END $$;

-- ============================================================================
-- PASO 7: CREAR FUNCIÓN HELPER PARA VERIFICAR ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND is_active = TRUE
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    );
END;
$$;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de seguridad completada exitosamente';
    RAISE NOTICE '✅ Tabla admin_users creada con RLS estricto';
    RAISE NOTICE '✅ Políticas RLS corregidas para token_analytics, virtual_events, profiles';
    RAISE NOTICE '✅ Políticas RLS creadas para tablas sensibles';
    RAISE NOTICE '✅ Funciones helper is_admin() y is_super_admin() creadas';
END $$;
