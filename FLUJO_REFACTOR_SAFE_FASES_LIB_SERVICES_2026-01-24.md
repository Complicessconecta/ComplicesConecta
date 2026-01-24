# Flujo de Refactor Seguro por Fases (src/lib y src/services)

**Fecha:** 24 Enero 2026
**Scope:** Refactor diferido (PR dedicado) para reducir “directorios monolíticos” sin romper imports/flujos críticos.

---

## Objetivo

Reducir riesgo y deuda técnica en:

- `src/lib/` ("cajón de sastre")
- `src/services/` ("directorio dios")

Manteniendo invariantes:

- No romper flujos: registro → discover → match → chat → check-in.
- No introducir `any`/`as any`.
- No mover archivos en caliente sin un plan de migración de imports.

---

## Fase 0 — Baseline y reglas de seguridad (obligatoria)

- **Nombre:** Baseline de estabilidad
- **Rutas afectadas:**
  - `src/lib/**`
  - `src/services/**`
- **Síntoma:** refactor masivo puede romper imports/paths y lógica de negocio.
- **Acciones:**
  - Congelar API pública actual (exports) y definir “canónicos” antes de mover.
  - Asegurar que `npm run build:check`, `npm run lint`, `npm run type-check` pasan antes de iniciar.
- **Criterio de salida:** baseline verde y lista de módulos canónicos.

---

## Fase 1 — Inventario y clasificación (sin cambios de runtime)

- **Nombre:** Inventario de módulos
- **Rutas:**
  - `src/lib/`
  - `src/services/`
- **Síntoma:** mezcla de responsabilidades (utils, config, validation, adapters, analytics, etc.).
- **Acciones:**
  - Clasificar archivos por dominio (ej.):
    - `lib/config/*`
    - `lib/utils/*`
    - `lib/validation/*`
    - `lib/security/*`
    - `services/auth/*`
    - `services/social/*`
    - `services/payments/*`
    - `services/core/*`
    - `services/analytics/*`
  - Detectar duplicados/proxies y dependencias cruzadas.
- **Criterio de salida:** matriz "archivo → dominio → dependientes".

---

## Fase 2 — Capa de compatibilidad (sin mover archivos aún)

- **Nombre:** Compat layer (barrels estables)
- **Rutas:**
  - `src/lib/index.ts`
  - `src/services/index.ts`
- **Síntoma:** cambios en imports masivos rompen build.
- **Acciones:**
  - Crear barrels por dominio (si no existen) y re-exportar desde rutas actuales.
  - Establecer un “punto único” de import recomendado sin forzar migración total.
- **Criterio de salida:** import paths estables documentados, sin mover archivos.

---

## Fase 3 — Migración gradual (mover 1 dominio por PR)

- **Nombre:** Migración incremental
- **Rutas:**
  - `src/lib/<dominio>/...`
  - `src/services/<dominio>/...`
- **Síntoma:** acoplamiento alto y cambios de path.
- **Acciones:**
  - Mover solo un dominio por PR.
  - Actualizar imports automáticos por dominio.
  - Mantener exports legacy temporalmente en barrels para compatibilidad.
- **Criterio de salida:** PR pequeño, checks verdes, sin regresión en flujos.

---

## Fase 4 — Deprecación y limpieza (cuando todo migre)

- **Nombre:** Limpieza final
- **Síntoma:** compat layer queda como deuda.
- **Acciones:**
  - Eliminar re-exports legacy.
  - Reducir superficie pública.
- **Criterio de salida:** no existen imports a rutas antiguas.

---

## Checklist post-fase (siempre)

- `npm run build:check`
- `npm run lint`
- `npm run type-check`
- Smoke test manual: auth → discover → chat → tokens
