/**
 * SMSService - Servicio de verificación por SMS
 *
 * Implementa envío y verificación de códigos SMS
 * Para producción, usar servicios como:
 * - Twilio
 * - AWS SNS
 * - Firebase Cloud Messaging
 * - Vonage
 *
 * @version 1.0.0
 */

import { logger } from "@/lib/logger";

export interface SMSVerificationResult {
  success: boolean;
  verified: boolean;
  error?: string;
  attempts?: number;
}

export class SMSService {
  private static instance: SMSService;
  private verificationCodes: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

  private constructor() {}

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * Envía código de verificación por SMS
   */
  async sendVerificationCode(
    userId: string,
    phoneNumber: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("📱 Enviando código SMS", {
        userId: userId.substring(0, 8) + "***",
        phone: phoneNumber.substring(0, 5) + "***",
      });

      // Generar código de 6 dígitos
      const code = this.generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

      // Guardar código en memoria
      this.verificationCodes.set(userId, {
        code,
        expiresAt,
        attempts: 0,
      });

      // Para producción, usar API de SMS real
      // Por ahora, simular envío
      const sent = await this.simulateSMS(phoneNumber, code);

      if (sent) {
        logger.info("✅ Código SMS enviado", {
          userId: userId.substring(0, 8) + "***",
          code: code.substring(0, 2) + "***",
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: "Error enviando código SMS",
        };
      }
    } catch (error) {
      logger.error("Error enviando código SMS:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifica código SMS
   */
  async verifyCode(
    userId: string,
    code: string,
  ): Promise<SMSVerificationResult> {
    try {
      logger.info("🔐 Verificando código SMS", {
        userId: userId.substring(0, 8) + "***",
        code: code.substring(0, 2) + "***",
      });

      const verificationData = this.verificationCodes.get(userId);

      if (!verificationData) {
        return {
          success: false,
          verified: false,
          error: "Código no encontrado o expirado",
        };
      }

      // Verificar expiración
      if (Date.now() > verificationData.expiresAt) {
        this.verificationCodes.delete(userId);
        return {
          success: false,
          verified: false,
          error: "Código expirado",
        };
      }

      // Verificar intentos máximos
      if (verificationData.attempts >= 3) {
        this.verificationCodes.delete(userId);
        return {
          success: false,
          verified: false,
          error: "Máximo de intentos alcanzado",
          attempts: verificationData.attempts,
        };
      }

      // Incrementar intentos
      verificationData.attempts++;

      // Verificar código
      const isValid = verificationData.code === code;

      if (isValid) {
        this.verificationCodes.delete(userId);
        logger.info("✅ Código SMS verificado", {
          userId: userId.substring(0, 8) + "***",
        });

        return {
          success: true,
          verified: true,
          attempts: verificationData.attempts,
        };
      } else {
        logger.warn("Código SMS inválido", {
          userId: userId.substring(0, 8) + "***",
          attempts: verificationData.attempts,
        });

        return {
          success: true,
          verified: false,
          error: "Código inválido",
          attempts: verificationData.attempts,
        };
      }
    } catch (error) {
      logger.error("Error verificando código SMS:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Genera código de verificación de 6 dígitos
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Simula envío de SMS
   * Para producción, usar API de SMS real
   */
  private async simulateSMS(
    _phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    try {
      // Para producción, usar API de SMS real como Twilio
      // Por ahora, simular envío exitoso
      logger.info(`📨 SMS simulado: Tu código es ${code}`);
      return true;
    } catch (error) {
      logger.error("Error simulando SMS:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Valida formato de número de teléfono
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    try {
      // Validar formato de teléfono (10-15 dígitos, puede empezar con +)
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      return phoneRegex.test(phoneNumber);
    } catch (error) {
      logger.error("Error validando número de teléfono:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Limpia códigos expirados
   */
  cleanExpiredCodes(): void {
    try {
      const now = Date.now();
      for (const [userId, data] of this.verificationCodes.entries()) {
        if (data.expiresAt < now) {
          this.verificationCodes.delete(userId);
        }
      }
      logger.info("🧹 Códigos expirados limpiados");
    } catch (error) {
      logger.error("Error limpiando códigos expirados:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtiene intentos restantes de verificación
   */
  getRemainingAttempts(userId: string): number {
    const verificationData = this.verificationCodes.get(userId);
    if (!verificationData) return 0;
    return 3 - verificationData.attempts;
  }

  /**
   * Cancela verificación pendiente
   */
  cancelVerification(userId: string): void {
    this.verificationCodes.delete(userId);
    logger.info("❌ Verificación cancelada", {
      userId: userId.substring(0, 8) + "***",
    });
  }
}

// Exportar instancia singleton
export const smsService = SMSService.getInstance();

// Limpiar códigos expirados cada 5 minutos
if (typeof window !== "undefined") {
  setInterval(() => {
    smsService.cleanExpiredCodes();
  }, 5 * 60 * 1000);
}
