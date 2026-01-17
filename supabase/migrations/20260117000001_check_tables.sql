y-- Verificar si las tablas mfa_settings y two_factor_auth existen
DO $$
BEGIN
  RAISE NOTICE 'Verificando tablas mfa_settings y two_factor_auth...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mfa_settings') THEN
    RAISE NOTICE '✅ Tabla mfa_settings existe';
  ELSE
    RAISE NOTICE '❌ Tabla mfa_settings NO existe';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'two_factor_auth') THEN
    RAISE NOTICE '✅ Tabla two_factor_auth existe';
  ELSE
    RAISE NOTICE '❌ Tabla two_factor_auth NO existe';
  END IF;
END $$;
