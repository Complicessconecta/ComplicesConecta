-- Migration: AI-Native Layer Tables
-- Version: 3.5.0
-- Date: 2025-10-30
-- Purpose: Tables for AI/ML functionalities (Phase 1: AI-Native Layers)

-- =====================================================
-- 1. Table: ai_compatibility_scores
-- Purpose: Store ML-generated compatibility scores
-- Inspired by: Grindr 2025 AI-native approach
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Scores
  ai_score DECIMAL(3,2) CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 1)),
  legacy_score DECIMAL(3,2) CHECK (legacy_score IS NULL OR (legacy_score >= 0 AND legacy_score <= 1)),
  final_score DECIMAL(3,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 1),
  
  -- Metadata
  model_version VARCHAR(50) DEFAULT 'v1-base',
  prediction_method VARCHAR(20) CHECK (prediction_method IN ('ai', 'legacy', 'hybrid')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  
  -- Features used (for analysis)
  features JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to avoid duplicates (using expression)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_scores_unique_pair
ON ai_compatibility_scores (
  LEAST(user1_id, user2_id),
  GREATEST(user1_id, user2_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_scores_user1 ON ai_compatibility_scores(user1_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_user2 ON ai_compatibility_scores(user2_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_final ON ai_compatibility_scores(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scores_method ON ai_compatibility_scores(prediction_method);
CREATE INDEX IF NOT EXISTS idx_ai_scores_created ON ai_compatibility_scores(created_at DESC);

-- Composite index for pair searches
CREATE INDEX IF NOT EXISTS idx_ai_scores_user_pair 
ON ai_compatibility_scores(user1_id, user2_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_scores_updated_at ON ai_compatibility_scores;
CREATE TRIGGER trigger_ai_scores_updated_at
BEFORE UPDATE ON ai_compatibility_scores
FOR EACH ROW
EXECUTE FUNCTION update_ai_scores_updated_at();

-- =====================================================
-- 2. Table: ai_prediction_logs
-- Purpose: Detailed ML prediction logs (debugging/analysis)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_prediction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Result
  score DECIMAL(3,2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('ai', 'legacy', 'hybrid')),
  
  -- Features (snapshot for analysis)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Performance
  prediction_time_ms INT CHECK (prediction_time_ms >= 0),
  cache_hit BOOLEAN DEFAULT FALSE,
  
  -- Error handling
  error_message TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  model_version VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_prediction_logs_timestamp ON ai_prediction_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_method ON ai_prediction_logs(method);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_error ON ai_prediction_logs(error_message) 
WHERE error_message IS NOT NULL;

-- =====================================================
-- 3. Table: ai_model_metrics
-- Purpose: ML model performance metrics
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version VARCHAR(50) NOT NULL,
  
  -- Accuracy metrics
  predictions_count INT DEFAULT 0,
  accuracy_score DECIMAL(5,4) CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  
  -- Performance metrics
  avg_prediction_time_ms DECIMAL(10,2),
  cache_hit_rate DECIMAL(5,4),
  error_rate DECIMAL(5,4),
  
  -- Post-match engagement (A/B testing)
  match_rate DECIMAL(5,4),
  conversation_rate DECIMAL(5,4),
  satisfaction_score DECIMAL(3,2),
  
  -- Measurement period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_model_period UNIQUE (model_version, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_model_metrics_version ON ai_model_metrics(model_version);
CREATE INDEX IF NOT EXISTS idx_model_metrics_period ON ai_model_metrics(period_start DESC);

-- =====================================================
-- 4. RLS (Row Level Security)
-- =====================================================

-- Enable RLS
ALTER TABLE ai_compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: ai_compatibility_scores
-- Users can only see their own scores
DROP POLICY IF EXISTS ai_scores_select_own ON ai_compatibility_scores;
CREATE POLICY ai_scores_select_own
ON ai_compatibility_scores FOR SELECT
USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Only system can insert/update (via service role)
DROP POLICY IF EXISTS ai_scores_insert_service ON ai_compatibility_scores;
CREATE POLICY ai_scores_insert_service
ON ai_compatibility_scores FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS ai_scores_update_service ON ai_compatibility_scores;
CREATE POLICY ai_scores_update_service
ON ai_compatibility_scores FOR UPDATE
USING (auth.role() = 'service_role');

-- Policies: ai_prediction_logs
-- Only admins can see logs (debugging)
DROP POLICY IF EXISTS prediction_logs_select_admin ON ai_prediction_logs;
CREATE POLICY prediction_logs_select_admin
ON ai_prediction_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS prediction_logs_insert_service ON ai_prediction_logs;
CREATE POLICY prediction_logs_insert_service
ON ai_prediction_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policies: ai_model_metrics
-- Only admins can see metrics
DROP POLICY IF EXISTS model_metrics_select_admin ON ai_model_metrics;
CREATE POLICY model_metrics_select_admin
ON ai_model_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS model_metrics_insert_service ON ai_model_metrics;
CREATE POLICY model_metrics_insert_service
ON ai_model_metrics FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 5. Useful functions
-- =====================================================

-- Function: Get compatibility score (cache-aware)
CREATE OR REPLACE FUNCTION get_ai_compatibility_score(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_score DECIMAL(3,2);
BEGIN
  SELECT final_score INTO v_score
  FROM ai_compatibility_scores
  WHERE (
    (user1_id = p_user1_id AND user2_id = p_user2_id) OR
    (user1_id = p_user2_id AND user2_id = p_user1_id)
  )
  AND created_at > NOW() - INTERVAL '1 hour'
  LIMIT 1;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Model statistics
CREATE OR REPLACE FUNCTION get_model_stats(
  p_model_version VARCHAR(50),
  p_period_hours INT DEFAULT 24
) RETURNS TABLE (
  total_predictions BIGINT,
  avg_score DECIMAL(3,2),
  cache_hit_rate DECIMAL(5,4),
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_predictions,
    AVG(score)::DECIMAL(3,2) as avg_score,
    (SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0))::DECIMAL(5,4) as cache_hit_rate,
    SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END)::BIGINT as error_count
  FROM ai_prediction_logs
  WHERE model_version = p_model_version
    AND timestamp > NOW() - (p_period_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Comments (documentation)
-- =====================================================

COMMENT ON TABLE ai_compatibility_scores IS 'AI/ML-generated compatibility scores (Phase 1: AI-Native)';
COMMENT ON TABLE ai_prediction_logs IS 'Detailed ML prediction logs for debugging and analysis';
COMMENT ON TABLE ai_model_metrics IS 'ML model performance metrics';

COMMENT ON COLUMN ai_compatibility_scores.ai_score IS 'ML-generated score (can be NULL if method=legacy)';
COMMENT ON COLUMN ai_compatibility_scores.legacy_score IS 'Legacy algorithm score (Big Five + swinger traits)';
COMMENT ON COLUMN ai_compatibility_scores.final_score IS 'Final score used (can be hybrid: 70% AI + 30% legacy)';
COMMENT ON COLUMN ai_compatibility_scores.features IS 'JSON features used for prediction (likes, proximity, etc.)';

-- =====================================================
-- 7. Initial data (optional)
-- =====================================================

-- Insert initial metrics for base model
INSERT INTO ai_model_metrics (
  model_version,
  predictions_count,
  accuracy_score,
  avg_prediction_time_ms,
  cache_hit_rate,
  error_rate,
  period_start,
  period_end
) VALUES (
  'v1-base',
  0,
  0.0,
  0.0,
  0.0,
  0.0,
  NOW(),
  NOW()
) ON CONFLICT (model_version, period_start, period_end) DO NOTHING;

-- =====================================================
-- End of migration
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'AI Tables migration completed successfully';
  RAISE NOTICE 'Tables created: ai_compatibility_scores, ai_prediction_logs, ai_model_metrics';
  RAISE NOTICE 'RLS enabled, indexes created, functions added';
END $$;




