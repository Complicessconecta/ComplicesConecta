# Estado del Barrido de SRC

| Directorio | Estado | Archivos Auditados | Notas |
|---|---|---|---|
| **src/components/accessibility** | 🟢 | `AccessibilityAudit.tsx`, `AccessibilityProvider.tsx`, `ContrastFixer.tsx` | - `AccessibilityProvider.tsx`: Corrección de tipo `any` pendiente. - Limpieza de variables no utilizadas (`_`). |
| **src/components/admin/dashboard** | 🟢 | `OverviewPanel.tsx`, `RecentActivityList.tsx`, `ReportsPanel.tsx`, `StatsPanel.tsx`, `SystemHealthWidget.tsx` | - Componentes estables. - Limpieza de variables no utilizadas en `ReportsPanel.tsx`. |
| **src/components/admin/panels** | 🟢 | `ReportsPanel.tsx`, `index.ts` | - Re-exporta componentes. |
| **src/components/admin** | 🟢 | `AdvancedModerationPanel.tsx`, `AlertConfigPanel.tsx`, `AnalyticsPanel.tsx`, `DesktopNotificationSettings.tsx`, `ExportButton.tsx`, `PerformancePanel.tsx`, `ReportsManagement.tsx`, `SecurityDashboard.tsx`, `SecurityPanel.tsx`, `TokenSystemPanel.tsx`, `UserManagementPanel.tsx`, `WebhookConfigPanel.tsx` | - `SecurityPanel.tsx`, `TokenSystemPanel.tsx`: Limpieza de código muerto. - `ReportsManagement.tsx`: Corrección de tipos y servicio. - `admin.tsx`: No existe. |
| **src/services** | 🟢 | Todos los servicios (auth, core, social, payments, analytics) | - Fixes críticos de TS (CoupleDissolution, NFTService, Reports). - Singleton patterns asegurados. - Alerts reemplazados por Toast. - Deuda técnica: Uso de `any` en 39 archivos (ver sección abajo). |

## Guía para continuar y punto de reanudación (operativo)
- **Último directorio COMPLETADO:** `src/services` (01 Ene 2026, commit: "refactor: completa barrido src/services - fixes TS, singleton, alerts")
- **Directorio EN CURSO:** `src/shared` (iniciar barrido)
- **Siguiente directorio al finalizar el actual:** `src/types`
- **Acción inmediata:** Iniciar barrido de `src/shared` aplicando mismos criterios.
- **Plan de barrido para src/shared:**
  1. Verificar estructura actual.
  2. Buscar pink-* y reemplazar.
  3. Reemplazar alert() por toast.
  4. Fixes de TypeScript/lint.
  5. Ejecutar type-check.
  6. Crear commit.
  7. Actualizar este archivo.

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

## Deuda Técnica Detectada (src/services)
- **Uso de `any` / `as any`**: Detectado en 39 archivos, incluyendo:
  - `auth/UserVerificationService.ts`, `auth/ContentProtectionService.ts`
  - `analytics/ProfileStatsService.ts`, `analytics/TokenAnalyticsService.ts`
  - `social/ReportService.ts`, `social/SmartMatchingService.ts`
  - `payments/NFTService.ts`, `payments/WalletService.ts`
  - `core/CoupleDissolutionService.ts` (frozenAssetsSnapshot)
  - Y otros servicios core/features.
  - **Acción futura:** Refactorizar para usar tipos estrictos (interfaces definidas en `src/types`).

**Marca de progresos:**
* **[Completo/Verificado✅]** 
* **[EnProceso🚧]**  
* **[ADVERTENCIA⚠️]**
* **[Incompleto❌]**
