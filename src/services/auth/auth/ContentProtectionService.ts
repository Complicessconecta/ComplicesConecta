/**
 * =====================================================
 * CONTENT PROTECTION SERVICE - LEY OLIMPIA
 * =====================================================
 * Servicio de protección de contenido digital
 * Cumplimiento: Ley Olimpia (México) - Arts. 259 Ter/Quáter/Quinquies
 * Features: Anti-screenshot, anti-download, watermarks
 * Fecha: 19 Nov 2025
 * Versión: v3.6.5
 * =====================================================
 */

import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export type UserRole = "user" | "moderator" | "admin";

export interface ContentAccessLog {
  action:
    | "download"
    | "view"
    | "screenshot_attempt"
    | "dev_tools_detected"
    | "violation";
  contentUrl?: string;
  fileName?: string;
  userRole?: UserRole;
  reason?: string;
  timestamp: string;
  userId?: string;
  [key: string]: unknown;
}

export class ContentProtectionService {
  private static instance: ContentProtectionService;
  private isDevModeDetected: boolean = false;
  private screenshotAttempts: number = 0;
  private readonly MAX_SCREENSHOT_ATTEMPTS = 3;
  private checkIntervals: number[] = [];

  private constructor() {}

  public static getInstance(): ContentProtectionService {
    if (!ContentProtectionService.instance) {
      ContentProtectionService.instance = new ContentProtectionService();
    }
    return ContentProtectionService.instance;
  }

  /**
   * Inicializar protecciones
   */
  initialize(): void {
    if (import.meta.env.DEV) {
      logger.info(
        "[ContentProtection] Dev mode detected via env, skipping aggressive checks",
      );
      return;
    }

    this.detectDeveloperMode();
    this.preventScreenshots();
    this.preventRightClick();
    this.preventDevTools();
    this.detectScreenRecording();

    logger.info(
      "[ContentProtection] Service initialized - Ley Olimpia compliance active",
    );
  }

  /**
   * Detectar modo desarrollador
   */
  private detectDeveloperMode(): void {
    // Detectar DevTools abierto por tamaño de ventana
    const devToolsChecker = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!this.isDevModeDetected) {
          this.isDevModeDetected = true;
          this.handleDevModeDetection();
        }
      }
    };

    const intervalId1 = window.setInterval(devToolsChecker, 2000);
    this.checkIntervals.push(intervalId1);

    // Detectar debugger
    const debuggerChecker = () => {
      const start = new Date();
      const end = new Date();
      if (end.getTime() - start.getTime() > 100) {
        if (!this.isDevModeDetected) {
          this.isDevModeDetected = true;
          this.handleDevModeDetection();
        }
      }
    };

    // Solo ejecutar debugger check si no estamos ya detectados para evitar loop infinito de breakpoints
    const intervalId2 = window.setInterval(() => {
      if (!this.isDevModeDetected) debuggerChecker();
    }, 2000);
    this.checkIntervals.push(intervalId2);
  }

  /**
   * Manejar detección de modo desarrollador
   */
  private handleDevModeDetection(): void {
    logger.warn(
      "[ContentProtection] Developer mode detected - BLOCKING ACCESS",
    );

    this.logContentAccess({
      action: "dev_tools_detected",
      timestamp: new Date().toISOString(),
    });

    // Mostrar advertencia
    toast.error("⚠️ ADVERTENCIA DE SEGURIDAD", {
      description:
        "Se ha detectado el modo desarrollador. Por tu seguridad y cumplimiento con la Ley Olimpia, el acceso a contenido sensible está bloqueado. Si necesitas acceso, contacta al administrador.",
      duration: 10000,
    });

    // Bloquear contenido
    this.blockSensitiveContent();
  }

  /**
   * Prevenir capturas de pantalla
   */
  private preventScreenshots(): void {
    // Detectar PrintScreen
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        this.screenshotAttempts++;
        logger.warn("[ContentProtection] Screenshot attempt detected", {
          attempts: this.screenshotAttempts,
        });

        this.logContentAccess({
          action: "screenshot_attempt",
          timestamp: new Date().toISOString(),
          reason: "PrintScreen key",
        });

        navigator.clipboard.writeText("").catch(() => {});

        toast.error("⚠️ CAPTURA DE PANTALLA NO PERMITIDA", {
          description:
            "Por protección legal (Ley Olimpia), las capturas de pantalla están deshabilitadías. Violación puede resultar en suspensión de cuenta o acciones legales.",
          duration: 5000,
        });

        if (this.screenshotAttempts >= this.MAX_SCREENSHOT_ATTEMPTS) {
          // Obtener usuario actual para el reporte si es posible
          const report = async () => {
             const { data } = await supabase?.auth.getUser() || {};
             const userId = data?.user?.id || "unknown";
             this.reportViolation(userId, "app-shell", "screenshot_attempts_exceeded");
          };
          report().catch(error => logger.error("[ContentProtection] Error reporting violation:", { error }));
        }
      }
    };
    document.addEventListener("keyup", keyUpHandler);

    // Detectar Ctrl+Shift+S (Windows) y Cmd+Shift+4 (Mac)
    const keyDownHandler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === "S") ||
        (e.metaKey && e.shiftKey && e.key === "4")
      ) {
        e.preventDefault();
        this.screenshotAttempts++;

        logger.warn("[ContentProtection] Screenshot shortcut blocked");

        this.logContentAccess({
          action: "screenshot_attempt",
          timestamp: new Date().toISOString(),
          reason: "Shortcut detected",
        });

        toast.error("🚫 Captura de pantalla bloqueada por protección legal");
      }
    };
    document.addEventListener("keydown", keyDownHandler);
  }

  /**
   * Prevenir clic derecho (descarga de imágenes)
   */
  private preventRightClick(): void {
    const contextMenuHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Solo bloquear en imágenes y videos sensibles
      if (
        target.tagName === "IMG" ||
        target.tagName === "VIDEO" ||
        target.closest('[data-sensitive="true"]')
      ) {
        e.preventDefault();

        logger.info(
          "[ContentProtection] Right-click blocked on sensitive content",
        );

        // Mostrar mensaje discreto
        this.showProtectionMessage(e.clientX, e.clientY);
      }
    };
    document.addEventListener("contextmenu", contextMenuHandler);
  }

  /**
   * Prevenir DevTools
   */
  private preventDevTools(): void {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Detectar F12
      if (e.key === "F12") {
        e.preventDefault();
        logger.warn("[ContentProtection] F12 blocked");

        this.logContentAccess({
          action: "dev_tools_detected",
          timestamp: new Date().toISOString(),
          reason: "F12",
        });

        toast.error("🔒 ACCESO RESTRINGIDO", {
          description:
            "Las herramientas de desarrollador están deshabilitadías para proteger el contenido de los usuarios. Cumplimiento: Ley Olimpia (México)",
          duration: 5000,
        });
      }

      // Bloquear atajos comunes de DevTools
      if (
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key)) ||
        (e.metaKey && e.altKey && ["I", "C", "J"].includes(e.key))
      ) {
        e.preventDefault();
        logger.warn("[ContentProtection] DevTools shortcut blocked", {
          key: e.key,
        });
      }
    };
    document.addEventListener("keydown", keyDownHandler);
  }

  /**
   * Detectar grabación de pantalla
   */
  private detectScreenRecording(): void {
    // En navegadores modernos, detectar MediaRecorder activo
    if ("mediaDevices" in navigator) {
      // Monitorear cambios en media devices
      navigator.mediaDevices.addEventListener("devicechange", () => {
        logger.info(
          "[ContentProtection] Media devices changed - checking for recording",
        );
      });
    }

    // Detectar cambios en visibilidad (puede indicar grabación)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        logger.info("[ContentProtection] Page hidden - potential recording");
      }
    });
  }

  /**
   * Verificar si el usuario puede descargar contenido
   */
  canDownloadContent(userRole: UserRole, contentId: string): boolean {
    // Solo moderadores y admins pueden descargar
    if (userRole === "moderator" || userRole === "admin") {
      logger.info("[ContentProtection] Download authorized", {
        role: userRole,
        contentId,
      });
      return true;
    }

    logger.warn("[ContentProtection] Download attempt denied", {
      role: userRole,
      contentId,
    });

    return false;
  }

  /**
   * Descargar contenido (solo para roles autorizados)
   */
  async downloadContent(
    contentUrl: string,
    fileName: string,
    userRole: UserRole,
    reason: string,
  ): Promise<void> {
    if (!this.canDownloadContent(userRole, contentUrl)) {
      throw new Error("No autorizado para descargar contenido");
    }

    // Registrar descarga para auditoría
    await this.logContentAccess({
      action: "download",
      contentUrl,
      fileName,
      userRole,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Proceder con la descarga
    const link = document.createElement("a");
    link.href = contentUrl;
    link.download = fileName;
    link.click();

    logger.info("[ContentProtection] Content downloaded for legal purposes", {
      fileName,
      role: userRole,
      reason,
    });
  }

  /**
   * Aplicar marca de agua a imagen
   */
  applyWatermark(
    imageElement: HTMLImageElement,
    userId: string,
    timestamp: Date,
  ): void {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Dibujar imagen original
    ctx.drawImage(imageElement, 0, 0);

    // Configurar marca de agua
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.textAlign = "right";

    const watermarkText = `ID: ${userId} | ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;

    // Aplicar marca de agua en esquina inferior derecha
    ctx.fillText(watermarkText, canvas.width - 10, canvas.height - 10);

    // Marca de agua diagonal (opcional)
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PROTEGIDO", 0, 0);
    ctx.restore();

    // Reemplazar imagen
    imageElement.src = canvas.toDataURL();
  }

  /**
   * Bloquear contenido sensible
   */
  private blockSensitiveContent(): void {
    const sensitiveElements = document.querySelectorAll(
      '[data-sensitive="true"]',
    );

    sensitiveElements.forEach((el) => {
      (el as HTMLElement).style.filter = "blur(20px)";
      (el as HTMLElement).style.pointerEvents = "none";
    });
  }

  /**
   * Mostrar mensaje de protección
   */
  private showProtectionMessage(x: number, y: number): void {
    const message = document.createElement("div");
    message.textContent = "🔒 Contenido protegido";
    message.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  /**
   * Registrar acceso a contenido (auditoría)
   */
  private async logContentAccess(data: ContentAccessLog): Promise<void> {
    try {
      if (!supabase) {
        logger.warn("[ContentProtection] Supabase not available for logging");
        return;
      }

      const { error } = await supabase
        .from("content_violations" as any)
        .insert({
          event_type: "content_access",
          metadata: data as Json,
          user_id: data.userId, // Si no está presente, será null
        });

      if (error) {
        logger.error("[ContentProtection] Error logging access to DB:", error);
      } else {
        logger.info("[ContentProtection] Content access logged to DB", data);
      }
    } catch (error) {
      logger.error("[ContentProtection] Error logging access:", { error });
    }
  }

  /**
   * Verificar acceso a contenido
   */
  async checkContentAccess(
    userId: string,
    contentId: string,
    _contentType: string,
    isPrivate: boolean,
  ): Promise<boolean> {
    if (!isPrivate) return true;

    if (!supabase) return false;

    // Check permissions in DB
    const { data, error } = await supabase
      .from("content_permissions" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("content_id", contentId)
      .single();

    if (error || !data) {
      // Reportar violación de acceso
      await this._handleProtectionViolation("unauthorized_access_attempt");
      return false;
    }

    return true;
  }

  /**
   * Reportar violación manualmente
   */
  async reportViolation(
    reporterId: string,
    contentId: string,
    reason: string,
    details?: string,
    eventType: 'user_report' | 'system_detection' = 'user_report'
  ): Promise<void> {
    if (!supabase) return;

    try {
      await supabase.from("content_violations" as any).insert({
        reporter_id: reporterId,
        content_id: contentId,
        reason: reason,
        details: details,
        event_type: eventType,
      });
    } catch (error) {
      logger.error("[ContentProtection] Error reporting violation:", { error: String(error) });
    }
  }

  /**
   * Reportar violación
   */
  private async _handleProtectionViolation(type: string): Promise<void> {
    logger.error("[ContentProtection] VIOLATION DETECTED", { type });

    await this.logContentAccess({
      action: "violation",
      timestamp: new Date().toISOString(),
      reason: type,
    });

    toast.error("⚠️ VIOLACIÓN DETECTADA", {
      description:
        "Se ha reportado una violación de las políticas de seguridad.\n\nTu cuenta será revisada por el equipo de moderación.\n\nViolaciones repetidías resultarán en suspensión permanente.",
      duration: 10000,
    });
  }

  /**
   * Verificar si está en modo dev
   */
  isDevMode(): boolean {
    return this.isDevModeDetected;
  }

  /**
   * Limpiar y destruir protecciones
   */
  destroy(): void {
    this.checkIntervals.forEach(clearInterval);
    this.checkIntervals = [];
    logger.info("[ContentProtection] Service destroyed");
  }
}

export const contentProtectionService = ContentProtectionService.getInstance();

