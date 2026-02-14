ALTER TABLE public.anti_cheat_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_cheat_log FORCE ROW LEVEL SECURITY;

ALTER TABLE public.consent_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_evidence FORCE ROW LEVEL SECURITY;

ALTER TABLE public.fingerprint_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fingerprint_bans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.predictive_matching ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_matching FORCE ROW LEVEL SECURITY;

ALTER TABLE public.referral_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tokens FORCE ROW LEVEL SECURITY;

ALTER TABLE public.smart_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_matches FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anti_cheat_log_admin_all" ON public.anti_cheat_log;
CREATE POLICY "anti_cheat_log_admin_all" ON public.anti_cheat_log
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "anti_cheat_log_user_select" ON public.anti_cheat_log;
CREATE POLICY "anti_cheat_log_user_select" ON public.anti_cheat_log
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anti_cheat_log_user_insert" ON public.anti_cheat_log;
CREATE POLICY "anti_cheat_log_user_insert" ON public.anti_cheat_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anti_cheat_log_user_update" ON public.anti_cheat_log;
CREATE POLICY "anti_cheat_log_user_update" ON public.anti_cheat_log
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anti_cheat_log_user_delete" ON public.anti_cheat_log;
CREATE POLICY "anti_cheat_log_user_delete" ON public.anti_cheat_log
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictive_matching_admin_all" ON public.predictive_matching;
CREATE POLICY "predictive_matching_admin_all" ON public.predictive_matching
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "predictive_matching_user_select" ON public.predictive_matching;
CREATE POLICY "predictive_matching_user_select" ON public.predictive_matching
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictive_matching_user_insert" ON public.predictive_matching;
CREATE POLICY "predictive_matching_user_insert" ON public.predictive_matching
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictive_matching_user_update" ON public.predictive_matching;
CREATE POLICY "predictive_matching_user_update" ON public.predictive_matching
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "predictive_matching_user_delete" ON public.predictive_matching;
CREATE POLICY "predictive_matching_user_delete" ON public.predictive_matching
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verification_admin_all" ON public.user_verification;
CREATE POLICY "user_verification_admin_all" ON public.user_verification
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_verification_user_select" ON public.user_verification;
CREATE POLICY "user_verification_user_select" ON public.user_verification
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verification_user_insert" ON public.user_verification;
CREATE POLICY "user_verification_user_insert" ON public.user_verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verification_user_update" ON public.user_verification;
CREATE POLICY "user_verification_user_update" ON public.user_verification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verification_user_delete" ON public.user_verification;
CREATE POLICY "user_verification_user_delete" ON public.user_verification
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "referral_tokens_admin_all" ON public.referral_tokens;
CREATE POLICY "referral_tokens_admin_all" ON public.referral_tokens
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "referral_tokens_user_select" ON public.referral_tokens;
CREATE POLICY "referral_tokens_user_select" ON public.referral_tokens
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "referral_tokens_user_insert" ON public.referral_tokens;
CREATE POLICY "referral_tokens_user_insert" ON public.referral_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "referral_tokens_user_update" ON public.referral_tokens;
CREATE POLICY "referral_tokens_user_update" ON public.referral_tokens
  FOR UPDATE
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "referral_tokens_user_delete" ON public.referral_tokens;
CREATE POLICY "referral_tokens_user_delete" ON public.referral_tokens
  FOR DELETE
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "smart_matches_admin_all" ON public.smart_matches;
CREATE POLICY "smart_matches_admin_all" ON public.smart_matches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "smart_matches_user_select" ON public.smart_matches;
CREATE POLICY "smart_matches_user_select" ON public.smart_matches
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "smart_matches_user_insert" ON public.smart_matches;
CREATE POLICY "smart_matches_user_insert" ON public.smart_matches
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "smart_matches_user_update" ON public.smart_matches;
CREATE POLICY "smart_matches_user_update" ON public.smart_matches
  FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "smart_matches_user_delete" ON public.smart_matches;
CREATE POLICY "smart_matches_user_delete" ON public.smart_matches
  FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "fingerprint_bans_admin_all" ON public.fingerprint_bans;
CREATE POLICY "fingerprint_bans_admin_all" ON public.fingerprint_bans
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fingerprint_bans_user_select" ON public.fingerprint_bans;
CREATE POLICY "fingerprint_bans_user_select" ON public.fingerprint_bans
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fingerprint_bans_user_insert" ON public.fingerprint_bans;
CREATE POLICY "fingerprint_bans_user_insert" ON public.fingerprint_bans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fingerprint_bans_user_update" ON public.fingerprint_bans;
CREATE POLICY "fingerprint_bans_user_update" ON public.fingerprint_bans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fingerprint_bans_user_delete" ON public.fingerprint_bans;
CREATE POLICY "fingerprint_bans_user_delete" ON public.fingerprint_bans
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "consent_evidence_admin_all" ON public.consent_evidence;
CREATE POLICY "consent_evidence_admin_all" ON public.consent_evidence
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "consent_evidence_user_select" ON public.consent_evidence;
CREATE POLICY "consent_evidence_user_select" ON public.consent_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_consents uc
      WHERE uc.id = consent_evidence.consent_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consent_evidence_user_insert" ON public.consent_evidence;
CREATE POLICY "consent_evidence_user_insert" ON public.consent_evidence
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_consents uc
      WHERE uc.id = consent_evidence.consent_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consent_evidence_user_update" ON public.consent_evidence;
CREATE POLICY "consent_evidence_user_update" ON public.consent_evidence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_consents uc
      WHERE uc.id = consent_evidence.consent_id
        AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_consents uc
      WHERE uc.id = consent_evidence.consent_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "consent_evidence_user_delete" ON public.consent_evidence;
CREATE POLICY "consent_evidence_user_delete" ON public.consent_evidence
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_consents uc
      WHERE uc.id = consent_evidence.consent_id
        AND uc.user_id = auth.uid()
    )
  );
