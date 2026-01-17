-- ============================================================================
-- Add error_type column to error_alerts
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Agregar columna error_type a la tabla error_alerts
-- ============================================================================

-- Verificar si la tabla error_alerts existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'error_alerts'
  ) THEN
    -- Crear tabla error_alerts si no existe
    CREATE TABLE public.error_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT DEFAULT 'unknown',
      error_message TEXT NOT NULL,
      error_stack TEXT,
      metadata JSONB DEFAULT '{}',
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID,
      url TEXT
    );

    -- Crear índices
    CREATE INDEX idx_error_alerts_user_id ON public.error_alerts(user_id);
    CREATE INDEX idx_error_alerts_category ON public.error_alerts(category);
    CREATE INDEX idx_error_alerts_resolved ON public.error_alerts(resolved);

    -- Habilitar RLS
    ALTER TABLE public.error_alerts ENABLE ROW LEVEL SECURITY;

    -- Crear políticas RLS
    CREATE POLICY users_can_view_own_alerts ON public.error_alerts
    FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY users_can_insert_own_alerts ON public.error_alerts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY users_can_update_own_alerts ON public.error_alerts
    FOR UPDATE
    USING (auth.uid() = user_id);

    -- Política para admins
    CREATE POLICY admins_can_view_all_alerts ON public.error_alerts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );

    RAISE NOTICE '✅ Tabla error_alerts creada';
  END IF;
END $$;

-- Agregar columna error_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_alerts' 
    AND column_name = 'error_type'
  ) THEN
    ALTER TABLE public.error_alerts ADD COLUMN error_type TEXT DEFAULT 'unknown';
    RAISE NOTICE '✅ Columna error_type agregada a error_alerts';
  ELSE
    RAISE NOTICE '⚠️ Columna error_type ya existe en error_alerts';
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.error_alerts.error_type IS 'Tipo de error (ej. network, auth, validation)';
COMMENT ON TABLE public.error_alerts IS 'Alertas de error para monitoreo y debugging';

-- Notificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
END $$;
