# Reporte de Refactorización y Limpieza Forense
**Fecha:** 23 de Diciembre, 2025
**Rama:** `refactorizacion/limpieza-forense-[TIMESTAMP]`

## Resumen de Operaciones
Se ha realizado una reestructuración masiva del proyecto para eliminar deuda técnica y archivos duplicados sin borrar información. Todos los archivos removidos de su ubicación original se encuentran resguardados en este directorio `archivosbckderefact/`.

## Estructura del Backup

### 1. UI Components (`src/components/ui/_root_duplicates/`)
Archivos que existían tanto en la raíz de `ui` como en subcarpetas organizadas. Se ha priorizado la versión en subcarpetas.
- `ImageWithFallback.tsx`
- `LazyImage.tsx`
- `OptimizedImage.tsx`
- `LogoutButton.tsx`
- `carousel.tsx`
- `chart.tsx`
- `drawer.tsx`
- `sonner.tsx`
- `table.tsx`
- `popover.tsx`
- `compliance-signup-form.tsx`
- `vip-booking-modal.tsx`

### 2. Legacy Unified UI (`src/components/ui/_legacy_unified/`)
Componentes "Unified" que se consideran legacy frente a la arquitectura shadcn/ui.
- `UnifiedCard.tsx`
- `UnifiedInput.tsx`
- `UnifiedModal.tsx`
- `AdaptiveCard.tsx`

### 3. Profiles (`src/components/_profile_legacy/`)
Contenido del directorio `src/components/profile` (singular). Se debe usar `src/components/profiles` (plural) o la estructura modular de entidades.

### 4. Admin Pages (`src/pages/_flat_admin_pages/`)
Páginas de administración que estaban sueltas en `src/pages/` (ej: `AdminDashboard.tsx`) y que deberían estar modularizadas en `src/pages/admin/`.

### 5. Supabase Types (`src/types/_supabase_chaos/`)
Se ha consolidado la definición de tipos de base de datos.
- **Fuente de Verdad Actual:** `src/types/supabase.ts` (Originalmente `supabase-generated.ts`, seleccionado por ser el más completo).
- **Archivos Movidos:** `supabase-extensions.ts`, `supabase-final.ts`, `supabase-fixes.ts`, `supabase-local.ts`, `supabase-remote.ts`, `supabase-updated.ts`, y el antiguo `supabase.ts` (manual/incompleto).

### 6. Tests (`src/tests/_uncategorized/`)
Tests que se encontraban en la raíz de `src/tests/` sin categorizar.
- `androidSecurity.test.ts`
- `auth.test.ts`
- `Chat.test.tsx`
- `media-access.test.ts`
- `mobile.test.ts`
- `Neo4jService.test.ts`
- `performance.test.ts`
- `realtime-chat.test.ts`
- `ReportService.test.ts`
- `system-integration.test.ts`
- `TokenAnalyticsService.test.ts`
- `useToast.test.ts`
- `webVitals.test.ts`

## Instrucciones de Restauración
Si alguna funcionalidad se rompe debido a la falta de estos archivos:
1.  Busque el archivo en este directorio de backup.
2.  Compare el contenido con la implementación actual (si existe).
3.  Si es necesario restaurar, mueva el archivo de vuelta a su ubicación original o (preferiblemente) integre la lógica faltante en el nuevo componente modular.
