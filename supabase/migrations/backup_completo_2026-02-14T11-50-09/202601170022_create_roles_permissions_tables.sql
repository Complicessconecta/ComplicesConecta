-- ============================================================================
-- Roles and Permissions Table Setup - Principio de Menor Privilegio
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tablas para RBAC (Role-Based Access Control)
-- ============================================================================

-- Crear enum para roles
CREATE TYPE role_enum AS ENUM ('user', 'moderator', 'admin');

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name role_enum NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL, -- Recurso: 'users', 'posts', 'events', etc.
  action TEXT NOT NULL, -- Acción: 'create', 'read', 'update', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de roles_permisos (many-to-many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Crear tabla de roles de usuario (usar tabla existente si ya existe)
-- Nota: La tabla user_roles ya existe en el sistema
-- Esta migración solo crea las tablas faltantes: roles, permissions, role_permissions

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Índices en user_roles - verificar que columnas existan antes de crear
DO $$
BEGIN
  -- Verificar si existe la tabla user_roles
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    -- Crear índice en user_id si existe la columna
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'user_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)';
    END IF;

    -- Crear índice en role_id si existe la columna
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id)';
    END IF;

    -- Crear índice en is_active si existe la columna
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'is_active'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON public.user_roles(is_active)';
    END IF;
  END IF;
END $$;

-- Insertar roles por defecto
INSERT INTO public.roles (name, description, permissions) VALUES
  ('user', 'Usuario regular', '{"read_own_profile": true, "update_own_profile": true, "create_posts": true, "read_public_content": true}'),
  ('moderator', 'Moderador de contenido', '{"read_own_profile": true, "update_own_profile": true, "create_posts": true, "read_public_content": true, "moderate_content": true, "delete_reports": true}'),
  ('admin', 'Administrador del sistema', '{"read_own_profile": true, "update_own_profile": true, "create_posts": true, "read_public_content": true, "moderate_content": true, "delete_reports": true, "manage_users": true, "manage_roles": true, "view_analytics": true}')
ON CONFLICT (name) DO NOTHING;

-- Insertar permisos por defecto
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('read_own_profile', 'Leer perfil propio', 'profiles', 'read'),
  ('update_own_profile', 'Actualizar perfil propio', 'profiles', 'update'),
  ('create_posts', 'Crear publicaciones', 'posts', 'create'),
  ('read_public_content', 'Leer contenido público', 'content', 'read'),
  ('moderate_content', 'Moderar contenido', 'content', 'update'),
  ('delete_reports', 'Eliminar reportes', 'reports', 'delete'),
  ('manage_users', 'Gestionar usuarios', 'users', 'update'),
  ('manage_roles', 'Gestionar roles', 'roles', 'update'),
  ('view_analytics', 'Ver analíticas', 'analytics', 'read')
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para roles - solo si existe la columna user_role en profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_role'
  ) THEN
    -- Crear políticas RLS para roles
    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_view_roles ON public.roles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';

    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_update_roles ON public.roles
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';

    -- Crear políticas RLS para permisos
    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_view_permissions ON public.permissions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';

    -- Crear políticas RLS para roles_permisos
    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_view_role_permissions ON public.role_permissions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';

    -- Crear políticas RLS para roles de usuario
    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_view_all_user_roles ON public.user_roles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';

    EXECUTE 'CREATE POLICY IF NOT EXISTS admins_can_assign_roles ON public.user_roles
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = ''admin''::user_role
        )
      )';
  ELSE
    RAISE NOTICE 'Columna user_role no existe en profiles - skipping RLS policies creation';
  END IF;
END $$;

-- Política básica para user_roles (no depende de user_role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_can_view_own_roles'
  ) THEN
    CREATE POLICY users_can_view_own_roles ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Crear trigger para updated_at automático en roles
CREATE OR REPLACE FUNCTION public.update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_roles_updated_at();

-- Comentarios
COMMENT ON TABLE public.roles IS 'Roles del sistema para RBAC';
COMMENT ON TABLE public.permissions IS 'Permisos del sistema';
COMMENT ON TABLE public.role_permissions IS 'Relación muchos a muchos entre roles y permisos';
COMMENT ON TABLE public.user_roles IS 'Asignación de roles a usuarios';
