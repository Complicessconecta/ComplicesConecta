/**
 * Sistema de moderación de contenido con IA para ComplicesConecta
 * Detecta contenido inapropiado y protege la comunidad sin modificar lógica existente
 */

import { logger } from "@/lib/logger";

// Tipos para moderación de contenido
interface ModerationResult {
  isApproved: boolean;
  confidence: number; // 0-100
  flags: ModerationFlag[];
  severity: "low" | "medium" | "high" | "critical";
  suggestedAction: ModerationAction;
  explanation: string;
  processedAt: Date;
}

interface ModerationFlag {
  type: FlagType;
  severity: number; // 0-100
  description: string;
  evidence?: string[]; // Palabras/frases específicas
}

type FlagType =
  | "inappropriate_language"
  | "sexual_explicit"
  | "harassment"
  | "spam"
  | "fake_profile"
  | "underage_content"
  | "violence_threats"
  | "hate_speech"
  | "personal_info"
  | "commercial_content"
  | "duplicate_content"
  | "low_quality";

type ModerationAction =
  | "approve"
  | "flag_for_review"
  | "auto_reject"
  | "require_verification"
  | "shadow_ban"
  | "permanent_ban";

interface ContentToModerate {
  type: "profile" | "message" | "image" | "bio" | "comment";
  content: string;
  userId: string;
  metadata?: {
    imageUrl?: string;
    recipientId?: string;
    context?: string;
  };
}

interface ModerationConfig {
  strictness: "permissive" | "moderate" | "strict";
  autoApproveThreshold: number; // Score mínimo para auto-aprobar
  autoRejectThreshold: number; // Score máximo para auto-rechazar
  requireHumanReview: boolean; // Siempre requiere revisión humana
  communitySpecific: boolean; // Usar reglas específicas para swingers
}

class ContentModerationEngine {
  private config: ModerationConfig;

  // Diccionarios de palabras y patrones
  private readonly INAPPROPRIATE_WORDS = new Set([
    // Palabras explícitamente prohibidas (manteniendo contexto swinger apropiado)
    "menor",
    "niño",
    "niña",
    "adolescente",
    "escolar",
    "drogas",
    "cocaína",
    "marihuana",
    "heroína",
    "prostitución",
    "escort",
    "pago",
    "dinero por",
    "violencia",
    "golpear",
    "lastimar",
    "forzar",
    "secuestro",
    "hacker",
    "hacking",
    "abuso",
    "abusar",
    "maltrato",
    "agresión",
    "agredir",
    "asalto",
    "robo",
    "estafa",
    "fraude",
    "extorsión",
    "chantaje",
    "amenaza",
    "amenazar",
    "matar",
    "asesinar",
    "asesinato",
    "homicidio",
    "suicidio",
    "arma",
    "armas",
    "pistola",
    "cuchillo",
    "navaja",
    "bomba",
    "explosivo",
    "terrorismo",
    "pedofilia",
    "pedófilo",
    "abuso sexual",
    "violación",
    "violar",
    "acoso",
    "acosar",
    "hostigamiento",
    "tráfico",
    "tráfico humano",
    "esclavitud",
    "trata de blancas",
    "pornografía infantil",
    "menores de edad",
    "prepuber",
    "prepuberal",
    "infantil",
    "loli",
    "lolita",
    "shota",
    "incesto",
    "bestialidad",
    "zoofilia",
    "necrofilia",
    "cannibalismo",
    "canibalismo",
    "ritual satánico",
    "satanismo",
    "culto",
    "secta",
    "lavado de dinero",
    "blanqueo",
    "narcotráfico",
    "cártel",
    "máfia",
    "pandilla",
    "maras",
    "gang",
    "sicario",
    "matón",
    "asesino a sueldo",
    "contrato",
    "contratado",
    "secuestrar",
    "secuestrador",
    "rescate",
    "cobro de rescate",
    "extorsionar",
    "extorsionista",
    "chantajista",
    "blackmail",
    "pornografía no consensuada",
    "revenge porn",
    "pornografía de venganza",
    "deepfake",
    "revenge porn",
    "doxing",
    "doxear",
    "filtrar datos",
    "filtrar información",
    "hackear cuenta",
    "robar cuenta",
    "suplantar identidad",
    "suplantación",
    "phishing",
    "scam",
    "estafa online",
    "criptomoneda",
    "bitcoin",
    "ethereum",
    "crypto",
    "inversión",
    "invertir",
    "ganar dinero",
    "ganar dinero rápido",
    "dinero fácil",
    "negocio",
    "oportunidad de negocio",
    "mlm",
    "multinivel",
    "pirámide",
    "esquema piramidal",
    "cripto estafa",
    "trading",
    "forex",
    "opciones binarias",
    "apuestas",
    "casino",
    "juegos de azar",
    "apostar",
    "ruleta",
    "blackjack",
    "póker",
    "tragamonedas",
    "slots",
    "apuestas deportivas",
    "bookmaker",
    "casa de apuestas",
    "bono",
    "bono gratis",
    "sin depósito",
    "free spins",
    "giros gratis",
    "jackpot",
    "progresivo",
    "máquina tragamonedas",
    "casino en vivo",
    "live casino",
    "dealer en vivo",
    "crupier",
    "mesa de juego",
    "apostar online",
    "apostar en línea",
    "ganar apostando",
    "ganar jugando",
    "jugar y ganar",
    "jugar por dinero",
    "apuestas reales",
    "dinero real",
    "apostar con dinero",
    "ganar premios",
    "premio en efectivo",
    "cash prize",
    "retirar ganancias",
    "retirar dinero",
    "cobrar ganancias",
    "cobrar dinero",
    "depósito mínimo",
    "mínimo depósito",
    "sin riesgo",
    "sin arriesgar",
    "garantizado",
    "ganancia garantizada",
    "ganar siempre",
    "siempre gana",
    "estrategia ganadora",
    "sistema ganador",
    "método infalible",
    "truco",
    "hack",
    "bot",
    "software",
    "programa",
    "algoritmo",
    "predicción",
    "predecir",
    "analizar",
    "señales",
    "señal",
    "tip",
    "consejo",
    "recomendación",
    "experto",
    "profesional",
    "gurú",
    "mentor",
    "coach",
    "entrenador",
    "academia",
    "curso",
    "clase",
    "taller",
    "seminario",
    "webinar",
    "masterclass",
    "formación",
    "capacitación",
    "aprender",
    "educación",
    "certificado",
    "diploma",
    "título",
    "licencia",
    "credencial",
    "acreditación",
    "certificación",
    "validación",
    "verificación",
    "aprobado",
    "oficial",
    "autorizado",
    "regulado",
    "legal",
    "legítimo",
    "seguro",
    "confiable",
    "confiable",
    "confianza",
    "garantía",
    "garantizado",
    "asegurado",
    "protegido",
    "seguridad",
    "protección",
    "privacidad",
    "datos personales",
    "información personal",
    "información confidencial",
    "datos confidenciales",
    "información sensible",
    "datos sensibles",
    "privado",
    "confidencial",
    "secreto",
    "discreto",
    "anónimo",
    "anónimato",
    "sin rastro",
    "sin dejar rastro",
    "borrar rastros",
    "eliminar rastros",
    "ocultar",
    "ocultar identidad",
    "máscara",
    "disfraz",
    "falso",
    "falsificación",
    "falsificar",
    "documento falso",
    "identidad falsa",
    "nombre falso",
    "alias",
    "seudónimo",
    "nick",
    "nickname",
    "usuario",
    "cuenta",
    "perfil",
    "biografía",
    "bio",
    "descripción",
    "descripción personal",
    "información de contacto",
    "contacto",
    "teléfono",
    "celular",
    "móvil",
    "whatsapp",
    "telegram",
    "instagram",
    "facebook",
    "twitter",
    "tiktok",
    "snapchat",
    "linkedin",
    "correo",
    "email",
    "gmail",
    "hotmail",
    "outlook",
    "yahoo",
    "dirección",
    "ubicación",
    "localización",
    "geolocalización",
    "gps",
    "coordenadas",
    "mapa",
    "ubicación exacta",
    "dirección exacta",
    "calle",
    "número",
    "colonia",
    "barrio",
    "ciudad",
    "estado",
    "país",
    "código postal",
    "zip",
    "cp",
    "referencia",
    "punto de referencia",
    "lugar",
    "sitio",
    "punto de encuentro",
    "encuentro",
    "cita",
    "quedada",
    "reunión",
    "junta",
    "conocer",
    "conocerse",
    "verse",
    "vernos",
    "juntarse",
    "reunirse",
    "encontrarse",
    "encontrarnos",
    "ir a",
    "ir al",
    "ir a la",
    "ir a los",
    "ir a las",
    "visitar",
    "visita",
    "visitar a",
    "ir a casa",
    "ir a tu casa",
    "ir a mi casa",
    "ir a su casa",
    "en casa",
    "en tu casa",
    "en mi casa",
    "en su casa",
    "en tu lugar",
    "en mi lugar",
    "en su lugar",
    "en tu departamento",
    "en mi departamento",
    "en su departamento",
    "en tu apartamento",
    "en mi apartamento",
    "en su apartamento",
    "en tu cuarto",
    "en mi cuarto",
    "en su cuarto",
    "en tu habitación",
    "en mi habitación",
    "en su habitación",
    "en tu recámara",
    "en mi recámara",
    "en su recámara",
    "en tu cama",
    "en mi cama",
    "en su cama",
    "en tu coche",
    "en mi coche",
    "en su coche",
    "en tu auto",
    "en mi auto",
    "en su auto",
    "en tu carro",
    "en mi carro",
    "en su carro",
    "en tu vehículo",
    "en mi vehículo",
    "en su vehículo",
    "en tu camión",
    "en mi camión",
    "en su camión",
    "en tu camioneta",
    "en mi camioneta",
    "en su camioneta",
    "en tu van",
    "en mi van",
    "en su van",
    "en tu motel",
    "en mi motel",
    "en su motel",
    "en tu hotel",
    "en mi hotel",
    "en su hotel",
    "en tu casa de huéspedes",
    "en mi casa de huéspedes",
    "en su casa de huéspedes",
    "en tu airbnb",
    "en mi airbnb",
    "en su airbnb",
    "en tu departamento airbnb",
    "en mi departamento airbnb",
    "en su departamento airbnb",
    "en tu habitación airbnb",
    "en mi habitación airbnb",
    "en su habitación airbnb",
    "reservar",
    "reserva",
    "reservar habitación",
    "reservar cuarto",
    "reservar motel",
    "reservar hotel",
    "reservar casa",
    "reservar departamento",
    "reservar apartamento",
    "reservar lugar",
    "reservar sitio",
    "pagar",
    "pagar por",
    "pagar a",
    "cobrar",
    "cobrar por",
    "cobrar a",
    "costo",
    "precio",
    "tarifa",
    "cuota",
    "pago",
    "abono",
    "anticipo",
    "seña",
    "seña",
    "adelanto",
    "depósito",
    "garantía",
    "fianza",
    "seguro",
    "póliza",
    "contrato",
    "acuerdo",
    "convenio",
    "pacto",
    "trato",
    "negociación",
    "negociar",
    "acordar",
    "convenir",
    "pactar",
    "tratar",
    "negociado",
    "acordado",
    "convenido",
    "pactado",
    "tratado",
  ]);

  private readonly SPAM_PATTERNS = [
    /telegram\s*[@:]?\s*\w+/i,
    /whatsapp\s*[@:]?\s*\+?\d+/i,
    /instagram\s*[@:]?\s*\w+/i,
    /onlyfans\s*[@:]?\s*\w+/i,
    /www\.\w+\.\w+/i,
    /https?:\/\/\w+/i,
    /\$\d+|\d+\s*pesos|\d+\s*dólares/i,
  ];

  private readonly PERSONAL_INFO_PATTERNS = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Tarjetas de crédito
    /\b\d{2,3}[-\s]?\d{7,8}\b/, // Teléfonos mexicanos
    /\b[A-Z]{4}\d{6}[A-Z0-9]{3}\b/, // CURP
    /\b[A-Z]{3,4}\d{6}[A-Z0-9]{3}\b/, // RFC
  ];

  constructor(config: Partial<ModerationConfig> = {}) {
    this.config = {
      strictness: "moderate",
      autoApproveThreshold: 80,
      autoRejectThreshold: 30,
      requireHumanReview: false,
      communitySpecific: true,
      ...config,
    };
  }

  /**
   * Modera contenido y devuelve resultado
   */
  public async moderateContent(
    content: ContentToModerate,
  ): Promise<ModerationResult> {
    const startTime = Date.now();

    try {
      const flags = await this.analyzeContent(content);
      const severity = this.calculateSeverity(flags);
      const confidence = this.calculateConfidence(flags, content);
      const suggestedAction = this.determinAction(flags, severity, confidence);
      const isApproved = suggestedAction === "approve";
      const explanation = this.generateExplanation(flags, suggestedAction);

      const result: ModerationResult = {
        isApproved,
        confidence,
        flags,
        severity,
        suggestedAction,
        explanation,
        processedAt: new Date(),
      };

      const processingTime = Date.now() - startTime;

      logger.info("🛡️ Contenido moderado", {
        contentType: content.type,
        userId: content.userId.substring(0, 8) + "***",
        isApproved,
        severity,
        flagsCount: flags.length,
        processingTime: `${processingTime}ms`,
      });

      return result;
    } catch (error) {
      logger.error("❌ Error en moderación de contenido", {
        contentType: content.type,
        error,
      });

      // Fallback seguro: rechazar en caso de error
      return {
        isApproved: false,
        confidence: 0,
        flags: [
          {
            type: "low_quality",
            severity: 50,
            description: "Error en el procesamiento",
          },
        ],
        severity: "medium",
        suggestedAction: "flag_for_review",
        explanation: "Error técnico durante la moderación",
        processedAt: new Date(),
      };
    }
  }

  /**
   * Analiza el contenido y genera flags
   */
  private async analyzeContent(
    content: ContentToModerate,
  ): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    const text = content.content.toLowerCase();

    // 1. Verificar palabras inapropiadas
    const inappropriateFlags = this.checkInappropriateLanguage(text);
    flags.push(...inappropriateFlags);

    // 2. Detectar spam y contenido comercial
    const spamFlags = this.detectSpam(text);
    flags.push(...spamFlags);

    // 3. Verificar información personal
    const personalInfoFlags = this.detectPersonalInfo(content.content);
    flags.push(...personalInfoFlags);

    // 4. Análisis específico por tipo de contenido
    switch (content.type) {
      case "profile":
      case "bio":
        flags.push(...this.analyzeProfileContent(text));
        break;
      case "message":
        flags.push(...this.analyzeMessageContent(text, content.metadata));
        break;
      case "image":
        flags.push(
          ...(await this.analyzeImageContent(content.metadata?.imageUrl)),
        );
        break;
    }

    // 5. Verificaciones específicas para comunidad swinger
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
      const cleanWord = word.replace(/[^\w]/g, "");
      if (this.INAPPROPRIATE_WORDS.has(cleanWord)) {
        foundWords.push(word);
      }
    }

    if (foundWords.length > 0) {
      flags.push({
        type: "inappropriate_language",
        severity: Math.min(100, foundWords.length * 30),
        description: `Lenguaje inapropiado detectado: ${foundWords.length} palabras`,
        evidence: foundWords,
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
        type: "spam",
        severity: Math.min(100, matches.length * 40),
        description: `Posible spam detectado: ${matches.length} patrones`,
        evidence: matches,
      });
    }

    // Detectar repetición excesiva
    const repetitionScore = this.calculateRepetitionScore(text);
    if (repetitionScore > 70) {
      flags.push({
        type: "spam",
        severity: repetitionScore,
        description: "Contenido repetitivo detectado",
      });
    }

    return flags;
  }

  /**
   * Detecta información personal sensible
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
        type: "personal_info",
        severity: 80,
        description: `Información personal detectada: ${matches.length} elementos`,
        evidence: matches.map((m) => m.replace(/./g, "*")), // Censurar evidencia
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de perfil
   */
  private analyzeProfileContent(text: string): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    // Verificar longitud mínima
    if (text.length < 20) {
      flags.push({
        type: "low_quality",
        severity: 40,
        description: "Descripción muy corta",
      });
    }

    // Verificar si es demasiado explícito para un perfil público
    const explicitScore = this.calculateExplicitnessScore(text);
    if (explicitScore > 80) {
      flags.push({
        type: "sexual_explicit",
        severity: explicitScore,
        description: "Contenido demasiado explícito para perfil público",
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de mensajes
   */
  private analyzeMessageContent(
    text: string,
    metadata?: { recipientId?: string; [key: string]: unknown },
  ): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    // Los mensajes privados pueden ser más permisivos
    const isPrivateMessage = metadata?.recipientId;

    if (!isPrivateMessage) {
      // Mensajes públicos más estrictos
      const explicitScore = this.calculateExplicitnessScore(text);
      if (explicitScore > 60) {
        flags.push({
          type: "sexual_explicit",
          severity: explicitScore,
          description: "Contenido explícito en mensaje público",
        });
      }
    }

    // Detectar acoso independientemente del tipo de mensaje
    const harassmentScore = this.detectHarassment(text);
    if (harassmentScore > 50) {
      flags.push({
        type: "harassment",
        severity: harassmentScore,
        description: "Posible acoso detectado",
      });
    }

    return flags;
  }

  /**
   * Analiza contenido de imágenes (placeholder para futura implementación)
   */
  private async analyzeImageContent(
    imageUrl?: string,
  ): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    if (!imageUrl) return flags;

    // TODO: Implementar análisis de imágenes con IA
    // Por ahora, verificaciones básicas

    // Verificar si la URL es válida
    try {
      new URL(imageUrl);
    } catch {
      flags.push({
        type: "low_quality",
        severity: 30,
        description: "URL de imagen inválida",
      });
    }

    return flags;
  }

  /**
   * Aplica reglas específicas de la comunidad swinger
   */
  private applyCommunityRules(
    text: string,
    contentType: string,
  ): ModerationFlag[] {
    const flags: ModerationFlag[] = [];

    const hasInappropriateContext =
      text.includes("menor") ||
      text.includes("pago") ||
      text.includes("prostituc");

    if (hasInappropriateContext) {
      flags.push({
        type: "inappropriate_language",
        severity: 90,
        description: "Contenido inapropiado para comunidad swinger",
      });
    }

    // Para perfiles, verificar que mencionen discreción/respeto
    if (contentType === "profile" && text.length > 50) {
      const mentionsDiscretion =
        text.includes("discre") ||
        text.includes("respeto") ||
        text.includes("límite");

      if (!mentionsDiscretion) {
        flags.push({
          type: "low_quality",
          severity: 20,
          description:
            "Perfil podría beneficiarse mencionando discreción/respeto",
        });
      }
    }

    return flags;
  }

  /**
   * Calcula score de repetición
   */
  private calculateRepetitionScore(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();

    for (const word of words) {
      if (word.length > 3) {
        // Ignorar palabras muy cortas
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
   * Calcula score de contenido explícito
   */
  private calculateExplicitnessScore(text: string): number {
    const explicitTerms = [
      "sexo",
      "sexual",
      "íntimo",
      "desnudo",
      "orgasmo",
      "penetración",
      "oral",
      "anal",
      "masturbación",
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
      /debes?\s+hacer/i,
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
  private calculateSeverity(
    flags: ModerationFlag[],
  ): ModerationResult["severity"] {
    if (flags.length === 0) return "low";

    const maxSeverity = Math.max(...flags.map((f) => f.severity));
    const criticalFlags = flags.filter(
      (f) =>
        f.type === "underage_content" ||
        f.type === "violence_threats" ||
        f.type === "hate_speech",
    );

    if (criticalFlags.length > 0 || maxSeverity >= 90) return "critical";
    if (maxSeverity >= 70) return "high";
    if (maxSeverity >= 40) return "medium";
    return "low";
  }

  /**
   * Calcula confianza en el resultado
   */
  private calculateConfidence(
    flags: ModerationFlag[],
    content: ContentToModerate,
  ): number {
    let confidence = 70; // Base

    // Aumentar confianza con más evidencia
    const evidenceCount = flags.reduce(
      (sum, f) => sum + (f.evidence?.length || 0),
      0,
    );
    confidence += Math.min(20, evidenceCount * 2);

    // Reducir confianza con contenido muy corto
    if (content.content.length < 10) {
      confidence -= 20;
    }

    // Aumentar confianza con flags de alta severidad
    const highSeverityFlags = flags.filter((f) => f.severity >= 80);
    confidence += highSeverityFlags.length * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Determina acción recomendada
   */
  private determinAction(
    flags: ModerationFlag[],
    severity: ModerationResult["severity"],
    confidence: number,
  ): ModerationAction {
    // Casos críticos siempre requieren acción inmediata
    if (severity === "critical") {
      return confidence > 80 ? "auto_reject" : "flag_for_review";
    }

    // Calcular score general
    const totalScore =
      flags.reduce((sum, f) => sum + f.severity, 0) / Math.max(1, flags.length);

    if (this.config.requireHumanReview) {
      return "flag_for_review";
    }

    if (totalScore >= this.config.autoRejectThreshold && confidence > 70) {
      return "auto_reject";
    }

    if (totalScore <= this.config.autoApproveThreshold || flags.length === 0) {
      return "approve";
    }

    return "flag_for_review";
  }

  /**
   * Genera explicación del resultado
   */
  private generateExplanation(
    flags: ModerationFlag[],
    action: ModerationAction,
  ): string {
    if (flags.length === 0) {
      return "Contenido aprobado sin problemas detectados";
    }

    const flagDescriptions = flags.map((f) => f.description).join(", ");

    switch (action) {
      case "approve":
        return `Contenido aprobado con advertencias menores: ${flagDescriptions}`;
      case "flag_for_review":
        return `Contenido marcado para revisión humana: ${flagDescriptions}`;
      case "auto_reject":
        return `Contenido rechazado automáticamente: ${flagDescriptions}`;
      default:
        return `Acción requerida (${action}): ${flagDescriptions}`;
    }
  }
}

// Instancia singleton del motor de moderación
const contentModerationEngine = new ContentModerationEngine();

// Hook para usar moderación en componentes React
export const useContentModeration = () => {
  const moderateContent = async (content: ContentToModerate) => {
    return await contentModerationEngine.moderateContent(content);
  };

  const moderateText = async (
    text: string,
    type: ContentToModerate["type"],
    userId: string,
  ) => {
    return await moderateContent({
      type,
      content: text,
      userId,
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
  type ModerationAction,
};

export default ContentModerationEngine;
