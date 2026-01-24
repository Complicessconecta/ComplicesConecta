/**
 * Índice centralizado de servicios - ComplicesConecta v3.8.0
 * Organización y exportación centralizada de servicios por dominio.
 */

// Core Services
export * from "@/services/core/ErrorAlertService";
export * from "@/services/core/PerformanceMonitoringService";
export * from "@/services/core/legal/ConsentService";
export * from "@/services/core/AdvancedCacheService";
export * from "@/services/core/DataPrivacyService";
export * from "@/services/core/DesktopNotificationService";
export * from "@/services/core/NotificationService";
export * from "@/services/core/WebhookService";

// Features
export * from "@/services/features/events/VirtualEventsService";
export * from "@/services/features/BannerManagementService";
export * from "@/services/features/GlobalSearchService";

// Analytics (migrados a analytics/ subdirectorio)
export * from "@/services/analytics/analytics/AnalyticsService";
export * from "@/services/analytics/analytics/TokenAnalyticsService";
export * from "@/services/analytics/analytics/HistoricalMetricsService";
export * from "@/services/analytics/analytics/ProfileStatsService";
export * from "@/services/analytics/analytics/AdvancedAnalyticsService";
export * from "@/services/analytics/analytics/ModerationMetricsService";
export * from "@/services/analytics/analytics/ai";

// Auth & Security (migrados a auth/ subdirectorio)
export * from "@/services/auth/auth/SecurityService";
export * from "@/services/auth/auth/UserVerificationService";
export * from "@/services/auth/digitalFingerprint";
export * from "@/services/auth/permanentBan";
export * from "@/services/auth/auth/SecurityAuditService";

// Payments & Tokens
export * from "@/services/payments/TokenService";
export * from "@/services/payments/WalletService";
export * from "@/services/payments/NFTService";
export * from "@/services/payments/NFTGalleryService";

// Social & Moderation (migrados a social/ subdirectorio)
export * from "@/services/social/social/ContentModerationService";
export * from "@/services/social/social/SmartMatchingService";
export {
  reportService,
  type ReportResponse as ProfileReportResponse,
} from "@/services/social/social/ReportService";
export * from "@/services/social/social/postsService";
export * from "@/services/social/chat/ChatPrivacyService";
