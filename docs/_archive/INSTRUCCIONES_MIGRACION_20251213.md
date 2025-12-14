# INSTRUCCIONES DE EJECUCIÓN - MIGRACIÓN SQL 20251213_ADD_MISSING_TABLES.sql

## 📋 RESUMEN

Archivo: supabase/migrations/20251213_ADD_MISSING_TABLES.sql
Tablas creadas: 11 (investment_tiers, investments, cmpx_shop_packages, cmpx_purchases, token_analytics, moderators, moderator_payments, security_audit_logs, posts, virtual_events, clubs)
Políticas RLS: 20+ (seguridad por rol y usuario)
Índices: 30+ (optimización de queries)

## 🚀 PASO 1: EJECUTAR MIGRACIÓN EN SUPABASE

### Opción A: Desde Supabase Dashboard (Recomendado)
1. Ir a: https://app.supabase.com/project/[PROJECT_ID]/sql/new
2. Copiar contenido completo de: supabase/migrations/20251213_ADD_MISSING_TABLES.sql
3. Pegar en el editor SQL
4. Click en botón RUN (esquina superior derecha)
5. Esperar confirmación: 'Query executed successfully'

### Opción B: Desde CLI (si tienes Supabase CLI instalado)
`ash
supabase db push
`

### Opción C: Desde Docker/Local (si ejecutas Supabase localmente)
`ash
docker exec supabase_db psql -U postgres -d postgres -f supabase/migrations/20251213_ADD_MISSING_TABLES.sql
`

## 🔄 PASO 2: ACTUALIZAR TIPOS TYPESCRIPT

Después de ejecutar la migración, ejecuta:

`ash
npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/supabase-generated.ts
`

O si usas el script del proyecto:

`ash
npm run generate:types
`

## ✅ PASO 3: VERIFICAR CREACIÓN DE TABLAS

En Supabase Dashboard, ve a: Database > Tables

Verifica que existan estas 11 tablas:
- ✓ investment_tiers
- ✓ investments
- ✓ cmpx_shop_packages
- ✓ cmpx_purchases
- ✓ token_analytics
- ✓ moderators
- ✓ moderator_payments
- ✓ security_audit_logs
- ✓ posts
- ✓ virtual_events
- ✓ clubs

## 🔐 PASO 4: VERIFICAR POLÍTICAS RLS

En cada tabla, ve a: RLS Policies

Cada tabla debe tener 2-3 políticas según su tipo:
- investment_tiers: 3 políticas (read, write, update)
- investments: 3 políticas (read, insert, update)
- cmpx_shop_packages: 2 políticas (read, write)
- cmpx_purchases: 2 políticas (read, insert)
- token_analytics: 2 políticas (read, insert)
- moderators: 2 políticas (read, insert)
- moderator_payments: 1 política (read)
- security_audit_logs: 2 políticas (read, insert)
- posts: 3 políticas (read, insert, update)
- virtual_events: 2 políticas (read, insert)
- clubs: 3 políticas (read, insert, update)

## 🧪 PASO 5: PROBAR CONEXIÓN DESDE CÓDIGO

Ejecuta en tu proyecto:

`ash
npm run dev
`

Abre la consola del navegador (F12) y verifica que NO haya errores de 'Table not found'.

Las siguientes páginas ahora deberían funcionar sin errores:
- /invest (investment_tiers + investments)
- /shop (cmpx_shop_packages + cmpx_purchases)
- /admin/moderators (moderators + moderator_payments)
- /posts o feed (posts)
- /clubs (clubs)

## �� PASO 6: VERIFICAR DATOS INICIALES (OPCIONAL)

Si deseas agregar datos de prueba, ejecuta en SQL Editor:

`sql
-- Agregar tier de inversión de prueba
INSERT INTO investment_tiers (tier_key, name, amount_mxn, return_percentage, cmpx_tokens_rewarded, is_active)
VALUES ('test_10k', 'Test Tier', 10000, 10.0, 1000, TRUE);

-- Agregar paquete de CMPX de prueba
INSERT INTO cmpx_shop_packages (name, cmpx_amount, price_mxn, is_active)
VALUES ('Test Package', 100, 500, TRUE);
`

## 🎯 PASO 7: ACTUALIZAR TIPOS TYPESCRIPT

Una vez que la migración esté aplicada, ejecuta:

`ash
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > src/types/supabase-generated.ts
`

Reemplaza [YOUR_PROJECT_ID] con tu ID de proyecto Supabase.

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Error: 'Table already exists'
- Esto es normal si ejecutas la migración dos veces
- Las tablas tienen IF NOT EXISTS, así que no habrá conflicto
- Solo ignora el mensaje

### Error: 'Permission denied'
- Verifica que tu usuario de Supabase tenga rol 'admin' o 'authenticated'
- Ve a: Authentication > Users > Edit user > Roles

### Error: 'Foreign key constraint failed'
- Asegúrate de que la tabla 'profiles' existe (debería existir del SQL maestro)
- Si no existe, ejecuta primero: supabase/migrations/20251209_SCHEMA_MAESTRO_CONSOLIDADO.sql

### Las políticas RLS no funcionan
- Verifica que RLS esté habilitado en cada tabla
- Ve a: Database > Tables > [Tabla] > RLS > Enable RLS (debe estar activado)

## 📈 PRÓXIMOS PASOS

1. ✅ Ejecutar migración SQL
2. ✅ Actualizar tipos TypeScript
3. ✅ Verificar tablas y políticas
4. ✅ Probar conexión desde código
5. ⏭️ Ejecutar npm run build para verificar que no hay errores de compilación
6. ⏭️ Eliminar las 30 tablas fantasma (opcional, después de verificar que todo funciona)

## 📞 SOPORTE

Si encuentras errores:
1. Revisa los logs en Supabase Dashboard > Logs
2. Verifica que el archivo SQL sea válido (sin caracteres especiales)
3. Intenta ejecutar tabla por tabla en lugar de todo de una vez
4. Contacta al equipo de Supabase si persiste el error

---

Generado: 13 de Diciembre, 2025
Versión: 1.0
