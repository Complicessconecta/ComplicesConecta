-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create couple_agreements table
CREATE TABLE IF NOT EXISTS public.couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL, -- Reference to couple_profiles will be added if table exists, checking in separate block or assuming existence based on codebase
    partner_1_id UUID NOT NULL REFERENCES public.profiles(id),
    partner_2_id UUID NOT NULL REFERENCES public.profiles(id),
    partner_1_signature BOOLEAN DEFAULT FALSE,
    partner_2_signature BOOLEAN DEFAULT FALSE,
    partner_1_ip TEXT,
    partner_2_ip TEXT,
    partner_1_signed_at TIMESTAMPTZ,
    partner_2_signed_at TIMESTAMPTZ,
    agreement_hash TEXT,
    death_clause_text TEXT,
    asset_disposition_clause TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED')),
    signed_at TIMESTAMPTZ,
    dispute_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to couple_profiles if it hasn't been added inline (to be safe against order of execution if couple_profiles is in another migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'couple_agreements_couple_id_fkey'
    ) THEN
        ALTER TABLE public.couple_agreements 
        ADD CONSTRAINT couple_agreements_couple_id_fkey 
        FOREIGN KEY (couple_id) 
        REFERENCES public.couple_profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_status ON public.couple_agreements(status);

-- RLS
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own couple agreements" ON public.couple_agreements;
CREATE POLICY "Users can view their own couple agreements" ON public.couple_agreements
    FOR SELECT USING (
        auth.uid() = partner_1_id OR auth.uid() = partner_2_id
    );

DROP POLICY IF EXISTS "Users can insert their own couple agreements" ON public.couple_agreements;
CREATE POLICY "Users can insert their own couple agreements" ON public.couple_agreements
    FOR INSERT WITH CHECK (
        auth.uid() = partner_1_id OR auth.uid() = partner_2_id
    );

DROP POLICY IF EXISTS "Users can update their own couple agreements" ON public.couple_agreements;
CREATE POLICY "Users can update their own couple agreements" ON public.couple_agreements
    FOR UPDATE USING (
        auth.uid() = partner_1_id OR auth.uid() = partner_2_id
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_couple_agreements_updated_at
    BEFORE UPDATE ON public.couple_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
