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
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo super_admins pueden insertar nuevos admins
CREATE POLICY "Super admins can insert admin_users" ON public.admin_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Solo super_admins pueden actualizar admins
CREATE POLICY "Super admins can update admin_users" ON public.admin_users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Solo super_admins pueden eliminar admins
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
-- Usuarios solo ven sus propias métricas, admins ven todas
CREATE POLICY "Users can view own token analytics" ON public.token_analytics
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert token analytics" ON public.token_analytics
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden actualizar
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
-- Organizadores ven sus eventos, participantes ven eventos en los que participan, admins ven todos
CREATE POLICY "Users can view accessible virtual events" ON public.virtual_events
    FOR SELECT
    USING (
        is_public = TRUE OR
        organizer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.virtual_event_participants 
            WHERE event_id = public.virtual_events.id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert virtual events" ON public.virtual_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Solo organizadores y admins pueden actualizar
CREATE POLICY "Organizers and admins can update virtual events" ON public.virtual_events
    FOR UPDATE
    USING (
        organizer_id = auth.uid() OR
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
-- Usuarios ven perfiles públicos y su propio perfil, admins ven todos
CREATE POLICY "Users can view public and own profiles" ON public.profiles
    FOR SELECT
    USING (
        is_public = TRUE OR
        id = auth.uid() OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 5: CREAR POLÍTICAS RLS PARA TABLAS SENSIBLES SIN POLÍTICAS
-- ============================================================================

-- 5.1 gallery_access_requests
ALTER TABLE public.gallery_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gallery requests" ON public.gallery_access_requests
    FOR SELECT
    USING (
        viewer_id = auth.uid() OR
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own gallery requests" ON public.gallery_access_requests
    FOR INSERT
    WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Owners can update gallery requests" ON public.gallery_access_requests
    FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- 5.2 gallery_commissions
ALTER TABLE public.gallery_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own commissions" ON public.gallery_commissions
    FOR SELECT
    USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can insert commissions" ON public.gallery_commissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can update commissions" ON public.gallery_commissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- 5.3 swinger_interests
ALTER TABLE public.swinger_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all interests" ON public.swinger_interests
    FOR SELECT
    USING (is_active = TRUE OR EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND is_active = TRUE
    ));

CREATE POLICY "Admins can insert interests" ON public.swinger_interests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can update interests" ON public.swinger_interests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- 5.4 couple_profile_likes
ALTER TABLE public.couple_profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes" ON public.couple_profile_likes
    FOR SELECT
    USING (
        liker_id = auth.uid() OR
        liked_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own likes" ON public.couple_profile_likes
    FOR INSERT
    WITH CHECK (liker_id = auth.uid());

CREATE POLICY "Users can delete own likes" ON public.couple_profile_likes
    FOR DELETE
    USING (liker_id = auth.uid());

-- 5.5 biometric_auth
ALTER TABLE public.biometric_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometric data" ON public.biometric_auth
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own biometric data" ON public.biometric_auth
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own biometric data" ON public.biometric_auth
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own biometric data" ON public.biometric_auth
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- PASO 6: MIGRAR ADMINISTRADORES EXISTENTES A admin_users
-- ============================================================================

-- Insertar administradores existentes basados en emails conocidos
INSERT INTO public.admin_users (user_id, role, granted_by, notes)
SELECT 
    id,
    CASE 
        WHEN email = 'complicesconectasw@outlook.es' THEN 'super_admin'
        WHEN email = 'djwacko28@gmail.com' THEN 'admin'
        ELSE 'admin'
    END,
    id,
    'Migrado desde raw_user_meta_data'
FROM auth.users
WHERE 
    email IN ('complicesconectasw@outlook.es', 'djwacko28@gmail.com') OR
    (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

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
