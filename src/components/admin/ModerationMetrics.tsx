/**
 * =====================================================
 * MODERATION METRICS COMPONENT
 * =====================================================
 * Panel de métricas para moderadores
 * Fecha: 2025-10-30
 * Versión: v3.4.1
 * =====================================================
 */

import React, { useState, useEffect } from "react";
import { ShieldCheckIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, UserGroupIcon, ChartBarIcon, FlagIcon } from "@heroicons/react/24/outline";
import { moderationMetricsService, type ModerationMetrics } from "@/services/analytics/ModerationMetricsService";
import { logger } from "@/lib/logger";
import { Progress } from "@/components/ui/progress";

// =====================================================
// INTERFACES
// =====================================================

interface ModerationMetricsProps {
  refreshInterval?: number; // en segundos
}

// =====================================================
// COMPONENT
// =====================================================

export const ModerationMetricsPanel: React.FC<ModerationMetricsProps> = ({
  refreshInterval = 30,
}) => {
  const [metrics, setMetrics] = useState<ModerationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [highPriority, setHighPriority] = useState(0);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // =====================================================
  // FUNCTIONS
  // =====================================================

  const fetchMetrics = async () => {
    try {
      const [metricsData, highPriorityCount] = await Promise.all([
        moderationMetricsService.getMetrics(),
        moderationMetricsService.getHighPriorityReports(),
      ]);

      setMetrics(metricsData);
      setHighPriority(highPriorityCount);
      setLoading(false);
    } catch (error) {
      logger.error("Error fetching moderation metrics:", {
        error: String(error),
      });
      setLoading(false);
    }
  };

  // =====================================================
  // HELPER COMPONENTS
  // =====================================================

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
    trend,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
    trend?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green:
        "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      yellow:
        "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
      red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      purple:
        "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      gray: "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        )}
      </div>
    );
  };

  const ProgressBar = ({
    label,
    value,
    max,
  }: {
    label: string;
    value: number;
    max: number;
  }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {value}
          </span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-3" />
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalReports = metrics.reports.total;
  const openReports =
    metrics.reports.byStatus.pending + metrics.reports.byStatus.under_review;
  const closedReports =
    metrics.reports.byStatus.resolved + metrics.reports.byStatus.dismissed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            Métricas de Moderación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Panel de control para moderadores • Actualización cada{" "}
            {refreshInterval}s
          </p>
        </div>
        {highPriority > 0 && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 px-4 py-2 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-semibold">
              ⚠️ {highPriority} reportes de alta prioridad pendientes
            </p>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={FlagIcon}
          title="Total de Reportes"
          value={totalReports}
          subtitle="Todos los tiempos"
          color="blue"
        />
        <MetricCard
          icon={ExclamationTriangleIcon}
          title="Reportes Abiertos"
          value={openReports}
          subtitle={`${metrics.reports.byStatus.pending} pendientes, ${metrics.reports.byStatus.under_review} en revisión`}
          color="yellow"
        />
        <MetricCard
          icon={CheckCircleIcon}
          title="Reportes Cerrados"
          value={closedReports}
          subtitle={`${metrics.reports.byStatus.resolved} resueltos, ${metrics.reports.byStatus.dismissed} descartados`}
          color="green"
        />
        <MetricCard
          icon={ClockIcon}
          title="Tiempo Promedio"
          value={`${metrics.reports.avgResolutionTime.toFixed(1)}h`}
          subtitle="Tiempo de resolución"
          color="purple"
        />
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          icon={ChartBarIcon}
          title="Últimas 24 Horas"
          value={metrics.reports.last24Hours}
          subtitle="Nuevos reportes"
          color="blue"
          trend="📈"
        />
        <MetricCard
          icon={UserGroupIcon}
          title="Moderadores Activos"
          value={metrics.moderators.activeCount}
          subtitle={`${metrics.moderators.totalActions} acciones totales`}
          color="purple"
        />
        <MetricCard
          icon={ClockIcon}
          title="Respuesta Promedio"
          value={`${metrics.moderators.avgResponseTime.toFixed(1)}h`}
          subtitle="Tiempo de primera acción"
          color="green"
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            Estado de Reportes
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="⏳ Pendientes"
              value={metrics.reports.byStatus.pending}
              max={totalReports}
            />
            <ProgressBar
              label="👀 En Revisión"
              value={metrics.reports.byStatus.under_review}
              max={totalReports}
            />
            <ProgressBar
              label="✅ Resueltos"
              value={metrics.reports.byStatus.resolved}
              max={totalReports}
            />
            <ProgressBar
              label="❌ Descartados"
              value={metrics.reports.byStatus.dismissed}
              max={totalReports}
            />
          </div>
        </div>

        {/* Reports by Severity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            Severidad de Reportes
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="🔴 Crítico"
              value={metrics.reports.bySeverity.critical}
              max={totalReports}
            />
            <ProgressBar
              label="🟠 Alto"
              value={metrics.reports.bySeverity.high}
              max={totalReports}
            />
            <ProgressBar
              label="🟡 Medio"
              value={metrics.reports.bySeverity.medium}
              max={totalReports}
            />
            <ProgressBar
              label="🟢 Bajo"
              value={metrics.reports.bySeverity.low}
              max={totalReports}
            />
          </div>
        </div>

        {/* Reports by Type */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FlagIcon className="w-5 h-5 text-purple-600" />
            Tipo de Reportes
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="👤 Perfiles"
              value={metrics.reports.byType.profile}
              max={totalReports}
            />
            <ProgressBar
              label="📝 Posts"
              value={metrics.reports.byType.post}
              max={totalReports}
            />
            <ProgressBar
              label="💬 Mensajes"
              value={metrics.reports.byType.message}
              max={totalReports}
            />
            <ProgressBar
              label="📦 Otros"
              value={metrics.reports.byType.other}
              max={totalReports}
            />
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📊 Resumen de Rendimiento
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tasa de Resolución
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {totalReports > 0
                  ? (
                      (metrics.reports.byStatus.resolved / totalReports) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reportes en 7 días
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {metrics.reports.last7Days}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Eficiencia del Equipo
              </span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {metrics.moderators.activeCount > 0
                  ? (
                      metrics.moderators.totalActions /
                      metrics.moderators.activeCount
                    ).toFixed(1)
                  : 0}{" "}
                acciones/mod
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

