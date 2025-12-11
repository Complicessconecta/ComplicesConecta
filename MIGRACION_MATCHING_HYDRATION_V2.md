# Plan de Migración a Hydration V2 (SmartMatchingService)

> Rama base: `master`
> Respaldo existente: `backup/main-11dic2025` (copia de `main` antes de la migración)

---

## Fase 0 – Respaldo y Línea Base

- [x] **Backup de main**
  - Rama: `backup/main-11dic2025`
  - Punto de referencia para revertir cualquier cambio de matching.
- [x] **Confirmar estado estable**
  - `pnpm run build` sin errores.
  - Deploy estable en Vercel + app Android sincronizada (`npx cap sync android`).

---

## Fase 1 – API Oficial del Servicio de Matching

**Objetivo:** Definir puntos de entrada claros para nuevas features.

### 1.1 Nuevos métodos de alto nivel

Archivo: `src/services/SmartMatchingService.ts`

- [ ] Agregar método **`getDefaultMatches`** (wrapper sobre V2 Hydration):

```ts
/**
 * Punto de entrada recomendado para matching estándar.
 * Internamente usa getMatchesV2 (Hydration: Neo4j + Supabase).
 */
async getDefaultMatches(
  userId: string,
  options: MatchSearchOptions = {}
): Promise<MatchSearchResult> {
  return this.getMatchesV2(userId, options);
}
```

- [ ] Agregar método **`getSecureMatches`** (wrapper sobre `findMatchesSecure`):

```ts
/**
 * Punto de entrada recomendado para flujos sensibles (producción, privacidad).
 */
async getSecureMatches(
  userId: string,
  options: MatchSearchOptions = {}
): Promise<MatchSearchResult> {
  return this.findMatchesSecure(userId, options);
}
```

### 1.2 Marcar v1 como legacy

- [ ] En `findMatches(...)` agregar JSDoc:

```ts
/**
 * @deprecated Usar getDefaultMatches() / getSecureMatches() en nuevas features.
 * Mantener solo para compatibilidad interna y fallbacks.
 */
```

Resultado de la Fase 1:
- Nuevas features solo deben usar `getDefaultMatches` o `getSecureMatches`.

---

## Fase 2 – Migración de Consumidores Existentes

**Objetivo:** Reducir uso directo de `findMatches` v1 en código de alto nivel.

### 2.1 PredictiveGraphMatchingService

Archivo: `src/services/ai/PredictiveGraphMatchingService.ts`

Uso actual:

```ts
const compatibilityMatches = await smartMatchingService.findMatches(userId, {
  limit: limit * 2
});
```

Cambio propuesto:

- [ ] Reemplazar por **V2 Hydration**:

```ts
const compatibilityMatches = await smartMatchingService.getDefaultMatches(userId, {
  limit: limit * 2
});
```

> Nota: Si este flujo se usa en contextos de producción con datos sensibles, evaluar migrarlo a `getSecureMatches`.

### 2.2 Fallbacks en `getRecommendedUsers`

Archivo: `src/services/SmartMatchingService.ts`

Hay varios fallbacks del tipo:

```ts
return this.findMatches(userId, { ...options, limit });
```

Plan gradual:

- [ ] Añadir comentario de TODO junto a cada fallback:

```ts
// TODO v3.7+: migrar fallback a getDefaultMatches (Hydration V2)
```

- [ ] En una iteración posterior (opcional, v3.7+):
  - Reemplazar `this.findMatches(...)` por `this.getDefaultMatches(...)` manteniendo `options` y `limit`.

Resultado de la Fase 2:
- Todo código de alto nivel (servicios AI) usa Hydration V2 como primera opción.
- `findMatches` queda restringido a fallbacks controlados.

---

## Fase 3 – Gobernanza y Prevención de Regresiones

**Objetivo:** Evitar que se agreguen nuevos usos de `findMatches` v1 fuera del servicio.

### 3.1 Regla de revisión de código

- [ ] Documentar en:
  - `README_DEVOPS.md` → sección "Matching".
  - `IMPLEMENTACION_PERSISTENCIA_POLIGLOTA.md` → agregar nota:

    > **API oficial de matching**
    > - `getDefaultMatches()` → Matching estándar con Hydration V2.
    > - `getSecureMatches()` → Matching con validación de privacidad.
    > - `findMatches()` → Legacy, solo para fallbacks internos.

### 3.2 Chequeo rápido antes de merge

Comando manual (o hook de CI) para detectar usos indebidos:

```bash
rg "smartMatchingService\\.findMatches" src \
  --glob '!src/services/SmartMatchingService.ts'
```

- [ ] Si este comando devuelve resultados → el PR debe ajustarse a usar `getDefaultMatches` / `getSecureMatches`.

---

## Fase 4 – Limpieza Opcional (Futuro)

**Objetivo:** Cuando todo esté estable y medido en producción.

- [ ] Reducir la firma pública de `SmartMatchingService`:
  - Mantener públicos: `getDefaultMatches`, `getSecureMatches`, `getRecommendedUsers`, `findMatchesSecure`.
  - Marcar `getMatchesV2` como implementación interna (o re-exportar solo vía `getDefaultMatches`).
- [ ] Evaluar si `findMatches` v1 puede:
  - Quedarse solo como helper privado.
  - O mantenerse público pero con etiqueta `@internal` en la documentación.

---

## Métricas y Validación

Antes y después de completar Fase 2:

- [ ] Medir tiempos de respuesta promedio de endpoints de matching (p95/p99) usando Datadog / logs.
- [ ] Verificar que el número de matches devueltos por usuario no se reduce de forma inesperada.
- [ ] Monitorear errores relacionados con Neo4j y Supabase durante las primeras 24–48h tras el despliegue.

---

## Resumen Ejecutivo

1. **Respaldo** ya creado: `backup/main-11dic2025`.
2. **Hydration V2** (`getMatchesV2` / `findMatchesSecure`) ya implementado.
3. Este plan define **cómo migrar el consumo** para que todas las nuevas features y servicios usen Hydration V2, manteniendo `findMatches` solo como compatibilidad y fallback controlado.
