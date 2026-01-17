-- ============================================================================
-- RPC Function: create_permanent_ban
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Función RPC para crear baneos permanentes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_permanent_ban(
  p_user_id UUID,
  p_canvas_hash TEXT,
  p_combined_hash TEXT,
  p_ban_reason TEXT,
  p_banned_by UUID,
  p_severity TEXT DEFAULT 'high',
  p_evidence JSONB DEFAULT '{}',
  p_worldid_nullifier_hash TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ban_id UUID;
BEGIN
  -- Crear el baneo permanente
  INSERT INTO public.permanent_bans (
    user_id,
    combined_hash,
    ban_reason,
    banned_by,
    banned_at,
    details,
    created_at
  ) VALUES (
    p_user_id,
    p_combined_hash,
    p_ban_reason,
    p_banned_by,
    NOW(),
    jsonb_build_object(
      'canvas_hash', p_canvas_hash,
      'worldid_nullifier_hash', p_worldid_nullifier_hash,
      'severity', p_severity,
      'evidence', p_evidence
    ),
    NOW()
  )
  RETURNING id INTO v_ban_id;

  -- Log de auditoría
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    created_at
  ) VALUES (
    p_banned_by,
    'create_permanent_ban',
    'permanent_ban',
    v_ban_id,
    jsonb_build_object(
      'banned_user_id', p_user_id,
      'ban_reason', p_ban_reason,
      'severity', p_severity,
      'combined_hash', p_combined_hash
    ),
    NULL,
    NOW()
  );

  RETURN v_ban_id;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.create_permanent_ban IS 'Función RPC para crear baneos permanentes de usuarios';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_permanent_ban TO authenticated;

RAISE NOTICE '✅ Función RPC create_permanent_ban creada exitosamente';
