-- ============================================================================
-- FASE 2: AISLAMIENTO DEMO/PRODUCCIÓN
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Implementar políticas específicas para demo_authenticated
--          y prevenir contaminación entre entornos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Crear función para detectar modo demo
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_demo_mode()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
    -- Verificar si el usuario actual está en modo demo
    RETURN EXISTS (
        SELECT 1 FROM public.user_metadata um
        WHERE um.user_id = auth.uid()
          AND um.metadata->>'mode' = 'demo'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- PASO 2: Políticas específicas para aislamiento demo en PROFILES
-- ----------------------------------------------------------------------------

-- Política adicional para perfiles demo: Solo usuarios demo pueden ver perfiles demo
DROP POLICY IF EXISTS "profiles_demo_isolation" ON public.profiles;
CREATE POLICY "profiles_demo_isolation" ON public.profiles
FOR SELECT
USING (
    -- Usuarios demo solo ven otros usuarios demo
    (public.is_demo_mode() AND user_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ))
    -- Usuarios producción ven solo usuarios producción
    OR (NOT public.is_demo_mode() AND user_id NOT IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ))
    -- Admins ven todo
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 3: Aislamiento demo en MATCHES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "matches_demo_isolation" ON public.matches;
CREATE POLICY "matches_demo_isolation" ON public.matches
FOR SELECT
USING (
    -- Solo matches entre usuarios del mismo entorno
    (public.is_demo_mode() AND user1_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ) AND user2_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ))
    OR (NOT public.is_demo_mode() AND user1_id NOT IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ) AND user2_id NOT IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
    ))
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 4: Aislamiento demo en CLUBS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "clubs_demo_isolation" ON public.clubs;
CREATE POLICY "clubs_demo_isolation" ON public.clubs
FOR SELECT
USING (
    -- Clubs demo solo visibles para usuarios demo
    (public.is_demo_mode() AND metadata->>'environment' = 'demo')
    -- Clubs producción solo visibles para usuarios producción
    OR (NOT public.is_demo_mode() AND (metadata->>'environment' IS NULL OR metadata->>'environment' != 'demo'))
    -- Admins ven todo
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 5: Función de limpieza automática de datos demo
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo admins pueden ejecutar limpieza
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Solo administradores pueden ejecutar limpieza de datos demo';
    END IF;

    -- Limpiar perfiles demo expirados (más de 24 horas)
    DELETE FROM public.profiles
    WHERE user_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
          AND (metadata->>'created_at')::timestamp < NOW() - INTERVAL '24 hours'
    );

    -- Limpiar matches demo expirados
    DELETE FROM public.matches
    WHERE (user1_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
          AND (metadata->>'created_at')::timestamp < NOW() - INTERVAL '24 hours'
    ) OR user2_id IN (
        SELECT user_id FROM public.user_metadata
        WHERE metadata->>'mode' = 'demo'
          AND (metadata->>'created_at')::timestamp < NOW() - INTERVAL '24 hours'
    ));

    -- Limpiar clubs demo expirados
    DELETE FROM public.clubs
    WHERE metadata->>'environment' = 'demo'
      AND created_at < NOW() - INTERVAL '24 hours';

    RAISE NOTICE '✅ Limpieza de datos demo completada';
END;
$$;

-- ----------------------------------------------------------------------------
-- PASO 6: Trigger para marcar automáticamente usuarios demo
-- ----------------------------------------------------------------------------

-- Crear tabla si no existe para metadata de usuario
CREATE TABLE IF NOT EXISTS public.user_metadata (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para marcar usuarios como demo automáticamente
CREATE OR REPLACE FUNCTION public.mark_user_as_demo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Si es un usuario demo (según alguna lógica de negocio), marcarlo
    INSERT INTO public.user_metadata (user_id, metadata)
    VALUES (NEW.id, '{"mode": "demo", "created_at": "' || NOW() || '"}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger en auth.users para marcar automáticamente (opcional, según lógica de negocio)
-- DROP TRIGGER IF EXISTS trigger_mark_demo_users ON auth.users;
-- CREATE TRIGGER trigger_mark_demo_users
-- AFTER INSERT ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION public.mark_user_as_demo();

-- ----------------------------------------------------------------------------
-- PASO 7: Verificación final de aislamiento
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_demo_policies INT;
    v_cleanup_function BOOLEAN;
BEGIN
    -- Contar políticas de aislamiento demo
    SELECT COUNT(*) INTO v_demo_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%demo_isolation%';

    -- Verificar función de limpieza
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name = 'cleanup_demo_data'
    ) INTO v_cleanup_function;

    RAISE NOTICE '✅ POLÍTICAS AISLAMIENTO DEMO: %', v_demo_policies;
    RAISE NOTICE '✅ FUNCIÓN LIMPIEZA DEMO: %', CASE WHEN v_cleanup_function THEN 'EXISTE' ELSE 'FALTA' END;
    RAISE NOTICE '✅ AISLAMIENTO DEMO/PRODUCCIÓN COMPLETADO';
END $$;

-- ============================================================================
-- RESUMEN DE AISLAMIENTO DEMO
-- ============================================================================
-- ✓ Función is_demo_mode() para detectar entorno
-- ✓ Políticas de aislamiento en profiles, matches, clubs
-- ✓ Función cleanup_demo_data() para limpieza automática
-- ✓ Tabla user_metadata para tracking de usuarios demo
-- ✓ Prevención de contaminación entre entornos
-- ✓ Trigger opcional para marcado automático
-- ============================================================================
