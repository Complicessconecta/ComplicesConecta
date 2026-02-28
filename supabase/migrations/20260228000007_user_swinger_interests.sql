-- Migración para Intereses Swinger de Usuario
-- Fecha: 28 Feb 2026

CREATE TABLE IF NOT EXISTS public.user_swinger_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_id TEXT NOT NULL,
    category TEXT,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, interest_id)
);

-- RLS
ALTER TABLE public.user_swinger_interests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_swinger_interests' 
        AND policyname = 'Users can manage own swinger interests'
    ) THEN
        CREATE POLICY "Users can manage own swinger interests" 
        ON public.user_swinger_interests 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;
