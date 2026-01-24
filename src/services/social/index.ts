/**
 * Barrel file para services/social
 * Import paths estables para migración futura
 * Rutas absolutas "@" usadas para imports entre dominios
 */

export * from './social/ContentModerationService';
export * from './social/MatchService';
export * from './social/PredictiveMatchingService';
export { reportManagementService } from './social/ReportManagementService';
export * from './social/ReportService';
export * from './social/SmartMatchingService';
export * from './social/VideoChatService';
export * from './social/InvitationsService';
export * from './social/postsService';
export * from './social/moderatorTimer';
export * from './social/reportAIClassification';
export * from './social/GalleryPrivacyService';
export * from './chat/ChatPrivacyService';
export * from './couple/AdvancedCoupleService';
export * from './notifications/OneSignalService';
