/**
 * Sistema de moderaciÃ³n de contenido con IA para ComplicesConecta
 * Detecta contenido inapropiado y protege la comunidad sin modificar lÃ³gica existente
 */

import { logger } from '@/lib/logger';

// Tipos para moderaciÃ³n de contenido
interface ModerationResult {
  isApproved: boolean;
  confidence: number;        // 0-100
  flags: ModerationFlag[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: ModerationAction;
  explanation: string;
  processedAt: Date;
}

interface ModerationFlag {
  type: FlagType;
  severity: number;         // 0-100
  description: string;
  evidence?: string[];      // Palabras/frases especÃ­ficas
}

type FlagType = 
  | 'inappropriate_language'
  | 'sexual_explicit'
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'underage_content'
  | 'violence_threats'
  | 'hate_speech'
  | 'personal_info'
  | 'commercial_content'
  | 'duplicate_content'
  | 'low_quality';

type ModerationAction = 
  | 'approve'
  | 'flag_for_review'
  | 'auto_reject'
  | 'require_verification'
  | 'shadow_ban'
  | 'permanent_ban';

interface ContentToModerate {
  type: 'profile' | 'message' | 'image' | 'bio' | 'comment';
  content: string;
  userId: string;
  metadata?: {
    imageUrl?: string;
    recipientId?: string;
    context?: string;
  };
}

interface ModerationConfig {
  strictness: 'permissive' | 'moderate' | 'strict';
  autoApproveThreshold: number;    // Score mÃ­nimo para auto-aprobar
  autoRejectThreshold: number;     // Score mÃ¡ximo para auto-rechazar
  requireHumanReview: boolean;     // Siempre requiere revisiÃ³n humana
  communitySpecific: boolean;      // Usar reglas especÃ­ficas para swingers
}

class ContentModerationEngine {
  private config: ModerationConfig;
  
  // Diccionarios de palabras y patrones
  private readonly INAPPROPRIATE_WORDS = new Set([
    // Palabras explÃ­citamente prohibidas (manteniendo contexto swinger apropiado)
    'menor', 'niÃ±o', 'niÃ±a', 'adolescente', 'escolar',
    'drogas', 'cocaÃ­na', 'marihuana', 'heroÃ­na',
    'prostituciÃ³n', 'escort', 'pago', 'dinero por',
    'violencia', 'golpear', 'lastimar', 'forzar'
  ]);

  private readonly SPAM_PATTERNS = [
    /telegram\s*[@:]?\s*\w+/i,
    /whatsapp\s*[@:]?\s*\+?\d+/i,
    /instagram\s*[@:]?\s*\w+/i,
    /onlyfans\s*[@:]?\s*\w+/i,
    /www\.\w+\.\w+/i,
    /https?:\/\/\w+/i,
    /\$\d+|\d+\s*pesos|\d+\s*dÃ³lares/i
  ];

  private readonly PERSONAL_INFO_PATTERNS = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Tarjetas de crÃ©dito
    /\b\d{2,3}[-\s]?\d{7,8}\b/,                    // TelÃ©fonos mexicanos
    /\b[A-Z]{4}\d{6}[A-Z0-9]{3}\b/,               // CURP
    /\b[A-Z]{3,4}\d{6}[A-Z0-9]{3}\b/              // RFC
  ];

  private readonly SWINGER_APPROPRIATE_TERMS = new Set([
    'intercambio', 'parejas', 'liberal', 'abierto', 'consensual',
    'discreciÃ³n', 'respeto', 'lÃ­mites', 'experiencia', 'aventura',
    'encuentro', 'conexiÃ³n', 'quÃ­mica', 'compatibilidad'
  ]);

  constructor(config: Partial<ModerationConfig> = {}) {
    this.config = {
      strictness: 'moderate',
      autoApproveThreshold: 80,
      autoRejectThreshold: 30,
      requireHumanReview: false,
      communitySpecific: true,
      ...config
    };
  }

  /**
   * Modera contenido y devuelve resultado
   */
  public async moderateContent(content: ContentToModerate): Promise<ModerationResult> {
    const startTime = Date.now();
    
    try {
      const flags = await this.analyzeContent(content);
      const severity = this.calculateSeverity(flags);
      const confidence = this.calculateConfidence(flags, content);
      const suggestedAction = this.determinAction(flags, severity, confidence);
      const isApproved = suggestedAction === 'approve';
      const explanation = this.generateExplanation(flags, suggestedAction);

      const result: ModerationResult = {
        isApproved,
        confidence,
        flags,
        severity,
        suggestedAction,
        explanation,
        processedAt: new Date()
      };

      const processingTime = Date.now() - startTime;
      
      logger.info('ðŸ›¡ï¸ Contenido moderado', {
        contentType: content.type,
        userId: content.userId.substring(0, 8) + '***',
        isApproved,
        severity,
        flagsCount: flags.length,
        processingTime: `${processingTime}ms`
      });

      return result;
      
    } catch (error) {
      logger.error('âŒ Error en moderaciÃ³n de contenido', { 
        contentType: content.type, 
        error 
      });
      
      // Fallback seguro: rechazar en caso de error
      return {
        isApproved: false,
        confidence: 0,
        flags: [{ 
          type: 'low_quality', 
          severity: 50, 
          description: 'Error en el procesamiento' 
        }],
        severity: 'medium',
        suggestedAction: 'flag_for_review',
        explanation: 'Error tÃ©cnico durante la moderaciÃ³n',
        processedAt: new Date()
      };
    }
  }

  /**
   * Analiza el contenido y genera flags
   */
  private async analyzeContent(content: ContentToModerate): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    const text = content.content.toLowerCase();

    // 1. Verificar palabras inapropiadas
    const inappropriateFlags = this.checkInappropriateLanguage(text);
    flags.push(...inappropriateFlags);

    // 2. Detectar spam y contenido comercial
    const spamFlags = this.detectSpam(text);
    flags.push(...spamFlags);

    // 3. Verificar informaciÃ³n personal
    const personalInfoFlags = this.detectPersonalInfo(content.content);
    flags.push(...personalInfoFlags);

    // 4. AnÃ¡lisis especÃ­fico por tipo de contenido
    switch (content.type) {
      case 'profile':
      case 'bio':
        flags.push(...this.analyzeProfileContent(text));
        break;
      case 'message':
        flags.push(...this.analyzeMessageContent(text, content.metadata));
        break;
      case 'image':
        flags.push(...await this.analyzeImageContent(content.metadata?.imageUrl));
        break;
    }

    // 5. Verificaciones especÃ­ficas para comunidad swinger
    if (this.config.communitySpecific) {
      flags.push(...this.applyCommunityRules(text, content.type));
    }

    return flags;
  }

  /**
   * Verifica lenguaje inapropiado
   */
  private checkInappropriateLanguage(text: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];
    const words = text.split(/\s+/);
    const foundWords: string[] = [];

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.INAPPROPRIATE_WORDS.has(cleanWord)) {
        foundWords.push(word);
      }
    }

    if (foundWords.length > 0) {
      flags.push({
        type: 'inappropriate_language',
        severity: Math.min(100, foundWords.length * 30),
        description: `Lenguaje inapropiado detectado: ${foundWords.length} palabras`,
        evidence: foundWords
      });
    }

    return flags;
  }

  /**
   * Detecta spam y contenido comercial
   */
  private detectSpam(text: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];
    const matches: string[] = [];

    for (const pattern of this.SPAM_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        matches.push(match[0]);
      }
    }

    if (matches.length > 0) {
      flags.push({
        type: 'spam',
        severity: Math.min(100, matches.length * 40),
        description: `Posible spam detectado: ${matches.length} patrones`,
        evidence: matches
      });
    }

    // Detectar repeticiÃ³n excesiva
    const repetitionScore = this.calculateRepetitionScore(text);
    if (repetitionScore > 70) {
      flags.push({
        type: 'spam',
        severity: repetitionScore,
        description: 'Contenido repetitivo detectado'
      });
    }

    return flags;
  }

  /**
   * Detecta informaciÃ³n personal sensible
   */
  private detectPersonalInfo(text: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];
    const matches: string[] = [];

    for (const pattern of this.PERSONAL_INFO_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        matches.push(match[0]);
      }
    }

    if (matches.length > 0) {
      flags.push({
        type: 'personal_info',
        severity: 80,
        description: `InformaciÃ³n personal detectada: ${matches.length} elementos`,
        evidence: matches.map(m => m.replace(/./g, '*')) // Censurar evidencia
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de perfil
   */
  private analyzeProfileContent(text: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    // Verificar longitud mÃ­nima
    if (text.length < 20) {
      flags.push({
        type: 'low_quality',
        severity: 40,
        description: 'DescripciÃ³n muy corta'
      });
    }

    // Verificar si es demasiado explÃ­cito para un perfil pÃºblico
    const explicitScore = this.calculateExplicitnessScore(text);
    if (explicitScore > 80) {
      flags.push({
        type: 'sexual_explicit',
        severity: explicitScore,
        description: 'Contenido demasiado explÃ­cito para perfil pÃºblico'
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de mensajes
   */
  private analyzeMessageContent(text: string, metadata?: { recipientId?: string; [key: string]: unknown }): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    // Los mensajes privados pueden ser mÃ¡s permisivos
    const isPrivateMessage = metadata?.recipientId;
    
    if (!isPrivateMessage) {
      // Mensajes pÃºblicos mÃ¡s estrictos
      const explicitScore = this.calculateExplicitnessScore(text);
      if (explicitScore > 60) {
        flags.push({
          type: 'sexual_explicit',
          severity: explicitScore,
          description: 'Contenido explÃ­cito en mensaje pÃºblico'
        });
      }
    }

    // Detectar acoso independientemente del tipo de mensaje
    const harassmentScore = this.detectHarassment(text);
    if (harassmentScore > 50) {
      flags.push({
        type: 'harassment',
        severity: harassmentScore,
        description: 'Posible acoso detectado'
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de imÃ¡genes (placeholder para futura implementaciÃ³n)
   */
  private async analyzeImageContent(imageUrl?: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    if (!imageUrl) return flags;

    // TODO: Implementar anÃ¡lisis de imÃ¡genes con IA
    // Por ahora, verificaciones bÃ¡sicas
    
    // Verificar si la URL es vÃ¡lida
    try {
      new URL(imageUrl);
    } catch {
      flags.push({
        type: 'low_quality',
        severity: 30,
        description: 'URL de imagen invÃ¡lida'
      });
    }

    return flags;
  }

  /**
   * Aplica reglas especÃ­ficas de la comunidad swinger
   */
  private applyCommunityRules(text: string, contentType: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    // Verificar que se mantenga el contexto apropiado
    const _hasAppropriateContext = Array.from(this.SWINGER_APPROPRIATE_TERMS)
      .some(term => text.includes(term));

    const hasInappropriateContext = text.includes('menor') || 
                                   text.includes('pago') ||
                                   text.includes('prostituc');

    if (hasInappropriateContext) {
      flags.push({
        type: 'inappropriate_language',
        severity: 90,
        description: 'Contenido inapropiado para comunidad swinger'
      });
    }

    // Para perfiles, verificar que mencionen discreciÃ³n/respeto
    if (contentType === 'profile' && text.length > 50) {
      const mentionsDiscretion = text.includes('discre') || 
                                text.includes('respeto') ||
                                text.includes('lÃ­mite');
      
      if (!mentionsDiscretion) {
        flags.push({
          type: 'low_quality',
          severity: 20,
          description: 'Perfil podrÃ­a beneficiarse mencionando discreciÃ³n/respeto'
        });
      }
    }

    return flags;
  }

  /**
   * Calcula score de repeticiÃ³n
   */
  private calculateRepetitionScore(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Ignorar palabras muy cortas
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    let repetitionScore = 0;
    for (const count of wordCount.values()) {
      if (count > 2) {
        repetitionScore += (count - 2) * 20;
      }
    }

    return Math.min(100, repetitionScore);
  }

  /**
   * Calcula score de contenido explÃ­cito
   */
  private calculateExplicitnessScore(text: string): number {
    const explicitTerms = [
      'sexo', 'sexual', 'Ã­ntimo', 'desnudo', 'orgasmo',
      'penetraciÃ³n', 'oral', 'anal', 'masturbaciÃ³n'
    ];

    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      for (const term of explicitTerms) {
        if (word.includes(term)) {
          score += 15;
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * Detecta posible acoso
   */
  private detectHarassment(text: string): number {
    const harassmentPatterns = [
      /no\s+acepto\s+un?\s+no/i,
      /insist[eo]/i,
      /obligad[ao]/i,
      /tienes?\s+que/i,
      /debes?\s+hacer/i
    ];

    let score = 0;
    for (const pattern of harassmentPatterns) {
      if (pattern.test(text)) {
        score += 30;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calcula severidad general
   */
  private calculateSeverity(flags: ModerationFlag[]): ModerationResult['severity'] {
    if (flags.length === 0) return 'low';

    const maxSeverity = Math.max(...flags.map(f => f.severity));
    const criticalFlags = flags.filter(f => 
      f.type === 'underage_content' || 
      f.type === 'violence_threats' ||
      f.type === 'hate_speech'
    );

    if (criticalFlags.length > 0 || maxSeverity >= 90) return 'critical';
    if (maxSeverity >= 70) return 'high';
    if (maxSeverity >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calcula confianza en el resultado
   */
  private calculateConfidence(flags: ModerationFlag[], content: ContentToModerate): number {
    let confidence = 70; // Base

    // Aumentar confianza con mÃ¡s evidencia
    const evidenceCount = flags.reduce((sum, f) => sum + (f.evidence?.length || 0), 0);
    confidence += Math.min(20, evidenceCount * 2);

    // Reducir confianza con contenido muy corto
    if (content.content.length < 10) {
      confidence -= 20;
    }

    // Aumentar confianza con flags de alta severidad
    const highSeverityFlags = flags.filter(f => f.severity >= 80);
    confidence += highSeverityFlags.length * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Determina acciÃ³n recomendada
   */
  private determinAction(
    flags: ModerationFlag[], 
    severity: ModerationResult['severity'], 
    confidence: number
  ): ModerationAction {
    // Casos crÃ­ticos siempre requieren acciÃ³n inmediata
    if (severity === 'critical') {
      return confidence > 80 ? 'auto_reject' : 'flag_for_review';
    }

    // Calcular score general
    const totalScore = flags.reduce((sum, f) => sum + f.severity, 0) / Math.max(1, flags.length);

    if (this.config.requireHumanReview) {
      return 'flag_for_review';
    }

    if (totalScore >= this.config.autoRejectThreshold && confidence > 70) {
      return 'auto_reject';
    }

    if (totalScore <= this.config.autoApproveThreshold || flags.length === 0) {
      return 'approve';
    }

    return 'flag_for_review';
  }

  /**
   * Genera explicaciÃ³n del resultado
   */
  private generateExplanation(flags: ModerationFlag[], action: ModerationAction): string {
    if (flags.length === 0) {
      return 'Contenido aprobado sin problemas detectados';
    }

    const flagDescriptions = flags.map(f => f.description).join(', ');
    
    switch (action) {
      case 'approve':
        return `Contenido aprobado con advertencias menores: ${flagDescriptions}`;
      case 'flag_for_review':
        return `Contenido marcado para revisiÃ³n humana: ${flagDescriptions}`;
      case 'auto_reject':
        return `Contenido rechazado automÃ¡ticamente: ${flagDescriptions}`;
      default:
        return `AcciÃ³n requerida (${action}): ${flagDescriptions}`;
    }
  }
}

// Instancia singleton del motor de moderaciÃ³n
const contentModerationEngine = new ContentModerationEngine();

// Hook para usar moderaciÃ³n en componentes React
export const useContentModeration = () => {
  const moderateContent = async (content: ContentToModerate) => {
    return await contentModerationEngine.moderateContent(content);
  };

  const moderateText = async (text: string, type: ContentToModerate['type'], userId: string) => {
    return await moderateContent({
      type,
      content: text,
      userId
    });
  };

  return { moderateContent, moderateText };
};

export { 
  contentModerationEngine,
  type ModerationResult,
  type ModerationFlag,
  type ContentToModerate,
  type ModerationConfig,
  type FlagType,
  type ModerationAction
};

export default ContentModerationEngine;

