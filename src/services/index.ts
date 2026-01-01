/**
 * Índice centralizado de servicios - ComplicesConecta v3.8.0
 * Organización y exportación centralizada de servicios por dominio.
 */

// Auth & Security
export * from '@/services/auth/SecurityService';
export * from '@/services/auth/UserVerificationService';
export * from '@/services/auth/digitalFingerprint';
export * from '@/services/auth/permanentBan';

// Payments & Tokens
export * from '@/services/payments/TokenService';
export * from '@/services/payments/WalletService';
export * from '@/services/payments/NFTService';

// Social & Moderation
export * from '@/services/social/ContentModerationService';
export { reportService, type ReportResponse as ProfileReportResponse } from '@/services/social/ReportService';
export * from '@/services/social/postsService';
export * from '@/services/social/chat/ChatPrivacyService';

// Core Services
export * from '@/services/core/ErrorAlertService';
export * from '@/services/core/PerformanceMonitoringService';
export * from '@/services/core/legal/ConsentService';

// Features
export * from '@/services/features/events/VirtualEventsService';

// Analytics
export * from '@/services/analytics/AnalyticsService';
export * from '@/services/analytics/TokenAnalyticsService';


