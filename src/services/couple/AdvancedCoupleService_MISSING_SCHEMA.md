# Esquema Faltante en `couple_profiles` para `AdvancedCoupleService`

El servicio `src/services/couple/AdvancedCoupleService.ts` intenta utilizar las siguientes columnas en la tabla `couple_profiles` que **no existen** en la definición actual de tipos (`types.ts`):

## Columnas Faltantes
1.  **couple_name** (string)
    *   **Uso:** Nombre visible de la pareja.
    *   **Estado actual:** No existe.
2.  **couple_bio** (string)
    *   **Uso:** Biografía o descripción de la pareja.
    *   **Estado actual:** No existe.
3.  **relationship_type** (enum/string)
    *   **Uso:** Tipo de relación (ej. 'man-woman', 'man-man', etc.).
    *   **Estado actual:** No existe.
4.  **couple_images** (array string / json)
    *   **Uso:** URLs de fotos de la pareja.
    *   **Estado actual:** No existe.
5.  **preferences** (json)
    *   **Uso:** Preferencias de búsqueda y configuración.
    *   **Estado actual:** No existe.
6.  **is_verified** (boolean)
    *   **Uso:** Estado de verificación de la pareja.
    *   **Estado actual:** No existe.
7.  **is_premium** (boolean)
    *   **Uso:** Estado de suscripción premium.
    *   **Estado actual:** No existe.

## Impacto
*   **Crítico:** La creación de perfiles de pareja (`createCoupleProfile`) fallará o perderá datos esenciales.
*   **Funcionalidad Rota:** No se pueden mostrar nombres, fotos ni biografías de parejas.

## Acción Recomendada
Crear una migración para agregar estas columnas a `couple_profiles`.
