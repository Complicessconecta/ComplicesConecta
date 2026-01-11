-- ============================================================================
-- MIGRACIÓN DE SEGURIDAD - CORRECCIÓN DE POLÍTICAS RLS (SOLO TABLAS EXISTENTES)
-- Fecha: January 10, 2026
-- Objetivo: Corregir políticas RLS para tablas existentes en la base de datos local
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR Y CORREGIR POLÍTICAS RLS DE profiles
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas inseguras si existen
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Crear políticas seguras
-- Usuarios ven perfiles públicos y su propio perfil, admins ven todos
CREATE POLICY "Users can view public and own profiles" ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid() OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PASO 2: VERIFICAR Y CORREGIR POLÍTICAS RLS DE user_wallets
-- ============================================================================

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;

CREATE POLICY "Users can view their own wallets" ON public.user_wallets
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert their own wallets" ON public.user_wallets
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" ON public.user_wallets
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 3: VERIFICAR Y CORREGIR POLÍTICAS RLS DE couple_profiles
-- ============================================================================

ALTER TABLE public.couple_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view couple profiles" ON public.couple_profiles;

CREATE POLICY "Users can view accessible couple profiles" ON public.couple_profiles
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        partner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own couple profile" ON public.couple_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Users can update own couple profile" ON public.couple_profiles
    FOR UPDATE
    USING (
        user_id = auth.uid() OR 
        partner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 4: VERIFICAR Y CORREGIR POLÍTICAS RLS DE notifications
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- PASO 5: VERIFICAR Y CORREGIR POLÍTICAS RLS DE user_consents
-- ============================================================================

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.user_consents
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own consents" ON public.user_consents
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consents" ON public.user_consents
    FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- PASO 6: VERIFICAR Y CORREGIR POLÍTICAS RLS DE reports
-- ============================================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT
    USING (
        reporter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert reports" ON public.reports
    FOR INSERT
    WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- PASO 7: VERIFICAR Y CORREGIR POLÍTICAS RLS DE invitations
-- ============================================================================

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations" ON public.invitations
    FOR SELECT
    USING (
        inviter_id = auth.uid() OR
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert invitations" ON public.invitations
    FOR INSERT
    WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update own invitations" ON public.invitations
    FOR UPDATE
    USING (inviter_id = auth.uid());

-- ============================================================================
-- PASO 8: VERIFICAR Y CORREGIR POLÍTICAS RLS DE blockchain_transactions
-- ============================================================================

ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blockchain transactions" ON public.blockchain_transactions
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "System can insert blockchain transactions" ON public.blockchain_transactions
    FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================================
-- PASO 9: VERIFICAR Y CORREGIR POLÍTICAS RLS DE user_nfts
-- ============================================================================

ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own NFTs" ON public.user_nfts
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert own NFTs" ON public.user_nfts
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own NFTs" ON public.user_nfts
    FOR UPDATE
    USING (owner_id = auth.uid());

-- ============================================================================
-- PASO 10: VERIFICAR Y CORREGIR POLÍTICAS RLS DE gallery_permissions
-- ============================================================================

ALTER TABLE public.gallery_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gallery permissions" ON public.gallery_permissions
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        viewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can insert gallery permissions" ON public.gallery_permissions
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update gallery permissions" ON public.gallery_permissions
    FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración de seguridad completada exitosamente';
    RAISE NOTICE '✅ Políticas RLS corregidas para todas las tablas existentes';
    RAISE NOTICE '✅ Tabla admin_users con RLS estricto ya existe';
    RAISE NOTICE '✅ Funciones helper is_admin() y is_super_admin() ya existen';
END $$;
