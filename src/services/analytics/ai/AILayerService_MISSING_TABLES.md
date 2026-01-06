# Tablas Faltantes para `AILayerService`

El servicio `src/services/ai/AILayerService.ts` depende de tablas que no se encuentran en la definición de tipos (`types.ts`).

## Tablas Faltantes

1.  **swinger_interests**
    - **Uso:** Relación de intereses específicos para perfiles swingers (`profiles.select('*, interests:swinger_interests(*)')`).
    - **Estado actual:** No encontrada en `types.ts`.
    - **Impacto:** Fallará la extracción de features para el algoritmo de matching ML.

2.  **couple_profile_likes**
    - **Uso:** Registro de likes entre perfiles de pareja.
    - **Estado actual:** No encontrada en `types.ts`.
    - **Impacto:** Imposible calcular "Likes intercambiados" (Feature 1 del modelo ML).

## Nota sobre `story_comments`

- Esta tabla **SÍ existe** en `types.ts`, por lo que su uso en `AILayerService` es correcto, asumiendo que las relaciones FK estén bien definidas.

## Acción Recomendada

Crear las tablas `swinger_interests` (o verificar si se llama `profile_interests`) y `couple_profile_likes`.
