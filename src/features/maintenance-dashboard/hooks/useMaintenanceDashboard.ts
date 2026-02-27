/**
 * Hook Principal - Dashboard de Manutenção
 *
 * Orquestra múltiplas queries e calcula métricas agregadas
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { maintenanceDashboardApi } from '../api/maintenance-dashboard-api';
import { metricsCalculator } from '../domain/calculators/MetricsCalculator';
import type { AggregatedMetrics } from '../types';

interface UseMaintenanceDashboardOptions {
  refreshInterval?: number; // em segundos
  enabled?: boolean;
}

interface UseMaintenanceDashboardReturn {
  metrics: AggregatedMetrics | null;
  overview: any;
  workOrders: any;
  anomalies: any;
  maintenancePlans: any;
  systemStatus: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook principal do dashboard de manutenção
 *
 * Features:
 * - Orquestra múltiplas queries em paralelo
 * - Calcula métricas agregadas automaticamente
 * - Refresh automático configurável
 * - Estados de loading/error consolidados
 *
 * @example
 * ```tsx
 * const { metrics, isLoading, refetch } = useMaintenanceDashboard({
 *   refreshInterval: 30 // atualiza a cada 30 segundos
 * });
 * ```
 */
export function useMaintenanceDashboard(
  options: UseMaintenanceDashboardOptions = {}
): UseMaintenanceDashboardReturn {
  const { refreshInterval = 30, enabled = true } = options;

  // Query 1: Overview
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isError: isErrorOverview,
    error: errorOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['maintenance-dashboard', 'overview'],
    queryFn: async () => {
      console.log('🔄 [Dashboard] Fetching overview from backend...');
      const data = await maintenanceDashboardApi.getOverview();
      console.log('✅ [Dashboard] Overview data:', data);
      return data;
    },
    refetchInterval: refreshInterval * 1000,
    enabled,
    retry: 2,
    staleTime: 20000, // 20 segundos
    onError: (err: any) => {
      console.error('❌ [Dashboard] Error fetching overview:', err);
    },
  });

  // Query 2: Work Orders
  const {
    data: workOrders,
    isLoading: isLoadingWorkOrders,
  } = useQuery({
    queryKey: ['maintenance-dashboard', 'work-orders'],
    queryFn: () => maintenanceDashboardApi.getWorkOrdersMetrics(),
    refetchInterval: refreshInterval * 1000,
    enabled,
    retry: 2,
    staleTime: 20000,
  });

  // Query 3: Anomalies
  const {
    data: anomalies,
    isLoading: isLoadingAnomalies,
  } = useQuery({
    queryKey: ['maintenance-dashboard', 'anomalies'],
    queryFn: () => maintenanceDashboardApi.getAnomalyStats(),
    refetchInterval: refreshInterval * 1000,
    enabled,
    retry: 2,
    staleTime: 20000,
  });

  // Query 4: Maintenance Plans
  const {
    data: maintenancePlans,
    isLoading: isLoadingPlans,
  } = useQuery({
    queryKey: ['maintenance-dashboard', 'maintenance-plans'],
    queryFn: () => maintenanceDashboardApi.getMaintenancePlansStats(),
    refetchInterval: refreshInterval * 1000,
    enabled,
    retry: 2,
    staleTime: 20000,
  });

  // Query 5: System Status
  const {
    data: systemStatus,
    isLoading: isLoadingStatus,
  } = useQuery({
    queryKey: ['maintenance-dashboard', 'system-status'],
    queryFn: () => maintenanceDashboardApi.getSystemStatus(),
    refetchInterval: refreshInterval * 1000,
    enabled,
    retry: 2,
    staleTime: 20000,
  });

  // Calcular métricas agregadas
  const metrics = useMemo(() => {
    if (!overview || !workOrders || !anomalies) return null;

    return metricsCalculator.calculateKPIs(
      overview,
      workOrders,
      anomalies,
      maintenancePlans
    );
  }, [overview, workOrders, anomalies, maintenancePlans]);

  const isLoading =
    isLoadingOverview ||
    isLoadingWorkOrders ||
    isLoadingAnomalies ||
    isLoadingPlans ||
    isLoadingStatus;

  const isError = isErrorOverview; // Considerar overview como crítico

  return {
    metrics,
    overview: overview ?? null,
    workOrders: workOrders ?? null,
    anomalies: anomalies ?? null,
    maintenancePlans: maintenancePlans ?? null,
    systemStatus: systemStatus ?? null,
    isLoading,
    isError,
    error: errorOverview ?? null,
    refetch: () => {
      refetchOverview();
      // Outras queries são refetchadas automaticamente pelo React Query
    },
  };
}
