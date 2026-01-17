# Reporte de Tablas y Columnas Faltantes - CómplicesConecta v3.9.2

**Fecha**: 17 de Enero, 2026  
**Estado**: Pendiente de migración

---

## 📊 Resumen

Este reporte identifica las tablas y columnas faltantes en el schema de Supabase basado en el análisis de archivos que usan `as any` en el directorio `src`.

---

## 📋 Tablas Faltantes

### 1. Tabla: `images`

**Archivos que la usan**:
- `src/services/core/DataPrivacyService.ts`

**Uso detectado**:
```typescript
// Línea 97
(supabase as any).from("images").select("*").eq("profile_id", userId)

// Línea 197-200
const { data: images } = await (supabase as any)
  .from("images")
  .select("id, url, is_public")
  .eq("profile_id", userId);

// Línea 234-237
const { error: deleteImagesError } = await (supabase as any)
  .from("images")
  .delete()
  .eq("profile_id", userId);
```

**Columnas necesarias**:
- `id` (UUID) - Primary Key
- `profile_id` (UUID) - ID del perfil del usuario
- `url` (TEXT) - URL de la imagen
- `is_public` (BOOLEAN) - Indica si la imagen es pública
- `created_at` (TIMESTAMP WITH TIME ZONE) - Fecha de creación
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Fecha de actualización

**Prioridad**: ALTA

---

## 📋 Columnas Faltantes en Tablas Existentes

### 1. Tabla: `profiles`

**Archivos que la usan**:
- `src/services/core/DataPrivacyService.ts`

**Columnas faltantes detectadas**:
- `photo_verified` (BOOLEAN) - Indica si el usuario ha verificado su identidad con selfie
- `id_verified` (BOOLEAN) - Indica si el usuario ha verificado su identidad con documento oficial
- `photo_verified_at` (TIMESTAMP WITH TIME ZONE) - Fecha en que se verificó la selfie
- `id_verified_at` (TIMESTAMP WITH TIME ZONE) - Fecha en que se verificó el documento
- `world_id_nullifier_hash` (TEXT) - Hash nullifier de World ID del usuario
- `world_id_verified_at` (TIMESTAMP WITH TIME ZONE) - Fecha en que se verificó con World ID
- `verification_level` (TEXT) - Nivel de verificación del usuario (none, basic, medium, high)

**Estado**: ✅ Migración creada (`20250119_profile_verification_columns.sql`)

**Prioridad**: ALTA

---

## 📋 Archivos con `as any` Analizados

### 1. DataPrivacyService.ts

**Ruta**: `src/services/core/DataPrivacyService.ts`

**Uso de `as any`**:
- Línea 97: `(supabase as any).from("images")`
- Línea 197: `(supabase as any).from("images")`
- Línea 234: `(supabase as any).from("images")`
- Línea 269: `sender_id: undefined, receiver_id: undefined, } as any`
- Línea 318: `(supabase as any).from("stories")`
- Línea 324: `(supabase as any).from("stories")`

**Tablas afectadas**:
- `images` (tabla faltante)
- `chat_messages` (columnas faltantes: sender_id, receiver_id)
- `stories` (tabla ya existe, pero usa as any)

**Prioridad**: ALTA

---

## 📝 Migraciones Pendientes

### 1. Crear tabla `images`

**Archivo**: `20250120_images_table.sql`

**Contenido**:
```sql
-- ============================================================================
-- Images Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla images
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_images_profile_id ON public.images(profile_id);
CREATE INDEX IF NOT EXISTS idx_images_is_public ON public.images(is_public);

-- Habilitar RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_images ON public.images
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY users_can_insert_own_images ON public.images
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY users_can_update_own_images ON public.images
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY users_can_delete_own_images ON public.images
FOR DELETE
USING (auth.uid() = profile_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.update_images_updated_at();

-- Comentarios
COMMENT ON TABLE public.images IS 'Imágenes de perfil y galería de usuarios';
```

---

## 🎯 Próximos Pasos

1. ✅ Crear migración para tabla `images`
2. ✅ Aplicar migraciones pendientes al schema
3. ✅ Regenerar tipos de TypeScript
4. ✅ Eliminar `as any` en archivos afectados
5. ✅ Commit y push de cambios

---

**Estado Final**: ✅ Completado - 17 de Enero, 2026 08:35

**Resumen de Cambios**:
- ✅ Tabla `images` creada y migrada
- ✅ Tipos de TypeScript actualizados
- ✅ Migración aplicada exitosamente
