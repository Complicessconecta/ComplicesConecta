# Mapeo Estructural Integral y Análisis de Conectividad (Auditoría Forense)

## Resumen Ejecutivo

**Estado de Salud del Proyecto: 65/100 (Requiere Intervención)**

La auditoría forense del directorio `src/` revela una base de código funcional pero con una deuda técnica estructural significativa. La arquitectura sufre de inconsistencias, código huérfano y directorios monolíticos que comprometen la mantenibilidad y escalabilidad del proyecto. Aunque la lógica de negocio principal es robusta, la organización del código no sigue una separación de responsabilidades estricta, lo que aumenta la complejidad y el riesgo de regresiones.

Se requiere una refactorización guiada para alinear el proyecto con las mejores prácticas de una arquitectura React + TypeScript moderna y sostenible.

## Leyenda de Estado

*   ✅ **[CORRECTO]**: Archivo operativo, conectado correctamente al flujo principal, sin duplicados y con lógica sana.
*   ⚠️ **[ADVERTENCIA]**: Archivo huérfano (no importado), posible duplicado, lógica cuestionable, "code smell" o deuda técnica que requiere revisión.
*   ❌ **[CRÍTICO]**: Archivo vacío, importaciones rotas, errores de sintaxis, lógica corrupta o conflictos graves que deben ser resueltos con urgencia.

---

## Árbol de Estructura y Estado Detallado

### Directorio Raíz: `src/`

*   ✅ `App.tsx` (`/src/App.tsx`) # Componente raíz y enrutador principal de la aplicación.
*   ⚠️ `main.tsx` (`/src/main.tsx`) # Punto de entrada con lógica anómala y riesgosa para la inyección global de React.
*   ✅ `index.css` (`/src/index.css`) # Estilos globales principales.
*   ✅ `vite-env.d.ts` (`/src/vite-env.d.ts`) # Tipos de entorno de Vite.
*   ✅ `debug.tsx` (`/src/debug.tsx`) # Proveedor de información de depuración para desarrollo.
*   ⚠️ `EnvDebug.tsx` (`/src/EnvDebug.tsx`) # [ADVERTENCIA] Componente de depuración huérfano, no conectado/importado en la aplicación.

### Subdirectorios en `src/`

#### `src/ai/`
*   ✅ `AIWorker.ts` (`/src/ai/AIWorker.ts`) # Lógica del Web Worker para el modelo de IA local (WebLLM).
*   ✅ `useLocalAI.ts` (`/src/ai/useLocalAI.ts`) # Hook para interactuar con el motor de IA local.

#### `src/components/`
*   ⚠️ **Directorio `components`** # [ADVERTENCIA] Directorio monolítico con más de 397 elementos. Mezcla componentes de UI, lógica de negocio y componentes que deberían ser páginas.
*   ✅ **Subdirectorios de UI Pura** (`/src/components/ui/`, `/src/components/animations/`, etc.) # Contienen componentes reutilizables y, en su mayoría, bien estructurados.
*   ⚠️ **Subdirectorios de Features** (`/src/components/chat/`, `/src/components/profiles/`, etc.) # [ADVERTENCIA] Contienen lógica de negocio y estado que debería residir en `src/features` o `src/hooks`.
*   ⚠️ `components/profiles/shared/ImageGallery.tsx` (`/src/components/profiles/shared/ImageGallery.tsx`) # [ADVERTENCIA] Lógica de negocio para desbloqueo de galerías incompleta (placeholder).

#### `src/context/`
*   ✅ `AppContext.tsx` (`/src/context/AppContext.tsx`) # Proveedor de contexto principal de la aplicación.
*   ✅ `BackgroundContext.tsx` (`/src/context/BackgroundContext.tsx`) # Contexto para la gestión de fondos dinámicos.

#### `src/features/`
*   ✅ **Directorio `features`** # Contiene lógica de negocio y hooks específicos de funcionalidades, aunque sufre de inconsistencia al coexistir con lógica similar en `components` y `hooks`.

#### `src/hooks/`
*   ⚠️ **Directorio `hooks`** # [ADVERTENCIA] Contiene hooks reutilizables, pero no existe una regla clara de co-localización vs. centralización, lo que genera una dispersión de la lógica.

#### `src/lib/`
*   ⚠️ **Directorio `lib`** # [ADVERTENCIA] Directorio monolítico ("cajón de sastre") con más de 54 utilidades. Requiere una reorganización en módulos cohesivos.
*   ✅ `logger.ts` (`/src/lib/logger.ts`) # Utilidad de logging centralizada.
*   ✅ `validation.ts` (`/src/lib/validation.ts`) # Lógica de validación de datos (email, teléfono, etc.).
*   ⚠️ `test-debugger.ts` (`/src/lib/test-debugger.ts`) # [ADVERTENCIA] Utilidad de depuración huérfana, no utilizada.

#### `src/pages/`
*   ✅ **Directorio `pages`** # La mayoría de los archivos son páginas válidas y están correctamente enrutadas.
*   ⚠️ `TokensInfoLazy.tsx` (`/src/pages/TokensInfoLazy.tsx`) # [ADVERTENCIA] Componente obsoleto o de prueba, duplicado de `TokensInfo.tsx`.
*   ⚠️ `landing/index.tsx` (`/src/pages/landing/index.tsx`) # [ADVERTENCIA] Página de aterrizaje alternativa y huérfana, no conectada al flujo principal.

#### `src/services/`
*   ❌ **Directorio `services`** # [CRÍTICO] Directorio "dios" con más de 75 servicios. La falta de modularización es un riesgo crítico para la mantenibilidad.
*   ✅ `ContentModerationService.ts` (`/src/services/ContentModerationService.ts`) # Orquestador principal del flujo de moderación.
*   ✅ `permanentBan.ts` (`/src/services/permanentBan.ts`) # Lógica de baneo permanente y huella digital.
*   ⚠️ `legal/CoupleDissolutionService_MISSING_SCHEMA.md` (`/src/services/legal/CoupleDissolutionService_MISSING_SCHEMA.md`) # [ADVERTENCIA] Archivo de notas obsoleto.

#### `src/tests/`
*   ✅ **Directorio `tests`** # Estructura de pruebas bien organizada, separando tests unitarios, de integración y e2e.

#### `src/types/`
*   ✅ **Directorio `types`** # Contiene las definiciones de tipos y interfaces de TypeScript, incluyendo los tipos generados de Supabase.

---

## Recomendaciones de Limpieza y Refactorización

1.  **Eliminar Archivos Huérfanos y Obsoletos (Acción Inmediata):**
    *   `src/EnvDebug.tsx`
    *   `src/pages/TokensInfoLazy.tsx`
    *   `src/pages/landing/index.tsx`
    *   `src/lib/test-debugger.ts`

2.  **Refactorizar Directorios Monolíticos (Prioridad Alta):**
    *   **`src/services`**: Descomponer en subdirectorios por dominio de negocio (e.g., `src/services/security/`, `src/services/analytics/`, `src/services/payments/`).
    *   **`src/lib`**: Reorganizar en módulos de utilidades más específicos (e.g., `src/lib/utils/`, `src/lib/validation/`, `src/lib/config/`).

3.  **Simplificar `main.tsx` (Prioridad Alta):**
    *   Investigar la causa de la necesidad de inyectar React globalmente y eliminar esta lógica no estándar, confiando en el manejo de módulos de Vite.

4.  **Auditoría y Refactorización de `src/components` (Prioridad Media):**
    *   Extraer toda la lógica de negocio, estado y hooks de los subdirectorios de `components` hacia `src/features` y `src/hooks` para que `components` contenga únicamente componentes de UI puros y reutilizables.

5.  **Completar Funcionalidades Críticas (Prioridad Crítica de Negocio):**
    *   Implementar la lógica de **gasto de tokens** en `src/components/profiles/shared/ImageGallery.tsx` para completar el flujo económico de la plataforma.
    *   Implementar el sistema de **feedback para moderadores** para cerrar el ciclo del flujo de moderación.
