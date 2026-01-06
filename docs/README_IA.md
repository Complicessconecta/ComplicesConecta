# 🤖 README_IA v3.6.6

## Estrategia Avanzada con IA + Machine Learning + DevOps Manager Ultra + 100% Type-Safe Development + Ley Olimpia Compliance

> **Novedades v3.8.x (resumen IA + UX):**
>
> - Capa de IA y reglas Ley Olimpia aplicada al **control parental global** (un solo candado sincronizado, contador estricto y relock automático).
> - Ajustes de animaciones y partículas respetando `prefers-reduced-motion` y perfiles de rendimiento móvil (incluyendo Redmi Note 13 Pro+).
> - Onboarding simplificado a 3 pantallas, con foco en privacidad, consentimiento y uso responsable.
> - **Profile Coach IA**: Generador de bio de perfil basado en plantillas inteligentes (`AILayerService.generateProfileBio`) con fallback sin dependencias de LLM externos.
> - **Rompehielos Contextuales**: Sugerencias de conversación desde `SmartMatchingService.getConversationStarters` + `AdvancedFeaturesService.generateConversationStarters`, integradas en `SmartMatchingModal`.
> - **Moderación Preventiva de Imágenes**: Bloqueo client-side antes de subir a Supabase usando `contentModerationService.moderateImage` dentro de `ImageUpload`.

### 📅 Bitácora 26 Nov 2025

- `search_unified` (pg_trgm) + `GlobalSearchService` conectados al UI (VanishSearchInput) para búsqueda en tiempo real desde Supabase; migración `20251126_create_global_search.sql` disponible vía CLI/SQL.
- FloatingNav reorganizada: jerarquía pública (Inicio/Explorar/NFTs/Tokens + dropdown “Más”) con estilo glassmorphism y compatibilidad móvil, reforzando el funnel IA-native.
- ChatInfo y StoriesInfo ahora utilizan el tema oscuro + CTA a `/auth`, reflejando la narrativa AI/privacidad en todas las páginas públicas.

### 🎨 Modo Visual Glass + Fondos Dinámicos (v3.8.x)

- Modo global `glassMode` controlado vía store (`useBgMode`), aplicado a perfiles, feed, tokens y settings.
- Fondos dinámicos por tipo de perfil y género:
  - Single: `single-male.webp`, `single-female.webp` (default mujer), `default-neon.webp`, `ybg2.jpg`.
  - Couple: `couple-mf.webp`, `couple-mm-ff.webp`, `single-female.webp` como opción neutra.
- Opción **Random** restringida al conjunto válido por tipo/género para mantener coherencia visual.
- Wallet & NFTs integran cards glass + diagramas de seguridad (`/assets/security/*.webp`) para educar a usuarios nuevos en Web3 sin exponer llaves privadas.

1. **Crear ramas específicas**
   - `backup/safe-YYYYMMDD_HHMMSS` → Respaldo completo
   - `feature/*` → Nuevas funciones
   - `fix/*` → Correcciones
   - `recover/*` → Recuperación desde backups
   - **v3.4.0**: `feature/advanced-*` → Funcionalidades avanzadas (seguridad, moderación, parejas)
   - **v3.4.1**: `feature/monitoring-*` → Sistema de monitoreo y analytics

- **v3.5.0**: `feature/ai-native-*` → AI/ML layers (compatibility, chat summaries) ✅
- **v3.5.0**: `feature/scalability-*` → S2 Geosharding ✅
- **v3.5.0**: `feature/neo4j-*` → Neo4j Graph Database implementado y operativo ✅
- **v3.5.0**: `feature/refactoring-*` → Consolidación código + CSS ✅
- **v3.5.0**: `fix/react-chunks-*` → Corrección React en producción ✅
- **v3.5.0**: `feature/chat-privacy-*` → ChatRoom + MessageList + ChatPrivacyService ✅
- **v3.5.0**: `fix/wallet-errors-*` → Silenciamiento ultra agresivo de errores wallet ✅
- **v3.5.0**: `fix/ui-visibility-*` → Correcciones de textos invisibles y colores rosa ✅
- **v3.5.0**: `fix/navigation-conditional-*` → Navegación condicional HeaderNav/Navigation ✅
- **v3.6.3**: `fix/typescript-complete-*` → 100% TYPE-SAFE + Todos los errores TypeScript eliminados ✅
- **v3.6.3**: `fix/supabase-alignment-*` → Supabase Local/Remoto completamente alineado + Docker Desktop ✅
- **v3.6.3**: `fix/build-optimization-*` → Build warnings eliminados + Performance mejorada ✅
- **v3.5.0**: `feature/nft-integration-*` → Integración NFT en componentes de tokens e imágenes ✅
- **v3.5.0**: `feature/styles-audit-*` → Análisis completo de estilos y limpieza (06 Nov 2025) ✅
- **v3.5.0**: `feature/consent-verification-*` → IA Consent Verification en chats (Ley Olimpia MX) ✅
- **v3.5.0**: `feature/nft-galleries-*` → Galerías NFT-Verificadas con GTK Staking ✅
- **v3.5.0**: `feature/graph-matching-*` → Predictive Matching con Neo4j + IA Emocional ✅
- **v3.5.0**: `feature/virtual-events-*` → Sustainable Virtual Events con CMPX Rewards ✅

2. **SQL y Backups**
   - Todos los `.sql` y migraciones quedan excluidos en `.gitignore`
   - Backups locales guardados en `D:\complicesconecta_ultima_version_respaldo\supabase\migrations`
   - **v3.4.0**: Migraciones de seguridad y parejas incluidas
   - **v3.4.1**: 20 migraciones aplicadas (47 tablas sincronizadas 100%)
   - **NUEVO v3.5.0**: 40+ migraciones aplicadas (52+ tablas sincronizadas 100%)
   - **NUEVO v3.5.0**: Sistema de Clubs Verificados (5 tablas nuevas)
   - **NUEVO v3.5.0**: Sistema de Moderación 24/7 (3 tablas nuevas)
   - **NUEVO v3.5.0**: Sistema de Tokens CMPX Shop (3 tablas nuevas)
   - **NUEVO v3.5.0**: Sistema de Donativos/Inversión (4 tablas nuevas)
   - **NUEVO v3.5.0**: Sistema de Baneo Permanente (2 tablas nuevas)

- **NUEVO v3.5.0**: Componentes de chat implementados (ChatRoom, MessageList)
- **NUEVO v3.5.0**: Sistema de privacidad de chat completo (ChatPrivacyService)
- **NUEVO v3.5.0**: Integración NFT en componentes de tokens (TokenBalance, TokenDashboard, StakingModal)
- **NUEVO v3.5.0**: Integración NFT en componentes de imágenes (ImageGallery, ImageUpload)
- **NUEVO v3.5.0**: Ejemplos de galerías NFT en perfiles demo
- **NUEVO v3.5.0**: Análisis de Estilos Completo - 19 archivos CSS documentados, `App.css` vacío eliminado
- **NUEVO v3.5.0**: IA Consent Verification - Sistema real-time de verificación de consentimiento en chats (Ley Olimpia MX)
- **NUEVO v3.5.0**: NFT-Verified Galleries - Galerías NFT con GTK staking (100 GTK requeridos)
- **NUEVO v3.5.0**: Predictive Matching - Matching predictivo con Neo4j + IA Emocional (friends-of-friends)
- **NUEVO v3.5.0**: Sustainable Virtual Events - Eventos virtuales con tracking CO2 y recompensas CMPX

3. **Flujo de trabajo con IA/ML**
   - IA genera migraciones o código → Validar con `npm run type-check`
   - **NUEVO**: ML models en `/public/models/` → Lazy loading con TensorFlow.js
   - Ejecutar `DevOpsManagerUltra.ps1` opción 7 → Commit seguro automático
   - Probar en `staging` antes de promover a `main`
   - **v3.4.0**: Validación automática de funcionalidades avanzadas
   - **v3.4.1**: Validación con linting 0 errores antes de cada commit
   - **NUEVO v3.5.0**: Tests unitarios para servicios AI (AILayerService, ChatSummaryService)

> **📚 Para documentación completa del sistema, consulta [docs/DOCUMENTACION_COMPLETA_v3.5.0.md](./docs/DOCUMENTACION_COMPLETA_v3.5.0.md)**  
> **📚 Para diagramas de flujos, consulta [docs/DIAGRAMAS_FLUJOS_v3.5.0.md](./docs/DIAGRAMAS_FLUJOS_v3.5.0.md)**  
> **📚 Para documentación de implementación, consulta [DOCUMENTACION_IMPLEMENTACION_REPORTES_CONSOLIDADA_v3.5.0.md](./DOCUMENTACION_IMPLEMENTACION_REPORTES_CONSOLIDADA_v3.5.0.md)**

4. **Prevención de caos**
   - No se crean duplicados de carpetas sin confirmación
   - Docs y reportes deben consolidarse (ej: `AUDIT_REPORT.md` mensual, no múltiples sueltos)
   - **v3.4.0**: Monitoreo continuo de amenazas y moderación automática
   - **v3.4.1**: Documentación consolidada en 4 archivos maestros + eliminación de redundantes
   - **NUEVO v3.5.0**: Documentación consolidada en 1 archivo maestro (`DOCUMENTACION_MAESTRA_v3.5.0.md`)

- **v3.5.0**: React chunks corregidos (vendor bundle principal)
- **v3.5.0**: Tests y servicios corregidos (0 errores linting)
- **v3.5.0**: Wallet errors silenciados ultra agresivo (captura por mensaje, archivo, stack)
- **v3.5.0**: React polyfills mejorados (todos los hooks disponibles globalmente)
- **v3.5.0**: Correcciones UI (botón "Todas", textos invisibles en TokenChatBot)
- **v3.5.0**: Navegación condicional (HeaderNav/Navigation según autenticación)
- **v3.5.0**: Documentación interna de tokens solo para usuarios autenticados

5. **AI/ML Strategy v3.5.0** 🆕
   - **PyTorch/TensorFlow.js**: Modelos pre-entrenados para compatibility scoring
   - **HuggingFace API**: Chat summaries GRATIS con BART model
   - **Feature Flags**: `VITE_AI_NATIVE_ENABLED`, `VITE_AI_CHAT_SUMMARIES_ENABLED`
   - **Opciones Gratuitas**: HuggingFace (gratis), Fallback (sin ML), Ollama (local)
   - **Caching**: 1h para scores AI, 24h para resúmenes
   - **Rate Limiting**: 10 resúmenes/día por usuario
   - **Fallback Automático**: AI → Legacy scoring si modelo falla
   - **Docs**: `CHAT_SUMMARIES_FREE_OPTIONS_v3.5.0.md` para opciones gratuitas

6. **AI-Native Features v3.8.x** 🆕
   - **Profile Coach IA (Bio de Perfil)**
     - Servicio: `src/services/ai/AILayerService.ts`
     - Método: `generateProfileBio(interests: string[], gender: string, mood: string)`
     - Tipo salida: `ProfileBioSuggestion` con `bio`, `usedInterests`, `tone`, `source`, `confidence`.
     - UI: botón de "varita mágica" en `AdvancedProfileEditor.tsx` (perfiles single/couple) que sugiere una bio segura alineada con Ley Olimpia.

   - **Rompehielos Contextuales de Match**
     - Servicio: `SmartMatchingService.getConversationStarters(userId, matchProfileId)`
     - Lógica: delega en `AdvancedFeaturesService.generateConversationStarters` (intereses comunes, estilo de vida, comunicación de límites).
     - UI: sección "💬 Rompehielos sugeridos" dentro de `SmartMatchingModal.tsx` (tab de análisis), con botones que copian el texto sugerido al portapapeles.

   - **Moderación Preventiva de Imágenes**
     - Servicio: `contentModerationService.moderateImage(imageUrl, context)` con análisis determinista (`explicit_content`, `violence`, `fake_detection`, `quality_score`).
     - Integración UI: `ImageUpload.tsx` crea una URL temporal del `File` y llama a `moderateImage` antes de subir a Supabase.
     - Reglas: bloquea (`reject`/`ban`) imágenes con alto contenido explícito/violencia o baja calidad en contexto de perfil, aprobando por defecto solo si las señales son bajas.

7. **Scalability Strategy v3.5.0** 🆕
   - **Google S2 Geosharding**: Cell ID para queries geográficas 50-300x más rápidos
   - **Backfill Script**: `npm run backfill:s2` para usuarios existentes
   - **Neo4j Graph Database (Fase 2.2)**: ✅ IMPLEMENTADO Y OPERATIVO v3.5.0 - Graph database para conexiones sociales (200x más rápido que PostgreSQL)
   - **Neo4j Integration**: SmartMatchingService con enriquecimiento social y recomendaciones FOF
   - **Neo4j Scripts**: `npm run sync:neo4j`, `npm run verify:neo4j` y `npm run setup:neo4j-indexes` (NUEVO)
   - **Neo4j Correcciones**: Scripts corregidos (columnas, metadata aplanado, queries Cypher) - 05 Nov 2025
   - **Redis** (Pendiente Fase 2.3): Cache distribuido con TTL
   - **Docs**: `GUIA_COMPLETA_NEO4J_v3.5.0.md` para guía completa de Neo4j

8. **Monitoreo y Observabilidad v3.4.1**
   - **Datadog RUM**: Integrado en `src/main.tsx` para Real User Monitoring
   - **Datadog Agent**: Desplegado en Docker con APM, Security, Profiling, Logs
   - **Sentry**: Configurado para error tracking con source maps y release tracking
   - **New Relic**: APM integrado en `server.js` para monitoreo de aplicación
   - **Analytics Dashboard**: 4 pestañas funcionales en `/admin/analytics`
   - **Webhooks**: Sistema completo para Slack, Discord, Custom
   - **Validación**: Antes de cada deploy, verificar métricas en Datadog/New Relic

9. **Seguridad Mejorada v3.4.1**
   - **Variables de Entorno**: Credenciales migradas a `.env` (gitignored)
   - **Wallet Protection**: Errores completamente silenciados en `src/main.tsx`
   - **Privacidad Sentry**: Filtros automáticos de datos sensibles
   - **RLS Completo**: 65+ políticas activas en Supabase (v3.5.0)
   - **Validación**: Nunca commitear `.env`, usar `.env.example` como template

10. **Correcciones de Tipos, Migraciones y Análisis v3.6.3** 🆕
    - **Migraciones Creadas**: 4 migraciones nuevas (`user_device_tokens`, `user_tokens`, `chat_rooms` columnas, `profiles` full_name)
    - **Análisis de Tablas**: Script `alinear-y-verificar-todo.ps1` creado para verificar y alinear tablas (67 local, 79 usadas)
    - **Corrección de Tipos**: Errores corregidos en `AdminDashboard.tsx` y `simpleChatService.ts` (eliminado `as any`)
    - **Corrección de Migración**: Error en `chat_rooms` corregido (`room_type` → `type`)
    - **Script de Caracteres**: Script `fix-character-encoding.ps1` actualizado - Backups en directorio `bck` fuera del proyecto
    - **Script Maestro de BD**: Script `database-manager.ps1` creado - Unifica 5 scripts de gestión de BD
    - **Scripts Unificados**: `alinear-supabase.ps1`, `analizar-y-alinear-bd.ps1`, `aplicar-migraciones-remoto.ps1`, `sync-databases.ps1`, `verificar-alineacion-tablas.ps1` → `database-manager.ps1`
    - **Secciones Legales**: Secciones legales independientes agregadas a `Moderators.tsx`, `Investors.tsx`, `Clubs.tsx`, `NFTs.tsx`
    - **Nota Importante**: Las secciones legales en estas páginas son independientes del contenido de `docs/legal/`. La página `Legal.tsx` solo se actualiza con el contenido del directorio `docs/legal/`
    - **Funciones Globales Fixed**: `showEnvInfo()` y `showErrorReport()` ahora disponibles en producción (no solo en desarrollo)
    - **CircleCI Fixed**: Configurado con Node.js 20.19+ (requerido por Vite 7.2.2)
    - **Correcciones de Servicios**: `AdminProduction.tsx`, `postsService.ts`, `InvitationsService.ts`, `clearStorage.ts`, `StoryViewer.tsx` corregidos con `safeLocalStorage`
