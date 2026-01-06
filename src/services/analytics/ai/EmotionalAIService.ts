// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------
/**
 * EmotionalAIService - Análisis Emocional con GPT-4
 *
 * Analiza chats para determinar química emocional
 * Usa GPT-4 para análisis de sentimientos y valores
 *
 * @version 3.5.0
 */

import OpenAI from "openai";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface EmotionalAnalysis {
  score: number; // 0-100
  reasons: string[];
  sentiment: "positive" | "neutral" | "negative";
  chemistry: number; // 0-1
  valuesAlignment: number; // 0-1
}

export interface ChatMessage {
  content: string;
  sender_id: string;
  created_at: string;
}

export class EmotionalAIService {
  private static instance: EmotionalAIService;
  private openai: OpenAI | null = null;

  constructor() {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true,
      });
      logger.info("✅ OpenAI inicializado para Emotional AI");
    } else {
      logger.warn("⚠️ OpenAI API key no configurada, usando fallback");
    }
  }

  static getInstance(): EmotionalAIService {
    if (!EmotionalAIService.instance) {
      EmotionalAIService.instance = new EmotionalAIService();
    }
    return EmotionalAIService.instance;
  }

  /**
   * Analiza emociones de chats entre dos usuarios
   */
  async analyzeChatEmotions(
    userId1: string,
    userId2: string,
  ): Promise<EmotionalAnalysis> {
    try {
      // 1. Obtener mensajes entre los dos usuarios
      const messages = await this.getChatMessages(userId1, userId2);

      if (messages.length < 3) {
        return {
          score: 50,
          reasons: ["Insuficientes mensajes para análisis emocional"],
          sentiment: "neutral",
          chemistry: 0.5,
          valuesAlignment: 0.5,
        };
      }

      // 2. Usar GPT-4 para análisis si está disponible
      if (this.openai) {
        return await this.analyzeWithGPT4(messages, userId1, userId2);
      }

      // 3. Fallback: análisis básico con patrones
      return this.analyzeWithPatterns(messages);
    } catch (error) {
      logger.error("Error analizando emociones", { error });
      return {
        score: 50,
        reasons: ["Error en análisis emocional"],
        sentiment: "neutral",
        chemistry: 0.5,
        valuesAlignment: 0.5,
      };
    }
  }

  /**
   * Análisis con GPT-4
   */
  private async analyzeWithGPT4(
    messages: ChatMessage[],
    userId1: string,
    _userId2: string,
  ): Promise<EmotionalAnalysis> {
    if (!this.openai) {
      throw new Error("OpenAI no está disponible");
    }

    const messagesText = messages
      .map(
        (m) => `Usuario ${m.sender_id === userId1 ? "1" : "2"}: ${m.content}`,
      )
      .join("\n");

    const prompt = `Analiza la química emocional y alineación de valores entre dos usuarios adultos (+18) basándote en su conversación.
    
    Mensajes:
    ${messagesText}
    
    Responde en JSON con este formato:
    {
      "score": number (0-100),
      "reasons": string[] (3 razones principales),
      "sentiment": "positive" | "neutral" | "negative",
      "chemistry": number (0-1),
      "valuesAlignment": number (0-1)
    }`;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
      });

      const content = completion.choices?.[0]?.message?.content;
      if (!content) throw new Error("Respuesta vacía de OpenAI");

      return JSON.parse(content) as EmotionalAnalysis;
    } catch (error) {
      logger.error("Error GPT-4", { error });
      return this.analyzeWithPatterns(messages);
    }
  }

  /**
   * Fallback: Análisis básico basado en palabras clave
   */
  private analyzeWithPatterns(messages: ChatMessage[]): EmotionalAnalysis {
    const text = messages.map((m) => m.content.toLowerCase()).join(" ");

    const positiveWords = [
      "gracias",
      "genial",
      "me gusta",
      "jaja",
      "sí",
      "claro",
      "bien",
    ];
    const negativeWords = ["no", "mal", "adiós", "nunca", "odio", "aburrido"];

    let score = 50;
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((w) => {
      if (text.includes(w)) {
        score += 5;
        positiveCount++;
      }
    });

    negativeWords.forEach((w) => {
      if (text.includes(w)) {
        score -= 5;
        negativeCount++;
      }
    });

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      reasons: [
        `Detectadas ${positiveCount} interacciones positivas y ${negativeCount} negativas`,
      ],
      sentiment: score > 60 ? "positive" : score < 40 ? "negative" : "neutral",
      chemistry: score / 100,
      valuesAlignment: 0.5, // Default
    };
  }

  /**
   * Obtiene mensajes de Supabase
   */
  private async getChatMessages(
    userId1: string,
    userId2: string,
  ): Promise<ChatMessage[]> {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from("messages")
      .select("content, sender_id, created_at")
      .or(
        `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Error fetching messages", { error });
      throw error;
    }

    return (data || []).map((m) => ({
      content: m.content || "",
      sender_id: m.sender_id || "",
      created_at: m.created_at || new Date().toISOString(),
    }));
  }
}

export const emotionalAIService = EmotionalAIService.getInstance();
