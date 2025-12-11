# Migraciones SQL - Diciembre 2025

## Descripción General
Este documento describe las migraciones SQL necesarias para soportar las nuevas features de CouplePreNuptialAgreement y ConsentGuard.

## Migraciones Creadas

### 0. `20251207_add_missing_columns.sql` (EJECUTAR PRIMERO SI HAY ERRORES)
**Propósito:** Agregar columnas faltantes a tablas existentes

**Contenido:**
- Verifica que las tablas existen
- Agrega columnas faltantes (agreement_id, dispute_id, etc.)
- Crea índices si no existen
- Idempotente (puede ejecutarse múltiples veces sin error)

**Cuándo usar:**
- Si obtienes error: `ERROR: 42703: column "agreement_id" does not exist`
- Si las tablas ya existen pero les faltan columnas
- Ejecuta esta migración para completar la estructura

### 1. `20251207_fix_migrations.sql` (SI HAY ERRORES DE ÍNDICES)
**Propósito:** Corregir índices duplicados si las migraciones anteriores fallaron

**Contenido:**
- Verifica que las tablas existen antes de crear índices
- Usa `IF NOT EXISTS` para evitar conflictos
- Idempotente (puede ejecutarse múltiples veces sin error)

**Cuándo usar:**
- Si obtienes error: `ERROR: 42P07: relation "idx_*" already exists`
- Ejecuta esta migración para limpiar los índices

### 2. `20251207_create_couple_agreements.sql`
**Propósito:** Crear tablas para gestionar acuerdos prenupciales digitales entre parejas

**Tablas creadas:**
- `couple_agreements` - Almacena acuerdos prenupciales con cláusula de muerte súbita
- `couple_disputes` - Registra disputas entre partners
- `frozen_assets` - Registra activos congelados durante disputas

**Características:**
- RLS (Row Level Security) habilitado
- Triggers automáticos para cambiar estado cuando ambos partners firman
- Índices optimizados para queries frecuentes
- Documentación completa en comentarios SQL

**Campos principales:**
```sql
couple_agreements:
- id (UUID, PK)
- couple_id (FK a couple_profiles)
- partner_1_id, partner_2_id (FK a profiles)
- partner_1_signature, partner_2_signature (BOOLEAN)
- status (PENDING, ACTIVE, DISPUTED, DISSOLVED, FORFEITED)
- agreement_hash (SHA-256)
- dispute_deadline (30 días después de firmar)
```

### 3. `20251207_create_user_consents.sql`
**Propósito:** Crear tablas para registrar consentimientos informados con evidencia legal

**Tablas creadas:**
- `user_consents` - Almacena consentimientos con IP, timestamp, hash
- `consent_evidence` - Almacena evidencia detallada (screenshots, firmas, etc.)

**Características:**
- RLS habilitado
- Evidencia legal completa (IP, timestamp, hash SHA-256)
- Soporte para múltiples tipos de evidencia
- Trigger para actualizar timestamp automáticamente

## Cómo Aplicar las Migraciones

### Opción 1: Supabase Dashboard
1. Ir a `supabase.com` → Tu proyecto
2. Ir a `SQL Editor`
3. Copiar el contenido de cada archivo `.sql`
4. Ejecutar cada migración en orden

### Opción 2: Supabase CLI
```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Autenticarse
supabase login

# Aplicar migraciones
supabase db push
```

### Opción 3: Directamente en Supabase
Los archivos están en: `supabase/migrations/`

Supabase detectará automáticamente las nuevas migraciones al hacer deploy.

## Orden de Aplicación

### Orden recomendado:
1. `20251207_create_user_consents.sql` (primero - no tiene dependencias externas)
2. `20251207_create_couple_agreements.sql` (segundo - depende de `couple_profiles` y `profiles`)

### Si obtienes errores:

**Error: "column does not exist"**
- Ejecuta `20251207_add_missing_columns.sql` para agregar columnas faltantes

**Error: "relation already exists"**
- Ejecuta `20251207_fix_migrations.sql` para corregir índices duplicados

**Orden de corrección:**
1. `20251207_add_missing_columns.sql` (si faltan columnas)
2. `20251207_fix_migrations.sql` (si hay índices duplicados)
3. Intenta nuevamente con las migraciones principales

## Verificación Post-Migración

### Verificar tablas creadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence');
```

### Verificar RLS habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence');
```

### Verificar índices
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence');
```

## Componentes que Usan Estas Tablas

### CouplePreNuptialAgreement.tsx
- Lee/escribe en `couple_agreements`
- Registra firmas digitales con IP y timestamp
- Maneja estado de acuerdos (PENDING → ACTIVE)
- Crea disputas en `couple_disputes` si hay conflicto

### ConsentGuard.tsx
- Lee/escribe en `user_consents`
- Registra evidencia en `consent_evidence`
- Captura IP, timestamp, user agent
- Genera hash SHA-256 del consentimiento

## Campos Importantes

### agreement_hash
- Hash SHA-256 del contenido del acuerdo
- Usado para verificar integridad
- Generado en el cliente con `crypto.subtle.digest()`

### consent_hash
- Hash SHA-256 del contenido del consentimiento
- Mismo propósito que agreement_hash

### ip_address
- Capturada desde `https://api.ipify.org`
- Usada como evidencia legal
- Almacenada en `partner_1_ip`, `partner_2_ip`, etc.

### dispute_deadline
- Calculado como `NOW() + INTERVAL '30 days'`
- Usado para el protocolo de "muerte súbita"
- Trigger automático cuando ambos firman

## Notas de Seguridad

1. **RLS Habilitado:** Solo los partners de una pareja pueden ver/modificar sus acuerdos
2. **Evidencia Legal:** Todos los consentimientos incluyen IP, timestamp, hash
3. **Inmutabilidad:** Una vez que un acuerdo está ACTIVE, ciertos campos no pueden cambiar
4. **Auditoría:** Todos los cambios se registran con `created_at` y `updated_at`

## Troubleshooting

### Error: "relation 'couple_profiles' does not exist"
- Asegúrate de que la tabla `couple_profiles` existe
- Ejecuta la migración de `couple_profiles` primero

### Error: "relation 'profiles' does not exist"
- Asegúrate de que la tabla `profiles` existe
- Esta tabla debe existir en tu base de datos Supabase

### Error: "permission denied for schema public"
- Verifica que tienes permisos de administrador en Supabase
- Usa la cuenta de administrador para ejecutar las migraciones

## Próximos Pasos

1. Aplicar las migraciones SQL
2. Verificar que las tablas se crearon correctamente
3. Probar CouplePreNuptialAgreement.tsx con datos de prueba
4. Probar ConsentGuard.tsx con datos de prueba
5. Verificar que RLS está funcionando correctamente

## Contacto
Para problemas con las migraciones, revisar los logs de Supabase en el dashboard.
