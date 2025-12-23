# Auditoría Estructural del Proyecto: CómplicesConecta v3.6.6

**Fecha de Auditoría:** 23 de Diciembre, 2025
**Directorio Analizado:** `@src`

## 1. Resumen Ejecutivo

Se ha realizado un análisis exhaustivo de la estructura de archivos dentro del directorio `src`. El proyecto presenta una arquitectura modular sólida en general, pero se han identificado inconsistencias significativas relacionadas con la duplicación de archivos y la organización de componentes y tests.

**Principales Hallazgos:**
*   **Duplicación Masiva en UI:** Existencia simultánea de componentes en `src/components/ui` (raíz) y en subdirectorios organizados (e.g., `src/components/ui/images`, `src/components/ui/buttons`).
*   **Desorganización en Tests:** Múltiples archivos de prueba existen tanto en la raíz de `src/tests` como en sus subcarpetas correspondientes (`unit`, `components`, `integration`).
*   **Fragmentación de Tipos:** Múltiples definiciones de tipos para Supabase (`supabase.ts`, `supabase-generated.ts`, `supabase-final.ts`, etc.), lo que puede llevar a inconsistencias en el tipado de la base de datos.
*   **Archivos Huérfanos/Desubicados:** Algunos modales y formularios se encuentran fuera de sus directorios lógicos (`src/components/modals` o `src/components/forms`).

---

## 2. Reporte Detallado de Hallazgos

### 2.1. Componentes UI (Duplicados y Desorganización)

Se detectó un patrón donde los componentes existen en la raíz de `ui` y también en una subcarpeta categorizada. Se recomienda mantener la versión categorizada y eliminar la de la raíz `ui` tras verificar que sean idénticas o que la categorizada sea la más reciente.

| Archivo / Directorio | Ruta Absoluta | Síntoma / Problema | Solución Propuesta |
| :--- | :--- | :--- | :--- |
| **ImageWithFallback.tsx** | `.../src/components/ui/ImageWithFallback.tsx` | **Duplicado Exacto**. Existe también en `.../src/components/ui/images/`. | **Eliminar** archivo en raíz `ui` y usar la versión en `ui/images`. Actualizar imports. |
| **LazyImage.tsx** | `.../src/components/ui/LazyImage.tsx` | **Duplicado**. Existe también en `.../src/components/ui/images/`. | **Eliminar** archivo en raíz `ui`. Consolidar en `ui/images`. |
| **OptimizedImage.tsx** | `.../src/components/ui/OptimizedImage.tsx` | **Duplicado**. Existe también en `.../src/components/ui/images/`. | **Eliminar** archivo en raíz `ui`. Consolidar en `ui/images`. |
| **LogoutButton.tsx** | `.../src/components/ui/LogoutButton.tsx` | **Duplicado**. Existe también en `.../src/components/ui/buttons/`. | **Eliminar** archivo en raíz `ui`. Consolidar en `ui/buttons`. |
| **carousel.tsx** | `.../src/components/ui/carousel.tsx` | **Duplicado**. Existe también en `.../src/components/ui/carousel/`. | **Eliminar** archivo en raíz `ui`. Mantener estructura modular en `ui/carousel`. |
| **chart.tsx** | `.../src/components/ui/chart.tsx` | **Duplicado**. Existe también en `.../src/components/ui/charts/`. | **Eliminar** archivo en raíz `ui`. Mantener en `ui/charts`. |
| **drawer.tsx** | `.../src/components/ui/drawer.tsx` | **Duplicado**. Existe también en `.../src/components/ui/drawer/`. | **Eliminar** archivo en raíz `ui`. Mantener en `ui/drawer`. |
| **sonner.tsx** | `.../src/components/ui/sonner.tsx` | **Duplicado**. Existe también en `.../src/components/ui/notifications/`. | **Eliminar** archivo en raíz `ui`. Mantener en `ui/notifications`. |
| **table.tsx** | `.../src/components/ui/table.tsx` | **Duplicado**. Existe también en `.../src/components/ui/table/`. | **Eliminar** archivo en raíz `ui`. Mantener en `ui/table`. |
| **popover.tsx** | `.../src/components/ui/popover.tsx` | **Duplicado**. Existe también en `.../src/components/ui/popover/`. | **Eliminar** archivo en raíz `ui`. Mantener en `ui/popover`. |
| **compliance-signup-form.tsx** | `.../src/components/ui/compliance-signup-form.tsx` | **Ubicación Incorrecta / Duplicado**. Existe en `ui` y `modals`. | Mover a `src/components/forms` o `src/components/auth` si es un formulario, o mantener en `modals` si es modal. Eliminar de `ui` raíz. |
| **vip-booking-modal.tsx** | `.../src/components/ui/vip-booking-modal.tsx` | **Ubicación Incorrecta / Duplicado**. Existe en `ui` y `modals`. | **Eliminar** de `ui` y mantener única fuente de verdad en `src/components/modals`. |

### 2.2. Tests (Duplicados en Raíz)

El directorio `src/tests` contiene muchos archivos en su raíz que ya han sido movidos a subcarpetas (`unit`, `integration`, `components`), generando ruido y posible ejecución doble de pruebas.

| Archivo / Directorio | Ruta Absoluta | Síntoma / Problema | Solución Propuesta |
| :--- | :--- | :--- | :--- |
| **Chat.test.tsx** | `.../src/tests/Chat.test.tsx` | **Duplicado**. Existe en `.../src/tests/components/`. | **Eliminar** de raíz `tests`. |
| **Neo4jService.test.ts** | `.../src/tests/Neo4jService.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **ReportService.test.ts** | `.../src/tests/ReportService.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **TokenAnalyticsService.test.ts** | `.../src/tests/TokenAnalyticsService.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **auth.test.ts** | `.../src/tests/auth.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **performance.test.ts** | `.../src/tests/performance.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **system-integration.test.ts** | `.../src/tests/system-integration.test.ts` | **Duplicado**. Existe en `.../src/tests/integration/`. | **Eliminar** de raíz `tests`. |
| **useToast.test.ts** | `.../src/tests/useToast.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |
| **webVitals.test.ts** | `.../src/tests/webVitals.test.ts` | **Duplicado**. Existe en `.../src/tests/unit/`. | **Eliminar** de raíz `tests`. |

### 2.3. Definiciones de Tipos (Supabase)

Confusión en la fuente de verdad para los tipos de base de datos.

| Archivo / Directorio | Ruta Absoluta | Síntoma / Problema | Solución Propuesta |
| :--- | :--- | :--- | :--- |
| **supabase-*.ts** | `.../src/types/` | **Fragmentación**. Múltiples archivos (`final`, `fixes`, `generated`, `local`, `remote`). | **Consolidar** en un único `supabase.ts` o `database.types.ts`. Archivar o eliminar versiones intermedias/obsoletas (`fixes`, `temp`). |

---

## 3. Plan de Acción Recomendado

1.  **Limpieza de UI**: Ejecutar script o eliminación manual de los archivos duplicados en `src/components/ui` listados arriba, asegurando que los imports en el proyecto apunten a las subcarpetas (e.g., `import { Button } from '@/components/ui/buttons/Button'` o mantener re-export en `index.ts` pero moviendo el archivo físico).
    *   *Nota*: Si se usa `index.ts` en `ui` para re-exportar, asegurar que apunte a las subcarpetas.
2.  **Limpieza de Tests**: Eliminar todos los `.test.ts` y `.test.tsx` de la raíz de `src/tests` que tengan duplicado en subcarpetas.
3.  **Unificación de Tipos**: Revisar `src/types` y determinar cuál es el esquema de Supabase más reciente y válido. Renombrar a `supabase.types.ts` y eliminar el resto.

## 4. Validación

Tras la aplicación de estas correcciones, se debe ejecutar:
1.  `npm run type-check` (para verificar imports rotos).
2.  `npm run test` (para asegurar que los tests siguen corriendo desde sus nuevas ubicaciones).
3.  Build de producción para asegurar integridad.
