-- Agregar columna 'read' a tabla notifications para compatibilidad con código existente
-- Fecha: 14 de Enero, 2026

-- Verificar si la columna 'read' existe, si no, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
        RAISE NOTICE '✅ Columna read agregada a notifications';
    ELSE
        RAISE NOTICE '⚠️ Columna read ya existe en notifications';
    END IF;
END $$;

-- Crear índices para optimizar consultas de notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read) WHERE read = false;

-- Comentarios para documentación
COMMENT ON COLUMN public.notifications.read IS 'Indica si la notificación ha sido leída (compatibilidad con código existente)';
