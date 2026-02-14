begin;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='System can insert reservations') THEN
    EXECUTE 'ALTER POLICY "System can insert reservations" ON public.reservations TO service_role';
    EXECUTE 'ALTER POLICY "System can insert reservations" ON public.reservations WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='System can update reservations') THEN
    EXECUTE 'ALTER POLICY "System can update reservations" ON public.reservations TO service_role';
    EXECUTE 'ALTER POLICY "System can update reservations" ON public.reservations USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='System can insert notifications') THEN
    EXECUTE 'ALTER POLICY "System can insert notifications" ON public.notifications TO service_role';
    EXECUTE 'ALTER POLICY "System can insert notifications" ON public.notifications WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_sessions' AND policyname='System can insert monitoring sessions') THEN
    EXECUTE 'ALTER POLICY "System can insert monitoring sessions" ON public.monitoring_sessions TO service_role';
    EXECUTE 'ALTER POLICY "System can insert monitoring sessions" ON public.monitoring_sessions WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_sessions' AND policyname='System can update monitoring sessions') THEN
    EXECUTE 'ALTER POLICY "System can update monitoring sessions" ON public.monitoring_sessions TO service_role';
    EXECUTE 'ALTER POLICY "System can update monitoring sessions" ON public.monitoring_sessions USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='security_audit_log' AND policyname='System can insert audit logs') THEN
    EXECUTE 'ALTER POLICY "System can insert audit logs" ON public.security_audit_log TO service_role';
    EXECUTE 'ALTER POLICY "System can insert audit logs" ON public.security_audit_log WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='security_audit_logs' AND policyname='system_can_insert_audit_logs') THEN
    EXECUTE 'ALTER POLICY "system_can_insert_audit_logs" ON public.security_audit_logs TO service_role';
    EXECUTE 'ALTER POLICY "system_can_insert_audit_logs" ON public.security_audit_logs WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='biometric_challenges' AND policyname='Authenticated users can create challenges') THEN
    EXECUTE 'ALTER POLICY "Authenticated users can create challenges" ON public.biometric_challenges TO service_role';
    EXECUTE 'ALTER POLICY "Authenticated users can create challenges" ON public.biometric_challenges WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

commit;
