-- Agregar columna avatar_url a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
