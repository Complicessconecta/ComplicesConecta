-- Migration: Add gallery_commissions table and record_gallery_commission function
-- Date: 2026-01-09

-- Create table for gallery commissions
CREATE TABLE IF NOT EXISTS gallery_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('view', 'like', 'super_like', 'purchase', 'tip')),
    amount_total NUMERIC NOT NULL,
    amount_commission NUMERIC NOT NULL,
    amount_creator NUMERIC NOT NULL,
    commission_percentage NUMERIC NOT NULL DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ, -- For payout processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded'))
);

-- Add RLS policies
ALTER TABLE gallery_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all commissions"
    ON gallery_commissions
    FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'service_role' OR raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Creators can view their own commissions"
    ON gallery_commissions
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Create RPC function to record commission
CREATE OR REPLACE FUNCTION record_gallery_commission(
  p_gallery_id TEXT,
  p_creator_id UUID,
  p_transaction_type TEXT,
  p_amount_cmpx NUMERIC,
  p_commission_percentage NUMERIC DEFAULT 10.0
) RETURNS UUID AS $$
DECLARE
  v_commission_amount NUMERIC;
  v_creator_amount NUMERIC;
  v_commission_id UUID;
BEGIN
  -- Calculate splits
  v_commission_amount := p_amount_cmpx * (p_commission_percentage / 100);
  v_creator_amount := p_amount_cmpx - v_commission_amount;

  -- Insert record
  INSERT INTO gallery_commissions (
    gallery_id,
    creator_id,
    transaction_type,
    amount_total,
    amount_commission,
    amount_creator,
    commission_percentage
  ) VALUES (
    p_gallery_id,
    p_creator_id,
    p_transaction_type,
    p_amount_cmpx,
    v_commission_amount,
    v_creator_amount,
    p_commission_percentage
  ) RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
