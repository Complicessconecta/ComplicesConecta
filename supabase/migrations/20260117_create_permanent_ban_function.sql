-- Crear función RPC para crear baneo permanente
CREATE OR REPLACE FUNCTION create_permanent_ban(
  p_user_id UUID,
  p_canvas_hash TEXT,
  p_combined_hash TEXT,
  p_ban_reason TEXT,
  p_banned_by UUID,
  p_severity TEXT,
  p_evidence JSONB DEFAULT '{}'::jsonb,
  p_worldid_nullifier_hash TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO permanent_bans (
    user_id,
    combined_hash,
    ban_reason,
    banned_by,
    details
  ) VALUES (
    p_user_id,
    p_combined_hash,
    p_ban_reason,
    p_banned_by,
    jsonb_build_object(
      'canvas_hash', p_canvas_hash,
      'severity', p_severity,
      'evidence', p_evidence,
      'worldid_nullifier_hash', p_worldid_nullifier_hash
    )
  )
  RETURNING id;
END;
$$;
