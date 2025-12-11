# AUDITORIA INTEGRAL FASE 2: complicesconecta

Este documento presenta los hallazgos de la auditoría de software realizada sobre el proyecto `complicesconecta`. La auditoría se centra en 4 pilares: Limpieza y Estructura, Calidad de Código, Seguridad y Arquitectura de Datos.

*Fecha de Auditoría:* 2025-12-10

## Resumen Ejecutivo

La auditoría revela un proyecto con una base funcional sólida pero que sufre de una deuda técnica y de seguridad considerable. Se han identificado **5 Errores Críticos** que exponen claves secretas de servicios de terceros y contraseñas directamente en el código del frontend, requiriendo acción inmediata.

Además, existen **cientos de advertencias** relacionadas con la calidad del código, incluyendo un uso masivo del tipo `any` en TypeScript, dependencias de hooks incompletas, y una estructura de archivos desorganizada con código duplicado y muerto. La arquitectura de sincronización de datos entre Postgres y Neo4j, aunque funcional, se basa en un script manual que introduce riesgos de desactualización y mantenimiento.

Se recomienda un plan de acción enfocado primero en mitigar las vulnerabilidades críticas de seguridad, seguido de una fase de limpieza y refactorización para mejorar la mantenibilidad y estabilidad del proyecto.

---

## 1. Errores Críticos (Acción Inmediata Requerida)

Estos errores representan riesgos de seguridad graves, exposición de datos o fallos funcionales catastróficos.

1.  **[CRÍTICO] Clave de API de OpenAI expuesta:** El fichero `services/ai/EmotionalAIService.ts` (y otros) carga la `VITE_OPENAI_API_KEY` directamente en el código cliente. Esto permite a cualquier usuario realizar peticiones a la API de OpenAI con cargo al propietario del proyecto.
2.  **[CRÍTICO] Clave de API de Pinata (JWT) expuesta:** El fichero `services/NFTService.ts` expone la `VITE_PINATA_JWT`. Esto permite a cualquier usuario subir archivos al servicio de Pinata del proyecto.
3.  **[CRÍTICO] Clave de encriptación de Wallets expuesta:** El fichero `services/WalletService.ts` carga `VITE_WALLET_ENCRYPTION_KEY` en el cliente. Si esta clave es estática, compromete la seguridad de todas las wallets de usuario.
4.  **[CRÍTICO] Credenciales de Neo4j expuestas:** El fichero `services/graph/Neo4jService.ts` carga `VITE_NEO4J_PASSWORD` en el cliente, exponiendo la base de datos de grafos a ataques directos.
5.  **[CRÍTICO] Contraseña de producción hardcodeada:** El fichero `lib/app-config.ts` contiene una contraseña de producción (`Magy_Wacko_nala28`) como fallback, exponiéndola directamente en el código fuente.

---

## 2. Advertencias y Deuda Técnica

Estos puntos degradan la calidad del código, aumentan la probabilidad de bugs y dificultan el mantenimiento.

1.  **Uso masivo de `any` en TypeScript:** Se encontraron **más de 1200 warnings** de ESLint, la gran mayoría por el uso de `any`. Esto anula las ventajas de TypeScript y es una fuente principal de bugs.
    *   **Ejemplos:** `catch (error: any)`, `data.map((item: any) => ...)` y en la definición de props de componentes.
    *   **Ficheros notables:** `utils/wallets.ts`, `services/ErrorAlertService.ts`, `components/ui/chart.tsx`.
2.  **Dependencias de Hooks incompletas (`useEffect`, `useCallback`):** El linter reportó docenas de casos donde el array de dependencias de un hook es incorrecto. Esto provoca "stale state" y que los efectos no se ejecuten cuando deberían, un tipo de bug muy difícil de depurar.
    *   **Ejemplo:** `hooks\useRealtimeNotifications.ts` tiene un `useEffect` sin `messages.length` en sus dependencias, por lo que no reaccionará a nuevos mensajes.
3.  **Código Muerto y No Utilizado:** El linter reportó una gran cantidad de variables e importaciones no utilizadas (`@typescript-eslint/no-unused-vars`). Esto indica una limpieza de código deficiente tras refactorizaciones.
    *   **Ejemplos:** `components/profiles/single/ProfileSingle.tsx` y `pages/Discover.tsx` tienen múltiples importaciones sin usar.
4.  **Estructura de Ficheros Duplicada y Confusa:** Existe una duplicación severa de ficheros y nombres, probablemente por una migración de `pages` a `app` router incompleta.
    *   **Duplicados directos:** `features/profile/CoupleProfilesService.ts` y `components/profiles/couple/CoupleProfilesService.ts`.
    *   **Componentes con lógica similar y nombres confusos:** `components/profiles/couple/ProfileCouple.tsx` vs `components/profiles/couple/CoupleProfileCard.tsx`.
    *   **Componentes de UI duplicados:** `components/lazy/LazyComponentLoader.tsx` y `components/performance/LazyComponentLoader.tsx`.
5.  **URLs y "Magic Strings" Hardcodeados:** Hay una gran cantidad de URLs de servicios y de assets hardcodeadas en el código.
    *   **URLs de APIs internas:** `https://api1.complicesconecta.com` en `services/LoadBalancingService.ts` debe estar en variables de entorno.
    *   **URLs de RPC:** Endpoints de Polygon RPC en `services/WalletService.ts` deben ser variables de entorno.
    *   **URLs de assets:** Múltiples URLs de `images.unsplash.com` se usan para mock data. Aunque es aceptable en desarrollo, deben estar centralizadas.
6.  **Arquitectura de Sincronización de Datos Manual:** La sincronización entre Postgres (Supabase) y Neo4j se realiza mediante un script (`scripts/sync-postgres-to-neo4j.ts`). Esto es un punto de fallo único, introduce riesgo de datos desactualizados si no se ejecuta, y requiere mantenimiento manual ante cambios de esquema.

---

## 3. Archivos Sugeridos para ELIMINAR

Basado en la duplicación y la migración de `pages` a `app`, se sugiere una revisión para eliminar los siguientes (previa verificación de que no están en uso):

*   Toda la carpeta `src/pages/`, ya que su contenido parece haber sido migrado a `src/app/`.
*   `src/components/profiles/couple/CoupleProfilesService.ts` (usar el de `src/features`).
*   `src/components/performance/LazyComponentLoader.tsx` (unificar con el de `src/components/lazy/`).
*   `src/components/ui/buttons/NFTMintButton.tsx` (unificar con `src/components/blockchain/NFTMintButton.tsx`).
*   `src/themes/useTheme.ts` (unificar con `src/hooks/useTheme.ts`).
*   Múltiples tests duplicados en `src/tests/` y `src/tests/unit/`.

---

## 4. Plan de Acción Recomendado

### Fase 1: Contención de Seguridad (Inmediato)

1.  **Rotar todas las claves expuestas:** Asumir que las claves de OpenAI, Pinata, Neo4j y la contraseña de producción están comprometidas. Generar nuevas claves y revocarlas antiguas.
2.  **Mover claves a variables de entorno:** Mover TODAS las claves (`VITE_OPENAI_API_KEY`, `VITE_PINATA_JWT`, etc.) a un fichero `.env` y asegurarse de que **NO** se exponen al cliente. Las variables que se exponen al cliente deben tener el prefijo `VITE_PUBLIC_`.
3.  **Crear un backend "broker":** Para las acciones que requieran claves secretas (como llamar a OpenAI o Pinata), crear funciones de Supabase (Edge Functions) que actúen como intermediario. El frontend llamará a estas funciones seguras, y ellas usarán las claves secretas en el backend.

### Fase 2: Limpieza y Deuda Técnica (Corto Plazo)

1.  **Ejecutar Linter con `--fix`:** Correr `npx eslint . --fix`. Esto solucionará automáticamente la mayoría de los imports no utilizados y algunos problemas de formato.
2.  **Solucionar `exhaustive-deps`:** Revisar manualmente cada warning de `react-hooks/exhaustive-deps`. Añadir las dependencias que faltan a los `useEffect` y `useCallback`. Este es un trabajo tedioso pero crucial para la estabilidad.
3.  **Centralizar URLs:** Mover todas las URLs de APIs, RPCs y dominios de terceros a variables de entorno con el prefijo `VITE_PUBLIC_`.
4.  **Consolidar Ficheros Duplicados:** Analizar los ficheros listados en la sección de eliminación. Unificar la lógica en un solo fichero y eliminar los duplicados. Empezar por la carpeta `src/pages`.

### Fase 3: Refactorización y Calidad (Medio Plazo)

1.  **Campaña "Anti-any":** Priorizar los ficheros más críticos (servicios, hooks, contexto de React) y empezar a reemplazar los `any` por tipos específicos. Usar los tipos generados por Supabase (`supabase-generated.ts`) siempre que sea posible.
2.  **Revisar Arquitectura de Sincronización:** Evaluar si el script `sync-postgres-to-neo4j.ts` puede ser reemplazado por una solución más robusta, como triggers de base de datos y Supabase Edge Functions que escriban en Neo4j en tiempo real o casi real tras una modificación en Postgres.
3.  **Mejorar Estructura de Ficheros:** Reorganizar componentes de UI en una estructura más lógica y eliminar directorios que quedaron vacíos o redundantes tras la limpieza.