-- Crear tablas CMPX Shop: cmpx_shop_packages y cmpx_purchases
-- Fecha: 28 Feb 2026

-- ============================================================================
-- Tabla: cmpx_shop_packages
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_is_active
  ON public.cmpx_shop_packages(is_active);

CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_display_order
  ON public.cmpx_shop_packages(display_order);

CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_is_popular
  ON public.cmpx_shop_packages(is_popular);

ALTER TABLE public.cmpx_shop_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_shop_packages'
      AND policyname = 'cmpx_shop_packages_select_authenticated'
  ) THEN
    CREATE POLICY "cmpx_shop_packages_select_authenticated"
      ON public.cmpx_shop_packages
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_shop_packages'
      AND policyname = 'cmpx_shop_packages_admin_insert'
  ) THEN
    CREATE POLICY "cmpx_shop_packages_admin_insert"
      ON public.cmpx_shop_packages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'superadmin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_shop_packages'
      AND policyname = 'cmpx_shop_packages_admin_update'
  ) THEN
    CREATE POLICY "cmpx_shop_packages_admin_update"
      ON public.cmpx_shop_packages
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'superadmin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_shop_packages'
      AND policyname = 'cmpx_shop_packages_admin_delete'
  ) THEN
    CREATE POLICY "cmpx_shop_packages_admin_delete"
      ON public.cmpx_shop_packages
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'superadmin')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- Tabla: cmpx_purchases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cmpx_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id BIGINT NOT NULL REFERENCES public.cmpx_shop_packages(id) ON DELETE RESTRICT,
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

CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_user_id ON public.cmpx_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_status ON public.cmpx_purchases(status);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_package_id ON public.cmpx_purchases(package_id);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_created_at ON public.cmpx_purchases(created_at DESC);

ALTER TABLE public.cmpx_purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_purchases'
      AND policyname = 'cmpx_purchases_select_own'
  ) THEN
    CREATE POLICY "cmpx_purchases_select_own"
      ON public.cmpx_purchases
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_purchases'
      AND policyname = 'cmpx_purchases_select_admin'
  ) THEN
    CREATE POLICY "cmpx_purchases_select_admin"
      ON public.cmpx_purchases
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'superadmin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_purchases'
      AND policyname = 'cmpx_purchases_insert_own'
  ) THEN
    CREATE POLICY "cmpx_purchases_insert_own"
      ON public.cmpx_purchases
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cmpx_purchases'
      AND policyname = 'cmpx_purchases_admin_update'
  ) THEN
    CREATE POLICY "cmpx_purchases_admin_update"
      ON public.cmpx_purchases
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'superadmin')
        )
      );
  END IF;
END $$;

-- Datos base (idempotente)
INSERT INTO public.cmpx_shop_packages (name, description, cmpx_amount, bonus_cmpx, price_usd, price_mxn, display_order, is_active, is_popular)
VALUES
  ('Paquete Básico', '100 tokens CMPX', 100, 0, 1.99, 39.00, 1, true, false),
  ('Paquete Estándar', '500 tokens CMPX + 50 de bonificación', 500, 50, 9.99, 195.00, 2, true, false),
  ('Paquete Premium', '1000 tokens CMPX + 150 de bonificación', 1000, 150, 19.99, 390.00, 3, true, true),
  ('Paquete VIP', '2500 tokens CMPX + 500 de bonificación', 2500, 500, 49.99, 975.00, 4, true, false),
  ('Paquete Mega', '5000 tokens CMPX + 1000 de bonificación', 5000, 1000, 99.99, 1950.00, 5, true, true)
ON CONFLICT DO NOTHING;
