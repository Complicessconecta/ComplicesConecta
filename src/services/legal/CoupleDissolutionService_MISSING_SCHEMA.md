# Esquema Faltante en `couple_disputes` para `CoupleDissolutionService`

El servicio `src/services/legal/CoupleDissolutionService.ts` utiliza columnas y lógica que no coinciden con la tabla `couple_disputes` actual en `types.ts`.

## Columnas Faltantes / Discrepancias

1.  **frozen_assets_snapshot** (json)
    *   **Uso:** Almacenar el estado de los activos al momento del congelamiento.
    *   **Estado actual:** No existe. Existe `nfts_in_dispute` y `tokens_in_dispute` por separado, pero el servicio intenta guardar un snapshot completo en un solo campo.
2.  **proposed_winner_id** (uuid)
    *   **Uso:** ID del usuario propuesto como ganador de la disputa.
    *   **Estado actual:** No existe.
3.  **proposed_at** (timestamp)
    *   **Uso:** Fecha de la propuesta.
    *   **Estado actual:** No existe.
4.  **winner_accepted_by** (uuid)
    *   **Uso:** ID del usuario que acepta la propuesta.
    *   **Estado actual:** No existe.
5.  **accepted_at** (timestamp)
    *   **Uso:** Fecha de aceptación.
    *   **Estado actual:** No existe.

## Errores de Inserción
*   El servicio intenta insertar sin `couple_agreement_id`, que es **NOT NULL** en la base de datos actual.
*   El servicio intenta insertar sin `dispute_reason`, que es **NOT NULL** (aunque el servicio recibe un motivo implícito, no lo pasa al insert).

## Impacto
*   **Crítico:** El protocolo de disolución ("Cuenta Regresiva") fallará al intentar crear o actualizar disputas.
*   **Pérdida de Datos:** No hay dónde guardar la propuesta de resolución.

## Acción Recomendada
Actualizar la tabla `couple_disputes` para soportar el flujo de propuesta/aceptación y alinear los campos obligatorios.
