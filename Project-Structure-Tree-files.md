## Barrido completo del directorio `src`

```
src/                          # Directorio raíz del frontend
├── App.tsx                   # Componente raíz de la SPA
├── main.tsx                  # Punto de entrada Vite/React
├── index.css                 # Estilos globales principales
├── vite-env.d.ts             # Tipos de entorno Vite
├── debug.tsx                 # Pantalla de debug
├── audit-report.md           # Reporte de auditoría
├── ai/                       # Servicios de IA (WebLLM, TensorFlow)
│   ├── useLocalAI.ts        # Hook para IA local
│   └── AIWorker.ts          # Web Worker para IA
├── app/                      # Nuevo router basado en app/ (layouts/páginas)
│   └── (admin)/             # Rutas de administración
├── assets/                   # Recursos estáticos (imágenes, SVG, etc.)
│   └── svg/                 # Archivos SVG del proyecto
│       ├── wallet-interna.webp
│       ├── wallet-interna.svg
│       ├── wallet-interna-alt.svg
│       ├── tokens.svg
│       ├── swinger-icon.svg
│       ├── original3.svg
│       ├── original2.svg
│       ├── mermaid-diagram.svg
│       ├── main-icon.svg
│       ├── logo.svg
│       ├── icon-network.svg
│       ├── icon-handshake.svg
│       ├── icon-chat.svg
│       ├── icon-cc-connect.svg
│       ├── grafico-tokens-app.svg
│       ├── grafico-flux-economia.svg
│       ├── flujo-trabajo-usuario-final.webp
│       └── flujo-trabajo-doble-economia.svg
├── components/               # Componentes reutilizables (UI + features)
│   ├── AppInitializer.tsx    # Inicializador de la aplicación
│   ├── AppLayout.tsx        # Layout principal de la app
│   ├── AppSidebar.tsx       # Sidebar de la app
│   ├── BetaBanner.tsx       # Banner de beta
│   ├── ChatRouteGate.tsx    # Gate de rutas de chat
│   ├── DecorativeHearts.tsx # Corazones decorativos
│   ├── DismissibleBanner.tsx # Banner descartable
│   ├── ErrorBoundary.tsx    # Límite de errores
│   ├── Footer.tsx           # Footer de la app
│   ├── HCaptchaWidget.tsx   # Widget de hCaptcha
│   ├── HeaderNav.tsx        # Navegación de header
│   ├── HeroSection.tsx      # Sección hero
│   ├── LoadingScreen.tsx    # Pantalla de carga
│   ├── LoginLoadingScreen.tsx # Pantalla de carga de login
│   ├── ModeIndicator.tsx    # Indicador de modo
│   ├── Navigation.tsx       # Navegación principal
│   ├── PageWrapper.tsx      # Wrapper de páginas
│   ├── ProtectedRoute.tsx   # Ruta protegida
│   ├── SendRequestDialog.tsx # Diálogo de envío de solicitud
│   ├── ThemeModal.tsx       # Modal de tema
│   ├── TokensSubnav.tsx     # Subnavegación de tokens
│   ├── access/             # Componentes de accesibilidad
│   ├── admin/               # Componentes de administración
│   │   ├── AdminNav.tsx
│   ├── ai/                  # Componentes de IA
│   ├── analytics/           # Componentes de analíticas
│   ├── android/             # Componentes optimizados para Android
│   ├── animations/          # Animaciones
│   ├── auth/                # Componentes de autenticación
│   ├── blockchain/          # Componentes de blockchain
│   ├── cache/               # Componentes de caché
│   ├── cards/               # Tarjetas UI
│   ├── chat/                # Componentes de chat
│   ├── clubs/               # Componentes de clubs
│   ├── dashboard/           # Componentes de dashboard
│   ├── debug/               # Componentes de debug
│   ├── dialogs/             # Diálogos y modales
│   ├── discover/            # Componentes de discover
│   ├── feedback/            # Componentes de feedback
│   ├── forms/               # Formularios
│   ├── gallery/             # Galerías
│   ├── gamification/        # Gamificación
│   ├── home/                # Componentes de home
│   ├── images/              # Componentes de imágenes
│   ├── invitations/         # Invitaciones
│   ├── layout/              # Layouts
│   ├── lazy/                # Lazy loading
│   ├── matches/             # Componentes de matches
│   ├── mobile/              # Componentes móviles
│   ├── modals/              # Modales
│   ├── navigation/          # Navegación
│   ├── notifications/       # Notificaciones
│   ├── onboarding/          # Onboarding
│   ├── performance/         # Performance
│   ├── premium/            # Componentes premium
│   ├── profiles/            # Componentes de perfiles
│   ├── routing/             # Routing
│   ├── search/              # Búsqueda
│   ├── security/            # Seguridad

│   ├── settings/            # Configuraciones
│   ├── sharing/             # Compartir
│   ├── sidebar/             # Sidebar
│   ├── social/              # Social
│   ├── stories/             # Stories
│   ├── swipe/               # Swipe
│   ├── templates/           # Templates
│   ├── tokens/              # Componentes de tokens
│   ├── ui/                  # Componentes UI base
│   ├── video/               # Video
│   └── wallet/              # Wallet
├── config/                   # Configuraciones (Sentry, Datadog, etc.)
├── constants/                # Constantes del proyecto
│   └── discover/            # Constantes para Discover
│       ├── ubicaciones.ts
│       ├── nombres.ts
│       ├── generalInterests.ts
│       ├── explicitInterests.ts
│       └── bios.ts
├── context/                  # React Context providers compartidos
├── contexts/                 # Contexts adicionales
├── data/                     # Datos mock y fixtures
│   └── mockData.ts
├── demo/                     # Flujos y pantallas de demo
├── entities/                 # Entidades y tipos de dominio
├── examples/                 # Ejemplos aislados / sandboxes
├── features/                 # Lógica reusable por feature (auth, chat, profile, etc.)
├── fixtures/                 # Fixtures para tests
│   └── coupleProfiles.ts
├── hooks/                    # Custom React hooks compartidos
│   ├── ai/                  # Hooks de IA
│   │   └── useModelLoader.ts
│   ├── index.ts
│   ├── use-mobile.tsx
│   ├── useAdvancedAnalytics.ts
│   ├── useAdvancedCache.ts
│   ├── useAdvancedModeration.ts
│   ├── useAppPermissions.ts
│   ├── useBackgroundPreferences.ts
│   ├── useBgMode.ts
│   ├── useConsentVerification.ts
│   ├── useDeviceCapability.ts
│   ├── useFeatures.ts
│   ├── useGeolocation.ts
│   ├── useInterests.ts
│   ├── useIsomorphicLayoutEffect.ts
│   ├── useModeratorTimer.ts
│   ├── useNotifications.ts
│   ├── useOnlineStatus.ts
│   ├── usePerformanceOptimization.ts
│   ├── usePersistedState.ts
│   ├── useProfileStats.ts
│   ├── usePushNotifications.ts
│   ├── useRandomBackground.ts
│   ├── useRealtimeNotifications.ts
│   ├── useScreenshotProtection.ts
│   ├── useScrollHide.ts
│   ├── useSplashScreen.ts
│   ├── useSupabaseTheme.ts
│   ├── useTheme.ts
│   ├── useToast.ts
│   ├── useTokens.ts
│   └── useWorldID.ts
├── lib/                      # Librerías y utilidades de infraestructura
│   ├── ai/                  # IA libraries
│   ├── advancedFeatures.ts
│   ├── analytics-metrics.ts
│   ├── app-config.ts
│   ├── asset-loader.ts
│   ├── capture-console-errors.ts
│   ├── data.ts
│   ├── demo-uuid.ts
│   ├── distance-utils.ts
│   ├── email-service.ts
│   ├── env-utils.ts
│   ├── errorHandling.ts
│   ├── features.ts
│   ├── image-optimization.ts
│   ├── imageService.ts
│   ├── images.ts
│   ├── index.ts
│   ├── infoCards.ts
│   ├── intelligentAutomation.ts
│   ├── invitations.ts
│   ├── lifestyle-interests.ts
│   ├── logger.ts
│   ├── matching.ts
│   ├── media.ts
│   ├── medianames.ts
│   ├── mobile.ts
│   ├── moderation/           # Moderación
│   ├── multimediaSecurity.ts
│   ├── notifications.ts
│   ├── redis-cache.ts
│   ├── report-export.ts
│   ├── requests.ts
│   ├── roles.ts
│   ├── safe-storage.ts
│   ├── secureMediaService.ts
│   ├── security/             # Seguridad
│   ├── sentry.ts
│   ├── storage-manager.ts
│   ├── storage.ts
│   ├── supabase-logger.ts
│   ├── supabase.ts
│   ├── tiktok-share.ts
│   ├── tokenPremium.ts
│   ├── userAgent.ts
│   ├── validation.ts
│   ├── validations/
│   ├── visual-validation.ts
│   ├── wallet-silencer.ts
│   └── zod-schemas.ts
├── types/                    # Tipos globales y contratos TS
│   ├── analytics.types.ts
│   ├── blockchain.ts
│   ├── chat-limits.ts
│   ├── chat-summary.types.ts
│   ├── content-moderation.types.ts
│   ├── discover.types.ts
│   ├── global.d.ts
│   ├── google.types.ts
│   ├── improved-types.ts
│   ├── index.ts
│   ├── react.types.ts
│   ├── security.types.ts
│   ├── storybook.d.ts
│   ├── supabase-custom.ts
│   ├── supabase-extended.ts
│   ├── supabase-extensions.ts
│   ├── supabase-final.ts
│   ├── supabase-fixes.ts
│   ├── supabase-generated.ts
│   ├── supabase-helpers.ts
│   ├── supabase-local.ts
│   ├── supabase-remote.ts
│   ├── supabase-updated.ts
│   ├── supabase.ts
│   ├── uuid.d.ts
│   └── wallet.types.ts
├── integrations/             # Integraciones externas (Supabase, APIs, etc.)
│   └── wallet/              # Integración con wallet
│       └── WalletConsentInjection.tsx
├── layouts/                  # Layouts de la aplicación
│   ├── ResponsiveLayout.tsx
│   ├── ProfileLayout.tsx
│   ├── MainLayout.tsx
│   ├── EmptyLayout.tsx
│   ├── AuthLayout.tsx
│   ├── AppLayout.tsx
│   ├── AdminLayout.tsx
│   └── index.ts
├── lib/                      # Librerías y utilidades de infraestructura
├── middleware/               # Middleware de rutas
├── pages/                    # Páginas clásicas (routing legacy)
│   ├── AIControlCenter.tsx
│   ├── About.tsx
│   ├── Auth.tsx
│   ├── Blog.tsx
│   ├── Careers.tsx
│   ├── Chat.tsx
│   ├── ChatAuthenticated.tsx
│   ├── ChatInfo.tsx
│   ├── Clubs.tsx
│   ├── ClubsComingSoon.tsx
│   ├── Construction.tsx
│   ├── Dashboard.tsx
│   ├── Demo.tsx
│   ├── Discover.tsx
│   ├── Donations.tsx
│   ├── Events.tsx
│   ├── FAQ.tsx
│   ├── Feed.tsx
│   ├── Guidelines.tsx
│   ├── Index.tsx
│   ├── Info.tsx
│   ├── Invest.tsx
│   ├── Investors.tsx
│   ├── Legal.tsx
│   ├── LeyOlimpia.tsx
│   ├── Marketplace.tsx
│   ├── Matches.tsx
│   ├── ModeratorDashboard.tsx
│   ├── ModeratorRequest.tsx
│   ├── Moderators.tsx
│   ├── NFTs.tsx
│   ├── News.tsx
│   ├── NotFound.tsx
│   ├── Notifications.tsx
│   ├── Premium.tsx
│   ├── Privacy.tsx
│   ├── ProjectInfo.tsx
│   ├── Requests.tsx
│   ├── Security.tsx
│   ├── Shop.tsx
│   ├── Stories.tsx
│   ├── StoriesInfo.tsx
│   ├── Support.tsx
│   ├── SwingerDashboard.tsx
│   ├── TemplateDemo.tsx
│   ├── Terms.tsx
│   ├── Tokens.tsx
│   ├── TokensInfo.tsx
│   ├── TokensLegal.tsx
│   ├── TokensPrivacy.tsx
│   ├── TokensTerms.tsx
│   ├── VideoChat.tsx
│   ├── VIPEvents.tsx
│   ├── VirtualGifts.tsx
│   ├── admin/                # Páginas de administración
│   │   ├── Admin.tsx
│   │   ├── AdminAnalytics.tsx
│   │   ├── AdminCareerApplications.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminModerators.tsx
│   │   ├── AdminPartners.tsx
│   │   ├── AdminProduction.tsx
│   │   ├── AdminSelectDashboard.tsx
│   │   ├── Users.tsx
│   │   └── useAdminDashboard.ts
│   ├── moderators/           # Páginas de moderadores
│   │   └── ModeratorDashboard.tsx
│   └── profiles/             # Páginas de perfiles
│       ├── couple/          # Páginas de parejas
│       │   ├── EditProfileCouple.tsx
│       │   └── ProfileCouple.tsx
│       ├── shared/          # Páginas compartidas
│       │   ├── ProfileDetail.tsx
│       │   └── Profiles.tsx
│       └── single/          # Páginas individuales
│           ├── EditProfileSingle.tsx
│           └── ProfileSingle.tsx
├── services/                  # Servicios de negocio
│   ├── index.ts
│   ├── moderatorTimer.ts
│   ├── ai/
│   │   ├── AIIntegrationService.ts
│   │   └── ConsentVerificationService.ts
│   ├── analytics/
│   │   ├── AdvancedAnalyticsService.ts
│   │   ├── AnalyticsService.ts
│   │   ├── HistoricalMetricsService.ts
│   │   ├── ModerationMetricsService.ts
│   │   ├── ProfileStatsService.ts
│   │   ├── TokenAnalyticsService.ts
│   │   ├── ai/
│   │   └── index.ts
│   ├── auth/
│   │   ├── ContentProtectionService.ts
│   │   ├── MFAService.ts
│   │   ├── SecurityAuditService.ts
│   │   ├── SecurityService.ts
│   │   ├── UserIdentificationService.ts
│   │   ├── UserVerificationService.ts
│   │   ├── digitalFingerprint.ts
│   │   ├── index.ts
│   │   ├── mfa/
│   │   ├── permanentBan.ts
│   │   └── security/
│   ├── blockchain/
│   │   ├── ContractService.ts
│   │   ├── Web3Service.ts
│   │   └── Web3WalletService.ts
│   ├── chat/
│   │   ├── ChatPrivacyService.ts
│   │   └── ChatRoomService.ts
│   ├── core/
│   │   ├── APMService.ts
│   │   ├── AdvancedCacheService.ts
│   │   ├── CDNService.ts
│   │   ├── DataPrivacyService.ts
│   │   ├── DesktopNotificationService.ts
│   │   ├── ErrorAlertService.ts
│   │   ├── GoogleServices.ts
│   │   ├── LoadBalancingService.ts
│   │   ├── NotificationService.ts
│   │   ├── PerformanceMonitoringService.ts
│   │   ├── PushNotificationService.ts
│   │   ├── QueryOptimizationService.ts
│   │   ├── RateLimitService.ts
│   │   ├── SecureStorageService.ts
│   │   ├── TestingService.ts
│   │   ├── WebhookService.ts
│   │   ├── geo/
│   │   ├── graph/
│   │   └── legal/
│   ├── features/
│   │   ├── BannerManagementService.ts
│   │   ├── GlobalSearchService.ts
│   │   ├── SustainableEventsService.ts
│   │   └── events/
│   ├── geo/
│   │   └── S2Service.ts
│   ├── legal/
│   │   ├── ConsentService.ts
│   │   └── CoupleDissolutionService.ts
│   ├── neo4j/
│   │   └── Neo4jService.ts
│   ├── notifications/
│   │   └── OneSignalService.ts
│   ├── payments/
│   │   ├── NFTGalleryService.ts
│   │   ├── NFTService.ts
│   │   ├── ReferralTokensService.ts
│   │   ├── TokenService.ts
│   │   ├── WalletProtectionService.ts
│   │   ├── WalletService.ts
│   │   ├── galleryCommission.ts
│   │   └── nft/
│   ├── rag/
│   │   └── RAGService.ts
│   ├── social/
│   │   ├── chat/
│   │   │   └── ChatPrivacyService.ts
│   │   ├── couple/
│   │   │   ├── AdvancedCoupleService.ts
│   │   │   └── CoupleProfilesService.ts
│   │   ├── notifications/
│   │   │   └── OneSignalService.ts
│   │   ├── ContentModerationService.ts
│   │   ├── InvitationsService.ts
│   │   ├── MatchService.ts
│   │   ├── PredictiveMatchingService.ts
│   │   ├── ReportManagementService.ts
│   │   ├── ReportService.ts
│   │   ├── SmartMatchingService.ts
│   │   ├── VideoChatService.ts
│   │   ├── chat/
│   │   ├── moderatorTimer.ts
│   │   ├── notifications/
│   │   ├── postsService.ts
│   │   └── reportAIClassification.ts
│   ├── tokens/
│   │   └── TokenService.ts
│   └── verification/
│       ├── FaceRecognitionService.ts
│       ├── OCRService.ts
│       └── SMSService.ts
├── components/android/       # Componentes optimizados para Android
│   ├── AndroidOptimizedApp.tsx
│   ├── AndroidThemeProvider.tsx
│   ├── LazyImageLoader.tsx
│   └── index.ts
├── components/animations/    # Animaciones
│   ├── AnimatedCard.tsx
│   ├── AnimatedLoader.tsx
│   ├── AnimatedTabs.tsx
│   ├── AnimationProvider.tsx
│   ├── AnimationSettings.tsx
│   ├── BackgroundControls.tsx
│   ├── EnhancedComponents.tsx
│   ├── GlobalAnimations.tsx
│   ├── InteractiveAnimations.tsx
│   ├── NotificationSystem.tsx
│   ├── PageTransitions.tsx
│   └── index.ts
├── components/accessibility/ # Accesibilidad
│   ├── AccessibilityAudit.tsx
│   ├── AccessibilityProvider.tsx
│   ├── ContrastFixer.tsx
│   └── index.ts
├── components/ai/            # Componentes de IA
│   ├── LegalChatBox.tsx
│   └── SmartMatchingModal.tsx
├── components/dashboard/     # Dashboard
│   └── AnalyticsDashboard.tsx
├── components/debug/         # Debug
│   ├── DebugEnv.tsx
│   └── EnvChecker.tsx
├── components/dialogs/       # Diálogos
│   ├── ReportDialog.tsx
│   ├── SendRequestDialog.tsx
│   └── index.ts
├── components/discover/     # Componentes de discover
│   ├── AdvancedFilters.tsx
│   ├── DiscoverSidebar.tsx
│   ├── LocationSelector.tsx
│   ├── MatchScore.tsx
│   ├── PreferenceSearch.tsx
│   └── index.ts
├── components/search/       # Búsqueda
│   ├── AdvancedSearch.tsx
│   └── index.ts
├── components/routing/      # Routing
│   └── ChatRouteGate.tsx
├── components/cache/        # Caché
│   ├── CacheDashboard.tsx
│   └── index.ts
├── components/cards/        # Tarjetas
│   └── RequestCard.tsx
├── components/gamification/  # Gamificación
│   ├── Gamification.tsx
│   ├── RewardsSystem.tsx
│   └── index.ts
│   ├── StakingWidget.tsx
│   └── index.ts
│   ├── ReportDialog.tsx
│   └── SwipeCard.tsx
├── components/templates/     # Templates
│   ├── ButtonEffectsTemplate.tsx
│   ├── ChatTemplate.tsx
│   ├── GlassAppShell.tsx
│   └── index.ts
├── components/video/         # Video
│   ├── VideoCallWindow.tsx
│   └── index.ts
│   └── TikTokShareButton.tsx
├── components/sidebar/       # Sidebar
│   ├── NavGroup.tsx
│   ├── QuickActions.tsx
│   └── index.ts
├── components/social/        # Social
│   └── GroupCard.tsx
│   └── DemoWallet.tsx
├── components/wallet/       # Componentes de wallet
│   └── DemoWallet.tsx
├── components/performance/  # Componentes de performance
│   ├── CodeSplittingManager.tsx
│   ├── ImageOptimizer.tsx
│   ├── LazyComponentLoader.tsx
│   └── index.ts
├── components/notifications/  # Notificaciones
│   ├── NotificationBell.tsx
│   ├── NotificationCenter.tsx
│   ├── NotificationSystem.tsx
│   ├── PushNotificationSettings.tsx
│   └── index.ts
├── components/onboarding/     # Onboarding
│   ├── OnboardingFlow.tsx
│   └── index.ts
├── components/settings/      # Configuraciones
│   ├── BiometricSettings.tsx
│   ├── ExplicitInterestsEditor.tsx
│   ├── LocationSettings.tsx
│   ├── NotificationSettings.tsx
│   ├── PinSettings.tsx
│   ├── PrivacySettings.tsx
│   └── index.ts
│   ├── MatchFilters.tsx
│   └── index.ts
├── components/mobile/        # Componentes móviles
│   ├── PWAManager.tsx
│   ├── TouchGestureManager.tsx
│   └── index.ts
├── components/navigation/    # Navegación
│   ├── ResponsiveNavigation.tsx
│   └── index.ts
│   ├── InvitationDialog.tsx
│   └── index.ts
├── components/layout/        # Layouts
│   ├── MainLayout.tsx
│   └── index.ts
├── components/lazy/          # Lazy loading
│   └── index.ts
│   └── UserFeedbackForm.tsx
├── components/home/          # Componentes de home
│   ├── HomeBenefitsSection.tsx
│   ├── HomeModalsManager.tsx
│   ├── HomeProfilesSection.tsx
│   └── index.ts
├── components/images/        # Componentes de imágenes
│   ├── ImageGallery.tsx
│   └── index.ts
│   ├── ClubProfileAdmin.tsx
│   ├── ClubProfileEvents.tsx
│   ├── ClubProfileGallery.tsx
│   ├── ClubProfileHeader.tsx
│   ├── ClubProfileReviews.tsx
│   └── PartnerRequestModal.tsx
├── components/gallery/       # Galerías
│   ├── ImageLightbox.tsx
│   └── index.ts
├── components/forms/         # Formularios
│   ├── EmailValidationForm.tsx
│   ├── ModeratorApplicationForm.tsx
│   ├── PhoneInput.tsx
│   └── index.ts
│   ├── BiometricAuth.tsx
│   ├── DynamicWatermark.tsx
│   ├── MediaUploadSecure.tsx
│   ├── ProtectedMedia.tsx
│   └── index.ts
│   ├── PremiumFeatures.tsx
│   ├── PricingPlans.tsx
│   ├── PrivateMatches.tsx
│   ├── VIPEvents.tsx
│   ├── VirtualGifts.tsx
│   └── index.ts
│   ├── CreateStory.tsx
│   ├── StoriesContainer.tsx
│   ├── StoryReportDialog.tsx
│   ├── StoryService.ts
│   ├── StoryTypes.ts
│   ├── StoryViewer.tsx
│   └── index.ts
├── components/discover/     # Componentes de discover
│   ├── AdvancedFilters.tsx
│   ├── DiscoverSidebar.tsx
│   ├── LocationSelector.tsx
│   ├── MatchScore.tsx
│   ├── PreferenceSearch.tsx
│   └── index.ts
├── components/auth/         # Componentes de autenticación
│   ├── AdminRoute.tsx
│   ├── DemoSelector.tsx
│   ├── EmailValidation.tsx
│   ├── EmailVerification.tsx
│   ├── InterestsSelector.tsx
│   ├── ModeratorRoute.tsx
│   ├── NicknameValidator.tsx
│   ├── PasswordValidator.tsx
│   ├── WorldIDButton.tsx
│   └── index.ts
├── components/ui/           # Componentes UI base
│   ├── AccessibilityEnhancer.tsx
│   ├── AnimatedCard.tsx
│   ├── AnimatedLoader.tsx
│   ├── AnimatedTabs.tsx
│   ├── ChatBubble.tsx
│   ├── ConsentGuard.tsx
│   ├── CrossBrowserOptimizer.tsx
│   ├── EnhancedNavigation.tsx
│   ├── EventCard.tsx
│   ├── FeatureCards.tsx
│   ├── FilterDemoCard.tsx
│   ├── FloatingElements.tsx
│   ├── GlassCard.tsx
│   ├── GlassContainer.tsx
│   ├── GlobalBackground.tsx
│   ├── GlobalBackgroundWrapper.tsx
│   ├── InfoCard.tsx
│   ├── MatchCard.tsx
│   ├── MobileOptimizer.tsx
│   ├── Modal.tsx
│   ├── ResponsiveContainer.tsx
│   ├── ResponsiveGrid.tsx
│   ├── SafeImage.tsx
│   ├── SkeletonComponents.tsx
│   ├── TemplateIntegrator.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeSelector.tsx
│   ├── ThemeToggle.tsx
│   ├── UnifiedCard.tsx
│   ├── UnifiedInput.tsx
│   ├── UnifiedTabs.tsx
│   ├── VisualHierarchy.tsx
│   ├── WhyChooseSection.tsx
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── alert.tsx
│   ├── animations/          # Animaciones
│   ├── avatar.tsx
│   ├── backgrounds/         # Fondos
│   ├── badge.tsx
│   ├── breadcrumb.tsx
│   ├── buttons/             # Botones
│   ├── cards/               # Tarjetas
│   ├── carousel/            # Carruseles
│   ├── charts/              # Gráficos
│   ├── checkbox.tsx
│   ├── drawer/              # Drawer lateral
│   ├── dropdown-menu.tsx
│   ├── examples/            # Ejemplos
│   ├── floating-navbar.tsx
│   ├── forms/               # Formularios
│   ├── images/              # Imágenes
│   ├── index.ts
│   ├── label.tsx
│   ├── menu/                # Menús
│   ├── notifications/       # Notificaciones
│   ├── popover/             # Popovers
│   ├── primitives/          # Primitivas
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── table/               # Tablas
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── toggle.tsx
│   ├── tooltip.tsx
│   ├── vanish-search-input.tsx
│   └── verification-badge.tsx
├── styles/                   # Sistema de estilos consolidado (CSS)
│   ├── AccessibilityAudit.css
│   ├── AnalyticsDashboard.css
│   ├── AnalyticsPanel.css
│   ├── CompatibilityModal.css
│   ├── DecorativeHearts.css
│   ├── EventsModal.css
│   ├── ImageOptimizer.css
│   ├── LegalChatBox.css
│   ├── LoginLoadingScreen.css
│   ├── ParentalControl.css
│   ├── StoryViewer.css
│   ├── TokenSystemPanel.css
│   ├── TokensInfo.css
│   ├── UnifiedBackground.css
│   ├── WelcomeModal.css
│   ├── android-grid.css
│   ├── index.css
│   └── particles.css
├── config/                   # Configuraciones (Sentry, Datadog, etc.)
│   ├── abis.ts
│   ├── app-config.ts
│   ├── csp.config.ts
│   ├── datadog-rum.config.ts
│   ├── demo-production.ts
│   ├── posthog.config.ts
│   ├── rateLimiter.config.ts
│   └── sentry.config.ts
├── context/                  # React Context providers compartidos
│   ├── AppContext.tsx
│   └── BackgroundContext.tsx
├── middleware/               # Middleware de rutas
│   ├── csp.ts
│   └── rateLimiter.ts
├── demo/                     # Flujos y pantallas de demo
├── entities/                 # Entidades y tipos de dominio
├── examples/                 # Ejemplos aislados / sandboxes
├── shared/                   # Directorio compartido (lib, hooks, etc.)
├── security/                 # Seguridad y autenticación
└── utils/                    # Utilidades genéricas (helpers, format, etc.)
    ├── webVitals.ts
    ├── tiktokShare.ts
    ├── testDebugger.ts
    ├── safeLocalStorage.ts
    ├── reportExport.ts
    ├── platformDetection.ts
    ├── mobile.ts
    ├── lazyWithDefault.ts
    ├── lazyComponents.ts
    ├── imageProcessing.ts
    ├── imageOptimization.ts
    ├── hcaptcha-verify.ts
    ├── emailValidation.ts
    ├── emailService.ts
    ├── dynamicImports.ts
    └── discover/
        └── generateRandomProfiles.ts

## Estadísticas del directorio `src`
- **Total de archivos**: 500+ archivos
- **Total de directorios**: 31 directorios principales
- **Subdirectorios de components**: 61
- **Páginas**: 56
- **Servicios**: 20
- **Hooks**: 30
- **Estilos CSS**: 18
- **Tipos TypeScript**: 26
- **Utilidades**: 21

## Nota
Este archivo contiene un barrido completo del directorio `src` del proyecto CómplicesConecta. La estructura está organizada por funcionalidad y tipo de archivo, siguiendo las mejores prácticas de organización de proyectos React + TypeScript.
