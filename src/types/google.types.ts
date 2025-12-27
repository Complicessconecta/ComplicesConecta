/**
 * Tipos para GoogleServices - ComplicesConecta v3.5.0
 * Reemplaza any con tipos especÃ­ficos para Google Analytics y Firebase Messaging
 */

/**
 * Evento de Google Analytics (gtag)
 */
export interface GtagEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * ParÃ¡metros de Google Analytics (gtag)
 */
export interface GtagParameters {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  items?: GtagItem[];
  user_id?: string;
  session_id?: string;
  page_path?: string;
  page_title?: string;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * Item de Google Analytics (para e-commerce)
 */
export interface GtagItem {
  item_id?: string;
  item_name?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * Payload de mensaje de Firebase Messaging
 */
export interface MessagePayload {
  notification?: NotificationData;
  data?: Record<string, string>;
  from?: string;
  collapseKey?: string;
  messageId?: string;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * Datos de notificaciÃ³n
 */
export interface NotificationData {
  title?: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  sound?: string;
  tag?: string;
  requireInteraction?: boolean;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * ExtensiÃ³n de Window para gtag
 */
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'js' | 'config',
      targetId: string | Date,
      config?: GtagParameters
    ) => void;
  }
}


