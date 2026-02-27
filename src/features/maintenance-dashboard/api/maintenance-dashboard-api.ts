/**
 * API Layer - Dashboard de Manutenção
 *
 * Centraliza todas as chamadas HTTP para o backend
 */

import { api } from '@/config/api';
import type {
  DashboardOverview,
  WorkOrdersMetrics,
  AnomalyStats,
  MaintenancePlansStats,
  SystemStatus,
  TaskPrioritiesDistribution,
  PlannedVsCompletedChartData,
  SeverityDistributionData,
} from '../types';
import {
  adaptOverview,
  adaptWorkOrders,
  adaptAnomalies,
  adaptMaintenancePlans,
  adaptSystemStatus,
} from '../adapters/backend-adapters';

/**
 * Normaliza resposta da API
 * Backend pode retornar { data: {...} } ou diretamente {...}
 */
function normalizeResponse<T>(response: any): T {
  return response.data?.data || response.data || response;
}

export const maintenanceDashboardApi = {
  /**
   * Busca visão geral do dashboard
   */
  async getOverview(): Promise<DashboardOverview> {
    const response = await api.get('/dashboard/overview');
    const backendData = normalizeResponse<any>(response);
    return adaptOverview(backendData);
  },

  /**
   * Busca métricas de ordens de serviço
   */
  async getWorkOrdersMetrics(): Promise<WorkOrdersMetrics> {
    const [workOrdersResponse, plannedVsCompletedResponse, recentOSResponse] = await Promise.all([
      api.get('/dashboard/work-orders'),
      api.get('/dashboard/planned-vs-completed'),
      api.get('/execucao-os', { params: { limit: 5, sortBy: 'criado_em', sortOrder: 'desc' } }).catch(() => ({ data: [] })),
    ]);

    const workOrdersData = normalizeResponse<any>(workOrdersResponse);
    const plannedVsCompletedData = normalizeResponse<any>(plannedVsCompletedResponse);
    const recentOS = normalizeResponse<any>(recentOSResponse);

    return adaptWorkOrders(workOrdersData, plannedVsCompletedData, recentOS);
  },

  /**
   * Busca estatísticas de anomalias
   */
  async getAnomalyStats(periodo?: string): Promise<AnomalyStats> {
    // Buscar stats e severity distribution em paralelo
    const [statsResponse, severityResponse] = await Promise.all([
      api.get('/anomalias/stats', { params: { periodo } }),
      api.get('/dashboard/severity-distribution'),
    ]);

    const statsData = normalizeResponse<any>(statsResponse);
    const severityData = normalizeResponse<any>(severityResponse);

    return adaptAnomalies(statsData, severityData);
  },

  /**
   * Busca estatísticas de planos de manutenção
   */
  async getMaintenancePlansStats(): Promise<MaintenancePlansStats> {
    const response = await api.get('/planos-manutencao/dashboard');
    const backendData = normalizeResponse<any>(response);
    return adaptMaintenancePlans(backendData);
  },

  /**
   * Busca status do sistema
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const [systemStatusResponse, overviewResponse] = await Promise.all([
      api.get('/dashboard/system-status'),
      api.get('/dashboard/overview'),
    ]);

    const systemStatusData = normalizeResponse<any>(systemStatusResponse);
    const overviewData = normalizeResponse<any>(overviewResponse);

    return adaptSystemStatus(systemStatusData, overviewData);
  },

  /**
   * Busca prioridades de tarefas
   */
  async getTaskPriorities(): Promise<TaskPrioritiesDistribution> {
    const response = await api.get('/dashboard/task-priorities');
    return normalizeResponse<TaskPrioritiesDistribution>(response);
  },

  /**
   * Busca dados do gráfico planejado vs executado (últimos 6 meses)
   */
  async getPlannedVsCompleted(): Promise<PlannedVsCompletedChartData[]> {
    const response = await api.get('/dashboard/planned-vs-completed');
    return normalizeResponse<PlannedVsCompletedChartData[]>(response);
  },

  /**
   * Busca distribuição de severidade de anomalias
   */
  async getSeverityDistribution(): Promise<SeverityDistributionData[]> {
    const response = await api.get('/dashboard/severity-distribution');
    return normalizeResponse<SeverityDistributionData[]>(response);
  },
};
