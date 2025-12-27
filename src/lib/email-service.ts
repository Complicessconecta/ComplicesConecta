import { logger } from '@/lib/logger';
import { validateEmail } from '@/lib/zod-schemas';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface TemplateData {
  confirmationUrl?: string;
  token?: string;
  resetUrl?: string;
  matchName?: string;
  matchAge?: number;
  matchLocation?: string;
  commonInterests?: string;
  chatUrl?: string;
  matchScore?: number;
  distance?: number;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventPrice?: string;
  eventUrl?: string;
  userName?: string;
}

export class EmailService {
  static {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // Avoid throwing error in non-browser env if not needed, or handle gracefully
      // but keeping original logic for now
      // throw new Error("Supabase URL or Anon Key is not defined in environment variables.");
    }
  }
  private static baseUrl = import.meta.env.VITE_SUPABASE_URL;
  private static anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  static async sendEmail(template: string, to: string, data: TemplateData = {}) {
    try {
      // Validar email con Zod
      validateEmail({ email: to, template });
      logger.info(`Enviando email con template: ${template}`, { to });
      
      const response = await fetch(`${this.baseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`,
        },
        body: JSON.stringify({
          to,
          template,
          data
        })
      });

      if (!response.ok) {
        logger.error(`âŒ Error HTTP en send-email: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.info(`Email enviado exitosamente con template: ${template}`, { to });
      return result;
    } catch (error) {
      logger.error(`âŒ Error enviando email con template ${template}:`, { error });
      throw error;
    }
  }

  static async sendWelcomeEmail(to: string, confirmationUrl: string, userName?: string) {
    logger.info(`Enviando email de bienvenida`, { to, userName });
    return this.sendEmail('welcome', to, { confirmationUrl, userName });
  }

  static async sendConfirmationEmail(to: string, confirmationUrl: string, token: string) {
    const result = await this.sendEmail('confirmation', to, { confirmationUrl, token });
    return result.success === true;
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string) {
    logger.info(`Enviando email de reset de contraseÃ±a`, { to });
    const result = await this.sendEmail('reset-password', to, { resetUrl });
    return result.success === true;
  }

  static async sendMatchNotification(to: string, matchData: {
    matchName: string;
    matchAge: number;
    matchLocation: string;
    commonInterests: string;
    chatUrl: string;
    matchScore?: number;
    distance?: number;
  }) {
    logger.info(`Enviando notificaciÃ³n de match`, { to, matchName: matchData.matchName });
    const result = await this.sendEmail('match-notification', to, matchData);
    return result.success === true;
  }
}

