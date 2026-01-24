-- Migración: Crear registros de administradores iniciales
-- Fecha: 24 Enero 2026
-- Autor: IA Assistant

-- Insertar administrador 1 (complicesconectasw@outlook.es)
-- NOTA: Usamos gen_random_uuid() para generar UUIDs válidos en lugar de strings personalizados
INSERT INTO admin_users (id, user_id, granted_by, role, is_unique, granted_at, created_at)
SELECT
  gen_random_uuid() as id,
  u.id as user_id,
  'system' as granted_by,
  'super_admin' as role,
  true as is_unique,
  NOW() as granted_at,
  NOW() as created_at
FROM auth.users u
WHERE u.email = 'complicesconectasw@outlook.es'
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Insertar administrador 2 (djwacko28@gmail.com)
INSERT INTO admin_users (id, user_id, granted_by, role, is_unique, granted_at, created_at)
SELECT
  gen_random_uuid() as id,
  u.id as user_id,
  'system' as granted_by,
  'super_admin' as role,
  true as is_unique,
  NOW() as granted_at,
  NOW() as created_at
FROM auth.users u
WHERE u.email = 'djwacko28@gmail.com'
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Comentario: Esta migración crea los registros iniciales de administradores con UUIDs válidos
-- Los IDs se generan automáticamente usando gen_random_uuid() en lugar de strings personalizados
