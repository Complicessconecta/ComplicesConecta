/**
 * Tipos para ContentModerationService - ComplicesConecta v3.5.0
 * Reemplaza any con tipos especÃ­ficos para moderaciÃ³n de contenido
 */

/**
 * Datos de perfil para moderaciÃ³n
 */
export interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  bio?: string;
  age?: number;
  location?: string;
  photos?: string[];
  interests?: string[];
  preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Para propiedades adicionales desconocidas
}

/**
 * AnÃ¡lisis de texto para moderaciÃ³n
 */
export interface TextAnalysis {
  detected_issues: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  toxicity?: number;
  spam_probability?: number;
  [key: string]: unknown;
}

/**
 * Reglas de contexto para moderaciÃ³n
 */
export interface ContextRules {
  maxLength: number;
  allowLinks: boolean;
  allowEmojis: boolean;
  requirePersonalContent: boolean;
}

/**
 * Metadatos de mensaje para moderaciÃ³n
 */
export interface MessageMetadata {
  recipientId?: string;
  senderId?: string;
  messageType?: 'private' | 'public' | 'group';
  [key: string]: unknown;
}


