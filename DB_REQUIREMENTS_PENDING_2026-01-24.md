# Requerimientos de Base de Datos - Auditoría Type-Safe
**Fecha:** 24 Enero 2026
**Objetivo:** Documentar tablas, columnas y policies faltantes detectadas durante el barrido type-safe de `src/`
**Estado:** Pendiente de verificación en Supabase MCP (bloqueado por configuración de SUPABASE_ACCESS_TOKEN)

---

## 1. Tablas y Columnas Verificadas

### 1.1 Tablas Blockchain (Ya alineadas con schema generado)

✅ **`couple_nft_requests`**
- Columnas verificadas: `initiator_address`, `partner1_address`, `partner2_address`, `metadata_uri`, `token_id`, `expires_at`, `status`, `blockchain_status`, `transaction_hash`, `metadata`, `consent1_timestamp`, `consent2_timestamp`, `created_at`
- Tipo alineado con: `Database["public"]["Tables"]["couple_nft_requests"]["Row"]`
- Archivos corregidos:
  - `src/types/blockchain.ts` - Interface `CoupleNFTRequest` alineada
  - `src/services/payments/NFTService.ts` - Queries actualizados
  - `src/pages/profiles/couple/ProfileCouple.tsx` - Estado `coupleRequests` derivado de servicio

✅ **`user_wallets`**
- Columnas: `address`, `user_id`, `encrypted_private_key`, `network`, `created_at`, `updated_at`
- Tipo: `Database["public"]["Tables"]["user_wallets"]["Row"]`
- Servicio: `WalletService.getOrCreateWallet()` retorna `WalletInfo` (debe alinearse con schema generado)

✅ **`couple_agreements`**
- Columnas principales: `id`, `agreement_hash`, `status`, `signed_at`, `partner_1_id`, `partner_2_id`, `partner_1_ip`, `partner_2_ip`
- Tipo: `Database["public"]["Tables"]["couple_agreements"]["Row"]`
- Archivo: `src/pages/profiles/couple/ProfileCouple.tsx` (líneas 262-273) usa `(supabase as any).from("couple_agreements" as any)` - **NECESITA CORRECCIÓN**

✅ **`couple_disputes`**
- Columnas principales: `id`, `resolved_at`, `resolution_type`, `couple_agreement_id`, `couple_id`, `initiated_by`, `proposed_winner_id`, `resolved_by`, `winner_accepted_by`
- Tipo: `Database["public"]["Tables"]["couple_disputes"]["Row"]`
- Archivo: `src/pages/profiles/couple/ProfileCouple.tsx` (líneas 350-356) usa `(supabase as any).from("couple_disputes" as any)` - **NECESITA CORRECCIÓN**

---

## 2. Archivos Pendientes de Corrección Type-Safe

### 2.1 Archivos con `supabase.from(...).as any` o `(supabase as any).from(...).as any`

| Archivo | Líneas | Tabla | Problema | Acción Requerida |
|---------|--------|-------|----------|------------------|
| `src/pages/profiles/couple/ProfileCouple.tsx` | 262-273 | `couple_agreements` | `(supabase as any).from("couple_agreements" as any)` | Reemplazar por tipado `SupabaseClient<Database>` y usar `Database["public"]["Tables"]["couple_agreements"]["Row"]` |
| `src/pages/profiles/couple/ProfileCouple.tsx` | 350-356 | `couple_disputes` | `(supabase as any).from("couple_disputes" as any)` | Reemplazar por tipado `SupabaseClient<Database>` y usar `Database["public"]["Tables"]["couple_disputes"]["Row"]` |

### 2.2 Archivos con `as any` en contextos de Supabase

**Pendiente de barrido completo** - Se detectaron 330+ ocurrencias de `as any` en `src/` (excluyendo tests). Prioridad:
1. Archivos que usan `supabase.from()` con `as any`
2. Archivos que hacen queries a tablas blockchain
3. Archivos que manejan datos de usuario/perfiles

---

## 3. Políticas (RLS) Pendientes de Verificación

⚠️ **BLOQUEADO**: No se puede verificar RLS hasta que Supabase MCP esté configurado con `SUPABASE_ACCESS_TOKEN`.

Políticas a verificar (según reporte forense anterior):
- `couple_nft_requests`: RLS para asegurar que solo usuarios involucrados puedan ver/crear solicitudes
- `couple_agreements`: RLS para restringir acceso a acuerdos activos
- `couple_disputes`: RLS para control de acceso a disputas
- `user_wallets`: RLS para asegurar que cada usuario solo vea su wallet

---

## 4. Migraciones Pendientes

⚠️ **BLOQUEADO**: No se pueden crear migraciones hasta:
1. Verificar que las tablas/columnas no existan ya
2. Confirmar estructura actual en Supabase MCP
3. Validar que no haya migraciones duplicadas en `supabase/migrations/`

### 4.1 Migraciones Potenciales (Pendientes de Verificación)

**Ninguna pendiente** - Las tablas principales ya existen y están alineadas con schema generado.

---

## 5. Próximos Pasos

1. ✅ Arreglar `ProfileCouple.tsx` para eliminar `(supabase as any).from(...)` y usar tipado `SupabaseClient<Database>`
2. ⏳ Configurar `SUPABASE_ACCESS_TOKEN` para habilitar Supabase MCP
3. ⏳ Ejecutar auditoría completa de RLS en Supabase MCP
4. ⏳ Verificar políticas de seguridad en tablas blockchain
5. ⏳ Continuar barrido de `src/` para corregir otros archivos con `as any` en contextos de Supabase

---

## 6. Notas

- **Build Status**: ✅ `npm run build:check` pasa
- **TypeScript Errors**: 0 (después de correcciones en NFTService.ts y ProfileCouple.tsx)
- **npm audit**: 3 high (tar, @capacitor/cli, supabase) - lodash ya mitigado
- **Supabase MCP**: Bloqueado por configuración de `SUPABASE_ACCESS_TOKEN`
- **Assets**: Rutas de imágenes corregidas para usar `import.meta.env.BASE_URL`
