# Especificación de Tabla Faltante: `couple_agreements`

**Fecha:** 18 de diciembre de 2025
**Autor:** Lead Architect
**Estado:** **CRÍTICO** - Tabla no existe. Implementación requerida.

## 1. Resumen del Problema

Durante la validación del componente `src/components/profiles/couple/CouplePreNuptialAgreement.tsx`, se ha determinado que el componente está completamente implementado en el frontend, pero su dependencia principal en la base de datos, la tabla `couple_agreements`, no existe. No se ha encontrado ningún archivo de migración de Supabase que cree esta tabla.

Esta ausencia impide por completo el funcionamiento de la gestión de acuerdos prenupciales digitales y la resolución de disputas, que son funcionalidades clave del perfil de pareja.

## 2. Especificaciones Técnicas

A continuación se detalla el script SQL necesario para crear la tabla, sus columnas, tipos de datos, y las políticas de seguridad a nivel de fila (RLS) indispensables para su correcto y seguro funcionamiento.

### 2.1. Script de Migración SQL

```sql
-- MIGRACIÓN PARA CREAR LA TABLA 'couple_agreements' Y HABILITAR RLS

-- 1. Crear el tipo ENUM para el estado del acuerdo
CREATE TYPE couple_agreement_status AS ENUM (
    'PENDING',      -- Esperando firmas de una o ambas partes
    'ACTIVE',       -- Firmado por ambas partes, acuerdo en vigor
    'DISPUTED',     -- Una de las partes ha iniciado una disputa
    'DISSOLVED',    -- El acuerdo ha sido disuelto tras una disputa
    'FORFEITED'     -- Los activos han sido transferidos a la plataforma por la cláusula de muerte súbita
);

-- 2. Crear la tabla principal 'couple_agreements'
CREATE TABLE public.couple_agreements (
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
    status couple_agreement_status NOT NULL DEFAULT 'PENDING'::couple_agreement_status,
    signed_at timestamp with time zone, -- Se llena cuando ambos firman
    dispute_deadline timestamp with time zone, -- Se establece si el estado cambia a DISPUTED

    CONSTRAINT couple_agreements_pkey PRIMARY KEY (id),
    CONSTRAINT couple_agreements_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT couple_agreements_partner_1_id_fkey FOREIGN KEY (partner_1_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT couple_agreements_partner_2_id_fkey FOREIGN KEY (partner_2_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS
-- POLÍTICA: Los miembros de la pareja pueden ver su propio acuerdo.
CREATE POLICY "Partners can view their own agreement"
ON public.couple_agreements
FOR SELECT USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

-- POLÍTICA: Un miembro de la pareja puede crear un acuerdo para su pareja.
CREATE POLICY "Partners can create an agreement for their couple"
ON public.couple_agreements
FOR INSERT WITH CHECK (
    (auth.uid() = partner_1_id OR auth.uid() = partner_2_id) AND
    couple_id IS NOT NULL -- Asegurar que se asocie a un perfil de pareja
);

-- POLÍTICA: Un miembro de la pareja puede actualizar el acuerdo (para firmarlo).
CREATE POLICY "Partners can update the agreement to sign it"
ON public.couple_agreements
FOR UPDATE USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
) WITH CHECK (
    -- Un usuario solo puede modificar su propia firma o IP
    (auth.uid() = partner_1_id AND partner_2_signature = (SELECT partner_2_signature FROM public.couple_agreements WHERE id = couple_agreements.id)) OR
    (auth.uid() = partner_2_id AND partner_1_signature = (SELECT partner_1_signature FROM public.couple_agreements WHERE id = couple_agreements.id))
);

-- POLÍTICA: Nadie puede eliminar acuerdos para mantener la integridad legal.
-- Se omite la política de DELETE para denegar la eliminación por defecto.

-- 5. Añadir comentarios a la tabla y columnas para mayor claridad
COMMENT ON TABLE public.couple_agreements IS 'Almacena los acuerdos prenupciales digitales para las parejas, incluyendo firmas y estado.';
COMMENT ON COLUMN public.couple_agreements.status IS 'Estado actual del acuerdo: PENDING, ACTIVE, DISPUTED, DISSOLVED, FORFEITED.';
COMMENT ON COLUMN public.couple_agreements.death_clause_text IS 'Texto de la cláusula de muerte súbita que aplica al acuerdo.';
COMMENT ON COLUMN public.couple_agreements.agreement_hash IS 'Hash SHA-256 del contenido del acuerdo para verificar su integridad.';

```

## 3. Guía de Integración

1.  **Crear la Migración:** Guardar el contenido del script SQL anterior en un nuevo archivo de migración de Supabase en la carpeta `supabase/migrations/`. Nombre sugerido: `YYYYMMDDHHMMSS_create_couple_agreements.sql`.
2.  **Aplicar la Migración:** Ejecutar el comando `supabase db push` (o el equivalente en el flujo de trabajo del proyecto) para aplicar la migración a la base deatos de desarrollo.
3.  **Verificar Componentes:** Una vez aplicada la migración, los componentes `CouplePreNuptialAgreement.tsx` y `CoupleDisputeManager.tsx` deberían poder interactuar con la tabla.
4.  **Pruebas:** Realizar pruebas de extremo a extremo:
    *   Un usuario (partner 1) crea el acuerdo.
    *   Verificar que se crea una fila en `couple_agreements` en estado `PENDING`.
    *   El mismo usuario firma. Verificar que `partner_1_signature` es `true`.
    *   El otro usuario (partner 2) inicia sesión y firma.
    *   Verificar que `partner_2_signature` es `true` y que el estado del acuerdo cambia a `ACTIVE`.

La implementación de esta tabla es un requisito indispensable para avanzar con la validación de los componentes de pareja.
