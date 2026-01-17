-- Agregar columna error_type a error_alerts
ALTER TABLE error_alerts ADD COLUMN IF NOT EXISTS error_type TEXT;
