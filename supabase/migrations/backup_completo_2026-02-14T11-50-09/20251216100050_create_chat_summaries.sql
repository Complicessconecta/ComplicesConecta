-- Migration: Chat Summaries ML Tables
-- Version: 3.5.0 - Phase 1.3
-- Date: 2025-10-30
-- Purpose: Tables for automatic conversation summaries with ML

-- =====================================================
-- 1. Table: chat_summaries
-- Purpose: Store AI-generated summaries
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL,
  
  -- Summary and metadata
  summary TEXT NOT NULL,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  topics JSONB DEFAULT '[]'::jsonb,
  message_count INT NOT NULL DEFAULT 0,
  
  -- Generation method
  method VARCHAR(20) CHECK (method IN ('gpt4', 'bart', 'fallback')),
  model_version VARCHAR(50) DEFAULT 'v1',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists (from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'chat_room_id') THEN
        ALTER TABLE chat_summaries RENAME COLUMN chat_id TO chat_room_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'sentiment') THEN
        ALTER TABLE chat_summaries ADD COLUMN sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'topics') THEN
        ALTER TABLE chat_summaries ADD COLUMN topics JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'message_count') THEN
        ALTER TABLE chat_summaries ADD COLUMN message_count INT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'method') THEN
        ALTER TABLE chat_summaries ADD COLUMN method VARCHAR(20) CHECK (method IN ('gpt4', 'bart', 'fallback'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'model_version') THEN
        ALTER TABLE chat_summaries ADD COLUMN model_version VARCHAR(50) DEFAULT 'v1';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_summaries' AND column_name = 'updated_at') THEN
        ALTER TABLE chat_summaries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_room_id ON chat_summaries(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_created ON chat_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_sentiment ON chat_summaries(sentiment);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_method ON chat_summaries(method);

-- GIN index for topic search
CREATE INDEX IF NOT EXISTS idx_chat_summaries_topics ON chat_summaries USING GIN (topics);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_chat_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_summaries_updated_at ON chat_summaries;
CREATE TRIGGER trigger_chat_summaries_updated_at
BEFORE UPDATE ON chat_summaries
FOR EACH ROW
EXECUTE FUNCTION update_chat_summaries_updated_at();

-- =====================================================
-- 2. Table: summary_requests
-- Purpose: Rate limiting (10 summaries/day per user)
-- =====================================================

CREATE TABLE IF NOT EXISTS summary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_room_id UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_summary_requests_user ON summary_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_requests_chat_room_id ON summary_requests(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_summary_requests_created ON summary_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summary_requests_user_date ON summary_requests(user_id, created_at);

-- =====================================================
-- 3. Table: summary_feedback
-- Purpose: User feedback (helpful/not helpful)
-- =====================================================

CREATE TABLE IF NOT EXISTS summary_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES chat_summaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Feedback
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: one feedback per user per summary
  CONSTRAINT unique_summary_feedback UNIQUE (summary_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_summary_feedback_summary ON summary_feedback(summary_id);
CREATE INDEX IF NOT EXISTS idx_summary_feedback_user ON summary_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_feedback_helpful ON summary_feedback(is_helpful);

-- =====================================================
-- 4. RLS (Row Level Security)
-- =====================================================

-- Enable RLS
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_feedback ENABLE ROW LEVEL SECURITY;

-- Policies: chat_summaries
-- Users can see summaries of their own chats
DROP POLICY IF EXISTS chat_summaries_select_own ON chat_summaries;
CREATE POLICY chat_summaries_select_own
ON chat_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_summaries.chat_room_id
    AND auth.uid() = ANY(participants)
  )
);

-- Only system can insert
DROP POLICY IF EXISTS chat_summaries_insert_service ON chat_summaries;
CREATE POLICY chat_summaries_insert_service
ON chat_summaries FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policies: summary_requests
-- Users can only see their own requests
DROP POLICY IF EXISTS summary_requests_select_own ON summary_requests;
CREATE POLICY summary_requests_select_own
ON summary_requests FOR SELECT
USING (auth.uid() = user_id);

-- Only system can insert
DROP POLICY IF EXISTS summary_requests_insert_service ON summary_requests;
CREATE POLICY summary_requests_insert_service
ON summary_requests FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policies: summary_feedback
-- Users can see feedback of summaries they can access
DROP POLICY IF EXISTS summary_feedback_select_own ON summary_feedback;
CREATE POLICY summary_feedback_select_own
ON summary_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_summaries cs
    JOIN chat_rooms cr ON cr.id = cs.chat_room_id
    WHERE cs.id = summary_feedback.summary_id
    AND auth.uid() = ANY(cr.participants)
  )
);

-- Users can insert their own feedback
DROP POLICY IF EXISTS summary_feedback_insert_own ON summary_feedback;
CREATE POLICY summary_feedback_insert_own
ON summary_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
DROP POLICY IF EXISTS summary_feedback_update_own ON summary_feedback;
CREATE POLICY summary_feedback_update_own
ON summary_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- 5. Useful functions
-- =====================================================

-- Function: Get cached summary
CREATE OR REPLACE FUNCTION get_cached_summary(
  p_chat_room_id UUID
) RETURNS TABLE (
  id UUID,
  summary TEXT,
  sentiment VARCHAR,
  topics JSONB,
  message_count INT,
  method VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.summary,
    cs.sentiment,
    cs.topics,
    cs.message_count,
    cs.method,
    cs.created_at
  FROM chat_summaries cs
  WHERE cs.chat_room_id = p_chat_room_id
    AND cs.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check rate limit
CREATE OR REPLACE FUNCTION check_summary_rate_limit(
  p_user_id UUID,
  p_max_per_day INT DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM summary_requests
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;
  
  RETURN v_count < p_max_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Summary statistics
CREATE OR REPLACE FUNCTION get_summary_stats(
  p_period_days INT DEFAULT 7
) RETURNS TABLE (
  total_summaries BIGINT,
  gpt4_count BIGINT,
  bart_count BIGINT,
  fallback_count BIGINT,
  avg_message_count DECIMAL,
  positive_sentiment_pct DECIMAL,
  neutral_sentiment_pct DECIMAL,
  negative_sentiment_pct DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_summaries,
    SUM(CASE WHEN method = 'gpt4' THEN 1 ELSE 0 END)::BIGINT as gpt4_count,
    SUM(CASE WHEN method = 'bart' THEN 1 ELSE 0 END)::BIGINT as bart_count,
    SUM(CASE WHEN method = 'fallback' THEN 1 ELSE 0 END)::BIGINT as fallback_count,
    AVG(message_count)::DECIMAL as avg_message_count,
    (SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as positive_sentiment_pct,
    (SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as neutral_sentiment_pct,
    (SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as negative_sentiment_pct
  FROM chat_summaries
  WHERE created_at > NOW() - (p_period_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Comments (documentation)
-- =====================================================

COMMENT ON TABLE chat_summaries IS 'Automatic conversation summaries generated by AI (GPT-4/BART)';
COMMENT ON TABLE summary_requests IS 'Rate limiting: maximum 10 summaries per day per user';
COMMENT ON TABLE summary_feedback IS 'User feedback on summary usefulness (helpful/not helpful)';

COMMENT ON COLUMN chat_summaries.summary IS 'Summary text (maximum 3 sentences)';
COMMENT ON COLUMN chat_summaries.sentiment IS 'Overall sentiment: positive, neutral, negative';
COMMENT ON COLUMN chat_summaries.topics IS 'JSON array of extracted key topics';
COMMENT ON COLUMN chat_summaries.method IS 'Method used: gpt4, bart, fallback';

-- =====================================================
-- 7. Automatic cleanup (optional)
-- =====================================================

-- Delete old summaries (>90 days) automatically
CREATE OR REPLACE FUNCTION cleanup_old_summaries()
RETURNS VOID AS $$
BEGIN
  DELETE FROM chat_summaries
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM summary_requests
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-summaries', '0 3 * * *', 'SELECT cleanup_old_summaries()');

-- =====================================================
-- End of migration
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Chat Summaries migration completed successfully';
  RAISE NOTICE 'Tables created: chat_summaries, summary_requests, summary_feedback';
  RAISE NOTICE 'RLS enabled, indexes created, functions added';
END $$;

