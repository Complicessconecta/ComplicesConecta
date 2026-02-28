-- Migración para Moderación (Sesiones y Logs)
-- Fecha: 28 Feb 2026

-- 1. Tabla de Sesiones de Moderador
CREATE TABLE IF NOT EXISTS public.moderator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'interrupted'
    actions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla de Logs de Moderación
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- ID del objeto moderado (usuario, post, etc.)
    target_type TEXT NOT NULL, -- 'user', 'post', 'comment', 'story'
    action_type TEXT NOT NULL, -- 'ban', 'suspend', 'warn', 'delete', 'approve'
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.moderator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas (Solo admins y moderadores pueden ver/gestionar)
CREATE POLICY "Moderators can manage own sessions" ON public.moderator_sessions 
FOR ALL USING (auth.uid() = moderator_id);

CREATE POLICY "Moderators can view all logs" ON public.moderation_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Moderators can insert logs" ON public.moderation_logs
FOR INSERT WITH CHECK (auth.uid() = moderator_id);
