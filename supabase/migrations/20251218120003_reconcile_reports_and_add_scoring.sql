-- MIGRACIÓN PARA RECONCILIAR 'reports' Y AÑADIR SCORING A 'profiles'
-- Fecha: 2025-12-18

-- =================================================================
-- PARTE 1: Reconciliación de la tabla 'reports'
-- =================================================================
-- Se crea la tabla con el esquema completo que espera la aplicación.
-- Esto asegura que las migraciones reflejen el estado real de la base de datos.

-- 1. Crear los tipos ENUM necesarios si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM ('pending', 'in_review', 'resolved', 'dismissed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_severity') THEN
        CREATE TYPE public.report_severity AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END$$;

-- 2. Crear la tabla 'reports' con todas las columnas esperadas
-- Usamos IF NOT EXISTS para seguridad, aunque la meta es tener una definición única.
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    reporter_user_id uuid, -- Hacer nullable para usar ON DELETE SET NULL
    reported_user_id uuid NOT NULL,

    content_type text NOT NULL,
    reported_content_id text,

    reason text NOT NULL,
    description text,

    status public.report_status NOT NULL DEFAULT 'pending',
    severity public.report_severity NOT NULL DEFAULT 'medium',

    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text,

    CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4. Re-aplicar políticas de forma idempotente
-- La política "Users can create reports" se maneja en su propio archivo, pero aquí aseguramos las demás.
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios reportes enviados" ON public.reports;
CREATE POLICY "Los usuarios pueden ver sus propios reportes enviados" ON public.reports
FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);


-- 5. Crear un trigger para actualizar 'updated_at' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_reports_update') THEN
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER on_reports_update
        BEFORE UPDATE ON public.reports
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END$$;


-- =================================================================
-- PARTE 2: Implementación del Sistema de Scoring en 'profiles'
-- =================================================================

-- 1. Crear tipo ENUM para el status del score si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_score_status') THEN
        CREATE TYPE public.profile_score_status AS ENUM ('green', 'yellow', 'red');
    END IF;
END$$;

-- 2. Alterar la tabla 'profiles' para añadir las nuevas columnas si no existen
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_status public.profile_score_status NOT NULL DEFAULT 'green';

-- 3. Añadir comentarios
COMMENT ON COLUMN public.profiles.score IS 'Puntaje de reputación del perfil (0-100).';
COMMENT ON COLUMN public.profiles.score_status IS 'Estado del semáforo del perfil basado en el score (green, yellow, red).';


-- =================================================================
-- PARTE 3: Lógica de Backend para Cálculo de Score
-- =================================================================

-- Crear la función de base de datos que calcula y actualiza el score de un perfil.
CREATE OR REPLACE FUNCTION public.update_profile_score(profile_id uuid)
RETURNS void AS $$
DECLARE
    report_count integer;
    new_score integer;
    new_status public.profile_score_status;
BEGIN
    -- Contar reportes válidos ('resolved') contra el usuario
    SELECT count(*) INTO report_count
    FROM public.reports
    WHERE reported_user_id = profile_id AND status = 'resolved';

    -- Lógica de cálculo de score (10 puntos por reporte resuelto)
    new_score := 100 - (report_count * 10);
    IF new_score < 0 THEN
        new_score := 0;
    END IF;

    -- Determinar el estado del semáforo
    IF new_score >= 80 THEN
        new_status := 'green';
    ELSIF new_score >= 50 THEN
        new_status := 'yellow';
    ELSE
        new_status := 'red';
    END IF;

    -- Actualizar la tabla de perfiles
    UPDATE public.profiles
    SET
        score = new_score,
        score_status = new_status
    WHERE id = profile_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_profile_score(uuid) IS 'Calcula y actualiza el score de reputación y el estado de un perfil basado en reportes válidos.';
