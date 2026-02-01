-- Migración: Crear registros de administradores iniciales
-- Fecha: 24 Enero 2026
-- Autor: IA Assistant

-- Insertar administrador 1 (complicesconectasw@outlook.es)
-- NOTA: Usamos gen_random_uuid() para generar UUIDs válidos en lugar de strings personalizados
-- La columna granted_by también debe ser un UUID válido
DO $$
DECLARE
  cols text := 'user_id, role, is_unique';
  vals text := 'u.id, ''super_admin'', true';
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'id'
  ) THEN
    cols := 'id, ' || cols;
    vals := 'gen_random_uuid(), ' || vals;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'granted_by'
  ) THEN
    cols := cols || ', granted_by';
    vals := vals || ', gen_random_uuid()';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'granted_at'
  ) THEN
    cols := cols || ', granted_at';
    vals := vals || ', NOW()';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'created_at'
  ) THEN
    cols := cols || ', created_at';
    vals := vals || ', NOW()';
  END IF;

  EXECUTE format(
    'INSERT INTO admin_users (%s) SELECT %s FROM auth.users u WHERE u.email = %L AND NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id) LIMIT 1;',
    cols,
    vals,
    'complicesconectasw@outlook.es'
  );
END $$;

-- Insertar administrador 2 (djwacko28@gmail.com)
DO $$
DECLARE
  cols text := 'user_id, role, is_unique';
  vals text := 'u.id, ''super_admin'', true';
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'id'
  ) THEN
    cols := 'id, ' || cols;
    vals := 'gen_random_uuid(), ' || vals;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'granted_by'
  ) THEN
    cols := cols || ', granted_by';
    vals := vals || ', gen_random_uuid()';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'granted_at'
  ) THEN
    cols := cols || ', granted_at';
    vals := vals || ', NOW()';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'created_at'
  ) THEN
    cols := cols || ', created_at';
    vals := vals || ', NOW()';
  END IF;

  EXECUTE format(
    'INSERT INTO admin_users (%s) SELECT %s FROM auth.users u WHERE u.email = %L AND NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id) LIMIT 1;',
    cols,
    vals,
    'djwacko28@gmail.com'
  );
END $$;

-- Comentario: Esta migración crea los registros iniciales de administradores con UUIDs válidos
-- Los IDs se generan automáticamente usando gen_random_uuid() en lugar de strings personalizados
