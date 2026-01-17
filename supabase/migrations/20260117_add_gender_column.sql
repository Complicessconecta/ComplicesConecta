-- Agregar columna gender a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
