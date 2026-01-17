-- Agregar columna interests a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
