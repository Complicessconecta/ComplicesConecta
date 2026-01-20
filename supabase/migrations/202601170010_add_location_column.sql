-- Agregar columna location a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
