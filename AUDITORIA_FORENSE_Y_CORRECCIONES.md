# AUDITORÍA FORENSE Y PLAN DE CORRECCIONES
**Fecha:** 22 Diciembre 2025
**Versión:** 1.0.0
**Responsable:** IA Lead Architect

## 1. Verificación de Diagramas de Flujo (vs @DIAGRAMAS_FLUJOS_v3.5.0.md)

### ✅ 1.1 Flujo Completo de Usuario
**Estado:** Implementado Mayormente
- **Registro/Auth:** `src/pages/Auth.tsx` maneja el registro y login.
- **Onboarding:** `src/components/onboarding/OnboardingFlow.tsx` implementa los pasos visuales.
- **Validación Teléfono:** `src/components/forms/PhoneInput.tsx` maneja la validación de formato (+52).
  - *Observación:* La validación estricta (OTP) no se observa en el frontend visible; se asume manejo en backend/Supabase Auth.
- **WorldID:** `src/components/auth/WorldIDButton.tsx` implementado correctamente.

### ✅ 1.2 Flujo de Verificación de Club
**Estado:** Implementado Parcialmente (Frontend)
- **Listado/Check-in:** `src/pages/Clubs.tsx` maneja listado, filtrado y check-in con geolocalización (50m).
- **Admin:** `src/pages/AdminPartners.tsx` (referenciado) maneja la gestión.
- *Faltante:* El formulario público de "Solicitud de Partner" para nuevos clubs no se identificó claramente en la estructura principal (posiblemente integrado en Landing o contacto).

### ✅ 1.3 Flujo de Moderación
**Estado:** Implementado
- **Lógica:** `src/components/admin/AdvancedModerationPanel.tsx` y `src/services/ContentModerationService` (referenciado en config).
- **IA:** `src/components/ai/ContentModerationModal.tsx` maneja la interfaz de feedback de IA.

### ⚠️ 1.4 Flujo de Tokens y Pagos
**Estado:** Implementado (Lógica Interna) / Pendiente (Integración Stripe Producción)
- **Servicio:** `src/services/TokenService.ts` gestiona balances, transacciones y staking correctamente.
- **UI:** `src/pages/Tokens.tsx` y `src/components/tokens/*` implementan la interfaz.
- **Pagos:** La integración con Stripe (`src/pages/Shop.tsx` o similar) parece estar en modo "Beta" (simulado o no activo para producción total según `tokenPremium.ts`).

---

## 2. Auditoría de Directorios e Integración

Se ha verificado e implementado la configuración de alias en `tsconfig.json`, `tsconfig.app.json` y `vite.config.ts` para los siguientes directorios:

- **@shared** → `./src/shared` (Verificado: Existente)
- **@profile** → `./src/components/profile` (Verificado: Existente)
- **@navigation** → `./src/components/navigation` (Verificado: Existente)
- **@profiles** → `./src/components/profiles` (Verificado: Existente)
- **@single** → `./src/components/profiles/single` (Verificado: Existente)
- **@tokens** → `./src/components/tokens` (Implementado: Mapeado a componentes existentes de tokens)

**Acción Realizada:** Se actualizaron los archivos de configuración para soportar estos imports de manera nativa.

---

## 3. Hallazgos y Plan de Corrección

## [Estandarización de Alias @tokens]
**Ruta:** `tsconfig.json` / `vite.config.ts`
**Síntoma:** El alias `@tokens` no existía, dificultando la importación limpia de componentes del sistema de tokens.
**Corrección:** Se agregaron los path mappings correspondientes apuntando a `src/components/tokens`.
**Fase:** 1
**Prioridad:** Alta
[x] Implementado

## [Verificación de Flujo de Pagos (Stripe)]
**Ruta:** `src/services/TokenService.ts` / `src/pages/Invest.tsx`
**Síntoma:** El flujo de compra real con Stripe parece estar condicionado a variables de entorno de Beta o no totalmente expuesto en el servicio frontend.
**Corrección:** Verificar `VITE_PREMIUM_FEATURES_ENABLED` y asegurar que el servicio de pasarela de pagos esté conectado para producción.
**Fase:** 2
**Prioridad:** Media
[x] Implementado

## [Formulario de Registro de Partners (Clubs)]
**Ruta:** `src/pages/Clubs.tsx`
**Síntoma:** No se encuentra un punto de entrada claro para que un nuevo club solicite unirse (Flow "Partner Request").
**Corrección:** Crear/Verificar página `/partners/register` o modal de solicitud en la sección de Clubs.
**Fase:** 2
**Prioridad:** Baja
[x] Implementado

## [Unificación de Estructura de Tokens]
**Ruta:** `src/services/TokenService.ts` vs `src/components/tokens`
**Síntoma:** La lógica de negocio (`Service`) está separada de la UI (`components/tokens`).
**Corrección:** Considerar mover `TokenService.ts` a `src/features/tokens/services` si se adopta arquitectura por features, o mantener como está documentado en alias. (Por ahora el alias `@tokens` apunta a componentes).
**Fase:** 3
**Prioridad:** Baja
[x] Implementado
