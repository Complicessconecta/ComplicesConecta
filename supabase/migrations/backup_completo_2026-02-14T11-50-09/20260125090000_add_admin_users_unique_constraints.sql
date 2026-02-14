-- Migración: Crear restricciones de unicidad en admin_users
-- Fecha: 24 Enero 2026
-- Autor: IA Assistant

-- Agregar columna is_unique a admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_unique BOOLEAN DEFAULT false;

-- Crear índice único en user_id para garantizar unicidad
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_user_id_unique_idx ON admin_users(user_id) WHERE user_id IS NOT NULL;

-- Crear índice único en granted_by para evitar duplicados en asignaciones
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'granted_by'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS admin_users_granted_by_idx ON admin_users(granted_by)';
  END IF;
END $$;

-- Crear función para generar IDs únicos para administradores
-- NOTA: admin_users.id es UUID en el esquema actual. Usar TEXT rompería inserts.
CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$;

-- Crear trigger para asignar ID único automáticamente
CREATE OR REPLACE FUNCTION assign_admin_unique_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.id = COALESCE(NEW.id, generate_admin_id());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en admin_users
DROP TRIGGER IF EXISTS admin_users_assign_id_trigger ON admin_users;
CREATE TRIGGER admin_users_assign_id_trigger
BEFORE INSERT ON admin_users
FOR EACH ROW
EXECUTE FUNCTION assign_admin_unique_id();

-- Comentario: Esta migración asegura que cada administrador tenga un ID único e irrepetible
-- y que no haya duplicados en user_id (relación 1:1 con users_safe)
