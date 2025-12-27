# CLEANUP_REPORT.md

Fecha: 27 Dic 2025 02:30 (UTC-06)
Rama: master

## Objetivo
Saneamiento profundo del repo (purga de ruido, organización de raíz, estandarización de configs, verificación build) sin romper runtime/deploy.

## FASE 0 — Auditoría (pre-cambios)
- `package.json`:
  - `"type": "module"`
- ESLint config:
  - Existe `eslint.config.ts`
  - No existe `eslint.config.js` en raíz
- Vite:
  - Principal: `vite.config.ts`
  - Extra: `vite.config.performance.ts` (no se movió; no rompe build)
- Scripts raíz:
  - `.js` en raíz detectados: `server.js`, `newrelic.js`, `postcss.config.js`
  - Regla crítica: **NO mover `server.js` ni `newrelic.js`** (runtime/deploy)
- SQL suelto en raíz:
  - `202512_MIGRACION_CONSOLIDADA_SEGURA.sql`
- Carpetas sospechosas solicitadas para purga:
  - `node_modules_old/`: existía
  - `bcktraesrc/`, `01tokenbck/`, `_archive/`, `src/components/_profile_legacy/`, `src/components/ui/_legacy_unified/`: no encontradas

## FASE 1 — Purga (eliminación de ruido)
### Acción ejecutada
- Eliminado recursivamente: `node_modules_old/`

### Doble chequeo post-borrado
- Se re-buscó en todo el repo:
  - `bcktraesrc/`: no encontrada
  - `01tokenbck/`: no encontrada
  - `_archive/`: no encontrada
  - `src/components/_profile_legacy/`: no encontrada
  - `src/components/ui/_legacy_unified/`: no encontrada

## FASE 2 — Organización (limpieza de raíz)
### SQL
- Se creó carpeta (si no existía): `supabase/migrations/review_pending/`
- Se movió:
  - `202512_MIGRACION_CONSOLIDADA_SEGURA.sql`
  - Destino: `supabase/migrations/review_pending/202512_MIGRACION_CONSOLIDADA_SEGURA.sql`

### Scripts JS/PS1/MJS en raíz
- No se movió nada por la excepción crítica.
- Se verificó que en raíz solo quedan:
  - `server.js` (**no mover**)
  - `newrelic.js` (**no mover**)
  - `postcss.config.js` (excluido por regla)

## FASE 3 — Estandarización
- ESLint:
  - Se mantiene `eslint.config.ts` como único config de raíz.
  - No se eliminó `eslint.config.js` porque no existe.
- Vite:
  - Se mantiene `vite.config.ts` como principal.
  - `vite.config.performance.ts` se deja intacto (sin acción) ya que no rompe el build.

## FASE 4 — Validación DB
- No existe `database/` en la raíz.
- Se detectó `docs-unified/database/` como documentación (sin acción).

## FASE 5 — Verificación final
### Build
Comando ejecutado:
- `pnpm run build`

Resultado:
- **Exit code: 0 (BUILD OK)**

Warnings observados (no bloqueantes):
- `Chat.tsx` se importa dinámicamente en `App.tsx` y también estáticamente en `MainLayout.tsx` (Vite indica que el dynamic import no moverá el módulo a otro chunk).
- Algunos chunks > 1500 kB después de minificar (warning esperado por configuración actual).

### Verificación de imports
- No se detectaron errores de tipo `Module not found` durante build.

## Estado Git (esperado)
Cambios locales detectados por `git status`:
- Delete: `node_modules_old/.../tailwindcss-oxide.win32-x64-msvc.node` (era parte del árbol eliminado)
- Delete: `202512_MIGRACION_CONSOLIDADA_SEGURA.sql` (ya no está en raíz)
- Add: `supabase/migrations/review_pending/202512_MIGRACION_CONSOLIDADA_SEGURA.sql`

## Recomendación siguiente (si aplica)
- Hacer commit con mensaje en español MX con fecha y hora, incluyendo únicamente:
  - borrado de `node_modules_old/`
  - movimiento del SQL a `supabase/migrations/review_pending/`
  - agregado de este `CLEANUP_REPORT.md`
