# 📌 TestSprite Product Spec + QA/Test Strategy — ComplicesConecta v3.9.2

**Versión:** 3.9.2
**Fecha:** 22 Ene 2026
**Objetivo:** Documento único para alimentar TestSprite (Product Specification Doc) y generar/ejecutar pruebas de **frontend** de forma consistente.

---

## 1) Resumen de Producto (Fuente: `COMPLICESCONECTA_PRESENTACION_PUBLICA.md`)

**ComplicesConecta** es una plataforma social +18 enfocada en conexión segura, discreta y verificada, con:

- **IA integrada** (asistencia, matching y moderación).
- **Privacidad reforzada** (galerías privadas con blur y control parental).
- **Cumplimiento legal** (Ley Olimpia MX).
- **Economía de tokens** (CMPX) y funcionalidades NFT (actual/roadmap).

**Principios QA (no negociables):**
- No romper flujo crítico: **registro → discover → match → chat → check-in**.
- No introducir regresiones en:
  - Moderación de contenido
  - Control parental
  - Bloqueos y permisos
  - Acceso a galería privada

---

## 2) Flujos Core (Fuente: `DIAGRAMAS_FLUJOS_CONSOLIDADO.md`)

### 2.1 Flujo de Seguridad (Auth)
**Entrada:** Usuario accede → autenticación → verificación MFA (si aplica) → validaciones de seguridad (rate-limit) → acceso.

**Criterios de aceptación (frontend):**
- Login/registro no debe quedar “congelado” ni con UI no interactiva.
- Si hay MFA habilitado:
  - El usuario puede completar el paso de verificación.
  - Errores se muestran con feedback claro.

### 2.2 Flujo de Usuario
**Landing +18 → Demo o Registro Real**
- Demo: `/demo`
- Registro/Auth: `/auth`

**Luego:**
- Discover: `/discover`
- Match: `/matches`
- Chat: `/chat` (y/o rutas relacionadas)
- Tokens: `/tokens`
- Eventos/Clubs: `/events`, `/clubs`

**Criterios de aceptación (frontend):**
- Navegación no se rompe en móvil.
- Rutas protegidas se comportan correctamente.

---

## 3) Estado QA y Riesgos (Fuente: `PROBLEMAS_PENDIENTES_CONSOLIDADOS.md`)

### 3.1 Pendientes relevantes (para test/regresión)
- **Archivos huérfanos (Media):** mantener vigilancia de imports/rutas para evitar rutas muertas.
- **WalletButton / mint NFT (Media):** feature incompleta; probar que no haya crashes en UI NFT existentes.
- **Auditoría periódica SECURITY DEFINER (Baja):** fuera del scope de UI, pero afecta endpoints/queries.

### 3.2 Áreas críticas de regresión (prioridad alta)
- Auth (registro/login) + Demo
- Discover (like/match)
- Match → Chat (gate/permiso)
- Chat realtime
- Galería privada (unlock/pago CMPX)
- Tokens (paneles y navegación)

---

## 4) Inventario de Tests Existentes (Fuente: `src/tests/**`)

> Nota: estos tests ya existen; TestSprite debe complementarlos (no reemplazarlos).

### 4.1 Unit tests (`src/tests/unit/`)
Incluye (muestra, no exhaustivo):
- AI/Moderation/Services:
  - `AILayerService.test.ts`
  - `ContentModerationService.test.ts`
  - `EmotionalAIService.test.ts`
  - `Neo4jService.test.ts`
  - `PerformanceMonitoringService.test.ts`
- Auth/Security:
  - `auth.test.ts`
  - `SecurityService.test.ts`
  - `androidSecurity.test.ts`
- Realtime/Matching:
  - `matching.test.ts`
  - `realtime-chat.test.ts`
- Validación:
  - `zod-validation.test.ts`

### 4.2 Integration tests (`src/tests/integration/`)
- `supabase-integration.test.ts`
- `rls-policies.test.ts`
- `system-integration.test.ts`

### 4.3 E2E (Playwright) (`src/tests/e2e/`)
Cobertura de flujos:
- Auth:
  - `auth-flow.spec.ts`, `registration.spec.ts`, `registration-complete.spec.ts`
- Flujos críticos:
  - `critical-flows.spec.ts`, `full-user-journey.spec.ts`
- Chat:
  - `chat-realtime.spec.ts`, `realtime-chat.spec.ts`
- Match/Likes:
  - `matches-likes.spec.ts`
- UI/Navegación:
  - `navigation.spec.ts`, `navigation-complete.spec.ts`, `ui-components.spec.ts`

### 4.4 Component tests (`src/tests/components/`)
- `Chat.test.tsx`
- `ParentalControl.test.tsx`
- `TokenDashboard.test.tsx`
- `NFTMintButton.test.tsx`
- `NFTWalletView.test.tsx`

### 4.5 Security tests (`src/tests/security/`)
- `biometric-auth.test.ts`
- `media-access.test.ts`

### 4.6 Setup/Mocks
- Setup: `src/tests/setup/`
- Mocks: `src/tests/mocks/` (Supabase, hCaptcha, TensorFlow, performance)

---

## 5) Plan de Pruebas Frontend para TestSprite (lo que debe generar/validar)

### 5.1 Configuración recomendada en TestSprite UI
- **Testing Types:** Frontend
- **Mode:** Frontend
- **Scope:** Codebase (para cobertura total) o Code diff (para cambios recientes)
- **Authentication:** None
- **Local Development Port:** 5173
- **Path:** /

### 5.2 Casos de prueba (prioridad) — criterios mínimos

#### A) Auth / Registro / Demo
- Abrir `/auth`.
- Validar que inputs son interactivos.
- Login demo (si aplica) → redirección correcta.
- Navegar a `/demo` (si no prod) y validar selección demo.

#### B) Discover → Like → Match
- Abrir `/discover`.
- Ejecutar acción like (si existen perfiles demo) y validar feedback UI.
- Verificar que `matches` aparece en `/matches` cuando aplica.

#### C) Chat
- Abrir `/chat` (o ruta de chat aplicable) con sesión.
- Enviar mensaje (si mock/entorno lo permite) y validar UI.
- Validar que sin sesión se redirige a `/chat-info`.

#### D) Galería privada
- Abrir chat con galería privada.
- Validar que contenido bloqueado aparece con blur.
- Validar flujo de desbloqueo (si entorno demo o mocks lo permiten).

#### E) Tokens
- Abrir `/tokens`.
- Verificar render de dashboard y navegación.

#### F) Mobile UX
- Simular viewport móvil.
- Validar que bottom navigation no se sobrepone a contenido crítico.
- Validar que labels no saturan y navegación es usable.

---

## 6) Evidencia y salida esperada

- Reporte de TestSprite debe incluir:
  - Lista de tests generados
  - Resultado por test
  - Pasos reproducibles
  - Capturas/trace si aplica

---

## 7) Nota de alcance

Este documento NO autoriza:
- Cambios masivos estructurales
- Eliminación de archivos sin verificación
- Introducción de secretos en repo

---
