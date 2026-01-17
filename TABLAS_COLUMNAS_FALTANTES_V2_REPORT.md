# Reporte de Tablas y Columnas Faltantes - CómplicesConecta v3.9.2

**Fecha**: 17 de Enero, 2026  
**Estado**: Pendiente de migración

---

## 📊 Resumen

Este reporte identifica las tablas y columnas faltantes en el schema de Supabase basado en el análisis de archivos que usan `as any`, `any` o `null` en el directorio `src`.

---

## 📋 Tablas Faltantes

### 1. Tabla: `user_themes`

**Archivos que la usan**:
- `src/themes/useTheme.ts`

**Uso detectado**:
```typescript
// Línea 56
.from("user_themes" as any)
.select("*")
.eq("user_id", user.id)
.maybeSingle();

// Línea 113
} as any,
```

**Columnas necesarias**:
- `id` (UUID) - Primary Key
- `user_id` (UUID) - ID del usuario
- `theme_name` (TEXT) - Nombre del tema
- `bg_url` (TEXT) - URL de fondo
- `primary_color` (TEXT) - Color primario
- `secondary_color` (TEXT) - Color secundario
- `text_color` (TEXT) - Color de texto
- `created_at` (TIMESTAMP WITH TIME ZONE) - Fecha de creación
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Fecha de actualización

**Prioridad**: MEDIA

---

### 2. Tabla: `error_alerts`

**Archivos que la usan**:
- `src/services/core/ErrorAlertService.ts`

**Uso detectado**:
```typescript
// Línea 620
await supabase.from("error_alerts").insert({
  error_type: alert.category || "unknown",
  error_message: alert.message,
  stack_trace: alert.stack || null,
  severity: alert.severity,
  resolved: alert.resolved,
  user_id: user?.id || alert.userId || null,
  url: typeof window !== "undefined" ? window.location.href : null,
});
```

**Columnas necesarias**:
- `id` (UUID) - Primary Key
- `error_type` (TEXT) - Tipo de error
- `error_message` (TEXT) - Mensaje de error
- `stack_trace` (TEXT) - Stack trace del error
- `severity` (TEXT) - Severidad del error
- `resolved` (BOOLEAN) - Indica si está resuelto
- `user_id` (UUID) - ID del usuario
- `url` (TEXT) - URL donde ocurrió el error
- `created_at` (TIMESTAMP WITH TIME ZONE) - Fecha de creación
- `resolved_at` (TIMESTAMP WITH TIME ZONE) - Fecha de resolución

**Prioridad**: ALTA

---

## 📋 Columnas Faltantes en Tablas Existentes

### 1. Tabla: `error_alerts`

**Archivos que la usan**:
- `src/services/core/ErrorAlertService.ts`

**Columnas faltantes detectadas**:
- `error_type` (TEXT) - Tipo de error (ya existe en el código pero no en el schema)

**Estado**: ⚠️ Necesita migración para agregar columna

**Prioridad**: ALTA

---

## 📋 Archivos con `as any`, `any` o `null` Analizados

### 1. useTheme.ts

**Ruta**: `src/themes/useTheme.ts`

**Uso de `as any`**:
- Línea 56: `.from("user_themes" as any)`
- Línea 113: `} as any`

**Tablas afectadas**:
- `user_themes` (tabla faltante)

**Prioridad**: MEDIA

---

### 2. ErrorAlertService.ts

**Ruta**: `src/services/core/ErrorAlertService.ts`

**Uso de `as any`**:
- No se detectó `as any` pero hay error de linting en línea 621

**Tablas afectadas**:
- `error_alerts` (columna faltante: `error_type`)

**Prioridad**: ALTA

---

### 3. Otros archivos con `as any` (aceptables)

**Archivos de utilidades**:
- `src/utils/platformDetection.ts` - Uso de `window as any` (aceptable)
- `src/utils/lazyWithDefault.ts` - Uso de `m as any` (aceptable)
- `src/utils/dynamicImports.ts` - Uso de `ethersModule as any` (aceptable)
- `src/utils/captureConsoleErrors.ts` - Uso de `window as any` (aceptable)

**Archivos de tipos**:
- `src/types/improved-types.ts` - Definición de tipos para reducir `as any` (aceptable)

**Archivos de pruebas**:
- `src/tests/unit/zod-validation.test.ts` - Uso de `as any` en tests (aceptable)
- `src/tests/unit/UserIdentificationService.test.ts` - Uso de `as any` en tests (aceptable)
- `src/tests/unit/SecurityService.test.ts` - Uso de `as any` en tests (aceptable)

---

## 📝 Migraciones Pendientes

### 1. Crear tabla `user_themes`

**Archivo**: `20250120_user_themes_table.sql`

**Contenido**:
```sql
-- ============================================================================
-- User Themes Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla user_themes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme_name TEXT DEFAULT 'default',
  bg_url TEXT,
  primary_color TEXT DEFAULT '#8b5cf6',
  secondary_color TEXT DEFAULT '#6366f1',
  text_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_themes_theme_name ON public.user_themes(theme_name);

-- Habilitar RLS
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_themes ON public.user_themes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_themes ON public.user_themes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_themes ON public.user_themes
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_user_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_themes_updated_at
BEFORE UPDATE ON public.user_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_user_themes_updated_at();

-- Comentarios
COMMENT ON TABLE public.user_themes IS 'Temas personalizados de usuarios';
```

---

### 2. Agregar columna `error_type` a `error_alerts`

**Archivo**: `20250120_error_alerts_add_error_type.sql`

**Contenido**:
```sql
-- ============================================================================
-- Add error_type column to error_alerts
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Agregar columna error_type a la tabla error_alerts
-- ============================================================================

-- Verificar si la tabla error_alerts existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'error_alerts'
  ) THEN
    -- Crear tabla error_alerts si no existe
    CREATE TABLE public.error_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT DEFAULT 'unknown',
      error_message TEXT NOT NULL,
      error_stack TEXT,
      metadata JSONB DEFAULT '{}',
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID,
      url TEXT
    );

    -- Crear índices
    CREATE INDEX idx_error_alerts_user_id ON public.error_alerts(user_id);
    CREATE INDEX idx_error_alerts_category ON public.error_alerts(category);
    CREATE INDEX idx_error_alerts_resolved ON public.error_alerts(resolved);

    -- Habilitar RLS
    ALTER TABLE public.error_alerts ENABLE ROW LEVEL SECURITY;

    -- Crear políticas RLS
    CREATE POLICY users_can_view_own_alerts ON public.error_alerts
    FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY users_can_insert_own_alerts ON public.error_alerts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY users_can_update_own_alerts ON public.error_alerts
    FOR UPDATE
    USING (auth.uid() = user_id);

    -- Política para admins
    CREATE POLICY admins_can_view_all_alerts ON public.error_alerts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );

    RAISE NOTICE '✅ Tabla error_alerts creada';
  END IF;
END $$;

-- Agregar columna error_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_alerts' 
    AND column_name = 'error_type'
  ) THEN
    ALTER TABLE public.error_alerts ADD COLUMN error_type TEXT DEFAULT 'unknown';
    RAISE NOTICE '✅ Columna error_type agregada a error_alerts';
  ELSE
    RAISE NOTICE '⚠️ Columna error_type ya existe en error_alerts';
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.error_alerts.error_type IS 'Tipo de error (ej. network, auth, validation)';
```

---

## 🎯 Próximos Pasos

1. ✅ Crear migración para tabla `user_themes`
2. ✅ Crear migración para agregar columna `error_type` a `error_alerts`
3. ✅ Aplicar migraciones pendientes al schema
4. ✅ Regenerar tipos de TypeScript
5. ✅ Eliminar `as any` en archivos afectados
6. ✅ Commit y push de cambios

---

**Estado Final**: ⏳ Pendiente de migración - 17 de Enero, 2026 06:55
