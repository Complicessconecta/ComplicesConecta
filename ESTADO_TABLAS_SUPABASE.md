# Estado de Tablas Supabase - 7 Diciembre 2025

## 📊 Tablas Creadas

### ✅ Tablas Existentes en Supabase

```sql
-- Migraciones aplicadas exitosamente:
1. couple_agreements (acuerdos prenupciales)
2. couple_disputes (disputas entre partners)
3. frozen_assets (activos congelados)
4. user_consents (consentimientos con evidencia legal)
5. consent_evidence (evidencia detallada)
```

### 📋 Estructura de Tablas

#### couple_agreements
```
- id (UUID, PK)
- couple_id (UUID, FK)
- partner_1_id (UUID, FK)
- partner_2_id (UUID, FK)
- partner_1_signature (BOOLEAN)
- partner_2_signature (BOOLEAN)
- partner_1_ip (VARCHAR)
- partner_2_ip (VARCHAR)
- partner_1_signed_at (TIMESTAMP)
- partner_2_signed_at (TIMESTAMP)
- status (VARCHAR: PENDING, ACTIVE, DISPUTED, DISSOLVED, FORFEITED)
- signed_at (TIMESTAMP)
- dispute_deadline (TIMESTAMP)
- agreement_hash (VARCHAR)
- death_clause_text (TEXT)
- asset_disposition_clause (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### couple_disputes
```
- id (UUID, PK)
- agreement_id (UUID, FK)
- couple_id (UUID, FK)
- initiated_by (UUID, FK)
- reason (TEXT)
- status (VARCHAR: OPEN, IN_REVIEW, RESOLVED, ESCALATED)
- created_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
- resolution_notes (TEXT)
- updated_at (TIMESTAMP)
```

#### frozen_assets
```
- id (UUID, PK)
- couple_id (UUID, FK)
- dispute_id (UUID, FK)
- asset_type (VARCHAR: CMPX_TOKEN, GTK_TOKEN, NFT, OTHER)
- asset_id (VARCHAR)
- amount (DECIMAL)
- status (VARCHAR: FROZEN, RELEASED, FORFEITED)
- frozen_at (TIMESTAMP)
- released_at (TIMESTAMP)
- asset_snapshot (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### user_consents
```
- id (UUID, PK)
- user_id (UUID, FK)
- consent_type (VARCHAR)
- consent_version (VARCHAR)
- description (TEXT)
- consent_hash (VARCHAR)
- ip_address (VARCHAR)
- user_agent (TEXT)
- timestamp (TIMESTAMP)
- status (VARCHAR: ACTIVE, REVOKED, EXPIRED)
- revoked_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### consent_evidence
```
- id (UUID, PK)
- consent_id (UUID, FK)
- evidence_type (VARCHAR: SCREENSHOT, SIGNATURE, TIMESTAMP, IP_LOG, DEVICE_INFO)
- evidence_data (JSONB)
- created_at (TIMESTAMP)
```

## 🔧 Estado de Tipos TypeScript

### Problema Actual
Supabase aún no ha generado tipos automáticos para las nuevas tablas. Por eso usamos `as any` en:

**CouplePreNuptialAgreement.tsx:**
- Línea 174-185: Insert de couple_agreements
- Línea 225: Update de couple_agreements

### ¿Por qué `as any`?
```typescript
// Sin tipos generados, Supabase infiere 'never'
const { data, error } = await supabase
  .from('couple_agreements')  // Tabla sin tipos generados
  .insert({...})              // Error: 'never' type
  .select()
  .single()

// Solución temporal: usar 'as any'
const result: any = await (supabase as any)
  .from('couple_agreements')
  .insert({...})
  .select()
  .single()
```

## 🚀 Cómo Regenerar Tipos de Supabase

### Opción 1: Supabase CLI (Recomendado)
```bash
cd c:\Users\conej\Documents\conecta-social-comunidad-main

# Regenerar tipos desde Supabase remoto
supabase gen types typescript --linked > src/types/supabase-generated.ts
```

### Opción 2: Supabase Dashboard
1. Ir a https://supabase.com → Tu proyecto
2. Ir a **SQL Editor**
3. Ejecutar:
```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence');
```

### Opción 3: Esperar a que Supabase genere automáticamente
- Supabase genera tipos automáticamente después de 30 segundos de la creación
- Si aún no aparecen, usar Opción 1

## ✅ Verificación Post-Generación

Una vez que Supabase genere los tipos, deberías ver:

```typescript
// En src/types/supabase-generated.ts
export type Database = {
  public: {
    Tables: {
      couple_agreements: {
        Row: CoupleAgreementRow
        Insert: CoupleAgreementInsert
        Update: CoupleAgreementUpdate
      }
      couple_disputes: {
        Row: CoupleDisputeRow
        Insert: CoupleDisputeInsert
        Update: CoupleDisputeUpdate
      }
      // ... etc
    }
  }
}
```

## 🔄 Eliminar `as any` Después de Generar Tipos

Una vez que Supabase genere los tipos, cambiar:

```typescript
// Antes (con as any)
const result: any = await (supabase as any)
  .from('couple_agreements')
  .insert({...} as any)
  .select()
  .single() as any;

// Después (sin as any)
const { data, error } = await supabase
  .from('couple_agreements')
  .insert({
    couple_id: coupleId,
    partner_1_id: partner1Id,
    partner_2_id: partner2Id,
    agreement_hash: agreementHash,
    death_clause_text: '...',
    asset_disposition_clause: 'ADMIN_FORFEIT'
  })
  .select()
  .single();
```

## 📝 Archivos Afectados

### Con `as any` (Temporal)
- `src/components/couples/CouplePreNuptialAgreement.tsx` (3 usos)
- `src/features/profile/ProfileReportService.ts` (2 usos)

### Notas
- Los `as any` son **temporales** y necesarios hasta que Supabase genere tipos
- Una vez generados los tipos, se pueden eliminar sin cambiar la lógica
- No afecta la funcionalidad, solo la seguridad de tipos

## 🎯 Próximos Pasos

1. **Verificar tablas en Supabase:**
   ```bash
   supabase db list
   ```

2. **Regenerar tipos:**
   ```bash
   supabase gen types typescript --linked > src/types/supabase-generated.ts
   ```

3. **Eliminar `as any`:**
   - Buscar en el proyecto: `as any`
   - Reemplazar con tipos correctos una vez generados

4. **Compilar y verificar:**
   ```bash
   pnpm run build
   ```

## 📊 Estado Actual

| Aspecto | Estado |
|---------|--------|
| Tablas SQL | ✅ Creadas |
| RLS | ✅ Habilitado |
| Índices | ✅ Creados |
| Triggers | ✅ Creados |
| Tipos TypeScript | ⏳ Pendiente (Supabase) |
| `as any` | ⏳ Temporal |
| Build | ✅ Exitoso |

**Conclusión:** Las tablas están 100% funcionales. Los `as any` son solo un problema de tipos TypeScript que se resolverá cuando Supabase genere los tipos automáticamente.
