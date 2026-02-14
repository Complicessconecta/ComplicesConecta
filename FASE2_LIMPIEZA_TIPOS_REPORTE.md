# 📋 FASE 2: LIMPIEZA DE TIPOS - REPORTE DETALLADO

**Fecha:** 14/2/2026, 6:19:44
**Estado:** EN PROGRESO - Análisis completado, corrección manual requerida

## 📊 ESTADÍSTICAS GENERALES

- **Archivos analizados:** 940
- **Archivos con problemas:** 244
- **Correcciones automáticas aplicadas:** 0 (enfoque conservador)
- **Archivos requiriendo corrección manual:** 244

## 🔧 ESTRATEGIA DE CORRECCIÓN

### ✅ ENFOQUE CONSERVADOR
- **NO se aplicaron correcciones automáticas** para evitar romper funcionalidad
- **Análisis detallado** de cada problema identificado
- **Corrección manual guiada** con ejemplos específicos

### 🎯 PRIORIDADES DE CORRECCIÓN
1. **Tipos críticos del core** (autenticación, perfiles, base de datos)
2. **Tipos de UI/UX** (menos críticos, pueden esperar)
3. **Tipos de utilidades** (mediana prioridad)

## 📋 ARCHIVOS QUE REQUIEREN ATENCIÓN MANUAL

### 📁 src\types\supabase-local.ts
**Total de problemas:** 418

**Desglose:**
- Tipos `unknown`: 418 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\supabase-generated.ts
**Total de problemas:** 45

**Desglose:**
- Tipos `unknown`: 45 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\supabase-remote.ts
**Total de problemas:** 33

**Desglose:**
- Tipos `unknown`: 33 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\supabase-updated.ts
**Total de problemas:** 33

**Desglose:**
- Tipos `unknown`: 33 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\security\biometric-auth.test.ts
**Total de problemas:** 32

**Desglose:**
- `as any`: 30 usos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\tests\unit\androidSecurity.test.ts
**Total de problemas:** 31

**Desglose:**
- `as any`: 31 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\captureConsoleErrors.ts
**Total de problemas:** 22

**Desglose:**
- `as any`: 10 usos
- Tipos `any`: 12 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\testDebugger.ts
**Total de problemas:** 17

**Desglose:**
- Tipos `any`: 17 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\profiles\couple\ProfileCouple.test.tsx
**Total de problemas:** 16

**Desglose:**
- Tipos `any`: 16 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\services\core\DataPrivacyService.ts
**Total de problemas:** 14

**Desglose:**
- `as any`: 5 usos
- Tipos `any`: 9 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\dynamicImports.ts
**Total de problemas:** 14

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 11 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\discover\PreferenceSearch.tsx
**Total de problemas:** 13

**Desglose:**
- `as any`: 9 usos
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\services\auth\auth\SecurityAuditService.ts
**Total de problemas:** 12

**Desglose:**
- `as any`: 9 usos
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\social\chat\ChatPrivacyService.ts
**Total de problemas:** 12

**Desglose:**
- `as any`: 12 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\AdminModerators.tsx
**Total de problemas:** 11

**Desglose:**
- `as any`: 6 usos
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\profiles\profile-cache.test.ts
**Total de problemas:** 11

**Desglose:**
- `as any`: 11 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\types\improved-types.ts
**Total de problemas:** 11

**Desglose:**
- `as any`: 2 usos
- Tipos `unknown`: 9 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\notifications\NotificationBell.tsx
**Total de problemas:** 10

**Desglose:**
- `as any`: 9 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\performance\CodeSplittingManager.tsx
**Total de problemas:** 10

**Desglose:**
- `as any`: 10 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\pages\ModeratorDashboard.tsx
**Total de problemas:** 10

**Desglose:**
- Tipos `unknown`: 10 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\moderators\ModeratorDashboard.tsx
**Total de problemas:** 10

**Desglose:**
- Tipos `unknown`: 10 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\profiles\single\ProfileSingle.tsx
**Total de problemas:** 10

**Desglose:**
- `as any`: 6 usos
- Tipos `any`: 2 parámetros/retornos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\services\social\social\PredictiveMatchingService.ts
**Total de problemas:** 10

**Desglose:**
- `as any`: 10 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\ProfileReportService.test.ts
**Total de problemas:** 10

**Desglose:**
- `as any`: 10 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\lib\images.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 7 usos
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\invitations.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 6 usos
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\requests.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 7 usos
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\auth\auth\UserIdentificationService.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 7 usos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\blockchain\Web3Service.ts
**Total de problemas:** 9

**Desglose:**
- Tipos `unknown`: 9 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\legal\ConsentService.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 5 usos
- Tipos `any`: 2 parámetros/retornos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\SecurityService.test.ts
**Total de problemas:** 9

**Desglose:**
- `as any`: 9 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\animations\NotificationSystem.tsx
**Total de problemas:** 8

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\demo\DemoProvider.tsx
**Total de problemas:** 8

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\features\chat\useRealtimeChat.ts
**Total de problemas:** 8

**Desglose:**
- `as any`: 7 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\features\profile\coupleProfilesCompatibility.ts
**Total de problemas:** 8

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 6 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\types\supabase-helpers.ts
**Total de problemas:** 8

**Desglose:**
- Tipos `unknown`: 8 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\animations\EnhancedComponents.tsx
**Total de problemas:** 7

**Desglose:**
- `as any`: 7 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\context\AppContext.tsx
**Total de problemas:** 7

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 6 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\features\profile\useProfileCache.ts
**Total de problemas:** 7

**Desglose:**
- `as any`: 7 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\hooks\usePerformanceOptimization.ts
**Total de problemas:** 7

**Desglose:**
- Tipos `any`: 7 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\validation\zod\zod-schemas.ts
**Total de problemas:** 7

**Desglose:**
- Tipos `unknown`: 7 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\AdminCareerApplications.tsx
**Total de problemas:** 7

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Clubs.tsx
**Total de problemas:** 7

**Desglose:**
- `as any`: 7 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\blockchain\ContractService.ts
**Total de problemas:** 7

**Desglose:**
- `as any`: 3 usos
- Tipos `unknown`: 4 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\NotificationService.ts
**Total de problemas:** 7

**Desglose:**
- `as any`: 5 usos
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\features\events\VirtualEventsService.ts
**Total de problemas:** 7

**Desglose:**
- `as any`: 6 usos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\mocks\supabase.ts
**Total de problemas:** 7

**Desglose:**
- Tipos `any`: 7 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\wallet.types.ts
**Total de problemas:** 7

**Desglose:**
- Tipos `unknown`: 7 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\HeaderNav.tsx
**Total de problemas:** 6

**Desglose:**
- `as any`: 4 usos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\charts\chart.tsx
**Total de problemas:** 6

**Desglose:**
- Tipos `any`: 5 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\config\sentry.config.ts
**Total de problemas:** 6

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\integrations\supabase\types.ts
**Total de problemas:** 6

**Desglose:**
- Tipos `unknown`: 6 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\secureMediaService.ts
**Total de problemas:** 6

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Chat.tsx
**Total de problemas:** 6

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\analytics\analytics\ProfileStatsService.ts
**Total de problemas:** 6

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\services\core\ErrorAlertService.ts
**Total de problemas:** 6

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 3 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\features\BannerManagementService.ts
**Total de problemas:** 6

**Desglose:**
- `as any`: 6 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\accessibility\AccessibilityProvider.tsx
**Total de problemas:** 5

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\android\AndroidThemeProvider.tsx
**Total de problemas:** 5

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\animations\AnimationProvider.tsx
**Total de problemas:** 5

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\features\profile\ProfileReportService.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 5 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\hooks\useTokens.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 4 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\security\androidSecurity.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `unknown`: 5 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\AdminProduction.tsx
**Total de problemas:** 5

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\QueryOptimizationService.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\SmartMatchingService.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\security\media-access.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\ContentModerationService.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\ContentProtectionService.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 5 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\mobile.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 5 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\realtime-chat.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 5 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\zod-validation.test.ts
**Total de problemas:** 5

**Desglose:**
- `as any`: 5 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\google.types.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `unknown`: 5 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\androidSecurity.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `unknown`: 5 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\webVitals.ts
**Total de problemas:** 5

**Desglose:**
- Tipos `any`: 5 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\chat\ChatBot.tsx
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\Footer.tsx
**Total de problemas:** 4

**Desglose:**
- `as any`: 4 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\profiles\AdvancedProfileEditor.tsx
**Total de problemas:** 4

**Desglose:**
- `as any`: 4 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\ui\ThemeProvider.tsx
**Total de problemas:** 4

**Desglose:**
- `as any`: 2 usos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\hooks\useAppPermissions.ts
**Total de problemas:** 4

**Desglose:**
- `as any`: 4 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\advancedFeatures.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\intelligentAutomation.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 1 parámetros/retornos
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\notifications.ts
**Total de problemas:** 4

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 2 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\validations\moderator.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `unknown`: 4 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\Admin.tsx
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Discover.tsx
**Total de problemas:** 4

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 1 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\profiles\shared\Profiles.tsx
**Total de problemas:** 4

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\services\ai\AIIntegrationService.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 3 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\auth\auth\ContentProtectionService.ts
**Total de problemas:** 4

**Desglose:**
- `as any`: 3 usos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\blockchain\Web3WalletService.ts
**Total de problemas:** 4

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\graph\Neo4jService.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `unknown`: 4 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\RateLimitService.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\WebhookService.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 4 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\MatchService.ts
**Total de problemas:** 4

**Desglose:**
- `as any`: 3 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\postsService.ts
**Total de problemas:** 4

**Desglose:**
- Tipos `any`: 1 parámetros/retornos
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\chat\ChatContainer.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\performance\LazyComponentLoader.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 2 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\profiles\shared\EnhancedGallery.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\search\AdvancedSearch.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\tokens\TokenChatBot.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\demo\AppFactory.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useGeolocation.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useRealtimeNotifications.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\safe-storage.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\security\dataEncryption.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\userAgent.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\main.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\middleware\csp.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\AdminPartners.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\profiles\single\EditProfileSingle.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\pages\Tokens.tsx
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\analytics\analytics\AdvancedAnalyticsService.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 1 usos
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\analytics\analytics\ai\AILayerService.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\AdvancedCacheService.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\payments\ReferralTokensService.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 2 usos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\ReportService.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `any`: 3 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\components\Chat.test.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\tests\components\TokenDashboard.test.tsx
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\tests\integration\system-integration.test.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\EmotionalAIService.test.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\UserIdentificationService.test.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\content-moderation.types.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\supabase.ts
**Total de problemas:** 3

**Desglose:**
- Tipos `unknown`: 3 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\platformDetection.ts
**Total de problemas:** 3

**Desglose:**
- `as any`: 3 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\auth\EmailVerification.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\components\chat\ChatRoom.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\chat\ChatWithLocation.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\clubs\ClubProfileAdmin.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\forms\ModeratorApplicationForm.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\profiles\shared\ImageGallery.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\profiles\shared\ProfileTabs.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\tokens\TokenDashboard.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\buttons\NFTMintButton.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 1 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\demo\RealProvider.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useProfileStats.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\hooks\useSupabaseTheme.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\capture-console-errors.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\errorHandling.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Invest.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\ModeratorRequest.tsx
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\TokensInfo.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\VideoChat.tsx
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 2 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\analytics\analytics\ai\types.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `any`: 1 parámetros/retornos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\APMService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\legal\CoupleDissolutionService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\PerformanceMonitoringService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\features\GlobalSearchService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\features\SustainableEventsService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\payments\NFTService.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\payments\WalletService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\rag\RAGService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\couple\AdvancedCoupleService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\InvitationsService.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\e2e\helpers\EnhancedAuthHelper.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 2 usos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\tests\unit\HistoricalMetricsService.test.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\analytics.types.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\blockchain.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\security.types.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\lazyWithDefault.ts
**Total de problemas:** 2

**Desglose:**
- `as any`: 1 usos
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\utils\safeLocalStorage.ts
**Total de problemas:** 2

**Desglose:**
- Tipos `unknown`: 2 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\ai\AIWorker.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\App.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\components\admin\dashboard\OverviewPanel.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\admin\ModerationMetrics.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\admin\PerformancePanel.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\admin\SecurityDashboard.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\admin\UserManagementPanel.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ai\LegalChatBox.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\android\AndroidOptimizedApp.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\auth\ModeratorRoute.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\components\clubs\ClubProfileReviews.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\clubs\PartnerRequestModal.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\dashboard\AnalyticsDashboard.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\images\ImageGallery.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\mobile\PWAManager.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\notifications\NotificationCenter.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\performance\ImageOptimizer.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\profiles\couple\CoupleRegistrationForm.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\profiles\shared\Gallery.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\profiles\shared\MainProfileCard.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\profiles\shared\useProfileQuery.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\profiles\single\SingleRegistrationForm.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\components\reservations\QRScanner.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\stories\StoryTypes.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\templates\ButtonEffectsTemplate.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\templates\ChatTemplate.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\CrossBrowserOptimizer.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\FloatingElements.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\MobileOptimizer.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\ui\Modal.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\components\wallet\DemoWallet.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\config\demo-production.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\demo\demoData.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\features\auth\BiometricGuard.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\features\auth\useBiometricAuth.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\features\chat\useVideoChat.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\features\profile\useProfileScore.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\hooks\ai\useModelLoader.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useAdvancedCache.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useBackgroundPreferences.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useDeviceCapability.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\usePersistedState.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\usePushNotifications.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useTheme.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\hooks\useToast.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\ai\contentModeration.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\email-service.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\logger\logger.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\roles.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\lib\visual-validation.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\admin\useAdminDashboard.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Careers.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Dashboard.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Index.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Matches.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\profiles\couple\ProfileCouple.tsx
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos de `@/types/supabase-custom`
- Crear tipos específicos para perfiles single/couple

---

### 📁 src\pages\ProjectInfo.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\pages\Shop.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\analytics\analytics\ai\PredictiveGraphMatchingService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\auth\auth\SecurityService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\auth\auth\UserVerificationService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\auth\permanentBan.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Usar tipos específicos de Supabase Auth
- Crear interfaces para User y Session

---

### 📁 src\services\chat\ChatRoomService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\CDNService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\core\geo\S2Service.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\neo4j\Neo4jService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\reservations\ReservationService.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\notifications\OneSignalService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\ContentModerationService.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\social\social\ReportManagementService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\services\tokens\TokenService.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\components\ParentalControl.test.tsx
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Usar tipos de React apropiados
- Crear interfaces para props

---

### 📁 src\tests\e2e\critical-flows.spec.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\integration\supabase-integration.test.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\setup\playwright-setup.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\emailService.test.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\performance.test.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `any`: 1 parámetros/retornos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\postsService.test.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\PushNotificationService.test.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\tests\unit\ReportService.test.ts
**Total de problemas:** 1

**Desglose:**
- `as any`: 1 usos

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\themes\useTheme.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\datadog.d.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\react.types.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

### 📁 src\types\supabase-custom.ts
**Total de problemas:** 1

**Desglose:**
- Tipos `unknown`: 1 sin resolver

**Sugerencias de corrección:**
- Crear tipos específicos basados en uso real
- Usar uniones de tipos en lugar de any

---

# 🚀 GUÍA DE CORRECCIÓN MANUAL

## 📝 PATRONES DE CORRECCIÓN

### 1. Reemplazar `as any`
**❌ Código problemático:**
```typescript
const user = data as any;
```

**✅ Código corregido:**
```typescript
interface UserData {
  id: string;
  email: string;
  name?: string;
}
const user = data as UserData;
```

### 2. Reemplazar tipos `: any`
**❌ Código problemático:**
```typescript
function processData(data: any): any {
  return data;
}
```

**✅ Código corregido:**
```typescript
interface InputData {
  id: string;
  value: number;
}

function processData(data: InputData): ProcessedResult {
  return { result: data.value * 2 };
}
```

### 3. Resolver tipos `unknown`
**❌ Código problemático:**
```typescript
function handleResponse(response: unknown) {
  console.log(response.property); // Error
}
```

**✅ Código corregido:**
```typescript
interface ApiResponse {
  property: string;
  data: any;
}

function handleResponse(response: unknown) {
  if (isApiResponse(response)) {
    console.log(response.property); // ✅ Seguro
  }
}

function isApiResponse(obj: unknown): obj is ApiResponse {
  return typeof obj === 'object' &&
         obj !== null &&
         'property' in obj;
}
```

## ⚠️ CONSIDERACIONES IMPORTANTES

### 🔴 NO HACER cambios automáticos
- Las correcciones automáticas podrían romper funcionalidad existente
- Cada cambio debe ser revisado manualmente

### ✅ HACER cambios incrementales
- Corregir un archivo a la vez
- Probar después de cada cambio
- Hacer commits separados por archivo

### 🎯 ENFOCARSE en archivos críticos primero
1. **Autenticación** (`src/features/auth/`, `src/pages/Auth.tsx`)
2. **Perfiles** (`src/pages/profiles/`)
3. **Base de datos** (`src/integrations/supabase/`)
4. **Componentes UI** (menos críticos)

## 📊 MÉTRICAS DE ÉXITO

- **Compilación TypeScript:** 0 errores
- **Linting:** Sin errores críticos
- **Tests:** 95%+ pasando
- **Funcionalidad:** Sin regresiones

## 🎯 PRÓXIMOS PASOS

1. **Seleccionar archivos prioritarios** para corrección manual
2. **Crear interfaces específicas** donde falten
3. **Aplicar correcciones** una por una
4. **Probar exhaustivamente** después de cada cambio
5. **Actualizar este reporte** con progreso

---

**Reporte generado automáticamente - FASE 2: LIMPIEZA DE TIPOS**
**Timestamp:** 2026-02-14T12:19:44.410Z
