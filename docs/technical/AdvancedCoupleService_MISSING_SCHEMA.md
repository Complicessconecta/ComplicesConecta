# Estado de esquema `couple_profiles` para `AdvancedCoupleService`

Este documento era un reporte de “schema faltante”, pero con el estado actual del proyecto quedó **desactualizado**.

## Verificación (aplicado ✅)

En los tipos actuales de Supabase (`src/integrations/supabase/types.ts`), la tabla `couple_profiles` **sí incluye** las columnas necesarias que usa `src/services/social/couple/AdvancedCoupleService.ts`, incluyendo:

- `couple_name`
- `bio`
- `relationship_type`
- `photos` (equivalente a lo que antes se describía como “couple_images”)
- `preferences`
- `is_verified`
- `is_premium`

Por lo tanto, **no aplica** crear una migración para agregar esas columnas (ya existen en el schema tipado actual).

## Notas de compatibilidad

- Si en algún lugar todavía se ven “columnas faltantes”, normalmente es porque se está usando un archivo de tipos distinto/antiguo (p. ej. `src/types/supabase-*.ts`) o un `Database` generado desfasado.
- La nomenclatura correcta en el schema actual es `bio` y `photos` (no `couple_bio` ni `couple_images`).

## Acción recomendada

- Mantener este documento como referencia histórica y moverlo a documentación técnica de parejas.
