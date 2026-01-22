-- Tabla para acuerdos de parejas
-- Fecha: 21 de Enero, 2026
-- Proyecto: ComplicesConetca v3.9.2

SET statement_timeout = 0;
SET lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.couple_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL,
  content TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_status ON public.couple_agreements(status);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_created_at ON public.couple_agreements(created_at DESC);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_couple_agreements_updated_at'
  ) THEN
    CREATE TRIGGER update_couple_agreements_updated_at
      BEFORE UPDATE ON public.couple_agreements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS Policies
DO $$
BEGIN
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = 'couple_agreements'
        AND c.relrowsecurity IS DISTINCT FROM true
    ) THEN
      ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;
    END IF;
  EXCEPTION
    WHEN lock_not_available THEN
      RAISE NOTICE '⚠️ No se pudo adquirir lock para ENABLE RLS en public.couple_agreements (se omitió en este push). Reintentar cuando no haya locks activos.';
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_agreements'
      AND policyname = 'Users can view their own agreements'
  ) THEN
    CREATE POLICY "Users can view their own agreements"
      ON public.couple_agreements FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.couples
          WHERE id = couple_agreements.couple_id
          AND (user_id = auth.uid() OR partner_id = auth.uid())
        )
      );
  END IF;
END $$;
