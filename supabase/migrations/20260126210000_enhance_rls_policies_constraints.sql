-- migrate:up

-- -----------------------------------------------------------------------------
-- MIGRACIÓN DE MEJORA: Políticas RLS completas + Constraints + Triggers
-- 
-- Esta migración ENRIQUECE las tablas existentes creadas en:
-- 20260126203000_create_missing_tables_views_src_audit.sql
-- 
-- Agrega:
-- - Enums para consistencia de datos
-- - Constraints CHECK, UNIQUE, NOT NULL robustos
-- - Triggers para updated_at y validaciones automáticas
-- - Políticas RLS completas con roles específicos
-- - Funciones helper para validación
-- -----------------------------------------------------------------------------

-- Enums para consistencia de datos (idempotentes)
DO $$ BEGIN
  CREATE TYPE public.chat_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.chat_permission_status AS ENUM ('pending', 'granted', 'denied', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.gallery_access_status AS ENUM ('pending', 'granted', 'denied', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.club_application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_permission_type AS ENUM ('view', 'download', 'share', 'comment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.violation_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Función helper para updated_at (si no existe)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función helper para validar UUIDs
CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN input_uuid IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Función helper para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND is_admin = true 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- MEJORAS A chat_requests
-- -----------------------------------------------------------------------------

-- Agregar columnas si no existen
DO $$
BEGIN
  -- Agregar expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_requests' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.chat_requests 
    ADD COLUMN expires_at timestamptz DEFAULT (timezone('utc', now()) + interval '7 days');
  END IF;

  -- Cambiar status a enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_requests' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.chat_requests 
    ALTER COLUMN status TYPE public.chat_request_status 
    USING status::public.chat_request_status;
  END IF;
END $$;

-- Agregar constraints robustos
DO $$
BEGIN
  -- Constraint para no auto-solicitud
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chat_requests_no_self_request'
  ) THEN
    ALTER TABLE public.chat_requests 
    ADD CONSTRAINT chat_requests_no_self_request 
    CHECK (sender_id != receiver_id);
  END IF;

  -- Constraint para validación de participantes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chat_requests_participants_valid'
  ) THEN
    ALTER TABLE public.chat_requests 
    ADD CONSTRAINT chat_requests_participants_valid 
    CHECK (
      sender_id IS NOT NULL 
      AND receiver_id IS NOT NULL 
      AND other_user_id IS NOT NULL
      AND receiver_id = other_user_id
    );
  END IF;

  -- Constraint para expires_at futuro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chat_requests_expires_future'
  ) THEN
    ALTER TABLE public.chat_requests 
    ADD CONSTRAINT chat_requests_expires_future 
    CHECK (expires_at > created_at);
  END IF;
END $$;

-- Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_expires_at ON public.chat_requests(expires_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS chat_requests_updated_at ON public.chat_requests;
CREATE TRIGGER chat_requests_updated_at
  BEFORE UPDATE ON public.chat_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Reemplazar políticas con versiones mejoradas
DROP POLICY IF EXISTS chat_requests_select_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_insert_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_update_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_delete_policy ON public.chat_requests;

DO $$
BEGIN
  -- SELECT mejorado: participantes, admins, service_role
  CREATE POLICY chat_requests_select_policy
  ON public.chat_requests
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR auth.uid() = other_user_id
  );

  -- INSERT mejorado: solo sender o service_role
  CREATE POLICY chat_requests_insert_policy
  ON public.chat_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() = sender_id AND public.is_valid_uuid(sender_id))
  );

  -- UPDATE mejorado: sender, receiver, admins
  CREATE POLICY chat_requests_update_policy
  ON public.chat_requests
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

  -- DELETE mejorado: sender, receiver, admins
  CREATE POLICY chat_requests_delete_policy
  ON public.chat_requests
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A chat_permissions
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- Cambiar status a enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_permissions' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.chat_permissions 
    ALTER COLUMN status TYPE public.chat_permission_status 
    USING status::public.chat_permission_status;
  END IF;

  -- Agregar columnas adicionales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_permissions' 
    AND column_name = 'granted_at'
  ) THEN
    ALTER TABLE public.chat_permissions 
    ADD COLUMN granted_at timestamptz,
    ADD COLUMN granted_by uuid REFERENCES public.profiles(id),
    ADD COLUMN expires_at timestamptz,
    ADD COLUMN reason text CHECK (length(reason) <= 500);
  END IF;
END $$;

-- Constraints para chat_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chat_permissions_no_self'
  ) THEN
    ALTER TABLE public.chat_permissions 
    ADD CONSTRAINT chat_permissions_no_self 
    CHECK (sender_id != receiver_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chat_permissions_granted_future'
  ) THEN
    ALTER TABLE public.chat_permissions 
    ADD CONSTRAINT chat_permissions_granted_future 
    CHECK (granted_at IS NULL OR granted_at <= created_at);
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_chat_permissions_status ON public.chat_permissions(status);
CREATE INDEX IF NOT EXISTS idx_chat_permissions_expires_at ON public.chat_permissions(expires_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS chat_permissions_updated_at ON public.chat_permissions;
CREATE TRIGGER chat_permissions_updated_at
  BEFORE UPDATE ON public.chat_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Reemplazar políticas mejoradas
DROP POLICY IF EXISTS chat_permissions_select_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_insert_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_update_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_delete_policy ON public.chat_permissions;

DO $$
BEGIN
  CREATE POLICY chat_permissions_select_policy
  ON public.chat_permissions
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR auth.uid() = other_user_id
  );

  CREATE POLICY chat_permissions_insert_policy
  ON public.chat_permissions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() = sender_id AND public.is_valid_uuid(sender_id))
  );

  CREATE POLICY chat_permissions_update_policy
  ON public.chat_permissions
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

  CREATE POLICY chat_permissions_delete_policy
  ON public.chat_permissions
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A gallery_access
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- Cambiar status a enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_access' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.gallery_access 
    ALTER COLUMN status TYPE public.gallery_access_status 
    USING status::public.gallery_access_status;
  END IF;

  -- Agregar columnas adicionales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_access' 
    AND column_name = 'access_count'
  ) THEN
    ALTER TABLE public.gallery_access 
    ADD COLUMN granted_at timestamptz,
    ADD COLUMN expires_at timestamptz DEFAULT (timezone('utc', now()) + interval '30 days'),
    ADD COLUMN access_count integer DEFAULT 0 CHECK (access_count >= 0),
    ADD COLUMN last_accessed timestamptz,
    ADD COLUMN reason text CHECK (length(reason) <= 300);
  END IF;
END $$;

-- Constraints para gallery_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'gallery_access_no_self'
  ) THEN
    ALTER TABLE public.gallery_access 
    ADD CONSTRAINT gallery_access_no_self 
    CHECK (owner_id != viewer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'gallery_access_expires_future'
  ) THEN
    ALTER TABLE public.gallery_access 
    ADD CONSTRAINT gallery_access_expires_future 
    CHECK (expires_at > created_at);
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_gallery_access_status ON public.gallery_access(status);
CREATE INDEX IF NOT EXISTS idx_gallery_access_expires_at ON public.gallery_access(expires_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS gallery_access_updated_at ON public.gallery_access;
CREATE TRIGGER gallery_access_updated_at
  BEFORE UPDATE ON public.gallery_access
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Reemplazar políticas mejoradas
DROP POLICY IF EXISTS gallery_access_select_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_insert_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_update_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_delete_policy ON public.gallery_access;

DO $$
BEGIN
  CREATE POLICY gallery_access_select_policy
  ON public.gallery_access
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = owner_id
    OR auth.uid() = viewer_id
  );

  CREATE POLICY gallery_access_insert_policy
  ON public.gallery_access
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() = viewer_id AND public.is_valid_uuid(viewer_id))
  );

  CREATE POLICY gallery_access_update_policy
  ON public.gallery_access
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = owner_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = owner_id
  );

  CREATE POLICY gallery_access_delete_policy
  ON public.gallery_access
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = owner_id
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A club_applications
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- Cambiar status a enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_applications' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.club_applications 
    ALTER COLUMN status TYPE public.club_application_status 
    USING status::public.club_application_status;
  END IF;

  -- Agregar columnas adicionales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'club_applications' 
    AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE public.club_applications 
    ADD COLUMN reviewed_by uuid REFERENCES public.profiles(id),
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN review_notes text CHECK (length(review_notes) <= 1000),
    ADD COLUMN rejection_reason text CHECK (length(rejection_reason) <= 500),
    ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Constraints robustos para club_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'club_applications_valid_email'
  ) THEN
    ALTER TABLE public.club_applications 
    ADD CONSTRAINT club_applications_valid_email 
    CHECK (email IS NOT NULL OR rep_email IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'club_applications_valid_phone'
  ) THEN
    ALTER TABLE public.club_applications 
    ADD CONSTRAINT club_applications_valid_phone 
    CHECK (phone IS NOT NULL OR rep_phone IS NOT NULL);
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_club_applications_reviewed_by ON public.club_applications(reviewed_by);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS club_applications_updated_at ON public.club_applications;
CREATE TRIGGER club_applications_updated_at
  BEFORE UPDATE ON public.club_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Reemplazar políticas mejoradas
DROP POLICY IF EXISTS club_applications_select_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_insert_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_update_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_delete_policy ON public.club_applications;

DO $$
BEGIN
  CREATE POLICY club_applications_select_policy
  ON public.club_applications
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

  CREATE POLICY club_applications_insert_policy
  ON public.club_applications
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
  );

  CREATE POLICY club_applications_update_policy
  ON public.club_applications
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );

  CREATE POLICY club_applications_delete_policy
  ON public.club_applications
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A content_permissions
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_permissions' 
    AND column_name = 'permission_type'
  ) THEN
    ALTER TABLE public.content_permissions 
    ADD COLUMN permission_type public.content_permission_type NOT NULL DEFAULT 'view',
    ADD COLUMN granted_by uuid REFERENCES auth.users(id),
    ADD COLUMN granted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    ADD COLUMN expires_at timestamptz,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true,
    ADD COLUMN usage_count integer DEFAULT 0 CHECK (usage_count >= 0),
    ADD COLUMN last_used timestamptz,
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Constraints para content_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'content_permissions_expires_future'
  ) THEN
    ALTER TABLE public.content_permissions 
    ADD CONSTRAINT content_permissions_expires_future 
    CHECK (expires_at IS NULL OR expires_at > granted_at);
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_content_permissions_type ON public.content_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_content_permissions_active ON public.content_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_content_permissions_expires_at ON public.content_permissions(expires_at);

-- Reemplazar políticas mejoradas
DROP POLICY IF EXISTS content_permissions_select_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_insert_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_update_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_delete_policy ON public.content_permissions;

DO $$
BEGIN
  CREATE POLICY content_permissions_select_policy
  ON public.content_permissions
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = user_id
    OR auth.uid() = granted_by
  );

  CREATE POLICY content_permissions_insert_policy
  ON public.content_permissions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = granted_by
    OR auth.uid() = user_id
  );

  CREATE POLICY content_permissions_update_policy
  ON public.content_permissions
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = granted_by
    OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = granted_by
    OR auth.uid() = user_id
  );

  CREATE POLICY content_permissions_delete_policy
  ON public.content_permissions
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = granted_by
    OR auth.uid() = user_id
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A content_violations
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_violations' 
    AND column_name = 'severity'
  ) THEN
    ALTER TABLE public.content_violations 
    ADD COLUMN severity public.violation_severity NOT NULL DEFAULT 'medium',
    ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN resolution_notes text CHECK (length(resolution_notes) <= 1000),
    ADD COLUMN action_taken text CHECK (length(action_taken) <= 200);
  END IF;
END $$;

-- Constraints para content_violations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'content_violations_valid_reporter'
  ) THEN
    ALTER TABLE public.content_violations 
    ADD CONSTRAINT content_violations_valid_reporter 
    CHECK (
      reporter_id IS NOT NULL 
      OR event_type IN ('automatic', 'system_detected')
    );
  END IF;
END $$;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_content_violations_severity ON public.content_violations(severity);
CREATE INDEX IF NOT EXISTS idx_content_violations_status ON public.content_violations(status);
CREATE INDEX IF NOT EXISTS idx_content_violations_reviewed_by ON public.content_violations(reviewed_by);

-- Reemplazar políticas mejoradas
DROP POLICY IF EXISTS content_violations_select_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_insert_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_update_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_delete_policy ON public.content_violations;

DO $$
BEGIN
  CREATE POLICY content_violations_select_policy
  ON public.content_violations
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = reporter_id
    OR auth.uid() = user_id
  );

  CREATE POLICY content_violations_insert_policy
  ON public.content_violations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
  );

  CREATE POLICY content_violations_update_policy
  ON public.content_violations
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = reporter_id
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = reporter_id
  );

  CREATE POLICY content_violations_delete_policy
  ON public.content_violations
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
  );
END $$;

-- -----------------------------------------------------------------------------
-- MEJORAS A couple_profiles_with_partners (VIEW)
-- -----------------------------------------------------------------------------

-- Recrear view con mejoras
DROP VIEW IF EXISTS public.couple_profiles_with_partners;

CREATE OR REPLACE VIEW public.couple_profiles_with_partners
AS
SELECT
  cp.id,
  cp.user_id,
  cp.partner_1_id AS partner1_id,
  cp.partner_2_id AS partner2_id,
  cp.couple_name,
  cp.couple_bio,
  cp.relationship_type,
  cp.location,
  cp.is_verified,
  cp.is_premium,
  cp.created_at,
  cp.updated_at,
  p1.first_name AS partner1_first_name,
  p1.last_name AS partner1_last_name,
  p1.age AS partner1_age,
  p1.gender AS partner1_gender,
  p1.bio AS partner1_bio,
  p1.avatar_url AS partner1_avatar_url,
  p1.is_active AS partner1_is_active,
  p2.first_name AS partner2_first_name,
  p2.last_name AS partner2_last_name,
  p2.age AS partner2_age,
  p2.gender AS partner2_gender,
  p2.bio AS partner2_bio,
  p2.avatar_url AS partner2_avatar_url,
  p2.is_active AS partner2_is_active,
  -- Campos calculados
  CASE 
    WHEN p1.is_active = true AND p2.is_active = true THEN 'both_active'
    WHEN p1.is_active = true OR p2.is_active = true THEN 'one_active'
    ELSE 'both_inactive'
  END as activity_status
FROM public.couple_profiles cp
LEFT JOIN public.profiles p1 ON p1.id = cp.partner_1_id
LEFT JOIN public.profiles p2 ON p2.id = cp.partner_2_id;

-- Security barrier para la vista
ALTER VIEW public.couple_profiles_with_partners SET (security_barrier = true);

-- Política para la view mejorada
DROP POLICY IF EXISTS couple_profiles_with_partners_select_policy ON public.couple_profiles_with_partners;

DO $$
BEGIN
  CREATE POLICY couple_profiles_with_partners_select_policy
  ON public.couple_profiles_with_partners
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_admin(auth.uid())
    OR auth.uid() = user_id
    OR auth.uid() = partner1_id
    OR auth.uid() = partner2_id
  );
END $$;

-- -----------------------------------------------------------------------------
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA (opcional)
-- -----------------------------------------------------------------------------

-- Función para limpiar registros expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_records()
RETURNS void AS $$
BEGIN
  -- Limpiar chat_requests expirados
  DELETE FROM public.chat_requests 
  WHERE expires_at < timezone('utc', now()) 
  AND status = 'pending';
  
  -- Limpiar chat_permissions expirados
  UPDATE public.chat_permissions 
  SET status = 'revoked' 
  WHERE expires_at IS NOT NULL 
  AND expires_at < timezone('utc', now()) 
  AND status = 'granted';
  
  -- Limpiar gallery_access expirado
  UPDATE public.gallery_access 
  SET status = 'revoked' 
  WHERE expires_at IS NOT NULL 
  AND expires_at < timezone('utc', now()) 
  AND status = 'granted';
  
  -- Limpiar content_permissions expirado
  UPDATE public.content_permissions 
  SET is_active = false 
  WHERE expires_at IS NOT NULL 
  AND expires_at < timezone('utc', now()) 
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- migrate:down

-- Eliminar políticas en orden inverso
DROP POLICY IF EXISTS couple_profiles_with_partners_select_policy ON public.couple_profiles_with_partners;
DROP VIEW IF EXISTS public.couple_profiles_with_partners;

DROP POLICY IF EXISTS content_violations_delete_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_update_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_insert_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_select_policy ON public.content_violations;

DROP POLICY IF EXISTS content_permissions_delete_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_update_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_insert_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_select_policy ON public.content_permissions;

DROP POLICY IF EXISTS club_applications_delete_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_update_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_insert_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_select_policy ON public.club_applications;

DROP POLICY IF EXISTS gallery_access_delete_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_update_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_insert_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_select_policy ON public.gallery_access;

DROP POLICY IF EXISTS chat_permissions_delete_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_update_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_insert_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_select_policy ON public.chat_permissions;

DROP POLICY IF EXISTS chat_requests_delete_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_update_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_insert_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_select_policy ON public.chat_requests;

-- Eliminar triggers
DROP TRIGGER IF EXISTS chat_requests_updated_at ON public.chat_requests;
DROP TRIGGER IF EXISTS chat_permissions_updated_at ON public.chat_permissions;
DROP TRIGGER IF EXISTS gallery_access_updated_at ON public.gallery_access;
DROP TRIGGER IF EXISTS club_applications_updated_at ON public.club_applications;

-- Eliminar función de limpieza
DROP FUNCTION IF EXISTS public.cleanup_expired_records();

-- Eliminar funciones helper
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_valid_uuid(uuid);
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Eliminar enums
DROP TYPE IF EXISTS public.violation_severity;
DROP TYPE IF EXISTS public.content_permission_type;
DROP TYPE IF EXISTS public.club_application_status;
DROP TYPE IF EXISTS public.gallery_access_status;
DROP TYPE IF EXISTS public.chat_permission_status;
DROP TYPE IF EXISTS public.chat_request_status;
