# RELEASE NOTES v3.8.0

## 🚀 Highlights
- **Producción Enterprise Ready**: Refactorización completa con arquitectura modular.
- **Local AI Worker**: Implementación de IA local con `@mlc-ai/web-llm` para privacidad total.
- **Ley Olimpia Compliance**: Sistema de verificación de consentimiento explícito.
- **Neo4j Integration**: Base de datos de grafos para matching avanzado.

## 🛠 Technical Improvements
- **Absolute Imports**: Migración total a alias `@/` para mejor mantenibilidad.
- **Type Safety**: Cobertura de tipos TypeScript al 100% (Strict Mode).
- **Performance**: Optimización de carga con Lazy Loading y Code Splitting.

## 🐛 Bug Fixes & Vercel Deployment Resolution (Jan 2026)
- **Dependency Management**:
  - Removed unused/conflicting dependencies (`next`, `express`, `serve-static`, `install`, `capacitor`).
  - Switched exclusively to `npm` (removed `pnpm-lock.yaml`, `pnpm-workspace.yaml`).
  - Added `engines` enforcement (`node >=20.0.0`).
- **Build Pipeline**:
  - Normalized `build:check` script to ensure consistent exit codes (`node scripts/type-check.js && vite build`).
  - Configured `.prettierignore` to exclude build artifacts and workflows.
- **Code Quality & Linting**:
  - Resolved 13 linting errors in Admin Panels, Token System, and Feedback forms.
  - Fixed `EmotionalAIService` optional chaining and singleton pattern usage.
  - Fixed `ThemeInfoModal` broken image path (`/compliceslogo.png` -> `/logo.jpg`).
  - Implemented strict type guards in `OnboardingFlow` and `UserFeedbackForm`.
  - **Critical Logic Fixes (Latest)**:
    - `TokenAnalyticsService`: Fixed `Promise.allSettled` handling to correctly map metrics and added error logging.
    - `ProfileSingle`: Fixed `_isGalleryUnlocked` typo causing build failure and removed redundant wrapper functions.
    - `PushNotificationSettings`: Added robustness with try/catch blocks for test notifications.
    - `HistoricalMetricsService`: Enforced strict types replacing `any[]` usage.
    - `StoryReportDialog`: Added audit logging for user block/hide actions.
    - `MatchService`: Fixed UUID validation in `getMatchedUserIds` to prevent infinite loops with demo users.
- **Infrastructure**:
  - Verified `package.json` "type": "module" for correct ES Module handling.
  - Ensured `vite build` compatibility for Vercel deployment.

## 🎨 Visual & UX Improvements (Jan 2026)
- **Background System**:
  - UnifiedBackground consolidado para todas las páginas públicas y perfiles demo
  - Partículas neón visibles en todas las rutas principales
  - Fondos sólidos reemplazados por transparencia glassmorphism
- **Authentication Page**:
  - Card más transparente (`bg-white/5`) para mejor visibilidad del fondo
  - Botones con gradientes y efectos hover mejorados
  - Estilos visuales mejorados en tabs y títulos
- **Discover Page**:
  - Fondo transparente para mostrar partículas neón
  - DiscoverProfileCard con glassmorphism más transparente
- **Profile Cards**:
  - Botón Me gusta con animación spring y cambio a rojo
  - Botón Chat con detección de perfiles privados
  - Botón Visualizar para perfiles públicos/privados

## 🖼 Gallery & NFT System Improvements (Jan 2026)
- **Private Gallery**:
  - Sistema de blur/candado con ParentalControl (PIN 1234)
  - Auto-bloqueo por tiempo (Strict: 60s, Normal: 180s, Soft: 360s)
  - Carrusel con navegación y expansión de imágenes
  - Marca de agua mejorada en imágenes privadas
- **Public Gallery**:
  - Corregidas imágenes repetidas en galería pública
  - 3 imágenes diferentes con gradientes únicos
- **NFT System (Demo)**:
  - Sistema mock de minteo hasta 4 NFTs
  - Imágenes aleatorias de `/assets/nfts/`
  - Rarity aleatoria (Common, Rare, Epic, Legendary)
  - Valor dinámico (100-5000 CMPX)
  - Wallet demo completa con tokens y NFTs
  - TokenDashboard con datos mock para modo demo

## 📦 New Features
### 1. Sistema de Clubs (Geo-fenced)
- Check-in validado por GPS + QR dinámico.
- Roles: Owner, Admin, VIP, Member.
- Eventos exclusivos y zonas privadas.

### 2. Token System (CMPX / GTK)
- **CMPX**: Governance Token (Polygon).
- **GTK**: Utility Token (In-app currency).
- Staking pools con APY dinámico.

### 3. Moderación Híbrida
- Pre-clasificación por IA (Local + Cloud).
- Panel de administración para revisión humana.
- Sistema de reportes con evidencia encriptada.

### 4. Investment System (SAFTE)
- Dashboard para inversores.
- Distribución automática de dividendos.
- KYC/AML integrado con Stripe Identity.

## 🔒 Security
- **Biometric Auth**: Integración nativa con FaceID/TouchID.
- **End-to-End Encryption**: Chat y fotos privadas cifradas.
- **Anti-Scraping**: Rate limiting y validación de sesiones.

## 📝 Update Guide
1. Ejecutar `npm install` (NO usar pnpm).
2. Verificar variables de entorno (`.env`).
3. Ejecutar `npm run build:check` para validar integridad.
4. Desplegar con `vercel --prod`.
