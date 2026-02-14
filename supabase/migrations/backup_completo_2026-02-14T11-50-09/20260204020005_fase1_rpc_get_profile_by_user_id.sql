-- ============================================================================
-- FASE 1: FUNCIÓN RPC PARA CARGA UNIFICADA DE PERFILES
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Crear función RPC get_profile_by_user_id que consulta vw_profiles_unified
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_by_user_id(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Consultar la vista unificada vw_profiles_unified
    SELECT to_jsonb(vpu) INTO result
    FROM vw_profiles_unified vpu
    WHERE vpu.user_id = p_user_id;

    -- Retornar null si no se encuentra el perfil
    RETURN COALESCE(result, NULL);
END;
$$;

-- Otorgar permisos apropiados
REVOKE ALL ON FUNCTION public.get_profile_by_user_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_by_user_id(UUID) TO authenticated;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name = 'get_profile_by_user_id'
    ) INTO v_function_exists;

    IF v_function_exists THEN
        RAISE NOTICE '✅ FUNCIÓN RPC get_profile_by_user_id CREADA CORRECTAMENTE';
    ELSE
        RAISE EXCEPTION '❌ ERROR: Función RPC no se creó correctamente';
    END IF;
END $$;

-- ============================================================================
