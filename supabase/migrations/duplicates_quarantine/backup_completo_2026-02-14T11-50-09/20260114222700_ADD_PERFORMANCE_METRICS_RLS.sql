-- ============================================================================
-- MIGRACIÓN: 20260114222700_ADD_PERFORMANCE_METRICS_RLS.sql
-- ============================================================================
-- Fecha: 14 de Enero, 2026 - 22:27 hrs UTC-06:00
-- Descripción: Habilitar RLS y crear políticas para performance_metrics
-- Objetivo: Asegurar la tabla performance_metrics con políticas de seguridad
-- Prioridad: Alta - Riesgo de seguridad
-- Referencia: REPORTE_AUDITORIA_SUPABASE_20260114.md
-- ============================================================================

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: performance_metrics
-- ============================================================================

-- Política: Solo usuarios autenticados pueden insertar métricas
CREATE POLICY performance_metrics_insert ON public.performance_metrics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Usuarios pueden ver sus propias métricas
CREATE POLICY performance_metrics_read_own ON public.performance_metrics
FOR SELECT
USING (user_id = auth.uid());

-- Política: Admins pueden ver todas las métricas
CREATE POLICY performance_metrics_read_admin ON public.performance_metrics
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM auth.users
        WHERE raw_user_meta_data->>'role' = 'admin'
    )
);

-- Política: Usuarios pueden actualizar sus propias métricas
CREATE POLICY performance_metrics_update_own ON public.performance_metrics
FOR UPDATE
USING (user_id = auth.uid());

-- Política: Admins pueden actualizar cualquier métrica
CREATE POLICY performance_metrics_update_admin ON public.performance_metrics
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id FROM auth.users
        WHERE raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- CONFIRMACIÓN
-- ============================================================================
-- Generado: 14 de Enero, 2026
-- Tabla: performance_metrics
-- RLS: Habilitado ✅
-- Políticas creadas: 5
-- Estado: Seguro
-- ============================================================================
