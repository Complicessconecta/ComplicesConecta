-- Migración para Preferencias de Matching
-- Fecha: 28 Feb 2026

CREATE TABLE IF NOT EXISTS public.matching_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    min_age INTEGER DEFAULT 18,
    max_age INTEGER DEFAULT 99,
    interested_in TEXT[] DEFAULT '{}',
    max_distance INTEGER DEFAULT 50,
    importance_personality INTEGER DEFAULT 50,
    importance_interests INTEGER DEFAULT 50,
    importance_location INTEGER DEFAULT 50,
    importance_activity INTEGER DEFAULT 50,
    importance_verification INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'matching_preferences' 
        AND policyname = 'Users can manage own matching preferences'
    ) THEN
        CREATE POLICY "Users can manage own matching preferences" 
        ON public.matching_preferences 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;
