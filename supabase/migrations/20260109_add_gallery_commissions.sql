-- Migration: Add gallery_commissions table and record_gallery_commission function
-- Date: 2026-01-09

-- Create table for gallery commissions
CREATE TABLE IF NOT EXISTS public.gallery_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('view', 'like', 'super_like', 'purchase', 'tip')),
    amount_cmpx NUMERIC NOT NULL,
    commission_amount_cmpx NUMERIC NOT NULL,
    creator_amount_cmpx NUMERIC NOT NULL,
    commission_percentage NUMERIC NOT NULL DEFAULT 10.0,
    creator_paid BOOLEAN DEFAULT FALSE,
    creator_paid_at TIMESTAMPTZ,
    platform_received BOOLEAN DEFAULT FALSE,
    platform_received_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alinear estructuras si la tabla ya existía con un esquema previo
ALTER TABLE public.gallery_commissions
  ADD COLUMN IF NOT EXISTS amount_cmpx NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_amount_cmpx NUMERIC,
  ADD COLUMN IF NOT EXISTS creator_amount_cmpx NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS creator_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS creator_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS platform_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS platform_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Alinear tipo de gallery_id a TEXT (algunos entornos lo tenían UUID)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gallery_commissions'
      AND column_name = 'gallery_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.gallery_commissions
      ALTER COLUMN gallery_id TYPE TEXT USING gallery_id::text;
  END IF;
END $$;

-- Add RLS policies
ALTER TABLE public.gallery_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all commissions" ON public.gallery_commissions;
DROP POLICY IF EXISTS "Creators can view their own commissions" ON public.gallery_commissions;

CREATE POLICY "Admins can view all commissions"
    ON public.gallery_commissions
    FOR SELECT
    USING (
      (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

CREATE POLICY "Creators can view their own commissions"
    ON public.gallery_commissions
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
  INSERT INTO public.gallery_commissions (
    gallery_id,
    creator_id,
    transaction_type,
    amount_cmpx,
    commission_amount_cmpx,
    creator_amount_cmpx,
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
