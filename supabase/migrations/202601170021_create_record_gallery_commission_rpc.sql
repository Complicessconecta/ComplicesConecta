-- Crear función RPC para registrar comisiones de galería
CREATE OR REPLACE FUNCTION record_gallery_commission(
  p_gallery_id UUID,
  p_creator_id UUID,
  p_transaction_type TEXT,
  p_amount_cmpx NUMERIC,
  p_commission_percentage NUMERIC DEFAULT 10.0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission_id UUID;
  v_commission_amount NUMERIC;
  v_creator_amount NUMERIC;
BEGIN
  -- Calcular montos
  v_commission_amount := p_amount_cmpx * (p_commission_percentage / 100);
  v_creator_amount := p_amount_cmpx - v_commission_amount;

  -- Insertar comisión
  INSERT INTO gallery_commissions (
    gallery_id,
    creator_id,
    transaction_type,
    amount_cmpx,
    commission_amount_cmpx,
    creator_amount_cmpx,
    creator_paid
  )
  VALUES (
    p_gallery_id,
    p_creator_id,
    p_transaction_type,
    p_amount_cmpx,
    v_commission_amount,
    v_creator_amount,
    false
  )
  RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$$;
