# Estado del Barrido de SRC

| Directorio | Estado | Archivos Auditados | Notas |
|---|---|---|---|
| **src/components/accessibility** | 🟢 | `AccessibilityAudit.tsx`, `AccessibilityProvider.tsx`, `ContrastFixer.tsx` | - `AccessibilityProvider.tsx`: Corrección de tipo `any` pendiente. - Limpieza de variables no utilizadas (`_`). |
| **src/components/admin/dashboard** | 🟢 | `OverviewPanel.tsx`, `RecentActivityList.tsx`, `ReportsPanel.tsx`, `StatsPanel.tsx`, `SystemHealthWidget.tsx` | - Componentes estables. - Limpieza de variables no utilizadas en `ReportsPanel.tsx`. |
| **src/components/admin/panels** | 🟢 | `ReportsPanel.tsx`, `index.ts` | - Re-exporta componentes. |
| **src/components/admin** | 🟢 | `AdvancedModerationPanel.tsx`, `AlertConfigPanel.tsx`, `AnalyticsPanel.tsx`, `DesktopNotificationSettings.tsx`, `ExportButton.tsx`, `PerformancePanel.tsx`, `ReportsManagement.tsx`, `SecurityDashboard.tsx`, `SecurityPanel.tsx`, `TokenSystemPanel.tsx`, `UserManagementPanel.tsx`, `WebhookConfigPanel.tsx` | - `SecurityPanel.tsx`, `TokenSystemPanel.tsx`: Limpieza de código muerto. - `ReportsManagement.tsx`: Corrección de tipos y servicio. - `admin.tsx`: No existe. |
| **src/integrations/supabase** | 🟢 | `client.ts`, `types.ts` | - Tipos corregidos: `security_events`, `two_factor_auth` normalizados y sin duplicados. - `SecurityService.ts` alineado a `two_factor_auth`. - `SecurityAuditService.ts` consulta `security_events` con `created_at`. - Type-check y lint ✅. - Build:check con advertencias en tests (no bloquea servicios). |
| **src/services** | 🟢 | Todos los servicios (auth, core, social, payments, analytics) | - Fixes críticos de TS (CoupleDissolution, NFTService, Reports). - Singleton patterns asegurados. - Alerts reemplazados por Toast. - Deuda técnica: Uso de `any` en 39 archivos (ver sección abajo). |
| **src/shared** | 🟢 | `cn.ts`, `format.ts`, `validation.ts` | - Sin `pink-*`, `alert()` ni errores TS. - Código limpio y sin modificaciones necesarias. |
| **src/types** | 🟢 | 20+ archivos (analytics, blockchain, chat, supabase, etc.) | - Tipos consistentes y sin errores. - Uso de `any` documentado como deuda técnica en `blockchain.ts` y `improved-types.ts`. - `supabase.ts` omitido por ser archivo generado de gran tamaño. |
| **src/utils** | 🟢 | 20+ archivos (androidSecurity, imageProcessing, webVitals, etc.) | - Código limpio y funcional. - Deuda técnica: `window.innerWidth` en `mobile.ts`. - Deuda técnica: Estilos inline en `androidSecurity.ts`. |

## Guía para continuar y punto de reanudación (operativo)
- **Último directorio COMPLETADO:** `src/utils` (02 Ene 2026, commit: "refactor: completa barrido src/utils, types, shared")
- **Directorio EN CURSO:** N/A (Barrido completado)
- **Siguiente directorio al finalizar el actual:** N/A
- **Acción inmediata:** El barrido de `src` está 100% finalizado. Próximo paso es eliminar deudas técnicas documentadas.
- **Estado sincronizado:** Tipos de Supabase y servicios de seguridad actualizados y verificados (type-check/lint ✅). Build:check reporta fallas en pruebas unitarias ajenas al barrido; se atenderán en su ciclo correspondiente.

- **Regla de actualización de este archivo:** El resumen y la actualización de `BARRIDO_SRC_ESTADO.md` se realizan SOLO al concluir por completo el directorio en curso. Si el directorio no está completo, completar primero y luego actualizar.
- **Excepción (handoff operativo):** Si se requiere que otro dev/IA continúe desde un punto intermedio, documentar aquí el estado *sin marcar el directorio como completo*, detallando lo hecho y los pendientes inmediatos.
- **Criterios del barrido que DEBEN cumplirse en cada archivo:**
  - Arreglar errores TS/lint y de importación rotos.
  - Reemplazar clases `pink-*` por `fuchsia/purple/cyan` cuando existan.
  - Reemplazar `alert()` por sistema `toast`.
  - Usar imports type-only de React cuando apliquen (tipos como `FC`, `ReactNode`, etc.).
  - Endurecer null-safety de Supabase si es crítico para no romper ejecución.
  - Documentar deudas técnicas aquí (casts `as any`, estilos inline, TODOs) sin arreglarlas salvo que bloqueen compilación.
- **Convención de commits:** Mensajes en español MX con fecha y hora, por bloque (directorio) y cambios relacionados únicamente.

## Deuda Técnica Detectada (General)
- **Uso de `any` / `as any`**: Detectado en `src/services`, `src/types` y `src/utils`:
  - `src/services`: Múltiples servicios (ver detalle anterior).
  - `src/types/blockchain.ts`: Helpers de casting para tipos de Supabase.
  - `src/types/improved-types.ts`: Tipos utilitarios para reducir `any`.
  - `src/utils/dynamicImports.ts`: Carga dinámica de SDKs opcionales.
- **Uso de `window.innerWidth`**:
  - `src/utils/mobile.ts`: Para detección de breakpoints. Reemplazar con sistema de diseño de Tailwind.
- **Estilos Inline**:
  - `src/utils/androidSecurity.ts`: Modal de advertencia de seguridad.
  - **Acción futura:** Refactorizar para usar tipos estrictos (interfaces definidas en `src/types`).
  - **Normalización completada:** Tipos de seguridad (`security_events`, `two_factor_auth`) corregidos en `src/integrations/supabase/types.ts` y consumo alineado en servicios.

**Marca de progresos:**
* **[Completo/Verificado✅]** 
* **[EnProceso🚧]**  
* **[ADVERTENCIA⚠️]**
* **[Incompleto❌]**
