/**
 * =====================================================
 * PERFORMANCE MONITORING SERVICE
 * =====================================================
 * Servicio para monitorear y analizar el rendimiento de la aplicación
 * Fecha: 2025-10-28
 * Versión: v3.4.1
 * =====================================================
 */

import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

// New Relic integration (only in browser context)
interface NewRelicAPI {
  noticeError?: (
    error: Error | string,
    customAttributes?: Record<string, unknown>,
  ) => void;
  addPageAction?: (name: string, attributes?: Record<string, unknown>) => void;
  setCustomAttribute?: (name: string, value: string | number | boolean) => void;
  [key: string]: unknown;
}

let newrelic: NewRelicAPI | null = null;
if (
  typeof window !== "undefined" &&
  (window as unknown as Record<string, unknown>).newrelic
) {
  newrelic = (window as unknown as Record<string, unknown>)
    .newrelic as NewRelicAPI;
}

// =====================================================
// INTERFACES
// =====================================================

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: "load" | "interaction" | "network" | "memory" | "custom";
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface PerformanceReport {
  period: string;
  metrics: PerformanceMetric[];
  summary: {
    avgLoadTime: number;
    avgInteractionTime: number;
    totalRequests: number;
    failedRequests: number;
    memoryUsage: number;
  };
  alerts: Array<{
    severity: "warning" | "critical";
    metric: string;
    value: number;
    threshold: number;
    message: string;
  }>;
}

// =====================================================
// THRESHOLDS
// =====================================================

// Ronda 19, stream A — la telemetría NO se mide a sí misma.
//
// Causa raíz del "Discover→perfil se queda en Cargando… 40+ s sin
// que aparezca el panel de 15 s" (test dirigido ronda 18, PR #78,
// DO NOT MERGE, 2026-11-26 08:30–08:53 CST; el tope de 15 s de la
// ronda 18 funciona en jsdom y en carga directa, pero no en SPA):
// el observer de `resource` de este servicio + `recordMetric` forman
// un BUCLE DE REALIMENTACIÓN que satura el hilo principal.
//
// Cadena medida en Chromium real (preview local, 886 px):
// 1. El observer dispara `recordMetric("resourceLoadTime")` por CADA
//    recurso que carga la página (cada imagen de Discover, cada chunk,
//    cada fetch).
// 2. `recordMetric` persiste la métrica en PROD: `persistMetric`
//    (getUser + insert en `app_metrics`) y `logMonitoringSession`
//    (getUser + insert en `monitoring_sessions`).
// 3. Cada una de esas peticiones ES un recurso nuevo: el fetch crea
//    una entrada `resource` en Performance Timing y el observer vuelve
//    a disparar → otra métrica → otras peticiones. Proporción medida:
//    getUser:app_metrics = 2:1 exacto (2 getUser + 1 insert por
//    métrica), 201 getUser/s y 100 inserts/s en /discover en reposo,
//    106 POST/s de reportes CSP (`/api/csp-violation-report`) y el
//    heartbeat de 100 ms con huecos de 0,6–1,8 s en reposo; tras el
//    click en Ana el renderer deja de responder a CDP (la URL se queda
//    en /discover 20+ s). Con el hilo así, el `setTimeout` de 15 s del
//    tope de chunk (ronda 18) no puede disparar y la navegación ni
//    siquiera llega a procesarse: el panel de error no aparece nunca.
//    En carga directa el perfil gana la carrera (el chunk de 52 kB
//    llega en ~3 s, antes de que el bucle sature el hilo); en SPA
//    desde Discover el bucle YA está saturado cuando se hace click.
// 4. El bucle se rompe en DOS sitios (cada uno basta por sí solo):
//    (a) el observer ignora los recursos de telemetría —
//    `isTelemetryResourceUrl` — porque medirlos es medir el propio
//    tráfico que genera este servicio; (b) `recordMetric` NO persiste
//    las métricas `resourceLoadTime` (son de alta frecuencia: una por
//    recurso; persistirlas una a una es lo que convierte cada recurso
//    en tráfico nuevo). Las métricas siguen en memoria para
//    `generateReport`/`getMetrics`; solo deja de escribirse a
//    Supabase una métrica por recurso.
const TELEMETRY_RESOURCE_URL_SUBSTRINGS = [
  "supabase.co", // getUser + app_metrics/monitoring_sessions (este servicio)
  "datadoghq.com", // beacons de Datadog RUM / logs
  "posthog", // PostHog (app.posthog.com y host propio)
  "vercel-scripts.com", // Vercel Speed Insights
  "/api/csp-violation-report", // reportes CSP (consecuencia del bucle)
];

/**
 * ¿La URL es tráfico de telemetría (no contenido de la página)? Las
 * entradas `resource` de estas URLs no se miden: cada métrica
 * persistida genera peticiones a estas URLs, y medirlas realimenta el
 * observer (ver nota de la ronda 19 arriba).
 */
export function isTelemetryResourceUrl(url: string): boolean {
  return TELEMETRY_RESOURCE_URL_SUBSTRINGS.some((part) => url.includes(part));
}

/** Métricas que NO se persisten en Supabase (ver nota ronda 19). */
const NON_PERSISTED_METRIC_NAMES = new Set(["resourceLoadTime"]);

const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  { metric: "pageLoadTime", warning: 2000, critical: 4000, unit: "ms" },
  { metric: "timeToInteractive", warning: 3000, critical: 5000, unit: "ms" },
  { metric: "firstContentfulPaint", warning: 1500, critical: 3000, unit: "ms" },
  {
    metric: "largestContentfulPaint",
    warning: 2500,
    critical: 4000,
    unit: "ms",
  },
  { metric: "apiResponseTime", warning: 500, critical: 1000, unit: "ms" },
  { metric: "memoryUsage", warning: 100, critical: 200, unit: "MB" },
];

// =====================================================
// SERVICE CLASS
// =====================================================

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = DEFAULT_THRESHOLDS;
  private observers: PerformanceObserver[] = [];
  private sessionId: string;

  private static instance: PerformanceMonitoringService;

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance =
        new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.initializeObservers();
  }

  /**
   * Inicializar observadores de performance
   */
  private initializeObservers(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      logger.warn("PerformanceObserver not available");
      return;
    }

    try {
      // Observer para navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: "pageLoadTime",
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: "ms",
              category: "load",
            });
          }
        }
      });

      navObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navObserver);

      // Observer para paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.startTime,
            unit: "ms",
            category: "load",
          });
        }
      });

      paintObserver.observe({ entryTypes: ["paint"] });
      this.observers.push(paintObserver);

      // Observer para resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "resource") {
            const resourceEntry = entry as PerformanceResourceTiming;
            // Ronda 19, stream A: ignorar la telemetría (ver nota sobre
            // TELEMETRY_RESOURCE_URL_SUBSTRINGS): cada métrica persistida
            // genera peticiones a esas URLs y cada petición es una entrada
            // `resource` nueva — medirlas realimenta el observer y satura
            // el hilo principal (Discover→perfil atascado 40+ s, sin panel
            // de 15 s, test dirigido ronda 18).
            if (isTelemetryResourceUrl(resourceEntry.name)) {
              continue;
            }
            this.recordMetric({
              name: "resourceLoadTime",
              value: resourceEntry.duration,
              unit: "ms",
              category: "network",
              metadata: {
                url: resourceEntry.name,
                type: resourceEntry.initiatorType,
              },
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);

      logger.info("✅ Performance observers initialized");
    } catch (error) {
      logger.error("Error initializing performance observers:", {
        error: String(error),
      });
    }
  }

  /**
   * Registrar métrica personalizada
   */
  recordMetric(metric: Omit<PerformanceMetric, "id" | "timestamp">): void {
    const fullMetric: PerformanceMetric = {
      id: `${metric.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Check thresholds
    this.checkThresholds(fullMetric);

    // Ronda 19, stream A: `resourceLoadTime` NO se persiste (ver nota
    // sobre TELEMETRY_RESOURCE_URL_SUBSTRINGS). Es una métrica por
    // recurso y persistirla (getUser + insert en `app_metrics`, más
    // getUser + insert en `monitoring_sessions`) crea el tráfico que
    // el observer de `resource` vuelve a medir: el bucle saturaba el
    // hilo principal y el tope de 15 s del chunk de /profile/:id no
    // podía disparar en SPA desde Discover. La métrica sigue en
    // memoria (`this.metrics`, `generateReport`); solo deja de
    // escribirse una fila por recurso en Supabase.
    const shouldPersistToSupabase =
      import.meta.env.PROD && !NON_PERSISTED_METRIC_NAMES.has(metric.name);

    if (shouldPersistToSupabase) {
      this.persistMetric(fullMetric).catch((err) =>
        logger.debug("Failed to persist metric:", { error: String(err) }),
      );

      this.logMonitoringSession(fullMetric).catch((err) =>
        logger.debug("Failed to log monitoring session:", {
          error: String(err),
        }),
      );
    }

    // 🆕 Enviar a New Relic si está disponible
    if (newrelic?.addPageAction) {
      try {
        newrelic.addPageAction("PerformanceMetric", {
          name: fullMetric.name,
          value: fullMetric.value,
          unit: fullMetric.unit,
          category: fullMetric.category,
          timestamp: fullMetric.timestamp.toISOString(),
          ...(fullMetric.metadata || {}),
        });
      } catch (error) {
        logger.debug("Failed to send metric to New Relic:", {
          error: String(error),
        });
      }
    }

    // Keep only last 1000 metrics to avoid memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    logger.debug("Metric recorded:", { metric: fullMetric });
  }

  /**
   * Registra sesión de monitoreo en la base de datos
   * @private
   */
  private async logMonitoringSession(metric: PerformanceMetric): Promise<void> {
    try {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("monitoring_sessions").insert({
        user_id: user.id,
        started_at: metric.timestamp.toISOString(),
        user_agent: navigator.userAgent,
        metadata: {
          session_type: "performance",
          url: window.location.href,
          metric: {
            name: metric.name,
            value: metric.value,
            unit: metric.unit || "number",
          },
        },
      });
    } catch (error) {
      logger.debug("Failed to log monitoring session:", {
        error: String(error),
      });
    }
  }

  /**
   * Verificar umbrales y generar alertas
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find((t) => t.metric === metric.name);
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      logger.error(
        `🔴 CRITICAL: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.critical}${threshold.unit})`,
      );
    } else if (metric.value >= threshold.warning) {
      logger.warn(
        `⚠️ WARNING: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.warning}${threshold.unit})`,
      );
    }
  }

  /**
   * Obtener métricas filtradas
   */
  getMetrics(filter?: {
    category?: PerformanceMetric["category"];
    name?: string;
    since?: Date;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filter?.category) {
      filtered = filtered.filter((m) => m.category === filter.category);
    }

    if (filter?.name) {
      filtered = filtered.filter((m) => m.name === filter.name);
    }

    if (filter?.since) {
      filtered = filtered.filter((m) => m.timestamp >= filter.since!);
    }

    return filtered;
  }

  /**
   * Generar reporte de performance
   */
  generateReport(periodMinutes: number = 60): PerformanceReport {
    const since = new Date(Date.now() - periodMinutes * 60 * 1000);
    const metrics = this.getMetrics({ since });

    // Calculate summary
    const loadMetrics = metrics.filter((m) => m.category === "load");
    const networkMetrics = metrics.filter((m) => m.category === "network");

    const avgLoadTime =
      loadMetrics.length > 0
        ? loadMetrics.reduce((sum, m) => sum + m.value, 0) / loadMetrics.length
        : 0;

    const avgInteractionTime =
      networkMetrics.length > 0
        ? networkMetrics.reduce((sum, m) => sum + m.value, 0) /
          networkMetrics.length
        : 0;

    // Calculate memory usage (if available)
    let memoryUsage = 0;
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Generate alerts
    const alerts: PerformanceReport["alerts"] = [];
    for (const metric of metrics) {
      const threshold = this.thresholds.find((t) => t.metric === metric.name);
      if (!threshold) continue;

      if (metric.value >= threshold.critical) {
        alerts.push({
          severity: "critical",
          metric: metric.name,
          value: metric.value,
          threshold: threshold.critical,
          message: `${metric.name} exceeded critical threshold: ${metric.value}${metric.unit} >= ${threshold.critical}${threshold.unit}`,
        });
      } else if (metric.value >= threshold.warning) {
        alerts.push({
          severity: "warning",
          metric: metric.name,
          value: metric.value,
          threshold: threshold.warning,
          message: `${metric.name} exceeded warning threshold: ${metric.value}${metric.unit} >= ${threshold.warning}${threshold.unit}`,
        });
      }
    }

    return {
      period: `Last ${periodMinutes} minutes`,
      metrics,
      summary: {
        avgLoadTime: Math.round(avgLoadTime),
        avgInteractionTime: Math.round(avgInteractionTime),
        totalRequests: networkMetrics.length,
        failedRequests: 0, // TODO: Track failed requests
        memoryUsage: Math.round(memoryUsage),
      },
      alerts,
    };
  }

  /**
   * Limpiar métricas antiguas
   */
  clearMetrics(olderThanMinutes: number = 60): void {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
    logger.info(`✅ Cleared metrics older than ${olderThanMinutes} minutes`);
  }

  /**
   * Actualizar umbrales
   */
  updateThresholds(thresholds: PerformanceThreshold[]): void {
    this.thresholds = thresholds;
    logger.info("✅ Performance thresholds updated");
  }

  /**
   * Destruir observadores
   */
  destroy(): void {
    this.observers.forEach((obs) => obs.disconnect());
    this.observers = [];
  }

  /**
   * Medir tiempo de ejecución de una función
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.recordMetric({
        name,
        value: duration,
        unit: "ms",
        category: "custom",
        metadata: { ...metadata, success: true },
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.recordMetric({
        name,
        value: duration,
        unit: "ms",
        category: "custom",
        metadata: { ...metadata, success: false, error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Obtener estadísticas de Web Vitals
   */
  getWebVitals(): {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
  } {
    const vitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
      fcp?: number;
      ttfb?: number;
    } = {};

    const lcpMetric = this.metrics
      .filter((m) => m.name === "largest-contentful-paint")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const fcpMetric = this.metrics
      .filter((m) => m.name === "first-contentful-paint")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (lcpMetric) vitals.lcp = lcpMetric.value;
    if (fcpMetric) vitals.fcp = fcpMetric.value;

    return vitals;
  }

  // =====================================================
  // MÉTODOS DE PERSISTENCIA EN BASE DE DATOS
  // =====================================================

  /**
   * Persistir métricas de performance en la base de datos
   */
  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, omitiendo persistencia de métrica",
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("app_metrics").insert({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_type: "counter",
        recorded_at: new Date().toISOString(),
        metadata: {
          user_id: user?.id ?? null,
          tags: { unit: metric.unit || "number" },
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.name === "AbortError") {
        logger.debug("Persistencia de métrica cancelada (AbortError)", {
          metric: metric.name,
        });
        return;
      }

      logger.warn("Error persisting performance metric:", {
        error: err.message,
      });
    }
  }

  /**
   * Persistir Web Vitals en la base de datos
   */
  async persistWebVitals(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, omitiendo persistencia de Web Vitals",
        );
        return;
      }

      const vitals = this.getWebVitals();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insertar métricas web vitals en la tabla web_vitals_history
      await supabase.from("web_vitals_history").insert({
        lcp: vitals.lcp || null,
        fcp: vitals.fcp || null,
        fid: vitals.fid || null,
        cls: vitals.cls || null,
        ttfb: vitals.ttfb || null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        user_id: user?.id || null,
        metadata: {
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info("✅ Web Vitals persisted to database");
    } catch (error) {
      logger.error("Error persisting Web Vitals:", { error: String(error) });
    }
  }

  /**
   * Persistir todas las métricas actuales en batch
   */
  async persistAllMetrics(): Promise<void> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, omitiendo persistencia de métricas",
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const metricsToInsert = this.metrics.map((metric) => ({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_type: "counter" as const,
        recorded_at: new Date().toISOString(),
        metadata: {
          user_id: user?.id ?? null,
          tags: { unit: metric.unit || "number" },
        },
      }));

      if (metricsToInsert.length > 0) {
        await supabase.from("app_metrics").insert(metricsToInsert);
        logger.info(
          `✅ ${metricsToInsert.length} metrics persisted to database`,
        );
      }
    } catch (error) {
      logger.error("Error persisting metrics batch:", { error: String(error) });
    }
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const performanceMonitoring = PerformanceMonitoringService.getInstance();
