-- Migración para Clasificación de Reportes con IA
-- Fecha: 28 Feb 2026

CREATE TABLE IF NOT EXISTS public.report_ai_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL, -- Referencia a la tabla de reportes (asumida existente o genérica)
    category TEXT NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    is_automated BOOLEAN DEFAULT true,
    ai_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.report_ai_classification ENABLE ROW LEVEL SECURITY;

-- Solo admins/moderadores deberían ver esto (usando user_roles para consistencia)
CREATE POLICY "Admins and moderators can view AI classifications" ON public.report_ai_classification
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);
