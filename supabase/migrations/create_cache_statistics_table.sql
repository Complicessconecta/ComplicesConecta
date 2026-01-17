-- Crear tabla cache_statistics para registrar estadísticas del cache
-- Fecha: 17 Ene 2026

CREATE TABLE IF NOT EXISTS public.cache_statistics (
  id BIGSERIAL PRIMARY KEY,
  hit_rate DECIMAL(5,4) NOT NULL,
  miss_rate DECIMAL(5,4) NOT NULL,
  total_hits INTEGER NOT NULL DEFAULT 0,
  total_misses INTEGER NOT NULL DEFAULT 0,
  average_access_time_ms DECIMAL(10,4) NOT NULL,
  memory_entries INTEGER NOT NULL DEFAULT 0,
  memory_size_bytes BIGINT NOT NULL DEFAULT 0,
  compression_ratio DECIMAL(5,4) NOT NULL,
  performance_score DECIMAL(5,4) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para optimizar consultas por timestamp
CREATE INDEX IF NOT EXISTS idx_cache_statistics_timestamp ON public.cache_statistics(timestamp DESC);

-- Crear índice para optimizar consultas por performance_score
CREATE INDEX IF NOT EXISTS idx_cache_statistics_performance_score ON public.cache_statistics(performance_score DESC);

-- Crear índice para optimizar consultas por hit_rate
CREATE INDEX IF NOT EXISTS idx_cache_statistics_hit_rate ON public.cache_statistics(hit_rate DESC);

-- Comentario en la tabla
COMMENT ON TABLE public.cache_statistics IS 'Estadísticas de rendimiento del cache del sistema';

-- Comentarios en las columnas
COMMENT ON COLUMN public.cache_statistics.hit_rate IS 'Tasa de aciertos del cache (0-1)';
COMMENT ON COLUMN public.cache_statistics.miss_rate IS 'Tasa de fallos del cache (0-1)';
COMMENT ON COLUMN public.cache_statistics.total_hits IS 'Número total de aciertos del cache';
COMMENT ON COLUMN public.cache_statistics.total_misses IS 'Número total de fallos del cache';
COMMENT ON COLUMN public.cache_statistics.average_access_time_ms IS 'Tiempo promedio de acceso en milisegundos';
COMMENT ON COLUMN public.cache_statistics.memory_entries IS 'Número de entradas en memoria';
COMMENT ON COLUMN public.cache_statistics.memory_size_bytes IS 'Tamaño total en memoria en bytes';
COMMENT ON COLUMN public.cache_statistics.compression_ratio IS 'Ratio de compresión de datos';
COMMENT ON COLUMN public.cache_statistics.performance_score IS 'Puntuación de rendimiento general (0-1)';
COMMENT ON COLUMN public.cache_statistics.timestamp IS 'Timestamp de la medición';
COMMENT ON COLUMN public.cache_statistics.created_at IS 'Fecha de creación del registro';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cache_statistics ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.cache_statistics;
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON public.cache_statistics
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción a administradores
DROP POLICY IF EXISTS "Permitir inserción a administradores" ON public.cache_statistics;
CREATE POLICY "Permitir inserción a administradores"
ON public.cache_statistics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir actualización a administradores
DROP POLICY IF EXISTS "Permitir actualización a administradores" ON public.cache_statistics;
CREATE POLICY "Permitir actualización a administradores"
ON public.cache_statistics
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
DROP POLICY IF EXISTS "Permitir eliminación a administradores" ON public.cache_statistics;
CREATE POLICY "Permitir eliminación a administradores"
ON public.cache_statistics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
