-- =====================================================
-- MIGRACIONES FASE 4: CREAR TABLAS FALTANTES
-- Generado: 8 Diciembre 2025
-- Version: 3.8+
-- =====================================================

-- =====================================================
-- TABLAS DE TOKENS Y ANALÍTICA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  cmpx_balance DECIMAL(20,8) DEFAULT 0,
  gtk_balance DECIMAL(20,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS public.staking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  amount DECIMAL(20,8) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  amount DECIMAL(20,8) NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('cmpx', 'gtk')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'stake', 'unstake', 'reward')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.token_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_cmpx_supply DECIMAL(20,8) NOT NULL,
  total_gtk_supply DECIMAL(20,8) NOT NULL,
  circulating_cmpx DECIMAL(20,8) NOT NULL,
  circulating_gtk DECIMAL(20,8) NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  transaction_volume_cmpx DECIMAL(20,8) DEFAULT 0,
  transaction_volume_gtk DECIMAL(20,8) DEFAULT 0,
  total_staked_cmpx DECIMAL(20,8) DEFAULT 0,
  active_stakers INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE REPORTES Y MODERACIÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL ,
  reported_user_id UUID NOT NULL ,
  reported_content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'profile', 'story', 'post', 'comment')),
  report_type TEXT NOT NULL CHECK (report_type IN ('message', 'profile', 'story', 'post', 'comment')),
  reason TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.permanent_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  canvas_hash TEXT NOT NULL,
  combined_hash TEXT NOT NULL,
  ban_reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  worldid_nullifier_hash TEXT,
  severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.fingerprint_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_ids TEXT[] NOT NULL,
  user_id UUID NOT NULL ,
  is_banned BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.blocked_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  is_blocked BOOLEAN DEFAULT TRUE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT
);
-- =====================================================
-- TABLAS DE MATCHING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.smart_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL ,
  user2_id UUID NOT NULL ,
  compatibility_score DECIMAL(5,2) NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('single', 'couple')),
  is_demo BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.predictive_matching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  predicted_matches JSONB NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  algorithm_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE SEGURIDAD
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'failed_login', 'suspicious_activity', 'logout', 'data_access', 'admin_action')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL  ,
  method TEXT NOT NULL CHECK (method IN ('2fa_app', 'sms', 'email')),
  secret TEXT,
  backup_codes TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE EVENTOS Y SOSTENIBILIDAD
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sustainable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  participants TEXT[] DEFAULT '{}',
  max_participants INTEGER NOT NULL,
  organizer_id UUID NOT NULL ,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  impact_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE POSTS Y COMENTARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  story_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  user_id UUID NOT NULL ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.story_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  user_id UUID NOT NULL ,
  share_type TEXT NOT NULL CHECK (share_type IN ('share', 'repost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE VERIFICACIÓN Y REFERRALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'phone', 'identity', 'age')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.referral_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL ,
  referred_id UUID NOT NULL ,
  token_amount DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
-- =====================================================
-- TABLAS DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL ,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE MODERACIÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.moderator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL ,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  total_minutes INTEGER DEFAULT 0,
  reports_reviewed INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.moderation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL ,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  reports_reviewed INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE INVITACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL ,
  invitee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
-- =====================================================
-- TABLAS DE ANÁLISIS IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.report_ai_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  classification TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  reasoning TEXT NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =====================================================
-- TABLAS DE APLICACIÓN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID ,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);
-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_token_balances_user_id ON public.user_token_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_records_user_id ON public.staking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_matches_user1 ON public.smart_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_smart_matches_user2 ON public.smart_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_moderator_sessions_moderator_id ON public.moderator_sessions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_metrics_moderator_id ON public.moderation_metrics(moderator_id);
-- Agregar columna inviter_id a invitations si no existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'invitations' AND column_name = 'inviter_id'
        ) THEN
            ALTER TABLE public.invitations ADD COLUMN inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON public.app_logs(user_id);
-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 
  'Migraciones completadas exitosamente' as status,
  NOW() as timestamp;
