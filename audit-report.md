# AUDITORÍA AUTOMÁTICA SRC – Enero 2026

**Proyecto:** ComplicesConecta v3.8.3  
**Ámbito:** Directorio `src/` (código) + documentación clave (`docs/`, referencias a `docs-unified/`, `reports/`)  
**Base:** project-structure-tree.md, AUDITORIA_SRC_COMPLETA.md, AUDITORIA_SEGURIDAD_SRC_v3_9_2.md, PROBLEMAS_ANALISIS.md, PENDIENTES.md

---

## 1. Resumen Global

- Código de producción: 0 errores TypeScript, 0 errores críticos de ESLint (según auditorías vigentes).
- `src/` estructurado por dominios: `ai/`, `components/`, `features/`, `hooks/`, `integrations/`, `layouts/`, `lib/`, `pages/`, `services/`, `tests/`, `types/`.
- Flujos críticos alineados con DIAGRAMAS_FLUJOS_CONSOLIDADO.md: registro → discover → match → chat → check-in, más economía de tokens y NFTs.
- Directorios con advertencias:
  - `src/hooks/`: hooks reutilizables dispersos, falta estándar único de co-localización.
  - `src/lib/`: “cajón de sastre” con muchas utilidades; requiere modularizar en submódulos.
  - `src/services/`: directorio “dios” con >75 servicios; riesgo de mantenibilidad.
  - `src/types/`: duplicidades controladas de tipos Supabase (decisión explícita de mantener).

---

## 2. Lista Global por Archivo (resumen alfabético)

> Nota: la lista completa de 600+ archivos ya está documentada en project-structure-tree.md y AUDITORIA_SRC_COMPLETA.md. Aquí se listan los archivos clave y/o con síntomas.

- `/src/App.tsx` → **ok** (enrutador principal, conectado a todos los flujos core).
- `/src/EnvDebug.tsx` → **advertencia** (componente huérfano de depuración, no se importa en producción).
- `/src/debug.tsx` → **ok** (debug provider para desarrollo).
- `/src/index.css` → **ok** (estilos globales).
- `/src/main.tsx` → **ok** (entrypoint Vite, con validación de entorno).
- `/src/pages/landing/index.tsx` → **advertencia** (landing alternativa huérfana).
- `/src/pages/TokensInfoLazy.tsx` → **advertencia** (duplicado funcional de TokensInfo.tsx).
- `/src/lib/index.ts` → **ok** (barrel central de UI + hooks + utils).
- `/src/lib/logger.ts` → **ok** (logger central).
- `/src/lib/test-debugger.ts` → **advertencia** (utilidad de debug huérfana).
- `/src/services/index.ts` → **ok** (barrel de servicios por dominio).
- `/src/services/auth/index.ts` → **ok** (barrel de servicios de auth/seguridad).
- `/src/services/auth/mfa/MFAService.ts` (versión avanzada in-memory) → **advertencia leve** (setInterval global sin mecanismo explícito de teardown, pero único y controlado).
- `/src/services/auth/MFAService.ts` (versión TOTP con Supabase) → **ok** (lógica MFA persistente).
- `/src/services/auth/security/SecurityMonitor.ts` → **advertencia leve** (setInterval global con limpieza periódica, sin claro stop explícito).
- `/src/services/auth/SecurityService.ts` → **ok** (2FA real + fraud detection).
- `/src/lib/secureMediaService.ts` → **ok** (URLs firmadas y permisos multimedia).
- `/src/services/payments/NFTService.ts` → **ok** (gestión de NFTs, IPFS y parejas).
- `/src/services/payments/nft/NFTVerificationService.ts` → **ok** (verificación de NFTs).
- `/src/services/core/PerformanceMonitoringService.ts` → **ok** (monitoreo de rendimiento).
- `/src/pages/Auth.tsx` → **ok** (flujo de login/registro demo + producción).
- `/src/pages/Security.tsx` → **ok** (presentación de medidas de seguridad).
- `/src/pages/Legal.tsx` → **ok** (enlace a documentación legal en `docs/legal`).
- `/src/components/ui/backgrounds/UnifiedBackground.tsx` → **ok** (fondo dinámico unificado).
- `/src/components/modals/UnifiedModal.tsx` → **ok** (modal unificado).
- `/src/components/ui/UnifiedCard.tsx` → **ok** (card unificada).
- `/src/components/ui/UnifiedInput.tsx` → **ok** (input unificado).
- `/src/components/ui/UnifiedTabs.tsx` → **ok** (tabs unificadas).
- `/src/components/security/index.ts` → **ok** (barrel de componentes de seguridad).
- `/src/tests/unit/auth.test.ts` → **ok** (tests de useAuth, con notas conocidas en PROBLEMAS_ANALISIS.md).
- `/src/tests/unit/androidSecurity.test.ts` → **ok** (tests de seguridad Android).
- `/src/types/supabase.ts` y derivados → **advertencia controlada** (ver sección duplicados).

---

## 3. Problemas Detectados por Archivo

En esta auditoría no se encontraron problemas críticos que rompan build, type-check o lint; las siguientes entradas son advertencias y áreas de mejora no bloqueantes.

### 3.1 Archivos Huérfanos / Obsoletos

- `/src/EnvDebug.tsx`
  - Síntomas:
    - No se importa en ninguna parte del código (componente huérfano).
    - Uso estrictamente de depuración.
  - Impacto:
    - No afecta flujo de producción ni demo.
  - Decisión:
    - Mantener por ahora como herramienta de debug documentada, eliminación sugerida en refactor futuro controlado.

- `/src/pages/TokensInfoLazy.tsx`
  - Síntomas:
    - Duplicado funcional de `src/pages/TokensInfo.tsx`.
    - Marcado como obsoleto/prueba en project-structure-tree.md.
  - Impacto:
    - No conectado al router principal.
  - Decisión:
    - Mantener como referencia histórica; no usar en nuevas rutas.

- `/src/pages/landing/index.tsx`
  - Síntomas:
    - Landing secundaria alternativa.
    - No referenciada en App.tsx (sin ruta activa).
  - Impacto:
    - Código muerto potencial; no afecta flujo actual.
  - Decisión:
    - Mantener como landing experimental; documentar como huérfana.

- `/src/lib/test-debugger.ts`
  - Síntomas:
    - Utilidad de depuración no importada desde código de producción.
  - Impacto:
    - Ruido en `lib/`; sin impacto runtime.
  - Decisión:
    - Mantener hasta que se haga limpieza estructural de `lib/`.

### 3.2 Duplicados y Tipos Supabase

- Directorio: `/src/types/`
  - Archivos relevantes (según AUDITORIA_SRC_COMPLETA.md):
    - `supabase.ts` (principal, ~266KB).
    - `supabase-remote.ts`, `supabase-updated.ts`, `supabase-local.ts` (duplicados controlados).
    - `supabase-final.ts`, `supabase-custom.ts`, `supabase-extended.ts`, `supabase-extensions.ts`, `supabase-fixes.ts`, `supabase-generated.ts`.
  - Síntomas:
    - Múltiples archivos con tipos similares/duplicados.
    - Conflicto puntual histórico en `Profile` (documentado y resuelto en estado actual).
  - Impacto:
    - Complejidad cognitiva alta en tipos.
    - No hay errores de compilación ni de lint.
  - Decisión:
    - Mantener estrategia actual documentada.
    - Centralizar consumo en archivos principales (`supabase.ts` + wrappers generados).

### 3.3 setInterval Sin Teardown Explícito

- `/src/services/auth/mfa/MFAService.ts` (versión avanzada in-memory)
  - Síntomas:
    - `mfaService` se instancia globalmente.
    - `setInterval` ejecuta `mfaService.cleanup()` cada 5 minutos.
  - Análisis:
    - Solo se crea un intervalo global por carga de módulo.
    - SPA típica: intervalo vive mientras viva la pestaña; no se crean múltiples instancias.
  - Impacto:
    - No causa fugas acumulativas de intervalos.
    - Riesgo teórico mínimo en hot-reload de desarrollo.
  - Decisión:
    - Se mantiene diseño actual.
    - Una refactorización para exponer `startCleanupScheduler/stopCleanupScheduler` se reservará para un cambio coordinado con el root de la app.

- `/src/services/auth/security/SecurityMonitor.ts`
  - Síntomas:
    - Instancia global `securityMonitor`.
    - Dos `setInterval`:
      - Limpieza de eventos cada hora.
      - Detección de anomalías cada 5 minutos.
  - Análisis:
    - Patrón similar al anterior: único intervalo por sesión.
    - Se ajusta a lo esperado para un monitor de seguridad de larga duración.
  - Impacto:
    - Sin fugas acumulativas.
    - Hot-reload puede duplicar intervalos en desarrollo (no en build final).
  - Decisión:
    - Se mantiene la implementación actual, anotada como “intervalos globales controlados”.

### 3.4 Directorios Monolíticos

- `/src/lib/`
  - Síntomas:
    - 50+ utilidades agrupadas en un solo directorio.
    - Mezcla de helpers generales, validación, configuración y pruebas.
  - Impacto:
    - Dificulta descubrir funciones y responsabilidades.
  - Decisión:
    - Mantener por ahora; refactor recomendado a módulos (`lib/utils/`, `lib/validation/`, `lib/config/`) en rama dedicada.

- `/src/services/`
  - Síntomas:
    - Directorio “dios” con múltiples dominios (auth, social, analytics, payments, core, features).
  - Impacto:
    - Curva de aprendizaje alta.
    - Acoplamiento conceptual.
  - Decisión:
    - Mantener estructura actual (ya indexada en `src/services/index.ts`).
    - Refactor a subcarpetas por dominio debe hacerse en plan de trabajo aparte.

### 3.5 Imports / Exports / index.ts

- Barriles existentes:
  - `/src/lib/index.ts` → UI, hooks, utils, entities (usa alias `@/`).
  - `/src/services/index.ts` → servicios por dominio (Auth, Payments, Social, Core, Features, Analytics).
  - `/src/services/auth/index.ts` → servicios de seguridad.
  - `/src/components/security/index.ts` → componentes de seguridad.
- Diagnóstico:
  - Los índices actuales ya ofrecen barrel exports coherentes.
  - No se detectan `index.ts` faltantes que sean imprescindibles para el flujo actual.
  - Alias `@/*` configurado y utilizado consistentemente (por ejemplo, en `UnifiedBackground.tsx`, `UnifiedInput.tsx`, `NFTService.ts`, etc.).
  - No se detectan imports rotos en auditorías recientes (`npm run type-check`, `npm run lint` pasan).
- Decisión:
  - No se crean nuevos `index.ts` en esta auditoría para evitar conflictos con barrel exports existentes.
  - No se fuerzan conversiones masivas de imports relativos a absolutos ya que el proyecto combina ambos patrones de forma intencional y estable.

---

## 4. Documentación Revisada

### 4.1 Carpeta `docs/`

- **Legal**
  - `docs/legal/README.md` → índice legal maestro.
  - `LEGAL_SUMMARY_REPORT.md`, `LEGAL_COMPLIANCE_MEXICO.md`, `LEY_OLIMPIA.md`, `TERMS_OF_SERVICE.md`, `PRIVACY_POLICY.md`, `DISCLAIMER.md`, `API.md` → definen el marco legal, TOS, privacidad y cumplimiento Ley Olimpia.
  - `ANALYSIS_REPORT_202509.md`, `SECURITY_AUDIT_REPORT_v3.8.1.md`, `INTERNAL_AUDIT_TEMPLATE_v3.6.3.md` → análisis técnicos y plantillas de auditoría.
- **Inversores**
  - `docs/Inversores/README.md`, `GUIA_INVERSORES.md`, `MANIFIESTO_FINTECH_ESTRATEGIA_NEGOCIO.md` → modelo de negocio, tokenomics, roadmap y narrativa para inversores.
- **Moderadores**
  - `docs/Moderadores/README.md`, `GUIA_MODERADORES.md` → operación y herramientas de moderación.
- **Clubs**
  - `docs/Clubs/GUIA_CLUBS.md` → alta y operación de clubs verificados.
- **Auditoría**
  - `docs/Auditoria/AUDITORIA_SRC_COMPLETA.md`, `AUDITORIA_SEGURIDAD_SRC_v3_9_2.md`, `Auditoria-enero2026.md` → auditorías completas de código, seguridad y base de datos.

### 4.2 Carpeta `docs-unified/`

- No indexada directamente en el árbol actual, pero:
  - Referenciada en `ANALYSIS_REPORT_202509.md` y otros como “Documentación Maestra Unificada”.
  - Se usa como fuente de verdad consolidada para flujos, estados y políticas (ver también DIAGRAMAS_FLUJOS_CONSOLIDADO.md).
  - Contiene documentación de deployment, tests avanzados (incluyendo World ID) y guías integradas.

### 4.3 Carpeta `reports/`

- Excluida en `.gitignore` (no forma parte del repositorio versionado).
- Uso previsto:
  - Reportes generados (auditorías, exportaciones, logs agregados).
  - Evidencias internas de cumplimiento y análisis forense.
- No se puede listar ni analizar contenido exacto desde el entorno actual; se infiere su rol a partir de:
  - `.gitignore`, `.npmignore`.
  - Referencias en documentación legal y de auditoría.

---

## 5. Conclusiones y Recomendaciones

1. **Estado del Código de Producción**
   - Sin errores de TypeScript ni errores críticos de ESLint.
   - Arquitectura consistente con los flujos documentados.
   - Los barrels principales (`lib/index.ts`, `services/index.ts`, `services/auth/index.ts`, `components/security/index.ts`) están correctos.

2. **Duplicados Controlados**
   - Duplicidades en `src/types/` son intencionales y documentadas.
   - No se deben eliminar sin una estrategia formal de consolidación.

3. **Archivos Huérfanos**
   - `EnvDebug.tsx`, `TokensInfoLazy.tsx`, `pages/landing/index.tsx`, `lib/test-debugger.ts` siguen siendo candidatos claros para limpieza futura.

4. **Monitoreo con setInterval**
   - `MFAService` in-memory y `SecurityMonitor` usan intervalos globales controlados.
   - No representan fugas en producción; sólo requieren precaución en entornos de hot-reload.

5. **Trabajos Futuro Sugeridos**
   - Refactor estructural de `src/services/` y `src/lib/` en ramas dedicadas, con actualización masiva de imports supervisada.
   - Eventual consolidación de tipos Supabase con generación automática centralizada.
   - Limpieza de archivos huérfanos una vez que se confirme que no se requerirán en nuevos flujos.

---

## 6. Checklist de Auditoría (ejecución actual)

- [x] Revisar estructura general de `src/` y conexión con flujos documentados.
- [x] Verificar barrels críticos (`lib/index.ts`, `services/index.ts`, `services/auth/index.ts`, `components/security/index.ts`).
- [x] Identificar archivos huérfanos y duplicados documentados.
- [x] Revisar uso de `setInterval` en servicios de seguridad y MFA.
- [x] Revisar documentación clave en `docs/` y referencias a `docs-unified/` y `reports/`.
- [x] Generar este reporte consolidado en `src/audit-report.md` sin modificar la lógica de negocio ni los flujos críticos.
