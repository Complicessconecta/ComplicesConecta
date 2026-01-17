-- Crear tabla cmpx_purchases para registrar compras de tokens CMPX
-- Fecha: 17 Ene 2026

CREATE TABLE IF NOT EXISTS public.cmpx_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  package_id BIGINT NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  cmpx_amount INTEGER NOT NULL DEFAULT 0,
  bonus_cmpx INTEGER NOT NULL DEFAULT 0,
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_mxn DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para optimizar consultas por user_id
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_user_id ON public.cmpx_purchases(user_id);

-- Crear índice para optimizar consultas por status
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_status ON public.cmpx_purchases(status);

-- Crear índice para optimizar consultas por package_id
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_package_id ON public.cmpx_purchases(package_id);

-- Crear índice para optimizar consultas por created_at
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_created_at ON public.cmpx_purchases(created_at DESC);

-- Comentario en la tabla
COMMENT ON TABLE public.cmpx_purchases IS 'Registro de compras de tokens CMPX';

-- Comentarios en las columnas
COMMENT ON COLUMN public.cmpx_purchases.id IS 'ID único de la compra';
COMMENT ON COLUMN public.cmpx_purchases.user_id IS 'ID del usuario que realizó la compra';
COMMENT ON COLUMN public.cmpx_purchases.package_id IS 'ID del paquete comprado';
COMMENT ON COLUMN public.cmpx_purchases.package_name IS 'Nombre del paquete comprado';
COMMENT ON COLUMN public.cmpx_purchases.cmpx_amount IS 'Cantidad de tokens CMPX comprados';
COMMENT ON COLUMN public.cmpx_purchases.bonus_cmpx IS 'Cantidad de tokens CMPX de bonificación';
COMMENT ON COLUMN public.cmpx_purchases.price_usd IS 'Precio en USD';
COMMENT ON COLUMN public.cmpx_purchases.price_mxn IS 'Precio en MXN';
COMMENT ON COLUMN public.cmpx_purchases.status IS 'Estado de la compra (pending, completed, failed, refunded)';
COMMENT ON COLUMN public.cmpx_purchases.payment_method IS 'Método de pago utilizado';
COMMENT ON COLUMN public.cmpx_purchases.transaction_id IS 'ID de la transacción de pago';
COMMENT ON COLUMN public.cmpx_purchases.created_at IS 'Fecha de creación de la compra';
COMMENT ON COLUMN public.cmpx_purchases.updated_at IS 'Fecha de actualización de la compra';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cmpx_purchases ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados de sus propias compras
CREATE POLICY IF NOT EXISTS "Permitir lectura de propias compras"
ON public.cmpx_purchases
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Política para permitir lectura a administradores de todas las compras
CREATE POLICY IF NOT EXISTS "Permitir lectura a administradores"
ON public.cmpx_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir inserción a usuarios autenticados de sus propias compras
CREATE POLICY IF NOT EXISTS "Permitir inserción de propias compras"
ON public.cmpx_purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Política para permitir actualización a administradores
CREATE POLICY IF NOT EXISTS "Permitir actualización a administradores"
ON public.cmpx_purchases
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
