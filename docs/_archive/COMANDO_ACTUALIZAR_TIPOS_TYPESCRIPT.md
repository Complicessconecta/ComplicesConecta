# COMANDO PARA ACTUALIZAR TIPOS TYPESCRIPT

## 📌 DESPUÉS DE EJECUTAR LA MIGRACIÓN SQL

Una vez que hayas ejecutado el archivo supabase/migrations/20251213_ADD_MISSING_TABLES.sql en Supabase, ejecuta este comando para generar los tipos TypeScript actualizados:

### Opción 1: Usar Supabase CLI (Recomendado)
`ash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase-generated.ts
`

Reemplaza YOUR_PROJECT_ID con tu ID de proyecto. Lo encuentras en:
- Supabase Dashboard > Settings > General > Project ID

### Opción 2: Si tienes script en package.json
`ash
npm run generate:types
`

### Opción 3: Generar desde URL de Supabase
`ash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --db-url postgresql://postgres:PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres > src/types/supabase-generated.ts
`

## ✅ VERIFICACIÓN

Después de ejecutar el comando, verifica que:

1. El archivo src/types/supabase-generated.ts se actualizó
2. Las 11 nuevas tablas aparecen en el archivo:
   - investment_tiers
   - investments
   - cmpx_shop_packages
   - cmpx_purchases
   - token_analytics
   - moderators
   - moderator_payments
   - security_audit_logs
   - posts
   - virtual_events
   - clubs

3. Ejecuta: npm run build
   - No debe haber errores de TypeScript
   - Todos los tipos deben resolverse correctamente

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: 'Cannot find module supabase'
`ash
npm install -g supabase
`

### Error: 'Project ID not found'
- Verifica que copiaste correctamente el Project ID
- No incluyas 'https://' ni '.supabase.co'
- Ejemplo correcto: abcdefghijklmnopqrst

### Error: 'Authentication failed'
- Genera un Access Token en: Supabase Dashboard > Settings > API > Project API Keys
- Usa: SUPABASE_ACCESS_TOKEN=YOUR_TOKEN npx supabase gen types...

### Los tipos no se actualizan
- Elimina el archivo src/types/supabase-generated.ts
- Ejecuta el comando nuevamente
- Verifica que la migración SQL se ejecutó correctamente en Supabase

## 📋 RESUMEN DE CAMBIOS EN TIPOS

Después de actualizar, tendrás acceso a estos tipos en tu código:

`	ypescript
import type { Database } from '@/types/supabase-generated';

// Usar tipos de las nuevas tablas
type InvestmentTier = Database['public']['Tables']['investment_tiers']['Row'];
type Investment = Database['public']['Tables']['investments']['Row'];
type CmpxPackage = Database['public']['Tables']['cmpx_shop_packages']['Row'];
type CmpxPurchase = Database['public']['Tables']['cmpx_purchases']['Row'];
type TokenAnalytics = Database['public']['Tables']['token_analytics']['Row'];
type Moderator = Database['public']['Tables']['moderators']['Row'];
type ModeratorPayment = Database['public']['Tables']['moderator_payments']['Row'];
type SecurityAuditLog = Database['public']['Tables']['security_audit_logs']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type VirtualEvent = Database['public']['Tables']['virtual_events']['Row'];
type Club = Database['public']['Tables']['clubs']['Row'];
`

## 🎯 FLUJO COMPLETO

1. ✅ Ejecutar SQL: supabase/migrations/20251213_ADD_MISSING_TABLES.sql
2. ✅ Esperar confirmación en Supabase Dashboard
3. ✅ Ejecutar comando TypeScript: npx supabase gen types typescript...
4. ✅ Verificar que src/types/supabase-generated.ts se actualizó
5. ✅ Ejecutar: npm run build (sin errores)
6. ✅ Ejecutar: npm run dev (probar en navegador)
7. ✅ Verificar que /invest, /shop, /admin/moderators, /posts, /clubs funcionan

---

Generado: 13 de Diciembre, 2025
