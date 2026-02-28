-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'profile', 'post', 'comment', etc.
    report_type TEXT NOT NULL DEFAULT 'profile', -- 'profile', 'content', etc.
    reported_content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Safely drop the policy if it exists to allow updates
-- This prevents "policy already exists" errors during migrations
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;

-- Create the policy with rate limiting (max 5 reports per day)
-- This ensures users cannot spam the reporting system and protects against abuse
-- Rate limit: 5 reports per rolling 24 hour window per user
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT
    WITH CHECK (
        auth.uid() = reporter_user_id
        AND (
            SELECT COUNT(*)
            FROM public.reports
            WHERE reporter_user_id = auth.uid()
            AND created_at > (NOW() - INTERVAL '24 hours')
        ) < 5
    );

-- Safely create/update "Users can view their own reports" policy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'reports' 
        AND policyname = 'Users can view their own reports'
    ) THEN
        DROP POLICY "Users can view their own reports" ON public.reports;
    END IF;
END $$;

CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT
    USING (auth.uid() = reporter_user_id);

-- Create notifications table for report updates if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'report_update', 'system', 'match', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Safely create/update "Users can view own notifications" policy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'notifications' 
        AND policyname = 'Users can view own notifications'
    ) THEN
        DROP POLICY "Users can view own notifications" ON public.notifications;
    END IF;
END $$;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Safely create/update "Users can update own notifications" policy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'notifications' 
        AND policyname = 'Users can update own notifications'
    ) THEN
        DROP POLICY "Users can update own notifications" ON public.notifications;
    END IF;
END $$;

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);
