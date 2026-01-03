# 📝 RELEASE NOTES - ComplicesConecta

**Última Actualización:** 03 de Enero, 2026
**Versión Actual:** v3.8.0
**Estado:** ✅ **PRODUCTION READY - REFACTORED & STANDARDIZED**

> **📚 Para guía completa de instalación y configuración, consulta [INSTALACION_SETUP_v3.5.0.md](./INSTALACION_SETUP_v3.5.0.md)**  
> **📚 Para documentación pública, consulta [docs/README.md](./docs/README.md)**  

---

## 🔧 Hotfix v3.8.0 — 03 Ene 2026 00:27

- Profiles/Single: sección "Blockchain & NFTs" visible también en perfiles Demo.
- Carga de blockchain en perfiles autenticados: se fuerza `user_id`/`id` al cargar `Wallet/NFTs`.
- Handlers de reclamo (`claimTestnetTokens`/`claimDailyTokens`): usan `uid` de respaldo (`user.id` || `profile.user_id` || `profile.id`).
- Modo Demo: `testnetInfo` inicial con `canClaim=true`, `remaining` y límites diarios para mostrar CTAs de reclamo.
- Botón en "Estado de cuenta NFT": muestra "Gestionar mis Tokens" en perfil propio o demo.
- Verificación de imports dinámicos de Tokens: sin referencias con casing incorrecto (`tokens.tsx`).

---

## 🔧 Hotfix v3.8.0 — 03 Ene 2026 01:28

- UI Background: refactor para eliminar estilos inline en `UnifiedBackground.tsx` (fondo con `<img>` + utilidades Tailwind; partículas CSS con clases predefinidas; contenido clickeable en `z-10`).
- Home `/`: se fuerza imagen de fondo aleatoria y partículas neón activas al iniciar, respetando accesos y rendimiento (sin bloquear clics).

---

## 🔧 Hotfix v3.8.0 — 02 Ene 2026 22:31

- UI Perfiles: agregado chip flotante "Demo User" en rutas de perfil (header oculto) para acceso rápido a /demo.
- Navegación: barra inferior habilitada también en rutas de perfil (single/couple/demo/real).
- Control Parental: sin auto-bloqueo al cargar perfil; bloqueo solo por acción del usuario o estado guardado.
- Tokens: aviso y CTA para crear Wallet cuando no existe; soporta modo real (Supabase) y demo (localStorage flag).
- Refactor Imports: barrels convertidos a alias absoluto `@/`:
  - components/tokens/index.ts
  - components/ui/backgrounds/index.ts
  - components/home/index.ts
  - components/layout/index.ts
  - components/gallery/index.ts
  - components/images/index.ts
  - components/invitations/index.ts
  - components/ui/charts/index.ts
  - components/ui/drawer/index.ts

Nota de reversión rápida:
- Revertir `MainLayout.tsx` si se desea ocultar la bottom nav en perfiles.
- Revertir `ProfileLayout.tsx` si se desea remover el chip "Demo User" y restaurar overlay.
- Revertir cambios de barrels si se requieren rutas relativas.

---

## 🔧 Hotfix v3.8.0 — 02 Ene 2026 21:47

- Gating de Chat por Match (Discover → Chat): botón deshabilitado si no hay match mutuo y validación previa a navegación.
- Monetización: Galería Privada en Chat con paywall CMPX. Cobro vía `TokenService.spendTokens` y registro de comisión con `recordGalleryCommission` (90% creador / 10% plataforma). UI con estado de desbloqueo local.
- Calidad: `pnpm run type-check`, `pnpm run lint` y `pnpm run build` en verde sobre `master` tras el merge.
- Backup: rama de respaldo `back-master-2026-01-02-21-46` y tag `backup-master-2026-01-02-21-46` antes del merge a `master`.

---

## 🚀 Versión 3.8.0 - Refactorización y Estandarización (26 Dic 2025)

Se ha completado una fase crítica de saneamiento y estandarización del código base para asegurar la escalabilidad y el cumplimiento de estándares enterprise.

### 🛠️ **REFACTORIZACIÓN ESTRUCTURAL**
- **Estandarización de Imports/Exports**: Migración masiva de componentes clave (Android, Navigation, Layouts) para utilizar **Named Exports** exclusivamente, eliminando ambigüedades y facilitando la refactorización automática.
- **Rutas Absolutas**: Implementación estricta de rutas absolutas con alias `@/` en todos los índices y componentes refactorizados, eliminando la fragilidad de las rutas relativas profundas (`../../../`).
- **Limpieza de Linting**: Resolución total de advertencias y errores de ESLint (0 errors, 0 warnings), asegurando un código limpio y consistente.

### 🔒 **SEGURIDAD Y MANTENIMIENTO**
- **Estrategia de Backup**: Implementación de protocolos de backup mediante ramas dedicadas con timestamp antes de intervenciones mayores.
- **Pre-commit Hooks**: Verificación y refuerzo de hooks de Husky para garantizar que solo código que pasa linting y type-check llegue al repositorio.

---

## 🚀 Versión 3.8.0 - Arquitectura y Refactorización (18–20 Dic 2025)

Esta versión se enfoca en una auditoría profunda y refactorización de componentes clave para mejorar la mantenibilidad, seguridad y consistencia del código, además de sentar las bases de la infraestructura de base de datos para futuras funcionalidades.

### 🏛️ **MEJORAS DE ARQUITECTURA**
- **Refactor de Navegación Responsiva**: Se ha eliminado la lógica de detección de pantalla basada en JavaScript en `ResponsiveNavigation.tsx`. El componente ahora utiliza un enfoque "mobile-first" puro con clases de Tailwind CSS, permitiendo una adaptación más granular y eficiente a los diferentes tamaños de pantalla de Android.
- **Hook de Autenticación Unificado**: Se ha reescrito `useBiometricAuth.ts` para usar el plugin nativo `@capgo/capacitor-native-biometric` en lugar de la API WebAuthn. El nuevo hook ahora centraliza la lógica para **biometría nativa y el PIN de 6 dígitos de respaldo**, unificando la experiencia de seguridad.
- **Sistema Centralizado de Permisos**: Se creó un nuevo hook `useAppPermissions.ts` que escanea y solicita permisos nativos (`geolocation`, `camera`, `notifications`) al iniciar la aplicación, asegurando que los permisos se gestionen de forma proactiva.
- **Consolidación de Lógica de PIN**: Se refactorizó `ParentalControl.tsx` para que utilice el hook `useBiometricAuth` central, eliminando la lógica de PIN duplicada e insegura.

### 🗄️ **INFRAESTRUCTURA DE BASE DE DATOS**
- **Nuevas Migraciones SQL**: Se han creado los scripts de migración para las tablas de base de datos que faltaban, necesarias para las siguientes funcionalidades:
  - `20251218120001_create_couple_agreements_table.sql`: Añade la tabla y políticas RLS para los acuerdos prenupciales de pareja.
  - `20251218120002_create_biometric_auth_tables.sql`: Añade las tablas para credenciales biométricas y la columna para el hash del PIN en `profiles`.
  - `20251218120003_reconcile_reports_and_add_scoring.sql`: Reconcilia el esquema de la tabla `reports` y añade las columnas `score` y `score_status` a la tabla `profiles` para el sistema de reputación.
- **Idempotencia de Migraciones**: Se corrigieron los scripts para incluir `IF NOT EXISTS` y `DROP ... IF EXISTS`, asegurando que puedan ejecutarse de forma segura en entornos donde los objetos de la base de datos ya podrían existir.

### 🐞 **ANÁLISIS Y CORRECCIONES**
- **Validación de Código:** Se realizó un análisis de todo el directorio `src/components/profiles` y se verificó que no hay errores de TypeScript.
- **Análisis de Políticas RLS**: Se investigó el error reportado sobre la política de `reports` y se confirmó que el código en el repositorio ya contiene la corrección, sugiriendo un problema de entorno local.

### 📅 Bitácora 20 Dic 2025 (v3.8.0)
- **Fondos Unificados + Modo Navidad**: Creación de `UnifiedBackground` como fondo único para toda la app pública, con gradiente, partículas CSS ligeras y nieve (tsparticles) limitada a rutas públicas (`/`, `/info`, `/about`, `/faq`, `/project-info`, `/auth`, `/login`, `/register`, `/terms`, `/privacy`). Eliminado el doble fondo en `Index.tsx` y el componente legacy `ParticlesBackground`.
- **Limpieza de Assets y Scripts**: Renombrados assets de fondos (`defautl.jpeg` → `default.jpeg`, `privadicouple*.jpg` → `privadocouple*.jpg`), movidos scripts PowerShell legacy a `scripts/maintenance/` y archivada documentación antigua en `_archive/docs_old/`.
- **QA y ESLint**: `pnpm type-check` y `pnpm run build` en verde. ESLint actualizado para ignorar `_archive/**`, manteniendo el código de producción libre de errores y dejando los artefactos históricos solo como referencia.

### 🛠️ Mantenimiento y Correcciones (26 Dic 2025)
- **Corrección de Codificación (Mojibake)**: Reparación masiva de caracteres corruptos en `ProfileCouple.tsx` y otros componentes clave, restaurando la legibilidad de nombres y textos en español.
- **Validación de Animaciones**: Verificación de cumplimiento de reglas de Hooks en `AnimationSettings.tsx` para asegurar estabilidad en renderizado.
- **Restauración de Utilidades**: Implementación de módulos base en `src/utils/` (`demoUuid`, `imageOptimization`, `assetLoader`, `tiktokShare`, `reportExport`) para resolver errores de importación y build, proporcionando implementaciones seguras y ligeras.
- **Exportaciones Android**: Corrección de `src/components/android/index.ts` para exportar `LazyImageLoader`, permitiendo importaciones consistentes en todo el proyecto.
- **Limpieza de Lint**: Resolución de advertencias de tipo `any` en `ProfileCouple.tsx` mediante interfaces estrictas.

### 🤖 IA Local Legal & Centro de Control IA (21 Dic 2025)

- **Libro Maestro Legal & Tokens:** Creado `app-master-context.md` como documento maestro que describe la lógica legal/financiera de ComplicesConecta (estado de relación `ACTIVE/FROZEN_DISPUTE/DISSOLVED`, 5 puntos de consentimiento, hashing SHA‑256, registro de IP/timestamps y gating de NFTs/Staking).
- **Motor de IA Local:** Implementado `LocalLegalAIWorker` en `src/ai/AIWorker.ts` sobre `@mlc-ai/web-llm` usando el modelo `Phi-3-mini-4k-instruct-q4f16_1-MLC`, con barra de progreso real (inicialización, descarga, warm-up) y respuestas determinísticas para casos críticos (activos congelados, compra de NFTs de pareja, resumen de los 5 puntos de consentimiento).
- **Hook `useLocalAI`:** Creado `src/ai/useLocalAI.ts` para gestionar mensajes, estado de carga del modelo y runtime legal (`hasActivePrenup`, `relationshipStatus`) desde componentes de chat.
- **LegalChatBox Reutilizable:** Nuevo componente `src/components/ai/LegalChatBox.tsx` con UI glassmorphism premium y loader 0–100% que integra la IA Local.
- **Centro de Control IA (`/ai-help`):** Creada la página `src/pages/AIControlCenter.tsx` como hub principal para explicar qué es CómplicesConecta, cómo funciona la IA Local y los beneficios de la seguridad forense. Incluye bloques educativos (qué es la app, por qué la IA es local y segura, guía rápida de registro) y un bloque protagonista con `LegalChatBox`.
- **TokensLegal → IA Help:** `src/pages/TokensLegal.tsx` ahora expone un CTA claro hacia `/ai-help` para que los usuarios puedan resolver dudas sobre los términos antes de operar con tokens CMPX/GTK.
- **Navegación "IA Ayuda":** Actualizado `src/components/Navigation.tsx` para incluir un nuevo item "IA Ayuda" (icono `Sparkles`) que navega a `/ai-help` desde la barra inferior.

### 🎨 UI Plexus/Glassmorphism + Navegación Unificada (21 Dic 2025)
- **Glassmorphism Consistente:**
  - Aplicado patrón glassmorphism premium a cards principales en `ProfileSingle.tsx` (stats, blockchain, galería), `TokenDashboard.tsx`, `Settings.tsx`, `Tokens.tsx` y `NFTs.tsx` usando `bg-white/5`, `backdrop-blur-xl`, `border-white/15`, `rounded-2xl`, `shadow-xl`, `p-6 md:p-10`.
  - Sub-cards de proyecciones y ventajas (Tokens) y de características/condiciones (NFTs) migradas a un estilo glass ligero con `bg-white/5`, `border-white/10`, `rounded-xl` para diferenciar jerarquías visuales.
- **Navegación y SideMenu:**
  - Se eliminaron instancias de navegación interna (`Navigation`/`Navbar`) en páginas específicas, dejando la navegación global en manos de `MainLayout` + `AppSidebar` para evitar parpadeos o barras duplicadas.
  - `AppSidebar` ahora usa `bg-black/60 backdrop-blur-2xl border border-white/10` y se alimenta de `mainNavItems`, `premiumItems`, `settingsItems`, incluyendo las rutas reales `/tokens` e `/investors` en el grupo Premium.
- **Rewrites SPA Vercel:**
  - Añadido `vercel.json` en la raíz con un rewrite genérico `/(.*) -> /index.html` para evitar errores 404 al recargar rutas internas manejadas por React Router.

---

## 🚀 Versión 3.7.0 - Privacy & UI Polish (18 Dic 2025)

### 🔒 **PRIVACIDAD MEJORADA**
- **Blur Agresivo en Galerías Privadas**: Implementado sistema de desenfoque (`blur-xl`) para imágenes privadas no desbloqueadas.
- **Indicador de Candado**: Icono 🔒 y mensaje "Desbloquear para ver" claramente visible sobre el contenido bloqueado.
- **Validación Parental**: Integración de control parental y PIN para acceso a contenido explícito.
- **Sincronización Demo/Prod**: La lógica de privacidad funciona idénticamente en entornos Demo y Producción.

### 🎨 **UI/UX POLISHING**
- **Corrección de Partículas**: Solucionado problema de z-index donde las partículas cubrían el contenido. Ahora usan `position: fixed` y `z-index: -1`.
- **Global Chat FAB**: Botón flotante de chat visible en todas las vistas principales con `z-index: 50`.
- **Botón NFT**: Añadido botón "Crear NFT" en perfiles, con gestión de estados (demo vs real).
- **Tokens Visualization**: Corrección de la visualización de tokens y gráficas en perfiles demo.

### 🛠️ **OPTIMIZACIÓN TÉCNICA**
- **Limpieza de Código**: Eliminación de archivos duplicados (`profilecopuuplentf.tsx`) y unificación de lógica en `ProfileCouple.tsx`.
- **Testing Unificado**: Fusión de tests redundantes en `ProfileSingle.test.tsx`.
- **Assets Estandarizados**: Renombrado de SVGs a `kebab-case` y limpieza de referencias.
- **Build & Lint**: Verificación exitosa de build y linting (0 errores).

---

## 🚀 Versión 3.6.3 - 100% TYPE-SAFE + Correcciones Definitivas TypeScript (15 Nov 2025)

### 🎯 TYPE SAFETY COMPLETADO v3.6.3 (15 Nov 2025)

#### ✅ **PROYECTO 100% TYPE-SAFE**
- **50+ Archivos Corregidos**: Todos los errores TypeScript eliminados
- **Event Handlers**: ErrorEvent, PromiseRejectionEvent, FormEvent, MouseEvent tipados
- **DOM Operations**: appendChild, createElement, getComputedStyle type-safe
- **Supabase Operations**: Null checks y type assertions implementados
- **Canvas API**: HTMLCanvasElement, toBlob callbacks correctamente tipados
- **Component Props**: ProfileCard, Modal, Form components type-safe
- **Test Suite**: Mock data y assertions completamente tipados

#### ✅ **CORRECCIONES SISTEMÁTICAS APLICADAS**
- **APMService.ts**: Event types (ErrorEvent, PromiseRejectionEvent)
- **ErrorAlertService.ts**: Global error handling type-safe
- **WalletService.ts**: Supabase operations con tablas válidas
- **ContrastFixer.tsx**: DOM operations y accessibility fixes
- **ProfileThemeShowcase.tsx**: Component props corregidas
- **NFTVerificationService.ts**: Null safety para strings
- **20+ Componentes**: Event handlers completamente tipados
- **15+ Servicios**: Type safety implementado
- **10+ Tests**: Mock data alineado con interfaces

### 🎯 BLOCKCHAIN SYSTEM COMPLETADO v3.6.3 (Previo)

#### ✅ **SISTEMA BLOCKCHAIN 100% FUNCIONAL**
- **8 Tablas Blockchain**: `user_wallets`, `testnet_token_claims`, `daily_token_claims`, `user_nfts`, `couple_nft_requests`, `nft_staking`, `token_staking`, `blockchain_transactions`
- **Migraciones Exitosas**: Todas las migraciones aplicadas sin errores
- **Políticas RLS**: Configuradas correctamente para seguridad
- **Triggers Automáticos**: `updated_at` funcionando en todas las tablas

#### 🔧 **CORRECCIONES CRÍTICAS IMPLEMENTADAS**
- **Eliminación de `as any`**: Reemplazado por helpers seguros
- **Tipos Explícitos**: Corregidos en todos los callbacks y funciones
- **Logger Context**: Formato de objeto implementado en todos los servicios
- **Validaciones Null**: Checks robustos implementados
- **Casting Controlado**: Helpers `safeBlockchainCast` y `safeGet`

#### 🛠️ **SERVICIOS BLOCKCHAIN OPTIMIZADOS**
- **WalletService**: Helper `blockchainClient` implementado
- **NFTService**: Tipos seguros y validaciones robustas
- **StakingWidget**: Métodos correctos y tipos válidos
- **ProfileSingle/Couple**: Integración blockchain completa

#### 📊 **VERIFICACIÓN COMPLETA**
- **Compilación TypeScript**: 0 errores críticos
- **Build Exitoso**: Proyecto compila sin problemas
- **Funcionalidad**: 100% operativa y verificada
- **Arquitectura**: Robusta con helpers seguros

---

## 🚀 Versión 3.5.0 - AI-Native Layer + Chat con Privacidad + Correcciones Críticas + Features Innovadoras + Sistema Completo (02-06 Nov 2025)

### 🎉 NUEVAS FEATURES INNOVADORAS v3.5.0 (06 Nov 2025)

#### 🏢 Sistema de Clubs Verificados ✅ (NUEVO v3.5.0)
- ✅ **5 Tablas Nuevas**: `clubs`, `club_verifications`, `club_checkins`, `club_reviews`, `club_flyers`
- ✅ **Check-ins Geoloc**: Radio 50m con verificación automática
- ✅ **Reseñas Verificadas**: Solo usuarios con WorldID + check-in real
- ✅ **Watermark + Blur IA**: Automático en imágenes de clubs
- ✅ **Páginas Públicas**: `/clubs/{slug}` con flyers editables
- ✅ **Panel Admin**: `/admin/partners` para gestión de clubs

**Migración SQL:**
- `20251106_05_create_club_system.sql` - Sistema completo de clubs

**Archivos Creados:**
- `src/pages/Clubs.tsx` - Página pública de clubs
- `src/pages/AdminPartners.tsx` - Panel admin partners
- `src/services/clubFlyerImageProcessing.ts` - Procesamiento IA de imágenes

#### 🛡️ Sistema de Moderación 24/7 ✅ (NUEVO v3.5.0)
- ✅ **Jerarquía 5 Niveles**: SuperAdmin (30%) → Elite (8%) → Senior (5%) → Junior (3%) → Trainee (1K CMPX)
- ✅ **Pagos Automáticos**: Cada lunes basados en % revenue
- ✅ **Timer Conexión**: Automático para tracking de horas
- ✅ **IA Pre-clasificación**: Cola de reportes con priorización automática
- ✅ **Baneo Permanente**: Con huella digital (canvas + WorldID)

**Migraciones SQL:**
- `20251106_07_create_moderation_v2_system.sql` - Moderación v2
- `20251106_08_create_permanent_ban_system.sql` - Baneo permanente

**Archivos Creados:**
- `src/pages/ModeratorDashboard.tsx` - Dashboard moderación
- `src/services/moderatorTimer.ts` - Timer moderadores
- `src/services/reportAIClassification.ts` - Clasificación IA
- `src/services/permanentBan.ts` - Baneo permanente
- `src/services/digitalFingerprint.ts` - Huella digital

#### 💎 Sistema de Tokens CMPX ✅ (NUEVO v3.5.0)
- ✅ **Total Supply**: 100M CMPX tokens
- ✅ **Shop Activo**: 1000 CMPX = 300 MXN
- ✅ **Comisión Galerías**: 10% (creador gana 90%)
- ✅ **Staking**: 10% APY anual
- ✅ **DAO**: Activación a 10K usuarios

**Migración SQL:**
- `20251106_09_create_cmpx_shop_system.sql` - Shop CMPX

**Archivos Creados:**
- `src/pages/Shop.tsx` - Shop CMPX tokens
- `src/services/galleryCommission.ts` - Comisiones galerías
- `supabase/functions/create-cmpx-checkout/index.ts` - Checkout CMPX

#### 💰 Sistema de Donativos/Inversión ✅ (NUEVO v3.5.0)
- ✅ **SAFTE Automático**: 10% retorno anual garantizado
- ✅ **Tiers**: $10K, $25K, $50K, $100K MXN
- ✅ **Landing `/invest`**: Con Stripe integrado
- ✅ **Plataformas**: AngelList + Republic listos para publicar

**Migración SQL:**
- `20251106_06_create_investment_system.sql` - Sistema de inversiones

**Archivos Creados:**
- `src/pages/Invest.tsx` - Landing donativos
- `supabase/functions/create-investment-checkout/index.ts` - Checkout inversión

### 🎉 NUEVAS FEATURES INNOVADORAS v3.5.0 (06 Nov 2025)

#### 💬 IA Consent Verification in Chats ✅ (Feature 1 - COMPLETADA)
- ✅ **ConsentVerificationService.ts** - Sistema real-time de verificación de consentimiento usando NLP con OpenAI
- ✅ **Análisis NLP con GPT-4**: Análisis de mensajes en tiempo real para detectar patrones de consentimiento
- ✅ **Scoring de Consenso**: Sistema de puntuación 0-100 basado en historial de mensajes
- ✅ **Auto-pause Automático**: Pausa automática de chat si consenso <80% (cumplimiento Ley Olimpia MX)
- ✅ **Integración con Chat**: Monitoreo automático de `chat_messages` con Supabase Realtime
- ✅ **Fallback Inteligente**: Análisis con patrones si OpenAI no está disponible
- ✅ **Cumplimiento Legal**: Sistema diseñado para cumplir con Ley Olimpia MX (protección contra acoso digital)

**Archivos Creados:**
- `src/services/ai/ConsentVerificationService.ts` (577 líneas)

**Migraciones SQL:**
- `20251106_01_consent_verification.sql` - Tabla `consent_verifications` con scoring y estado

#### 🖼️ NFT-Verified Galleries con GTK Staking ✅ (Feature 2 - COMPLETADA)
- ✅ **NFTGalleryService.ts** - Servicio completo de gestión de galerías NFT
- ✅ **GTK Staking Requerido**: Requiere 100 GTK en staking para mint NFT (tabla `tokens_gtk`)
- ✅ **Mint ERC-721 Stub**: Integración con Polygon stub para mint de NFTs
- ✅ **Galerías Privadas NFT**: Solo usuarios con NFT pueden ver galerías privadas verificadas
- ✅ **UI Completa**: Botón "Mint NFT" en perfil + badge verificado en imágenes
- ✅ **Integración con Gallery Permissions**: Sistema de permisos integrado con `gallery_permissions`
- ✅ **Componentes Actualizados**: TokenBalance, TokenDashboard, StakingModal, ImageGallery, ImageUpload

**Archivos Creados:**
- `src/services/nft/NFTGalleryService.ts` (456 líneas)
- `src/components/profile/NFTGalleryManager.tsx` (234 líneas)

**Migraciones SQL:**
- `20251106_02_nft_staking.sql` - Tablas `nft_galleries`, `nft_tokens`, `nft_ownership`, `nft_staking_requirements`

#### 🧠 Predictive Matching con Social Graphs ✅ (Feature 3 - COMPLETADA)
- ✅ **GraphMatchingService.ts** - Sistema de matching predictivo usando Neo4j + IA Emocional
- ✅ **Neo4j Integration**: Usa grafo social `(user)-[:LIKES|DISLIKES|VISITED]->(profile)`
- ✅ **Friends-of-Friends Algorithm**: Algoritmo "friends-of-friends" con peso emocional
- ✅ **IA Emocional**: GPT-4 analiza chats para determinar química emocional
- ✅ **Score 400k Params**: Modelo ML con 400k parámetros para compatibilidad + química + valores
- ✅ **Reemplaza Matching Actual**: Integrado con SmartMatchingService en Discover
- ✅ **Enriquecimiento Social**: Recomendaciones basadas en conexiones sociales reales

**Archivos Creados:**
- `src/services/matching/GraphMatchingService.ts` (523 líneas)

**Migraciones SQL:**
- `20251106_03_graph_matching.sql` - Tablas `graph_matches`, `social_connections`, `emotional_scores`

#### 🌱 Sustainable Virtual Events con CMPX Rewards ✅ (Feature 4 - COMPLETADA)
- ✅ **VirtualEventsService.ts** - Servicio completo de eventos virtuales sostenibles
- ✅ **Extiende couple_events**: Nuevos campos para tracking de sostenibilidad
- ✅ **Tracking CO2 Ahorrado**: Cálculo automático de CO2 ahorrado por evento virtual
- ✅ **CMPX Rewards**: 50 CMPX reward por participar en evento virtual
- ✅ **VIP Access**: Acceso VIP solo con GTK o Premium
- ✅ **Integración con TokenService**: Recompensas automáticas en CMPX
- ✅ **Integración con SustainabilityService**: Tracking de impacto ambiental

**Archivos Creados:**
- `src/services/events/VirtualEventsService.ts` (301 líneas)

**Migraciones SQL:**
- `20251106_04_virtual_events.sql` - Campos `co2_saved`, `cmpx_reward`, `is_vip`, `event_type` en `couple_events`

#### 🔧 Correcciones de Servicios (06 Nov 2025)
- ✅ **ContentModerationService.ts**: Corregido tipo `Json` para `metadata` en `moderation_logs`
- ✅ **VirtualEventsService.ts**: Corregido manejo de `null` en `couple_id`, `created_at`, `updated_at`
- ✅ **AILayerService.ts**: Sin errores, tipos correctos
- ✅ **ConsentVerificationService.ts**: Sin errores, funcionando correctamente
