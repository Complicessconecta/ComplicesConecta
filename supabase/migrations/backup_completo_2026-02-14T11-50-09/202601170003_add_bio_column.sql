-- Agregar columna bio a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
