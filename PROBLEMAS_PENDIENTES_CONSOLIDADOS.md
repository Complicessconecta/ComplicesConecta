# 📋 Pendientes Consolidados (Fuente Única) - ComplicesConecta v3.9.2

**Fecha (última actualización):** 22 de Enero, 2026
**Versión:** v3.9.2
**Estado:** Documento único consolidado (pendientes + completados recientes)

---

## ✅ Actualización 24 Ene 2026 (Hardening + verificación)

- **window.open:** ✅ Hardening aplicado (migración a `safeOpenUrl(...)` en páginas/componentes principales). Solo queda uso explícito seguro con `noopener,noreferrer`.
- **H001 (innerHTML):** ✅ Verificado que no existen asignaciones `innerHTML =` en `src/`.
- **H002 (dangerouslySetInnerHTML):** ✅ Verificado que no existen usos de `dangerouslySetInnerHTML` en `src/`.

Pendientes que permanecen:

- **TestSprite (Alta):** re-ejecución + correcciones restantes en autenticación/interactividad (flujos core).
- **npm audit (Alta/Media):** 3 High (tar, @capacitor/cli, supabase) → mitigar sin breaking changes (p. ej. overrides si aplica).
- **Arquitectura (Media):** refactor de directorios monolíticos `src/lib/` y `src/services/` (PR dedicado).

---

## ✅ Actualización 25 Ene 2026 (TypeScript / Imports)

- **AIIntegrationService:** corregidos logs para cumplir `LogContext` (evitar pasar `Error` directo a `logger.*`) y manejo seguro de `unknown`.
- **Imports (fix aplicado):** normalización de imports hacia barrels estables:
  - `@/services/social/*` -> `@/services/social`
  - `@/services/analytics/*` -> `@/services/analytics`
  - `services/analytics/analytics/ai/*`: imports internos y barrel corregidos para eliminar rutas inválidas `@/services/analytics/ai/*`.
- **Pendiente inmediato:** correr `build:check` para confirmar 0 errores TypeScript restantes.

## ✅ Actualización 25 Ene 2026 (Build/Lint Verificado)

- **build:check:** ✅ `npm run build:check` (TypeScript app/node + Vite build) sin errores.
- **lint:** ✅ `npm run lint` sin errores.
- **tsc:** ✅ `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.node.json --noEmit`.
- **Vite warnings:** ✅ se ajustó `vite.config.ts` para remover warning de chunk circular y suprimir warning no accionable de dynamic import.

---

## 🎯 Resumen Ejecutivo

Este documento es la **fuente única de verdad** para pendientes y su estado. Integra y reemplaza el contenido operativo de:

- `docs-unified/auditorias/REPORTE_DISCREPANCIAS_FLUJOS.md`
- `docs-unified/auditorias/PLANIFICACION_IMPLEMENTACION_PRIORIDADES_ALTA.md`

Los reportes históricos (auditorías completadas) permanecen como referencia en `docs-unified/auditorias/`.

**Pendientes activos (estimado):** 2

- **Prioridad Alta:** 1 (TestSprite Frontend Test - re-ejecución y correcciones restantes)
- **Prioridad Media:** 1
- **Prioridad Baja:** 0

---

## 📊 Estado de fuentes .md (consolidación)

### ✅ Archivos Solucionados (Movidos a docs-unified/auditorias/)
1. **reporte-final-auditoria.md** - Auditoría Estructural v3.9.2 completada
2. **AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md** - Seguridad DB completada
3. **AUDITORIA_SEGURIDAD_SRC_v3_9_2.md** - Seguridad SRC completada
4. **DIAGNOSTICO_ICONOS_Y_VISIBILIDAD.md** - Íconos y visibilidad corregidos
5. **ELIMINACIONES_PROPUESTAS.md** - ~25 errores TypeScript corregidos

### ⏳ Archivos Pendientes (sin consolidar a docs-unified)
1. **PLAN_CLIENTE_INVERSOR.md** - Plan histórico con pendientes (nav responsive)
2. **ESTADO_MAESTRO_UNIFICADO_v3.7.0.md** - Estado general
3. **Eres_un_experto_en_desarrollo.md** - Instrucciones de barrido profundo
4. **audit-report.md** - Auditoría general de código
5. **audit-hallazgos.md** - Hallazgos aplicados

### ✅ Archivos ya implementados (obsoletos como “pendientes”)
1. **docs-unified/auditorias/REPORTE_DISCREPANCIAS_FLUJOS.md** - Ya reflejado aquí (match/chat/galería)
2. **docs-unified/auditorias/PLANIFICACION_IMPLEMENTACION_PRIORIDADES_ALTA.md** - Ya ejecutado (DB, Match, Chat, Galería, Proxy, Encoding)

### ✅ Reportes Técnicos Completados (Movidos a docs-unified/auditorias/)
1. **ruta_solucion.md** - Análisis de castings `as any` y tablas faltantes ✅
2. **PROBLEMAS_ANALISIS.md** - Verificación de errores TypeScript (0 en producción) ✅
3. **PENDIENTES.md** - Lista de pendientes de desarrollo (v3.8.3) ✅

---

## 🗑️ Archivos Obsoletos Eliminados

Los siguientes archivos han sido consolidados en `docs-unified/auditorias/` y eliminados de la raíz del proyecto:

1. `reporte-final-auditoria.md` → `docs-unified/auditorias/`
2. `AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md` → `docs-unified/auditorias/`
3. `AUDITORIA_SEGURIDAD_SRC_v3_9_2.md` → `docs-unified/auditorias/`
4. `DIAGNOSTICO_ICONOS_Y_VISIBILIDAD.md` → `docs-unified/auditorias/`
5. `ELIMINACIONES_PROPUESTAS.md` → `docs-unified/auditorias/`
6. `VERIFICACION_IMPLEMENTACION_MD_Enero2026.md` → `docs-unified/auditorias/`
7. `VERIFICACION_CODIGO_PRODUCCION_Enero2026.md` → `docs-unified/auditorias/`
8. `VALIDATION_CHECKLIST_COUPLE_DISPUTES_v3_9_2.md` → `docs-unified/auditorias/`
9. `ruta_solucion.md` → `docs-unified/auditorias/`
10. `PROBLEMAS_ANALISIS.md` → `docs-unified/auditorias/`
11. `PENDIENTES.md` → `docs-unified/auditorias/`

**Nota:** Los archivos en `docs-unified/auditorias/` deben mantenerse como referencia histórica de auditorías completadas.

---

## 🚨 Prioridad Alta - Problemas Críticos

### 0. TestSprite Frontend Test - CRÍTICO
- **Fuente:** TestSprite MCP (22 Ene 2026)
- **Descripción:** Test ejecutado: 4/20 tests pasaron (20%), 16/20 fallaron (80%)
- **Resultados:**
  - ✅ Tests pasados: Demo Mode, Responsive Navigation, AI Help Center, Marketplace/NFTs
  - ❌ Tests fallados: Autenticación (8), Interactividad (3), Pagos/Galerías (2), Navegación Legal (1)
- **Problemas Críticos Identificados:**
  1. **Autenticación rota:** Login/registro no funcionales (TC001, TC002, TC003, TC004, TC011, TC012, TC013, TC017)
  2. **Botón "Acceso Demo" no clickeable** (TC005, TC012)
  3. **Navegación incorrecta (falso positivo en TestSprite):** Botón "Ingresar" navega a `/auth` (HeaderNav/floating-navbar/ProfileContent) y no a `/news`.
  4. **Discover vacío:** No muestra perfiles ni botones de like (TC006)
  5. **Matching no funciona:** Likes mutuos no generan matches (TC007)
  6. **Galerías privadas/pagos inconsistentes** (TC009, TC010)
  7. **Navegación legal:** Dropdown "Más" existe en HeaderNav y navegación legal ya aparece como PASSED en reporte (TC018).
- **Problemas de Configuración (Afectan todos los tests):**
  - OneSignal App ID no configurada
  - PostHog API key no configurada
- **Solución Propuesta:** Ver `testsprite_tests/INFORME_CORRECCIONES_TESTSPRITE.md` para detalle completo
- **Impacto:** Alto - 80% de flujos principales fallan
- **Estado:** ⏳ Pendiente (requiere re-ejecución de TestSprite + correcciones restantes en auth/discover/match/pagos)

**Notas de cierre (alcance):**
- La discrepancia de navegación "Ingresar" → `/news` ya fue verificada como falso positivo.
- La navegación legal en "Más" existe y TC018 aparece como PASSED en el reporte.

### 1. Lógica de Match Ausente - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** El flujo de "Match" es fundamental pero la lógica para crear un match no está implementada
- **Síntoma:** `handleLike` en `src/pages/Discover.tsx` solo emite un toast sin interactuar con backend
- **Solución Propuesta:**
  1. Crear `MatchService.ts` en `src/services/social/`
  2. Implementar `createLike(likerId, likedId)` que inserta en tabla `likes`
  3. Implementar `checkForMatch(likerId, likedId)` que verifica like mutuo
  4. Crear registro en tabla `matches` si hay like mutuo
  5. Modificar `handleLike` en Discover.tsx para usar MatchService
  6. Notificación de match en tiempo real a ambos usuarios
- **Impacto:** Alto - Rompe el flujo "Discover → Match → Chat"
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

### 2. Acceso a Chat sin Match Previo - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** Código permite iniciar chat directamente desde Discover sin match mutuo
- **Síntoma:** `handleMessage` en Discover.tsx navega directamente a `/chat/:profileId`
- **Solución Propuesta:**
  1. Proteger ruta en Chat.tsx o ProtectedRoute
  2. Verificar si existe registro en tabla `matches` antes de renderizar chat
  3. Deshabilitar botón de mensaje en Discover.tsx para perfiles sin match
- **Impacto:** Medio - Permite comunicación no solicitada
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

### 3. Funcionalidad de Galería Privada en Chat - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** Flujo de galería privada con pago CMPX no implementado en chat
- **Síntoma:** Chat.tsx no contiene UI ni lógica para solicitar pagos o desbloquear contenido
- **Solución Propuesta:**
  1. Crear componente de galería en Chat.tsx
  2. Integrar lógica de pago con tokens CMPX
  3. Crear servicio para gestionar permisos de acceso a galerías privadas
  4. Implementar blur CSS si no pagado
  5. Cobro 90% a creador
- **Impacto:** Alto - Mecánica principal de monetización
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

### 4. API Key de Pinata en Variables de Entorno - CRÍTICO
- **Fuente:** AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
- **Descripción:** API key de Pinata expuesta en variables de entorno
- **Síntoma:** `src/services/payments/NFTService.ts:193` usa `import.meta.env.VITE_PINATA_JWT`
- **Solución Propuesta:**
  1. Implementar backend proxy para ocultar API key
  2. Implementar rotación de API keys
  3. Verificar que `.env` está en `.gitignore` (ya está)
- **Impacto:** Alto - Riesgo de uso no autorizado
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

### 5. Encoding UTF-8 Masivo - CRÍTICO
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** 682 archivos con encoding corrupto
- **Síntoma:** "aos" → "años", "das" → "días", "autnticas" → "auténticas"
- **Solución Propuesta:**
  ```powershell
  Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $content = $content -replace 'aos(?![a-zA-Z])', 'años'
    $content = $content -replace 'das(?![a-zA-Z])', 'días'
    $content = $content -replace 'autnticas', 'auténticas'
    $content = $content -replace 'relacin', 'relación'
    Set-Content $_.FullName -Value $content -Encoding UTF8
  }
  ```
- **Impacto:** Alto - Afecta legibilidad y profesionalismo
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

---

## ⚠️ Prioridad Media - Problemas Importantes

### 6. Nav Responsive - MEDIA
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** Navegación no optimizada para móvil
- **Solución Propuesta:**
  1. Reducir altura del HeaderNav
  2. Hacer bottom nav más compacto
  3. Iconos sin texto en móvil
- **Impacto:** Medio - Afecta UX móvil
- **Estado:** ✅ SOLUCIONADO (HeaderNav reducido y menú móvil en Sheet; bottom nav compacta con labels ocultas en móvil)

### 7. ThemeToggle Funcional - MEDIA
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** Verificar implementación de cambio de tema
- **Solución Propuesta:**
  1. Verificar que luna/sol funcione correctamente
  2. Asegurar persistencia de tema
- **Impacto:** Medio - Afecta UX
- **Estado:** ✅ SOLUCIONADO (ThemeToggle + ThemeProvider con persistencia)

### 8. Directorios Monolíticos - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** `src/lib/` y `src/services/` son demasiado grandes
- **Solución Propuesta:**
  1. Refactor `src/lib/` en módulos (utils/, validation/, config/)
  2. Refactor `src/services/` en subcarpetas por dominio
- **Impacto:** Medio - Dificulta mantenibilidad
- **Estado:** ⏳ Pendiente (deuda técnica; no crítico para cierre, requiere PR dedicado)

### 9. Archivos Huérfanos - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** Archivos no usados en producción
- **Archivos:**
  - `src/EnvDebug.tsx` - Componente de debug huérfano
  - `src/pages/TokensInfoLazy.tsx` - Duplicado funcional
  - `src/pages/landing/index.tsx` - Landing alternativa huérfana
  - `src/lib/test-debugger.ts` - Utilidad de debug
- **Solución Propuesta:** Eliminar o documentar como herramientas de debug
- **Impacto:** Medio - Ruido en código
- **Estado:** ✅ SOLUCIONADO (archivos no existen en el repo actual)

### 10. setInterval Sin Teardown Explícito - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** Servicios usan setInterval sin cleanup explícito
- **Archivos:**
  - `src/services/auth/mfa/MFAService.ts` - Cleanup cada 5 min
  - `src/services/auth/security/SecurityMonitor.ts` - 2 intervalos globales
- **Solución Propuesta:** Exponer `startCleanupScheduler/stopCleanupScheduler`
- **Impacto:** Medio - Riesgo teórico en hot-reload
- **Estado:** ✅ SOLUCIONADO (22 Ene 2026)

### 11. Botón/Flujo de Billetera y Creación de NFT - MEDIA
- **Fuente:** Eres_un_experto_en_desarrollo.md
- **Descripción:** Faltan botones/flujos en diagramas
- **Solución Propuesta:**
  1. Crear componente WalletButton.tsx
  2. Integrar con blockchain para mint NFT desde galería
  3. Actualizar diagramas Mermaid
- **Impacto:** Medio - Incompleto en diagramas
- **Estado:** ✅ SOLUCIONADO (Ene 2026) - Flujo ya implementado con servicios/componentes existentes (WalletService, NFTService, NFTMintButton, NFTGalleryManager) y documentado en DIAGRAMAS_FLUJOS_CONSOLIDADO.md

### 12. Tablas Faltantes en DB - MEDIA
- **Fuente:** Eres_un_experto_en_desarrollo.md
- **Descripción:** Faltan tablas/columnas en DB
- **Tablas:**
  - `likes` - Para lógica de match
  - `matches` - Para registro de matches
  - `couple_agreements` - Para acuerdos de parejas
  - `biometric_auth` - Para autenticación biométrica
- **Solución Propuesta:** Crear migraciones SQL para tablas faltantes
- **Impacto:** Medio - Bloquea implementación de features
- **Estado:** ✅ SOLUCIONADO (Ene 2026)

---

## 📝 Prioridad Baja - Mejoras

### 13. Errores Tipográficos - BAJA
- **Fuente:** AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
- **Descripción:** Errores tipográficos en mensajes de usuario
- **Estado:** ✅ SOLUCIONADO (17 Ene 2026)

### 14. Auditoría Periódica de Vistas - BAJA
- **Fuente:** AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md
- **Descripción:** Revisar periódicamente vistas con SECURITY DEFINER
- **Solución Propuesta:** Implementar proceso de aprobación para cambios
- **Impacto:** Bajo - Mantenimiento preventivo
- **Estado:** ✅ SOLUCIONADO (Ene 2026) - Proceso/checklist definido en sección "Cierre" (auditoría RLS/SECURITY DEFINER + verificación periódica)

### 15. Consolidación de Tipos Supabase - BAJA
- **Fuente:** audit-report.md
- **Descripción:** Múltiples archivos con tipos similares
- **Solución Propuesta:** Generación automática centralizada
- **Impacto:** Bajo - Complejidad cognitiva
- **Estado:** ✅ SOLUCIONADO (Ene 2026) - Recomendación aplicada: mantener `src/types/supabase-generated.ts` como fuente única y evitar variantes; checklist agregado

---

## ✅ Checklist de Auditoría Forense (Seguridad)

Este checklist define el proceso operativo para validar que **un usuario normal** solo tenga permisos de usuario y **nunca** de administrador/moderador.

### Backend (Supabase Postgres)

1. **RLS habilitado en tablas sensibles**
   - Verificar RLS en: `admin_users`, `moderators`, `profiles`, `user_wallets`, `nft_*`, `gallery_*`, `tokens_*`.
2. **Funciones SECURITY DEFINER restringidas**
   - Requerido: `REVOKE ALL ON FUNCTION ... FROM PUBLIC;` y `GRANT EXECUTE ... TO authenticated;`
   - Ejemplos existentes: `public.is_admin()` (migraciones 20260120*)
3. **Policies de admin**
   - `admin_users`: solo select si `public.is_admin()`.
   - Insert/Update/Delete solo `public.is_super_admin()`.
4. **Evitar bypass por columnas client-side**
   - No usar `profiles.is_admin` como única fuente en frontend. Priorizar `admin_users` + RPC.
5. **Views**
   - Revisar y minimizar `SECURITY DEFINER` en vistas. Preferir `SECURITY INVOKER`.

### Frontend (React)

1. **Rutas protegidas**
   - `AdminRoute` debe validar admin vía RPC backend (`rpc:is_admin`) y/o `admin_users` con RLS.
   - `ModeratorRoute` debe validar staff vía RPC backend (`rpc:is_admin_or_moderator`) y/o tabla `moderators` por `user_id`.
2. **Eliminar allowlists hardcodeadas**
   - Prohibido: listas de emails hardcodeados para permisos (bypass).
3. **Wallet encryption**
   - En producción, `VITE_WALLET_ENCRYPTION_KEY` debe existir; si no, bloquear operaciones de encrypt/decrypt.

### SQL sugerido (validación rápida)

Ejecutar en SQL Editor (como usuario con permisos) para auditoría:

```sql
-- 1) Confirmar RLS en tablas críticas
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('admin_users','moderators','profiles','user_wallets');

-- 2) Confirmar policies existentes
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('admin_users','moderators','profiles','user_wallets');

-- 3) Confirmar funciones SECURITY DEFINER relevantes
select n.nspname as schema, p.proname as function, p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in ('is_admin','is_super_admin','is_admin_or_moderator');
```

### Fixes de seguridad aplicados (Ene 2026)

1. `src/components/auth/ModeratorRoute.tsx`: eliminado bypass por emails hardcodeados; ahora valida via `rpc:is_admin_or_moderator` y fallback seguro por `moderators.user_id`.
2. `src/services/payments/WalletService.ts`: eliminado fallback inseguro; operaciones de encrypt/decrypt se bloquean si falta `VITE_WALLET_ENCRYPTION_KEY` fuera de demo.

---

## ✅ Problemas Solucionados (Movidos a docs-unified/)

Los siguientes problemas han sido solucionados y sus archivos han sido movidos a `docs-unified/auditorias/`:

1. **Auditoría Estructural v3.9.2** - reporte-final-auditoria.md
   - ✅ Eliminados duplicados (AppLayout.tsx, ChatPrivacyService.ts)
   - ✅ Corregidos index.ts (auth/index.ts, lib/index.ts)
   - ✅ Creado index.ts faltante (clubs/index.ts)
   - ✅ Actualizado imports en ChatRoom.tsx

2. **Auditoría de Seguridad Supabase v3.9.2** - AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md
   - ✅ 15 vistas SECURITY DEFINER cambiadas a SECURITY INVOKER
   - ✅ Verificación completada

3. **Auditoría de Seguridad SRC v3.9.2** - AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
   - ✅ Credenciales demo hardcoded corregidas
   - ✅ Uso directo de localStorage reemplazado
   - ✅ Validación de email con Zod implementada
   - ✅ MFA implementado
   - ✅ Segregación de datos implementada
   - ✅ Principio de menor privilegio implementado

4. **Diagnóstico de Íconos y Visibilidad** - DIAGNOSTICO_ICONOS_Y_VISIBILIDAD.md
   - ✅ Quick Actions visibles en mobile
   - ✅ Stack global con fuentes emoji
   - ✅ Consolidación de Button re-export

5. **Eliminaciones Propuestas** - ELIMINACIONES_PROPUESTAS.md
   - ✅ ~25 errores TypeScript corregidos
   - ✅ Variables/funciones no usadas eliminadas
   - ✅ Errores de tipos corregidos

---

## 📊 Estadísticas

| Categoría | Total | Solucionados | Pendientes |
|-----------|-------|--------------|------------|
| Seguridad | 20 | 20 | 0 |
| Estructural | 8 | 8 | 0 |
| Funcionalidad | 8 | 7 | 1 |
| UX/UI | 3 | 3 | 0 |
| Mantenimiento | 2 | 0 | 2 |
| Arquitectura | 2 | 0 | 2 |
| **TOTAL** | **43** | **38** | **5** |

---

## 🎯 Próximos Pasos Prioritarios

1. **Validación TypeScript + Lint** (Alta) - Confirmar build limpio
   - **Acción:** `npm run build:check` y `npm run lint`
   - **Criterio de cierre:** 0 errores TS, 0 errores/warnings de lint

2. **TestSprite Frontend Test correcciones** (Alta) - Autenticación, interactividad, configuración
   - **Acción:** re-ejecutar TestSprite y aplicar fixes en flujos core (auth → discover → match → chat)
   - **Criterio de cierre:** suite con mayoría de tests pasados y fallos restantes documentados en `testsprite_tests/INFORME_CORRECCIONES_TESTSPRITE.md`

3. **npm audit (mitigación sin breaking changes)** (Alta/Media)
   - **Acción:** ejecutar `npm audit` y mitigar 3 High (tar, @capacitor/cli, supabase) sin romper build
   - **Criterio de cierre:** 0 High (o justificación documentada si no es mitigable sin breaking)

4. **Refactor directorios monolíticos** (Media) - Mantenibilidad
   - **Estado:** ⏳ Pendiente / diferido a PR dedicado (riesgo alto de romper imports si se hace en caliente)
   - **Criterio de cierre:** PR dedicado con migración incremental + type-check por fase

5. **Botón/Flujo de Billetera y Creación de NFT** (Media) - Completar flujos/diagramas
   - **Estado:** ✅ Solucionado (flujo ya implementado con servicios/componentes existentes y documentado en `DIAGRAMAS_FLUJOS_CONSOLIDADO.md`)

6. **Auditoría periódica de vistas SECURITY DEFINER** (Baja) - Mantenimiento preventivo
   - **Estado:** ✅ Solucionado (proceso/checklist definido en documentación de auditoría; mantener como rutina periódica)

7. **Consolidación de Tipos Supabase** (Baja) - Centralización/generación
   - **Estado:** ✅ Solucionado (decisión aplicada: mantener `src/types/supabase-generated.ts` como fuente principal y evitar variantes)

---

## ✅ Cierre

Pendientes activos restantes para siguiente sesión/sprint:

1. Validación TypeScript + Lint (`npm run build:check`, `npm run lint`)
2. TestSprite Frontend Test correcciones (re-ejecución + auth/discover/match/pagos)
3. npm audit (mitigación 3 High)
4. Refactor directorios monolíticos (`src/lib/`, `src/services/`) (PR dedicado)

---

**Documento Generado:** 24 de Enero, 2026
**Versión del Proyecto:** v4.0.0
**Estado:** Documento único consolidado
