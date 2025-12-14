# MIGRACIÓN DE REPARACIÓN: 20251213_SYNC_AND_FIX.sql

## 📋 RESUMEN

Este archivo SQL de reparación sincroniza la Base de Datos con el Código Fuente.

**Contenido:**
- ✅ Paso A: Fix Reports - Agregar columna `reporter_id` faltante
- ✅ Paso B: Crear 11 tablas críticas faltantes
- ✅ Paso C: Habilitar RLS en todas las tablas
- ✅ Paso D: Crear políticas RLS básicas

**Características:**
- 100% Idempotente (IF NOT EXISTS, IF NOT)
- Seguro ejecutar múltiples veces
- Sin errores de sintaxis
- Incluye índices para optimización

---

## 🚀 PASO 1: EJECUTAR MIGRACIÓN SQL EN SUPABASE

### Opción A: Supabase Dashboard (Recomendado)

1. Abre: https://app.supabase.com/
2. Selecciona tu proyecto: ComplicesConecta
3. Ve a: SQL Editor > New Query
4. Copia TODO el contenido de: `supabase/migrations/20251213_SYNC_AND_FIX.sql`
5. Pega en el editor
6. Haz clic en: RUN (botón azul, esquina superior derecha)
7. Espera confirmación: "Query executed successfully"

### Opción B: CLI (Supabase)

```bash
supabase db push
```

Selecciona "y" cuando pregunte si quieres aplicar las migraciones.

### Opción C: Docker (Local)

```bash
docker exec supabase_db psql -U postgres -d postgres -f supabase/migrations/20251213_SYNC_AND_FIX.sql
```

---

## 🔄 PASO 2: ACTUALIZAR TIPOS TYPESCRIPT

Una vez que la migración esté aplicada en Supabase, ejecuta:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase-generated.ts
```

**Reemplaza `YOUR_PROJECT_ID`** con tu ID de proyecto.

Para encontrar tu Project ID:
1. Ve a: Supabase Dashboard > Settings > General
2. Copia el "Project ID" (ej: abcdefghijklmnopqrst)

### Ejemplo completo:

```bash
npx supabase gen types typescript --project-id abcdefghijklmnopqrst > src/types/supabase-generated.ts
```

---

## ✅ PASO 3: VERIFICAR ACTUALIZACIÓN

Después de ejecutar el comando, verifica que:

1. El archivo `src/types/supabase-generated.ts` se actualizó
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

3. La tabla `reports` ahora tiene la columna `reporter_id`

---

## 🧪 PASO 4: COMPILAR Y PROBAR

```bash
npm run build
npm run dev
```

Verifica que NO haya errores de TypeScript en la consola.

---

## 📊 VERIFICACIÓN DE TABLAS EN SUPABASE

1. Ve a: Supabase Dashboard > Database > Tables
2. Verifica que existan estas 11 tablas:
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

3. Verifica que `reports` tenga la columna `reporter_id`

---

## 🔐 VERIFICACIÓN DE RLS

1. Haz clic en cualquier tabla nueva
2. Ve a la pestaña: RLS Policies
3. Verifica que tenga 2-3 políticas según el tipo

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Ejecutar migración SQL (20251213_SYNC_AND_FIX.sql)
2. ✅ Actualizar tipos TypeScript
3. ✅ Compilar sin errores (npm run build)
4. ✅ Probar en navegador (npm run dev)
5. ⏭️ Verificar que /invest, /shop, /admin/moderators, /posts, /clubs funcionan

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Error: "Table already exists"
- NORMAL - Las tablas pueden ya existir
- El SQL tiene IF NOT EXISTS, así que no hay conflicto
- Solo ignora el mensaje

### Error: "Policy already exists"
- NORMAL - Las políticas pueden ya existir
- El SQL tiene IF NOT EXISTS, así que no hay conflicto
- Solo ignora el mensaje

### Error: "Column already exists"
- NORMAL - Las columnas pueden ya existir
- El SQL tiene IF NOT EXISTS, así que no hay conflicto
- Solo ignora el mensaje

### Los tipos no se actualizan
1. Elimina el archivo: `src/types/supabase-generated.ts`
2. Ejecuta el comando nuevamente
3. Verifica que la migración SQL se ejecutó correctamente

### TypeScript sigue mostrando errores
1. Ejecuta: `npm run build`
2. Si hay errores, verifica que el archivo `src/types/supabase-generated.ts` se actualizó
3. Cierra y abre VS Code nuevamente

---

## 📋 CHECKLIST FINAL

- [ ] Migración SQL ejecutada en Supabase
- [ ] Tipos TypeScript actualizados
- [ ] npm run build sin errores
- [ ] npm run dev sin errores
- [ ] /invest funciona
- [ ] /shop funciona
- [ ] /admin/moderators funciona
- [ ] /posts funciona
- [ ] /clubs funciona
- [ ] Tablas visibles en Supabase Dashboard
- [ ] Políticas RLS habilitadas

---

**Generado:** 13 de Diciembre, 2025
**Versión:** 3.8.0
**Status:** ✅ LISTO PARA EJECUTAR
