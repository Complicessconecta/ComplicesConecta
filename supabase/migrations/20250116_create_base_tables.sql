-- ============================================================================
-- CREACIÓN DE TABLAS BASE - couples, profiles, couple_agreements
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- ============================================================================

-- ============================================================================
-- TABLA: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    account_type TEXT NOT NULL DEFAULT 'user' CHECK (account_type IN ('user', 'admin', 'moderator')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear policies usando DO block para verificar existencia
DO $$
BEGIN
    -- Users can view all profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles"
        ON public.profiles FOR SELECT
        USING (true);
    END IF;
    
    -- Users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
    
    -- Users can insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- ============================================================================
-- TABLA: couples
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'dissolved')),
    relationship_start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Crear policies usando DO block para verificar existencia
DO $$
BEGIN
    -- Users can view their own couples
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couples' AND policyname = 'Users can view their own couples'
    ) THEN
        CREATE POLICY "Users can view their own couples"
        ON public.couples FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    -- Users can create their own couples
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couples' AND policyname = 'Users can create their own couples'
    ) THEN
        CREATE POLICY "Users can create their own couples"
        ON public.couples FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Users can update their own couples
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couples' AND policyname = 'Users can update their own couples'
    ) THEN
        CREATE POLICY "Users can update their own couples"
        ON public.couples FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================================================
-- TABLA: couple_agreements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    agreement_type TEXT NOT NULL,
    terms JSONB NOT NULL,
    signed_by_user_a BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_user_b BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at_a TIMESTAMP WITH TIME ZONE,
    signed_at_b TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

-- Crear policies usando DO block para verificar existencia
DO $$
BEGIN
    -- Users can view their own agreements
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_agreements' AND policyname = 'Users can view their own agreements'
    ) THEN
        CREATE POLICY "Users can view their own agreements"
        ON public.couple_agreements FOR SELECT
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_agreements.couple_id
            )
        );
    END IF;
    
    -- Users can create agreements for their couples
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_agreements' AND policyname = 'Users can create agreements for their couples'
    ) THEN
        CREATE POLICY "Users can create agreements for their couples"
        ON public.couple_agreements FOR INSERT
        WITH CHECK (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_agreements.couple_id
            )
        );
    END IF;
    
    -- Users can update their own agreements
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_agreements' AND policyname = 'Users can update their own agreements'
    ) THEN
        CREATE POLICY "Users can update their own agreements"
        ON public.couple_agreements FOR UPDATE
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_agreements.couple_id
            )
        );
    END IF;
END $$;

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Tabla de perfiles de usuarios - v3.9.2';
COMMENT ON TABLE public.couples IS 'Tabla de parejas/relaciones - v3.9.2';
COMMENT ON TABLE public.couple_agreements IS 'Tabla de acuerdos de pareja - v3.9.2';
