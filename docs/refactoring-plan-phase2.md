# Informe de Análisis y Plan de Refactorización

## FASE 2 - PASO 1: Detección de "God Components"

Se ha realizado un escaneo de los directorios `src/components`, `src/pages` y `src/app` en busca de archivos con más de 300 líneas de código.

### Archivos Críticos Identificados:

-   **`src/components/profiles/couple/ProfileCouple.tsx`**: **900 líneas**
-   **`src/app/(admin)/AdminDashboard.tsx`**: **726 líneas** (equivalente a `src/pages/Admin/AdminDashboard.tsx`)
-   **`src/components/profiles/single/ProfileSingle.tsx`**: 1236 líneas
-   **`src/pages/TokensInfo.tsx`**: 1223 líneas
-   **`src/components/profiles/couple/EditProfileCouple.tsx`**: 1016 líneas
-   **`src/pages/Discover.tsx`**: 1005 líneas
-   **`src/pages/ModeratorDashboard.tsx`**: 991 líneas
-   **`src/pages/Chat.tsx`**: 928 líneas

El análisis se centrará en los dos primeros, como se solicitó.

---

## FASE 2 - PASO 2: Estrategia de División de Componentes

### 1. Plan para `AdminDashboard.tsx` (726 líneas)

Este componente maneja la obtención de todos los datos, la lógica de estado y la renderización de un dashboard multi-pestaña.

**Bloques Lógicos Identificados:**
-   **Lógica de Datos:** La función `loadDashboardData` (aprox. 100 líneas) obtiene 8+ tipos de datos diferentes.
-   **Estado del Componente:** Múltiples `useState` para estadísticas, actividad de usuarios, reportes, etc.
-   **Componente de Cabecera:** El JSX que renderiza el título y el botón de actualizar.
-   **Tarjetas de Estadísticas:** Un grid con 6+ tarjetas (`<Card>`) que muestran métricas clave. Cada tarjeta es un bloque repetitivo.
-   **Pestañas (Tabs):** El componente `<Tabs>` que gestiona las vistas de "Resumen", "Usuarios", "Reportes" y "Sistema".
-   **Lógica de Pestañas Individuales:** El contenido de cada `<TabsContent>` es un sub-componente en sí mismo (ej. `OverviewTab`, `UsersTab`).
-   **Funciones de Utilidad:** `exportData`, `resolveReport`, `getSeverityColor`, `formatDate`.

**Estrategia de Refactorización Propuesta:**

1.  **Extraer la Lógica de Datos a un Hook Personalizado:**
    -   Crear `src/app/(admin)/hooks/useAdminDashboardData.ts`.
    -   Este hook contendrá la función `loadDashboardData` y gestionará los estados de `loading` y `refreshing`. Devolverá los datos formateados (`stats`, `userActivity`, etc.).
    -   El componente `AdminDashboard` simplemente llamará a `const { data, loading, refreshData } = useAdminDashboardData();`.

2.  **Crear Componentes Atómicos para las Estadísticas:**
    -   Crear un componente `src/app/(admin)/components/StatCard.tsx`.
    -   Recibirá props como `title`, `value`, `change`, `icon`.
    -   El dashboard mapeará un array de datos de estadísticas para renderizar `StatCard` repetidamente, limpiando el JSX principal.

3.  **Dividir el Dashboard en Sub-Componentes por Pestaña:**
    -   Crear una carpeta `src/app/(admin)/components/tabs/`.
    -   Crear `OverviewTab.tsx`, `UsersTab.tsx`, `ReportsTab.tsx` y `SystemTab.tsx` dentro de esa carpeta.
    -   Cada archivo recibirá los datos necesarios como props desde `AdminDashboard`.
    -   La lógica específica de cada pestaña (ej. `exportData`, `resolveReport`) se moverá a su componente correspondiente.

4.  **Crear un Componente de Cabecera:**
    -   Crear `src/app/(admin)/components/DashboardHeader.tsx` que contenga el título, el botón de "Volver" y el botón de "Actualizar".

### 2. Plan para `ProfileCouple.tsx` (900 líneas)

Componente masivo que gestiona la visualización del perfil de pareja, incluyendo datos, estados, modales, pestañas, lógica de wallet, NFTs, y más.

**Bloques Lógicos Identificados:**
-   **Lógica de Carga de Datos:** `useEffect` masivo que carga datos de perfil, actividad, logros y tokens, mezclando lógica de demo con la real.
-   **Gestión de Múltiples Estados:** Más de 25 `useState` para gestionar el perfil, modales, notificaciones, galería, likes, etc.
-   **Componente Toast Personalizado:** Definido localmente dentro del archivo.
-   **Lógica de Handlers:** Múltiples funciones `handle...` para acciones como subir imágenes, enviar PIN, reclamar tokens, mintear NFTs, etc.
-   **Componentes de UI Complejos:**
    -   Tarjeta de Wallet y Coleccionables.
    -   Tarjeta de Arquitectura de Seguridad.
    -   Tarjeta de Perfil Principal (con avatares, nombres, etc.).
    -   Sistema de Pestañas (Resumen, Actividad, Logros, Analytics).
    -   Múltiples Modales (PIN, Minteo de NFT, Diálogo de confirmación, etc).

**Estrategia de Refactorización Propuesta:**

1.  **Crear Hooks Específicos para Lógica de Dominio:**
    -   **`src/features/profile/hooks/useCoupleProfileData.ts`**: Encargado de cargar los datos del perfil (`loadProfile`), actividad y logros. Separar la lógica de demo de la de producción.
    -   **`src/features/blockchain/hooks/useCoupleWallet.ts`**: Mover toda la lógica relacionada con tokens y NFTs (`tokenBalances`, `coupleNFTs`, `handleClaimTokens`, `handleMintClick`).

2.  **Dividir la UI en Componentes Granulares:**
    -   Crear el directorio `src/components/profiles/couple/components/`.
    -   **`CoupleProfileHeader.tsx`**: Renderizaría la tarjeta de perfil principal con los avatares, nombres y botones de acción.
    -   **`CoupleWallet.tsx`**: Contendría la sección de Wallet, Coleccionables y los diagramas de seguridad. Usaría el hook `useCoupleWallet`.
    -   **`CoupleTabs.tsx`**: Gestionaría el `<Tabs>` y el contenido de cada pestaña, importando componentes más pequeños para `Activity`, `Achievements`, etc.
    -   **`PrivateGallery.tsx`**: Movería la lógica de la galería de fotos privadas, incluyendo el desbloqueo por PIN y el modal de imágenes.

3.  **Mover Componentes y Tipos Genéricos:**
    -   El componente `Toast` debe moverse a `src/components/ui/Toast.tsx` para ser reutilizado globalmente.
    -   Los tipos locales (`PrivateImageItem`, `ConfirmDialogState`) deben moverse a un archivo de tipos relevante como `src/features/profile/types.ts`.

---

## FASE 2 - PASO 3: Auditoría de Tipos (TypeScript)

Se ha realizado un análisis de la carpeta `src/types` y se ha comparado con `src/types/supabase-generated.ts`.

### Hallazgos:

1.  **Archivos de Anulación Manual:** La presencia de `supabase-final.ts`, `supabase-fixes.ts` y `supabase-updated.ts` confirma que se están extendiendo o modificando manualmente los tipos generados, lo cual es una práctica arriesgada y propensa a errores cuando la base de datos cambia.

2.  **Tipos Manuales Redundantes:**
    -   En `AdminDashboard.tsx`, se definen manualmente `DashboardStats`, `UserActivity` y `SystemReport`.
    -   En `ProfileCouple.tsx`, se definen `CoupleProfileRow` y `PrivateImageItem`.

    Estos tipos duplican parcialmente la estructura que ya existe en `supabase-generated.ts`. Por ejemplo:
    -   `UserActivity` puede ser reemplazado casi en su totalidad por `Database['public']['Tables']['profiles']['Row']`.
    -   `CoupleProfileRow` es una copia directa de `Database['public']['Tables']['couple_profiles']['Row']`.

### Plan de Estandarización de Tipos:

1.  **Eliminar Definiciones Manuales de Tablas:**
    -   Reemplazar `type CoupleProfileRow = ...` con una importación directa: `type CoupleProfileRow = Database['public']['Tables']['couple_profiles']['Row'];`.
    -   En `AdminDashboard`, en lugar de definir `UserActivity` manualmente, construirlo a partir de los tipos generados. Si se necesitan campos adicionales que no están en la tabla (como `is_active`), se pueden extender:
        ```typescript
        import { Database } from '@/types/supabase-generated';
        type ProfileRow = Database['public']['Tables']['profiles']['Row'];

        interface UserActivity extends ProfileRow {
          is_active: boolean;
        }
        ```

2.  **Centralizar y Consolidar Extensiones:**
    -   Revisar los archivos `supabase-fixes.ts` y `supabase-final.ts`.
    -   Crear un único archivo, por ejemplo `src/types/supabase-extensions.ts`, que importe los tipos de `supabase-generated.ts` y aplique las extensiones necesarias en un solo lugar. Esto evitará la dispersión y la confusión.
    -   El objetivo final es que los componentes importen los tipos desde un único punto de verdad, idealmente el archivo de extensiones, que a su vez se basa en el generado.

---

**Espero su confirmación para proceder con la implementación de este plan de refactorización.**