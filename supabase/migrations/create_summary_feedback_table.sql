-- Crear tabla summary_feedback
-- Esta tabla almacena el feedback de los usuarios sobre los resúmenes generados por IA

CREATE TABLE IF NOT EXISTS public.summary_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_summary_feedback_summary_id ON public.summary_feedback(summary_id);
CREATE INDEX IF NOT EXISTS idx_summary_feedback_user_id ON public.summary_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_feedback_created_at ON public.summary_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_summary_feedback_is_helpful ON public.summary_feedback(is_helpful);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.summary_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.summary_feedback;
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON public.summary_feedback
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Permitir inserción a usuarios autenticados" ON public.summary_feedback;
CREATE POLICY "Permitir inserción a usuarios autenticados"
ON public.summary_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Política para permitir actualización a administradores
DROP POLICY IF EXISTS "Permitir actualización a administradores" ON public.summary_feedback;
CREATE POLICY "Permitir actualización a administradores"
ON public.summary_feedback
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir eliminación a administradores
DROP POLICY IF EXISTS "Permitir eliminación a administradores" ON public.summary_feedback;
CREATE POLICY "Permitir eliminación a administradores"
ON public.summary_feedback
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Comentario sobre la tabla
COMMENT ON TABLE public.summary_feedback IS 'Almacena el feedback de los usuarios sobre los resúmenes generados por IA';
COMMENT ON COLUMN public.summary_feedback.summary_id IS 'ID del resumen generado por IA';
COMMENT ON COLUMN public.summary_feedback.is_helpful IS 'Indica si el resumen fue útil para el usuario';
COMMENT ON COLUMN public.summary_feedback.rating IS 'Calificación del resumen del 1 al 5';
