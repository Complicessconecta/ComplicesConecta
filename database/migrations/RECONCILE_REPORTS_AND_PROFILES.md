# Especificación de Migración: Reconciliación de `reports` y Adición de Scoring a `profiles`

**Fecha:** 18 de diciembre de 2025
**Autor:** Lead Architect
**Estado:** **CRÍTICO** - El esquema de la base de datos está desincronizado con las migraciones del código. Se requiere una reconciliación antes de añadir nuevas funcionalidades.

## 1. Resumen del Problema

Se han identificado dos problemas críticos durante el análisis de la funcionalidad de reportes:

1.  **Esquema de `reports` Desincronizado:** El código (`src/features/profile/ProfileReportService.ts`) utiliza una tabla `reports` con una estructura completa y compleja. Sin embargo, no existe un archivo de migración que defina esta tabla. El único archivo encontrado (`...fix_reports_table.sql`) es un parche menor y no refleja el esquema real en uso. Esto indica que la tabla fue probablemente creada o modificada manualmente en el Supabase Studio.

2.  **Sistema de Scoring Incompleto:** El `ProfileReportService` calcula un score de perfil al vuelo, pero no lo persiste en la base de datos. El prompt requiere un sistema de semáforo (scoring persistente) en los perfiles.

Para resolver esto y seguir las buenas prácticas de Infraestructura como Código, se deben tomar las siguientes acciones.

## 2. Acción 1: Reconciliar la Tabla `reports`

Es imperativo crear un archivo de migración que represente el estado actual real de la tabla `reports`. Basado en el análisis del `ProfileReportService.ts`, el siguiente script SQL debería ser la fuente de verdad.

**Archivo Sugerido:** `supabase/migrations/YYYYMMDDHHMMSS_create_reports_table.sql`

```sql
-- MIGRACIÓN PARA CREAR LA TABLA 'reports' Y SUS DEPENDENCIAS

-- 1. Crear los tipos ENUM necesarios
CREATE TYPE report_status AS ENUM ('pending', 'in_review', 'resolved', 'dismissed');
CREATE TYPE report_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 2. Crear la tabla 'reports'
CREATE TABLE public.reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    reporter_user_id uuid NOT NULL,
    reported_user_id uuid NOT NULL,
    
    -- El tipo de contenido reportado (ej: 'profile', 'comment', 'message')
    content_type text NOT NULL,
    -- El ID del contenido específico reportado, si aplica
    reported_content_id text,
    
    reason text NOT NULL,
    description text,
    
    status report_status NOT NULL DEFAULT 'pending',
    severity report_severity NOT NULL DEFAULT 'medium',
    
    resolved_at timestamp with time zone,
    resolved_by uuid, -- FK a un user de admin/moderador
    resolution_notes text,

    CONSTRAINT reports_pkey PRIMARY KEY (id),
    CONSTRAINT reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Habilitar RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas RLS
-- La política "Users can create reports" ya existe y causa conflictos. Se debe gestionar en su propio archivo (Tarea #7)
-- Por ahora, esta es la política ideal:
CREATE POLICY "Los usuarios pueden crear reportes" ON public.reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Los usuarios pueden ver sus propios reportes enviados" ON public.reports
FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);

-- Los administradores/moderadores deberían tener políticas de acceso total.

-- 5. Crear un trigger para actualizar 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reports_update
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

```

## 3. Acción 2: Implementar Sistema de Scoring en `profiles`

Una vez que la tabla `reports` esté correctamente definida, se pueden añadir las columnas para el scoring en la tabla `profiles`.

**Archivo Sugerido:** `supabase/migrations/YYYYMMDDHHMMSS_add_scoring_to_profiles.sql`

```sql
-- MIGRACIÓN PARA AÑADIR COLUMNAS DE SCORING A LA TABLA 'profiles'

-- 1. Crear tipo ENUM para el status del score
CREATE TYPE profile_score_status AS ENUM ('green', 'yellow', 'red');

-- 2. Alterar la tabla 'profiles' para añadir las nuevas columnas
ALTER TABLE public.profiles
ADD COLUMN score integer NOT NULL DEFAULT 100,
ADD COLUMN score_status profile_score_status NOT NULL DEFAULT 'green';

-- 3. Añadir comentarios
COMMENT ON COLUMN public.profiles.score IS 'Puntaje de reputación del perfil (0-100).';
COMMENT ON COLUMN public.profiles.score_status IS 'Estado del semáforo del perfil basado en el score (green, yellow, red).';
```

## 4. Acción 3: Lógica de Backend para Cálculo de Score

Para mantener el score actualizado, se debe crear una función en la base de datos que se ejecute cuando un reporte es resuelto.

**Archivo Sugerido:** `supabase/migrations/YYYYMMDDHHMMSS_create_update_profile_score_fn.sql`

```sql
-- MIGRACIÓN PARA CREAR FUNCIÓN DE CÁLCULO DE SCORE

CREATE OR REPLACE FUNCTION public.update_profile_score(profile_id uuid)
RETURNS void AS $$
DECLARE
    report_count integer;
    new_score integer;
    new_status profile_score_status;
BEGIN
    -- Contar reportes válidos (resueltos) contra el usuario
    SELECT count(*) INTO report_count
    FROM public.reports
    WHERE reported_user_id = profile_id AND status = 'resolved';

    -- Lógica de cálculo de score (ejemplo)
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

-- Se necesita un trigger o una llamada explícita a esta función desde el backend 
-- cuando un moderador resuelve un reporte.
```

## 5. Guía de Integración

1.  **Ejecutar Migraciones:** Aplicar las 3 migraciones especificadas en orden.
2.  **Modificar `ProfileReportService`:**
    *   La función `resolveProfileReport` debe ser modificada para llamar a la nueva función de base de datos `update_profile_score` después de resolver un reporte.
    ```typescript
    // Dentro de resolveProfileReport, después de la actualización exitosa
    if (resolution === 'resolved') {
      const { error: scoreError } = await supabase.rpc('update_profile_score', {
        profile_id: data.reported_user_id
      });
      if (scoreError) {
        logger.error('Error actualizando el score del perfil:', { scoreError });
      }
    }
    ```
3.  **Actualizar UI:** Los componentes de UI como `ProfileCouple.tsx` y su hook `useProfileScore` deben ser modificados para leer las columnas `score` y `score_status` directamente del perfil del usuario, en lugar de calcularlo al vuelo.

Resolver esta desincronización y añadir la lógica de backend correcta es fundamental para la estabilidad y escalabilidad del sistema de moderación.
