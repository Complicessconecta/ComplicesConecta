# 📝 Changelog - ComplicesConecta

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v3.8.3] - 2026-01-03
### 🧩 ProfileSingle + Blockchain (Demo/Real)
- Sección "Blockchain & NFTs" visible para perfiles Demo además de perfil propio.
- Carga de datos blockchain en perfiles autenticados forzando `user_id`/`id` para Wallet y NFTs.
- Handlers de reclamo de tokens (testnet/diario) con `uid` de respaldo: `user.id || profile.user_id || profile.id`.
- Estado inicial Demo para `testnetInfo` con `canClaim` y límites diarios para mostrar CTAs.
- Ajuste en botón de estado NFT: muestra "Gestionar mis Tokens" en demo o perfil propio.
- Documentación actualizada en `RELEASE_NOTES_v3.8.0.md` (Hotfix 03 Ene 2026).

### 🎨 UI Background & Home
- Refactor de `UnifiedBackground.tsx` para eliminar estilos inline: fondo con `<img>` + utilidades Tailwind; partículas CSS con clases predefinidas; contenido clickeable en `z-10`.
- Home `/`: imagen de fondo aleatoria forzada y partículas neón activas al iniciar (sin bloquear clics), respetando rendimiento en otras rutas.

## [v3.8.2] - 2026-01-02
### 🚀 Hotfix + Monetización Chat
- Gating de Chat por Match (Discover → Chat): botón deshabilitado si no existe match mutuo y validación previa a la navegación.
- Monetización de Galería Privada en Chat: paywall con CMPX integrado usando TokenService y registro de comisión (90% creador / 10% plataforma).
- Calidad verificada en master: type-check, lint y build en verde.
- Backup creado antes del merge: rama `back-master-2026-01-02-21-46` y tag `backup-master-2026-01-02-21-46`.

## [v3.8.1] - 2025-12-26
### 🐛 Correcciones y Mantenimiento
- Corrección masiva de codificación UTF-8 (Mojibake) en componentes críticos (`ProfileCouple`, `TokensInfo`, `LazyComponentLoader`).
- Resolución de 137 errores de linting (espacios irregulares, imports no resueltos, variables no usadas).
- Optimización de `ProfileCouple.tsx` (eliminación de código muerto, tipado estricto `AgreementRow`).
- Fix en `src/components/android/index.ts` para exportaciones nombradas consistentes.
- Eliminación de archivos de backup obsoletos (`bcktraesrc`) de la configuración de linting.

## [v3.8.0] - 2025-12-20


### 🛡️ Auditoría y Estabilización
- **Resolución de Conflictos**: Migración de archivos conflictivos y duplicados a `docs/audit/archivos_conflictivos`.
- **Corrección de Imports**: Reparación de referencias rotas a `ProfileCard` (usando `MainProfileCard`) en `ThemeInfoModal` y `ProfileThemeShowcase`.
- **Unificación de Componentes**: Consolidación de `ThemeInfoModal` eliminando la versión redundante en `src/components/auth`.
- **Type Safety**: Regeneración de `src/types/supabase.ts` para restaurar definiciones de tipos de base de datos críticas.
- **Limpieza de Código**: Resolución de warnings de linter en `ProfileSingle` y `PermissionManager`.
- **Mejora de Estructura**: Creación de `src/components/profiles/shared/index.ts` para exportaciones más limpias.

## [v3.0.0] - 2025-09-21

### 🎨 Sistema de Temas Personalizable
- **5 Temas Únicos**: Light, Dark, Elegant, Modern, Vibrant con paletas específicas
- **Selección en Registro**: Modal interactivo `ThemeModal.tsx` durante creación de cuenta
- **Persistencia Supabase**: Nuevas columnas `preferred_theme`, `navbar_style`, `theme_updated_at` en tabla `profiles`
- **Hook Unificado**: `useThemeConfig()` detecta automáticamente modo demo/producción
- **Aplicación Automática**: Temas basados en género y tipo de perfil (single/couple)
- **Estilos Dinámicos**: Navbar adaptable (transparente/sólido) según tema seleccionado
- **Compatibilidad Total**: Funciona igual en modo demo (localStorage) y producción (Supabase)
- **Componentes UI**: `ThemeSelector.tsx` con animaciones Framer Motion y previews visuales
- **Migración SQL**: `20250921_add_theme_preferences.sql` con triggers automáticos e índices optimizados
- **Integración Completa**: Auth.tsx, EditProfile, Header con aplicación dinámica de temas

### 📱 Optimización Android Completa
- **Android Optimization CSS**: Estilos específicos para múltiples densidades Android (mdpi-xxxhdpi)
- **LazyImageLoader**: Componente con detección WebP/AVIF y fallbacks automáticos
- **AndroidThemeProvider**: Modo oscuro/claro automático con detección del sistema
- **AndroidOptimizedApp**: Wrapper con error boundary y optimizaciones WebView
- **Material Design**: Variables CSS siguiendo guidelines oficiales de Google
- **Touch Targets**: Área mínima 48x48px para todos los elementos interactivos
- **Performance**: Reducción 30% en tiempo de carga inicial

### 🔧 Correcciones TypeScript
- **AndroidOptimizedApp.tsx**: Eliminados imports inexistentes, corregido webkitOverflowScrolling
- **useProfileCache.ts**: Logs comentados para tests más limpios
- **useSupabaseTheme.ts**: Implementado hook para persistencia real con subscripciones en tiempo real
- **useProfileTheme.ts**: Hooks unificados para demo y producción con fallbacks seguros
- **0 Errores TypeScript**: Proyecto completamente limpio y production-ready

### 📊 Testing y Calidad
- **Test Suite**: 140/147 tests pasando (95.2% success rate)
- **Build Time**: Optimizado de 14.29s a 8.20s (-42%)
- **Bundle Size**: Mantenido en 321KB optimizado
- **Documentación**: README.md, RELEASE_NOTES.md y project-structure.md actualizados

## [v2.1.8] - 2025-01-14

### ✨ Nuevas Funcionalidades

#### 🌍 Sistema de Geolocalización Avanzado
- **Cálculo de Distancia Real**: Implementada fórmula de Haversine para distancias precisas
- **Filtros por Proximidad**: "Muy cerca de ti" (≤5km), "En tu zona" (≤15km)
- **Filtros de Búsqueda**: Matches filtrados por distancia máxima configurable
- **Privacidad de Ubicación**: Solo usuarios con `share_location = true` comparten ubicación

#### 🎯 Sistema de Matches Mejorado
- **Algoritmo de Compatibilidad**: Scoring basado en edad, género, verificación y proximidad
- **Ordenamiento Inteligente**: Prioriza compatibilidad, luego distancia
- **Razones de Match**: Incluye proximidad geográfica en las razones
- **Modo Demo/Producción**: Detección automática para datos reales vs mock

#### 💬 Chat en Tiempo Real Optimizado
- **Servicios Simplificados**: `simpleChatService.ts` alineado con esquema Supabase
- **Mensajería Real**: Integración con Supabase Realtime channels
- **Fallback Inteligente**: Datos demo para usuarios de prueba
- **Corrección de Tipos**: Eliminadas referencias a columnas inexistentes

### 🔧 Mejoras Técnicas

#### 📊 Base de Datos
- **Esquema Alineado**: Servicios compatibles con tabla `profiles` real
- **Campos Disponibles**: `latitude`, `longitude`, `share_location` para geolocalización
- **Consultas Optimizadas**: Solo campos existentes en las queries

#### 🛠️ Servicios
- **`simpleMatchService.ts`**: Servicio principal para matches con geolocalización
- **`simpleChatService.ts`**: Chat service funcional sin dependencias rotas
- **Eliminación de Servicios Problemáticos**: Backup de archivos con errores de tipos

#### 🎨 UI/UX
- **Estados de Carga**: Skeletons durante carga de matches reales
- **Detección de Modo**: Automática entre demo y producción
- **Estadísticas Dinámicas**: Contadores basados en datos reales o demo

### 🐛 Correcciones

#### TypeScript
- **Errores de Tipos**: Corregidos todos los errores en `productionChatService.ts`
- **Columnas Inexistentes**: Eliminadas referencias a `display_name`, `account_type`, `partner_first_name`
- **Sintaxis**: Corregido error en `simpleMatches.ts` línea 139

#### Funcionalidad
- **Cálculo de Distancia**: Variable `distance` declarada antes de uso
- **Filtros Geográficos**: Implementación correcta de filtrado por distancia
- **Compatibilidad**: Servicios funcionan con esquema Supabase real

### 📈 Rendimiento
- **Consultas Eficientes**: Solo campos necesarios en queries de perfiles
- **Cálculos Optimizados**: Fórmula de Haversine para distancias precisas
- **Fallback Rápido**: Distancia aleatoria cuando no hay coordenadas

### 🔒 Seguridad
- **Privacidad de Ubicación**: Respeto a configuración `share_location`
- **Datos Reales**: Solo usuarios autenticados acceden a matches reales
- **Modo Demo**: Preservado para pruebas sin comprometer datos reales

---

## Versiones Anteriores

### [v2.1.7] - 2025-01-13
- Sistema de Tokens CMPX/GTK completamente funcional
- Corrección de errores TypeScript críticos
- Integración Premium Features

### [v2.1.6] - 2025-01-12
- Navegación unificada y consistente
- Eliminación de barras de scroll no deseadas
- Mejoras en responsividad móvil

### [v2.1.5] - 2025-01-11
- Auditoría DevOps completa con puntuación 96/100
- Configuración de storage buckets
- Implementación de funciones de base de datos
