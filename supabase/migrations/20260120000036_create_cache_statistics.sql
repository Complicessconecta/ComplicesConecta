-- Crear tabla cache_statistics
CREATE TABLE IF NOT EXISTS public.cache_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hit_rate NUMERIC(5, 2) DEFAULT 0,
  miss_rate NUMERIC(5, 2) DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_misses INTEGER DEFAULT 0,
  average_access_time_ms NUMERIC(10, 2) DEFAULT 0,
  memory_entries INTEGER DEFAULT 0,
  memory_size_bytes BIGINT DEFAULT 0,
  compression_ratio NUMERIC(5, 2) DEFAULT 0,
  performance_score NUMERIC(5, 2) DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_cache_statistics_timestamp ON public.cache_statistics(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_statistics_performance_score ON public.cache_statistics(performance_score);

-- Habilitar RLS
ALTER TABLE public.cache_statistics ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver estadísticas de cache
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cache_statistics'
      AND policyname = 'Users can view cache statistics'
  ) THEN
    CREATE POLICY "Users can view cache statistics"
      ON public.cache_statistics FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Política para que los usuarios puedan insertar estadísticas de cache
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cache_statistics'
      AND policyname = 'Users can insert cache statistics'
  ) THEN
    CREATE POLICY "Users can insert cache statistics"
      ON public.cache_statistics FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;
