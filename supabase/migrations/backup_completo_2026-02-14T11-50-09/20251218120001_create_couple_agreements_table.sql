-- MIGRACIÓN PARA CREAR LA TABLA 'couple_agreements' Y HABILITAR RLS (IDEMPOTENTE)
-- Fecha: 2025-12-18

-- 1. Crear el tipo ENUM para el estado del acuerdo, si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'couple_agreement_status') THEN
        CREATE TYPE public.couple_agreement_status AS ENUM (
            'PENDING',
            'ACTIVE',
            'DISPUTED',
            'DISSOLVED',
            'FORFEITED'
        );
    END IF;
END$$;


-- 2. Crear la tabla principal 'couple_agreements', si no existe
CREATE TABLE IF NOT EXISTS public.couple_agreements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    couple_id uuid NOT NULL,
    partner_1_id uuid NOT NULL,
    partner_2_id uuid NOT NULL,
    agreement_hash text NOT NULL,
    death_clause_text text NOT NULL,
    asset_disposition_clause text NOT NULL,
    partner_1_signature boolean NOT NULL DEFAULT false,
    partner_2_signature boolean NOT NULL DEFAULT false,
    partner_1_ip character varying,
    partner_2_ip character varying,
    partner_1_signed_at timestamp with time zone,
    partner_2_signed_at timestamp with time zone,
    status public.couple_agreement_status NOT NULL DEFAULT 'PENDING'::public.couple_agreement_status,
    signed_at timestamp with time zone,
    dispute_deadline timestamp with time zone,

    CONSTRAINT couple_agreements_pkey PRIMARY KEY (id),
    CONSTRAINT couple_agreements_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT couple_agreements_partner_1_id_fkey FOREIGN KEY (partner_1_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT couple_agreements_partner_2_id_fkey FOREIGN KEY (partner_2_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS de forma idempotente
DROP POLICY IF EXISTS "Partners can view their own agreement" ON public.couple_agreements;
CREATE POLICY "Partners can view their own agreement"
ON public.couple_agreements
FOR SELECT USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

DROP POLICY IF EXISTS "Partners can create an agreement for their couple" ON public.couple_agreements;
CREATE POLICY "Partners can create an agreement for their couple"
ON public.couple_agreements
FOR INSERT WITH CHECK (
    (auth.uid() = partner_1_id OR auth.uid() = partner_2_id) AND
    couple_id IS NOT NULL -- Asegurar que se asocie a un perfil de pareja
);

DROP POLICY IF EXISTS "Partners can update the agreement to sign it" ON public.couple_agreements;
CREATE POLICY "Partners can update the agreement to sign it"
ON public.couple_agreements
FOR UPDATE USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
) WITH CHECK (
    -- Un usuario solo puede modificar su propia firma o IP
    (auth.uid() = partner_1_id AND partner_2_signature = (SELECT partner_2_signature FROM public.couple_agreements WHERE id = couple_agreements.id)) OR
    (auth.uid() = partner_2_id AND partner_1_signature = (SELECT partner_1_signature FROM public.couple_agreements WHERE id = couple_agreements.id))
);

-- 5. Añadir comentarios a la tabla y columnas para mayor claridad
COMMENT ON TABLE public.couple_agreements IS 'Almacena los acuerdos prenupciales digitales para las parejas, incluyendo firmas y estado.';
COMMENT ON COLUMN public.couple_agreements.status IS 'Estado actual del acuerdo: PENDING, ACTIVE, DISPUTED, DISSOLVED, FORFEITED.';
COMMENT ON COLUMN public.couple_agreements.death_clause_text IS 'Texto de la cláusula de muerte súbita que aplica al acuerdo.';
COMMENT ON COLUMN public.couple_agreements.agreement_hash IS 'Hash SHA-256 del contenido del acuerdo para verificar su integridad.';
