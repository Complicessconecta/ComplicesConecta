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

// Analytics
export * from "@/services/analytics/AnalyticsService";
export * from "@/services/analytics/TokenAnalyticsService";
export * from "@/services/analytics/HistoricalMetricsService";
export * from "@/services/analytics/ProfileStatsService";

// Auth & Security
export * from "@/services/auth/SecurityService";
export * from "@/services/auth/UserVerificationService";
export * from "@/services/auth/digitalFingerprint";
export * from "@/services/auth/permanentBan";
export * from "@/services/auth/SecurityAuditService";

// Payments & Tokens
export * from "@/services/payments/TokenService";
export * from "@/services/payments/WalletService";
export * from "@/services/payments/NFTService";
export * from "@/services/payments/NFTGalleryService";

// Social & Moderation
export * from "@/services/social/ContentModerationService";
export * from "@/services/social/SmartMatchingService";
export {
  reportService,
  type ReportResponse as ProfileReportResponse,
} from "@/services/social/ReportService";
export * from "@/services/social/postsService";
export * from "@/services/social/chat/ChatPrivacyService";
