// src/lib/index.ts - ARCHIVO MAESTRO DE IMPORTS
// USO: import { Button, Card, useAuth } from '@/lib'

// Barrels por dominio (Fase 2 - Capa de compatibilidad)
// Solo para dominios sin conflictos
export * from './config';
export * from './validation';
export * from './security';
export * from './analytics';
export * from './supabase'; // Fase 3: migración de supabase a su propio directorio

// Utils (mantener exportaciones directas para evitar conflictos)
export type { LocationCoordinates } from './distance-utils';
export { resizeImage as resizeImageOpt } from './image-optimization';
export * from './medianames';
export * from './mobile';
export * from './userAgent';

// Storage (mantener exportaciones directas para evitar conflictos)
export { deleteImage as deleteImageStorage, uploadImage as uploadImageStorage } from './storage';
export * from './storage-manager';
export * from './redis-cache';

// Otros módulos (mantener exportaciones directas)
export * from './advancedFeatures';
export * from './asset-loader';
export * from './capture-console-errors';
export * from './data';
export * from './demo-uuid';
export * from './email-service';
export * from './features';
export * from './imageService';
export * from './images';
export * from './infoCards';
export * from './intelligentAutomation';
export * from './invitations';
export * from './lifestyle-interests';
export * from './matching';
export * from './notifications';
export * from './report-export';
export * from './requests';
export * from './roles';
export * from './supabase-logger';
export * from './supabase';
export * from './tiktok-share';
export * from './tokenPremium';

// UI
export * from "@/components/ui/buttons";
export * from "@/components/ui/cards";
export * from "@/components/ui/forms/Input";
export * from "@/components/ui/Modal";

// Hooks compartidos
export * from "@/hooks/useGeolocation";
export * from "@/hooks/usePersistedState";
export * from "@/hooks/useIsomorphicLayoutEffect";
export * from "@/hooks/useToast";

// Utils
export * from "@/shared/lib/cn";
export * from "@/shared/lib/format";
export * from "@/shared/lib/validation";

// Entities
export * from "@/entities/user";
