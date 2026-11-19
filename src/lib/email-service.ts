import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { validateEmail } from "@/lib/validation";

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
    // C2: send-email now requires a valid user JWT (401 with the anon key).
    // The anon key is no longer used here; auth comes from the session.
    if (!import.meta.env.VITE_SUPABASE_URL) {
      // Avoid throwing error in non-browser env if not needed, or handle gracefully
      // but keeping original logic for now
      // throw new Error("Supabase URL is not defined in environment variables.");
    }
  }
  private static baseUrl = import.meta.env.VITE_SUPABASE_URL;

  static async sendEmail(
    template: string,
    to: string,
    data: TemplateData = {},
  ) {
    try {
      // Validar email con Zod
      validateEmail(to);
      logger.info(`Enviando email con template: ${template}`, { to });

      // C2: send-email requires a user JWT. No session -> fail closed,
      // never fall back to the anon key (it now returns 401).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          "No hay sesión activa: inicia sesión para enviar emails",
        );
      }

      const response = await fetch(`${this.baseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          to,
          template,
          data,
        }),
      });

      if (!response.ok) {
        logger.error(`❌ Error HTTP en send-email: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.info(`Email enviado exitosamente con template: ${template}`, {
        to,
      });
      return result;
    } catch (error) {
      logger.error(`❌ Error enviando email con template ${template}:`, {
        error,
      });
      throw error;
    }
  }

  /**
   * JWT complement (2026-11-19): los emails de bienvenida / confirmación /
   * reset de contraseña se disparan para usuarios que AÚN NO tienen sesión,
   * y `send-email` exige un JWT de usuario desde C2 (sin sesión, `sendEmail`
   * lanza). Se mantiene fail-closed, pero con un error explícito: estos
   * emails deben enviarse desde el servidor (Supabase Auth hooks /
   * remitente server-side), no desde el cliente. NO se inventó ningún
   * remitente server-side aquí: es decisión del dueño (ver
   * JWT_COMPLEMENT_SUMMARY.md). No se "arregla" re-añadiendo la anon key:
   * eso desharía C2.
   */
  private static async requireSessionForAuthEmail(
    template: string,
  ): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error(
        `El email "${template}" no se puede enviar sin sesión: los emails ` +
          `de bienvenida / confirmación / reset se disparan para usuarios ` +
          `que aún no han iniciado sesión, y send-email exige un JWT de ` +
          `usuario desde C2. Deben enviarse desde el servidor (Supabase ` +
          `Auth hooks / remitente server-side). Decisión del dueño pendiente.`,
      );
    }
  }

  static async sendWelcomeEmail(
    to: string,
    confirmationUrl: string,
    userName?: string,
  ) {
    logger.info(`Enviando email de bienvenida`, { to, userName });
    await this.requireSessionForAuthEmail("welcome");
    const templateData: any = { confirmationUrl };
    if (userName) {
      templateData.userName = userName;
    }
    return this.sendEmail("welcome", to, templateData);
  }

  static async sendConfirmationEmail(
    to: string,
    confirmationUrl: string,
    token: string,
  ) {
    await this.requireSessionForAuthEmail("confirmation");
    const result = await this.sendEmail("confirmation", to, {
      confirmationUrl,
      token,
    });
    return result.success === true;
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string) {
    logger.info(`Enviando email de reset de contraseña`, { to });
    await this.requireSessionForAuthEmail("reset-password");
    const result = await this.sendEmail("reset-password", to, { resetUrl });
    return result.success === true;
  }

  static async sendMatchNotification(
    to: string,
    matchData: {
      matchName: string;
      matchAge: number;
      matchLocation: string;
      commonInterests: string;
      chatUrl: string;
      matchScore?: number;
      distance?: number;
    },
  ) {
    logger.info(`Enviando notificación de match`, {
      to,
      matchName: matchData.matchName,
    });
    const result = await this.sendEmail("match-notification", to, matchData);
    return result.success === true;
  }
}
