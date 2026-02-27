/**
 * Domain Layer - Calculador de Métricas
 *
 * Lógica de negócio isolada e testável para cálculo de KPIs
 */

import type {
  DashboardOverview,
  WorkOrdersMetrics,
  AnomalyStats,
  MaintenancePlansStats,
  AggregatedMetrics,
} from '../../types';

export class MetricsCalculator {
  /**
   * Calcula KPIs agregados do dashboard
   */
  calculateKPIs(
    overview: DashboardOverview,
    workOrders: WorkOrdersMetrics,
    anomalies: AnomalyStats,
    maintenancePlans?: MaintenancePlansStats
  ): AggregatedMetrics {
    return {
      // Ordens de Serviço
      totalWorkOrders: workOrders.totalOpen,
      overdueWorkOrders: workOrders.overdueCount,
      completionRate: this.calculateCompletionRate(workOrders),
      workQuality: workOrders.qualityScore,

      // Anomalias
      totalAnomalies: anomalies.total,
      criticalAnomalies: anomalies.byPriority.critical,
      resolutionRate: this.calculateResolutionRate(anomalies),
      avgResolutionTime: anomalies.avgResolutionTimeHours,

      // Performance
      systemUptime: overview.systemUptime,
      plannedDowntime: overview.plannedDowntime,
      unplannedDowntime: overview.unplannedDowntime,

      // Tendências
      trend: this.calculateTrends(overview),
    };
  }

  /**
   * Calcula taxa de conclusão de ordens de serviço
   */
  calculateCompletionRate(workOrders: WorkOrdersMetrics): number {
    if (workOrders.totalPlanned === 0) return 0;
    return (workOrders.completed / workOrders.totalPlanned) * 100;
  }

  /**
   * Calcula taxa de resolução de anomalias
   */
  calculateResolutionRate(anomalies: AnomalyStats): number {
    if (anomalies.total === 0) return 0;
    return (anomalies.resolved / anomalies.total) * 100;
  }

  /**
   * Calcula tendências de mudança
   */
  private calculateTrends(overview: DashboardOverview) {
    return {
      workOrders: overview.workOrdersTrend || 0,
      anomalies: overview.anomaliesTrend || 0,
      uptime: overview.uptimeTrend || 0,
    };
  }

  /**
   * Calcula percentual de progresso
   */
  calculateProgressPercentage(current: number, total: number): number {
    if (total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  }

  /**
   * Determina severidade baseado em limites
   */
  determineSeverity(
    value: number,
    thresholds: { warning: number; critical: number }
  ): 'normal' | 'warning' | 'critical' {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Calcula média
   */
  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }
}

// Singleton instance
export const metricsCalculator = new MetricsCalculator();
