# Instrucciones para Ejecutar Migraciones

## Opción 1: Supabase CLI (Recomendado)

```bash
cd c:\Users\conej\Documents\conecta-social-comunidad-main

# Ejecutar todas las migraciones pendientes
supabase db push
```

## Opción 2: Supabase Dashboard

1. Ir a https://supabase.com → Tu proyecto
2. Ir a **SQL Editor**
3. Ejecutar en este orden:

### Paso 1: Crear tablas de consentimientos
```bash
# Copiar contenido de: supabase/migrations/20251207_create_user_consents.sql
# Pegar en SQL Editor y ejecutar
```

### Paso 2: Crear tablas de acuerdos
```bash
# Copiar contenido de: supabase/migrations/20251207_create_couple_agreements.sql
# Pegar en SQL Editor y ejecutar
```

### Paso 3: Agregar columnas faltantes (si es necesario)
```bash
# Copiar contenido de: supabase/migrations/20251207_add_missing_columns.sql
# Pegar en SQL Editor y ejecutar
```

### Paso 4: Corregir índices (si hay errores)
```bash
# Copiar contenido de: supabase/migrations/20251207_fix_migrations.sql
# Pegar en SQL Editor y ejecutar
```

## Verificación Post-Migración

### Verificar tablas creadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence')
ORDER BY table_name;
```

**Resultado esperado:**
- couple_agreements
- couple_disputes
- consent_evidence
- frozen_assets
- user_consents

### Verificar columnas de couple_disputes
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'couple_disputes'
ORDER BY ordinal_position;
```

**Columnas esperadas:**
- id (UUID)
- agreement_id (UUID)
- couple_id (UUID)
- initiated_by (UUID)
- reason (TEXT)
- status (VARCHAR)
- created_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
- resolution_notes (TEXT)
- updated_at (TIMESTAMP)

### Verificar índices creados
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence')
ORDER BY tablename, indexname;
```

### Verificar RLS habilitado
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence')
ORDER BY tablename;
```

**Resultado esperado:** rowsecurity = true para todas las tablas

## Troubleshooting

### Error: "relation already exists"
- Ejecutar: `20251207_fix_migrations.sql`

### Error: "column does not exist"
- Ejecutar: `20251207_add_missing_columns.sql`

### Error: "syntax error"
- Verificar que los comentarios usan `/* */` o `--` correctamente
- No usar `-` al inicio de líneas

## Archivos de Migración

```
supabase/migrations/
├── 20251207_create_user_consents.sql (3.6 KB)
├── 20251207_create_couple_agreements.sql (7.7 KB)
├── 20251207_add_missing_columns.sql (3.0 KB)
└── 20251207_fix_migrations.sql (2.7 KB)
```

## Estado Actual

✅ Migraciones creadas y listas
✅ Sintaxis SQL corregida
✅ Columnas faltantes identificadas
✅ Índices optimizados
✅ RLS configurado

**Próximo paso:** Ejecutar migraciones en Supabase
