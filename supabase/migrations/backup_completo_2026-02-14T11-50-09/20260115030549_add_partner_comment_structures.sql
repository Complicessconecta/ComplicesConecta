-- migrate:up

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    likes_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    deleted_at timestamptz,
    CONSTRAINT post_comments_content_length CHECK (char_length(content) > 0)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_comment_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_comments_select_policy
ON public.post_comments
FOR SELECT
USING (deleted_at IS NULL OR auth.role() = 'service_role');

CREATE POLICY post_comments_insert_policy
ON public.post_comments
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY post_comments_update_policy
ON public.post_comments
FOR UPDATE
USING (auth.role() = 'service_role' OR auth.uid() = user_id)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY post_comments_delete_policy
ON public.post_comments
FOR DELETE
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_likes_unique ON public.comment_likes(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_profile_id ON public.comment_likes(profile_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_likes_select_policy
ON public.comment_likes
FOR SELECT
USING (true);

CREATE POLICY comment_likes_insert_policy
ON public.comment_likes
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY comment_likes_delete_policy
ON public.comment_likes
FOR DELETE
USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.partner_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name text NOT NULL,
    city text NOT NULL,
    address text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text,
    description text,
    status text NOT NULL DEFAULT 'pending',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_partner_requests_status ON public.partner_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_created_at ON public.partner_requests(created_at DESC);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY partner_requests_select_policy
ON public.partner_requests
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY partner_requests_insert_policy
ON public.partner_requests
FOR INSERT
WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY partner_requests_update_policy
ON public.partner_requests
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY partner_requests_delete_policy
ON public.partner_requests
FOR DELETE
USING (auth.role() = 'service_role');

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_select_policy
ON public.matches
FOR SELECT
USING (auth.role() = 'service_role' OR auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY matches_insert_policy
ON public.matches
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user1_id);

CREATE POLICY matches_update_policy
ON public.matches
FOR UPDATE
USING (auth.role() = 'service_role' OR auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY matches_delete_policy
ON public.matches
FOR DELETE
USING (auth.role() = 'service_role' OR auth.uid() = user1_id OR auth.uid() = user2_id);

ALTER TABLE public.moderator_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderator_sessions_select_policy
ON public.moderator_sessions
FOR SELECT
USING (auth.role() = 'service_role' OR auth.uid() = moderator_id);

CREATE POLICY moderator_sessions_insert_policy
ON public.moderator_sessions
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = moderator_id);

CREATE POLICY moderator_sessions_update_policy
ON public.moderator_sessions
FOR UPDATE
USING (auth.role() = 'service_role' OR auth.uid() = moderator_id)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = moderator_id);

CREATE POLICY moderator_sessions_delete_policy
ON public.moderator_sessions
FOR DELETE
USING (auth.role() = 'service_role' OR auth.uid() = moderator_id);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY performance_metrics_select_policy
ON public.performance_metrics
FOR SELECT
USING (true);

CREATE POLICY performance_metrics_insert_policy
ON public.performance_metrics
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY performance_metrics_update_policy
ON public.performance_metrics
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY performance_metrics_delete_policy
ON public.performance_metrics
FOR DELETE
USING (auth.role() = 'service_role');

-- migrate:down

DROP POLICY IF EXISTS performance_metrics_delete_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_update_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_insert_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_select_policy ON public.performance_metrics;

DROP POLICY IF EXISTS moderator_sessions_delete_policy ON public.moderator_sessions;
DROP POLICY IF EXISTS moderator_sessions_update_policy ON public.moderator_sessions;
DROP POLICY IF EXISTS moderator_sessions_insert_policy ON public.moderator_sessions;
DROP POLICY IF EXISTS moderator_sessions_select_policy ON public.moderator_sessions;

DROP POLICY IF EXISTS matches_delete_policy ON public.matches;
DROP POLICY IF EXISTS matches_update_policy ON public.matches;
DROP POLICY IF EXISTS matches_insert_policy ON public.matches;
DROP POLICY IF EXISTS matches_select_policy ON public.matches;

DROP POLICY IF EXISTS partner_requests_delete_policy ON public.partner_requests;
DROP POLICY IF EXISTS partner_requests_update_policy ON public.partner_requests;
DROP POLICY IF EXISTS partner_requests_insert_policy ON public.partner_requests;
DROP POLICY IF EXISTS partner_requests_select_policy ON public.partner_requests;

DROP POLICY IF EXISTS comment_likes_delete_policy ON public.comment_likes;
DROP POLICY IF EXISTS comment_likes_insert_policy ON public.comment_likes;
DROP POLICY IF EXISTS comment_likes_select_policy ON public.comment_likes;

DROP POLICY IF EXISTS post_comments_delete_policy ON public.post_comments;
DROP POLICY IF EXISTS post_comments_update_policy ON public.post_comments;
DROP POLICY IF EXISTS post_comments_insert_policy ON public.post_comments;
DROP POLICY IF EXISTS post_comments_select_policy ON public.post_comments;

DROP TABLE IF EXISTS public.partner_requests;
DROP TABLE IF EXISTS public.comment_likes;
DROP TABLE IF EXISTS public.post_comments;
