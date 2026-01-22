/**
 * =====================================================
 * ERROR ALERT SERVICE
 * =====================================================
 * Servicio para configurar y enviar alertas de errores
 * Fecha: 2025-10-28
 * Versión: v3.4.1
 * =====================================================
 */

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { webhookService } from "@/services/core/WebhookService";

// New Relic integration (only in browser context)
let newrelic: any = null;
if (typeof window !== "undefined" && (window as any).newrelic) {
  newrelic = (window as any).newrelic;
}

// =====================================================
// INTERFACES
// =====================================================

export interface ErrorAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "frontend"
    | "backend"
    | "network"
    | "database"
    | "auth"
    | "unknown";
  message: string;
  error: Error | string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (alert: ErrorAlert) => boolean;
  actions: AlertAction[];
  enabled: boolean;
}

export type AlertAction =
  | { type: "console"; level: "log" | "warn" | "error" }
  | { type: "notification"; title: string; body: string }
  | { type: "email"; to: string; subject: string }
  | { type: "webhook"; url: string; method: "POST" | "GET" }
  | { type: "storage"; persist: boolean };

export interface AlertStatistics {
  total: number;
  bySeverity: Record<ErrorAlert["severity"], number>;
  byCategory: Record<ErrorAlert["category"], number>;
  resolved: number;
  unresolved: number;
  last24Hours: number;
}

// =====================================================
// DEFAULT RULES
// =====================================================

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "critical-errors",
    name: "Critical Errors",
    condition: (alert) => alert.severity === "critical",
    actions: [
      { type: "console", level: "error" },
      {
        type: "notification",
        title: "🔴 Critical Error",
        body: "A critical error occurred",
      },
      { type: "storage", persist: true },
    ],
    enabled: true,
  },
  {
    id: "high-severity",
    name: "High Severity Errors",
    condition: (alert) => alert.severity === "high",
    actions: [
      { type: "console", level: "error" },
      { type: "storage", persist: true },
    ],
    enabled: true,
  },
  {
    id: "auth-errors",
    name: "Authentication Errors",
    condition: (alert) => alert.category === "auth",
    actions: [
      { type: "console", level: "warn" },
      { type: "storage", persist: true },
    ],
    enabled: true,
  },
  {
    id: "database-errors",
    name: "Database Errors",
    condition: (alert) => alert.category === "database",
    actions: [
      { type: "console", level: "error" },
      { type: "storage", persist: true },
    ],
    enabled: true,
  },
];

// =====================================================
// SERVICE CLASS
// =====================================================

export class ErrorAlertService {
  private static instance: ErrorAlertService;
  private alerts: ErrorAlert[] = [];
  private rules: AlertRule[] = DEFAULT_RULES;
  private listeners: Array<(alert: ErrorAlert) => void> = [];

  private constructor() {
    this.initializeGlobalErrorHandler();
    this.loadPersistedAlerts();
  }

  public static getInstance(): ErrorAlertService {
    if (!ErrorAlertService.instance) {
      ErrorAlertService.instance = new ErrorAlertService();
    }
    return ErrorAlertService.instance;
  }

  /**
   * Inicializar manejador global de errores
   */
  private initializeGlobalErrorHandler(): void {
    if (typeof window === "undefined") return;

    // Unhandled errors
    window.addEventListener("error", (event: ErrorEvent) => {
      this.createAlert({
        severity: "high",
        category: "frontend",
        message: event.message,
        error: event.error || event.message,
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        this.createAlert({
          severity: "high",
          category: "frontend",
          message: "Unhandled Promise Rejection",
          error: event.reason,
          stack: event.reason?.stack,
          metadata: {
            promise: event.promise,
          },
        });
      },
    );

    logger.info("✅ Global error handlers initialized");
  }

  /**
   * Cargar alertas persistidías
   */
  private loadPersistedAlerts(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const stored = localStorage.getItem("error-alerts");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.alerts = parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
          resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
        }));
        logger.info(`✅ Loaded ${this.alerts.length} persisted alerts`);
      }
    } catch (error) {
      logger.error("Error loading persisted alerts:", { error: String(error) });
    }
  }

  /**
   * Persistir alertas en localStorage
   */
  private persistAlerts(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      // Keep only last 100 alerts to avoid localStorage limits
      const toStore = this.alerts.slice(-100);
      localStorage.setItem("error-alerts", JSON.stringify(toStore));
    } catch (error) {
      logger.error("Error persisting alerts:", { error: String(error) });
    }
  }

  /**
   * Crear nueva alerta
   */
  createAlert(
    alertData: Omit<ErrorAlert, "id" | "timestamp" | "resolved">,
  ): ErrorAlert {
    const computedStack =
      alertData.stack ??
      (alertData.error instanceof Error ? alertData.error.stack : undefined);
    const alert: ErrorAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
      ...(computedStack !== undefined ? { stack: computedStack } : {}),
    };

    this.alerts.push(alert);

    // Execute matching rules
    this.executeRules(alert);

    // Notify listeners
    this.notifyListeners(alert);

    // Persistir en base de datos (async sin await para no bloquear)
    this.persistAlert(alert).catch((err) =>
      logger.debug("Failed to persist alert:", { error: String(err) }),
    );

    // 🆕 Enviar a New Relic si está disponible
    if (newrelic) {
      try {
        // Enviar error a New Relic
        const error =
          alertData.error instanceof Error
            ? alertData.error
            : new Error(alertData.message);

        newrelic.noticeError(error, {
          severity: alert.severity,
          category: alert.category,
          userId: alert.userId,
          ...(alert.metadata || {}),
        });

        // También enviar como custom event
        newrelic.addPageAction("ErrorAlert", {
          severity: alert.severity,
          category: alert.category,
          message: alert.message,
          userId: alert.userId,
          timestamp: alert.timestamp.toISOString(),
        });
      } catch (error) {
        logger.debug("Failed to send alert to New Relic:", {
          error: String(error),
        });
      }
    }

    // 🆕 Enviar a Webhooks configurados
    webhookService
      .sendNotification({
        event: "error",
        severity: alert.severity,
        title: `Error ${alert.severity.toUpperCase()}: ${alert.category}`,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        source: "ErrorAlertService",
        userId: alert.userId ?? "",
        metadata: {
          id: alert.id,
          ...(alert.stack !== undefined ? { stack: alert.stack } : {}),
          ...alert.metadata,
        },
      })
      .catch((err: unknown) =>
        logger.debug("Failed to send webhook notification:", {
          error: String(err),
        }),
      );

    // Keep only last 500 alerts in memory
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(-500);
    }

    logger.debug("Alert created:", { alert });

    return alert;
  }

  /**
   * Ejecutar reglas de alerta
   */
  private executeRules(alert: ErrorAlert): void {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (rule.condition(alert)) {
        logger.debug(`Rule triggered: ${rule.name}`);

        for (const action of rule.actions) {
          this.executeAction(action, alert);
        }
      }
    }
  }

  /**
   * Ejecutar acción de alerta
   */
  private executeAction(action: AlertAction, alert: ErrorAlert): void {
    try {
      switch (action.type) {
        case "console": {
          const consoleMethod = console[action.level];
          consoleMethod(`[${alert.severity.toUpperCase()}] ${alert.message}`, {
            category: alert.category,
            error: alert.error,
            metadata: alert.metadata,
          });
          break;
        }

        case "notification":
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(action.title, {
              body: action.body || alert.message,
              icon: "/icon.png",
              tag: alert.id,
            });
          }
          break;

        case "storage":
          if (action.persist) {
            this.persistAlerts();
          }
          break;

        case "webhook":
          // TODO: Implement webhook action
          logger.debug("Webhook action (not implemented):", action);
          break;

        case "email":
          // TODO: Implement email action
          logger.debug("Email action (not implemented):", action);
          break;
      }
    } catch (error) {
      logger.error("Error executing alert action:", {
        error: String(error),
        action,
      });
    }
  }

  /**
   * Notificar listeners
   */
  private notifyListeners(alert: ErrorAlert): void {
    for (const listener of this.listeners) {
      try {
        listener(alert);
      } catch (error) {
        logger.error("Error in alert listener:", { error: String(error) });
      }
    }
  }

  /**
   * Subscribirse a alertas
   */
  subscribe(listener: (alert: ErrorAlert) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtener alertas filtradías
   */
  getAlerts(filter?: {
    severity?: ErrorAlert["severity"];
    category?: ErrorAlert["category"];
    resolved?: boolean;
    since?: Date;
  }): ErrorAlert[] {
    let filtered = [...this.alerts];

    if (filter?.severity) {
      filtered = filtered.filter((a) => a.severity === filter.severity);
    }

    if (filter?.category) {
      filtered = filtered.filter((a) => a.category === filter.category);
    }

    if (filter?.resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === filter.resolved);
    }

    if (filter?.since) {
      filtered = filtered.filter((a) => a.timestamp >= filter.since!);
    }

    return filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.persistAlerts();

      // Actualizar en base de datos
      this.updateAlertResolution(alertId, true).catch((err) =>
        logger.debug("Failed to update alert resolution:", {
          error: String(err),
        }),
      );

      logger.info(`✅ Alert resolved: ${alertId}`);
    }
  }

  /**
   * Resolver todías las alertas
   */
  resolveAll(): void {
    let count = 0;
    for (const alert of this.alerts) {
      if (!alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        count++;
      }
    }
    this.persistAlerts();
    logger.info(`✅ Resolved ${count} alerts`);
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): AlertStatistics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const stats: AlertStatistics = {
      total: this.alerts.length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byCategory: {
        frontend: 0,
        backend: 0,
        network: 0,
        database: 0,
        auth: 0,
        unknown: 0,
      },
      resolved: 0,
      unresolved: 0,
      last24Hours: 0,
    };

    for (const alert of this.alerts) {
      stats.bySeverity[alert.severity]++;
      stats.byCategory[alert.category]++;

      if (alert.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }

      if (alert.timestamp.getTime() >= last24Hours) {
        stats.last24Hours++;
      }
    }

    return stats;
  }

  /**
   * Agregar regla personalizada
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
    logger.info(`✅ Rule added: ${rule.name}`);
  }

  /**
   * Eliminar regla
   */
  removeRule(ruleId: string): void {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      logger.info(`✅ Rule removed: ${ruleId}`);
    }
  }

  /**
   * Habilitar/deshabilitar regla
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info(`✅ Rule ${enabled ? "enabled" : "disabled"}: ${rule.name}`);
    }
  }

  /**
   * Obtener reglas
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  /**
   * Limpiar alertas antiguas
   */
  clearAlerts(olderThanDays: number = 7): void {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const before = this.alerts.length;
    this.alerts = this.alerts.filter((a) => a.timestamp >= cutoff);
    const removed = before - this.alerts.length;
    this.persistAlerts();
    logger.info(
      `✅ Cleared ${removed} alerts older than ${olderThanDays} days`,
    );
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  // =====================================================
  // MÉTODOS DE PERSISTENCIA EN BASE DE DATOS
  // =====================================================

  /**
   * Persistir alerta en la base de datos
   */
  private async persistAlert(alert: ErrorAlert): Promise<void> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, omitiendo persistencia de alerta",
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("error_alerts").insert({
        category: alert.category || "unknown",
        error_message: alert.message,
        error_stack: alert.stack || null,
        error_type: alert.category || "unknown",
        severity: alert.severity,
        resolved: alert.resolved,
        user_id: user?.id || alert.userId || null,
        url: typeof window !== "undefined" ? window.location.href : null,
        user_agent: typeof window !== "undefined" ? navigator.userAgent : null,
      });
    } catch (error) {
      logger.error("Error persisting alert:", { error: String(error) });
    }
  }

  /**
   * Actualizar estado de resolución en la base de datos
   */
  private async updateAlertResolution(
    alertId: string,
    resolved: boolean,
  ): Promise<void> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, omitiendo actualización de resolución",
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from("error_alerts")
        .update({
          resolved,
          resolved_at: resolved ? new Date().toISOString() : null,
          resolved_by: resolved ? user?.id || null : null,
        })
        .eq("id", alertId);

      logger.info(`✅ Alert resolution updated in database: ${alertId}`);
    } catch (error) {
      logger.error("Error updating alert resolution:", {
        error: String(error),
      });
    }
  }

  /**
   * Obtener alertas desde la base de datos
   */
  async getAlertsFromDatabase(filter?: {
    severity?: ErrorAlert["severity"];
    category?: ErrorAlert["category"];
    resolved?: boolean;
    limit?: number;
  }): Promise<ErrorAlert[]> {
    try {
      if (!supabase) {
        logger.debug("Supabase no está disponible, retornando array vacío");
        return [];
      }

      let query = supabase
        .from("error_alerts")
        .select("*")
        .order("timestamp", { ascending: false });

      if (filter?.severity) {
        query = query.eq("severity", filter.severity);
      }

      if (filter?.category) {
        query = query.eq("category", filter.category);
      }

      if (filter?.resolved !== undefined) {
        query = query.eq("resolved", filter.resolved);
      }

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching alerts from database:", error);
        return [];
      }

      return (data || []).map((row: any) => {
        const base: ErrorAlert = {
          id: row.id,
          severity: row.severity,
          category: row.category,
          message: row.error_message,
          error: row.error_message,
          timestamp: new Date(row.timestamp || row.created_at),
          metadata: row.metadata || {},
          resolved: row.resolved || false,
        };
        const withStack = row.error_stack
          ? { ...base, stack: row.error_stack as string }
          : base;
        const withUser = row.user_id
          ? { ...withStack, userId: row.user_id as string }
          : withStack;
        return row.resolved_at
          ? { ...withUser, resolvedAt: new Date(row.resolved_at) }
          : withUser;
      });
    } catch (error) {
      logger.error("Error in getAlertsFromDatabase:", { error: String(error) });
      return [];
    }
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const errorAlertService = ErrorAlertService.getInstance();

