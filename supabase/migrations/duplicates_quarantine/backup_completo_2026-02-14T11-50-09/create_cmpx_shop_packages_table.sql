-- Crear tabla cmpx_shop_packages para paquetes de compra de tokens CMPX
-- Fecha: 17 Ene 2026

CREATE TABLE IF NOT EXISTS public.cmpx_shop_packages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cmpx_amount INTEGER NOT NULL DEFAULT 0,
  bonus_cmpx INTEGER NOT NULL DEFAULT 0,
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_mxn DECIMAL(10,2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para optimizar consultas por is_active
CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_is_active ON public.cmpx_shop_packages(is_active);

-- Crear índice para optimizar consultas por display_order
CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_display_order ON public.cmpx_shop_packages(display_order);

-- Crear índice para optimizar consultas por is_popular
CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_is_popular ON public.cmpx_shop_packages(is_popular);

-- Comentario en la tabla
COMMENT ON TABLE public.cmpx_shop_packages IS 'Paquetes de compra de tokens CMPX en la tienda';

-- Comentarios en las columnas
COMMENT ON COLUMN public.cmpx_shop_packages.id IS 'ID único del paquete';
COMMENT ON COLUMN public.cmpx_shop_packages.name IS 'Nombre del paquete';
COMMENT ON COLUMN public.cmpx_shop_packages.description IS 'Descripción del paquete';
COMMENT ON COLUMN public.cmpx_shop_packages.cmpx_amount IS 'Cantidad de tokens CMPX en el paquete';
COMMENT ON COLUMN public.cmpx_shop_packages.bonus_cmpx IS 'Cantidad de tokens CMPX de bonificación';
COMMENT ON COLUMN public.cmpx_shop_packages.price_usd IS 'Precio en USD';
COMMENT ON COLUMN public.cmpx_shop_packages.price_mxn IS 'Precio en MXN';
COMMENT ON COLUMN public.cmpx_shop_packages.display_order IS 'Orden de visualización';
COMMENT ON COLUMN public.cmpx_shop_packages.is_active IS 'Indica si el paquete está activo';
COMMENT ON COLUMN public.cmpx_shop_packages.is_popular IS 'Indica si el paquete es popular';
COMMENT ON COLUMN public.cmpx_shop_packages.created_at IS 'Fecha de creación del paquete';
COMMENT ON COLUMN public.cmpx_shop_packages.updated_at IS 'Fecha de actualización del paquete';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cmpx_shop_packages ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "Permitir lectura a usuarios autenticados"
ON public.cmpx_shop_packages
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción a administradores
CREATE POLICY IF NOT EXISTS "Permitir inserción a administradores"
ON public.cmpx_shop_packages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir actualización a administradores
CREATE POLICY IF NOT EXISTS "Permitir actualización a administradores"
ON public.cmpx_shop_packages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir eliminación a administradores
CREATE POLICY IF NOT EXISTS "Permitir eliminación a administradores"
ON public.cmpx_shop_packages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Insertar datos de ejemplo
INSERT INTO public.cmpx_shop_packages (name, description, cmpx_amount, bonus_cmpx, price_usd, price_mxn, display_order, is_active, is_popular) VALUES
  ('Paquete Básico', '100 tokens CMPX', 100, 0, 1.99, 39.00, 1, true, false),
  ('Paquete Estándar', '500 tokens CMPX + 50 de bonificación', 500, 50, 9.99, 195.00, 2, true, false),
  ('Paquete Premium', '1000 tokens CMPX + 150 de bonificación', 1000, 150, 19.99, 390.00, 3, true, true),
  ('Paquete VIP', '2500 tokens CMPX + 500 de bonificación', 2500, 500, 49.99, 975.00, 4, true, false),
  ('Paquete Mega', '5000 tokens CMPX + 1000 de bonificación', 5000, 1000, 99.99, 1950.00, 5, true, true)
ON CONFLICT DO NOTHING;
