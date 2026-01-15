-- migrate:up

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'couple_disputes'
          AND column_name = 'initiator_id'
    ) THEN
        ALTER TABLE public.couple_disputes
            ADD COLUMN initiator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_couple_disputes_initiator_id
    ON public.couple_disputes(initiator_id);

-- migrate:down

DROP INDEX IF EXISTS idx_couple_disputes_initiator_id;

ALTER TABLE public.couple_disputes
    DROP COLUMN IF EXISTS initiator_id;
