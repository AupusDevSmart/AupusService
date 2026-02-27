import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import type {
  OverviewApiResponse,
  WorkOrdersApiResponse,
  TaskPriorityApiResponse,
  SeverityDistributionApiResponse,
  PlannedVsCompletedApiResponse,
  SystemStatusApiResponse,
  DashboardData,
  Task,
} from '../types';

const API_BASE = '/dashboard';

// Helper functions para mapear dados da API
function mapCriticidadeToPriority(criticidade: number): 'urgent' | 'high' | 'medium' | 'low' {
  if (criticidade === 5) return 'urgent';
  if (criticidade === 4) return 'high';
  if (criticidade === 3) return 'medium';
  return 'low';
}

function mapStatusTarefa(status: string): 'pending' | 'in-progress' | 'completed' {
  if (status === 'ATIVA') return 'pending';
  if (status === 'EM_REVISAO') return 'in-progress';
  return 'completed';
}

// Converter contagens absolutas em porcentagens
function calculatePercentages(counts: { baixa: number; media: number; alta: number; critica: number }) {
  const total = counts.baixa + counts.media + counts.alta + counts.critica;

  if (total === 0) {
    return { baixa: 0, media: 0, alta: 0, critica: 0 };
  }

  return {
    baixa: Math.round((counts.baixa / total) * 100),
    media: Math.round((counts.media / total) * 100),
    alta: Math.round((counts.alta / total) * 100),
    critica: Math.round((counts.critica / total) * 100),
  };
}

export function useDashboard() {
  // Fetch all endpoints in parallel
  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<OverviewApiResponse>(`${API_BASE}/overview`);
      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30s
    staleTime: 25000,
  });

  const workOrdersQuery = useQuery({
    queryKey: ['dashboard', 'work-orders'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrdersApiResponse>(`${API_BASE}/work-orders`);
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const taskPrioritiesQuery = useQuery({
    queryKey: ['dashboard', 'task-priorities'],
    queryFn: async () => {
      const { data } = await api.get<TaskPriorityApiResponse>(`${API_BASE}/task-priorities`);
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const severityQuery = useQuery({
    queryKey: ['dashboard', 'severity-distribution'],
    queryFn: async () => {
      const { data } = await api.get<SeverityDistributionApiResponse>(`${API_BASE}/severity-distribution`);
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const plannedVsCompletedQuery = useQuery({
    queryKey: ['dashboard', 'planned-vs-completed'],
    queryFn: async () => {
      const { data } = await api.get<PlannedVsCompletedApiResponse>(`${API_BASE}/planned-vs-completed`);
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const systemStatusQuery = useQuery({
    queryKey: ['dashboard', 'system-status'],
    queryFn: async () => {
      const { data } = await api.get<SystemStatusApiResponse>(`${API_BASE}/system-status`);
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Transformar dados da API para o formato esperado pelos componentes
  const dashboardData: DashboardData | null = useMemo(() => {
    if (
      !overviewQuery.data ||
      !workOrdersQuery.data ||
      !taskPrioritiesQuery.data ||
      !severityQuery.data ||
      !plannedVsCompletedQuery.data ||
      !systemStatusQuery.data
    ) {
      return null;
    }

    // Mapear tarefas para o formato do frontend
    const tasks: Task[] = taskPrioritiesQuery.data.tarefas.map((t) => ({
      id: t.id,
      title: t.nome,
      priority: mapCriticidadeToPriority(t.criticidade),
      status: mapStatusTarefa(t.status),
    }));

    // Converter contagens de severidade em porcentagens
    const severityPercentages = calculatePercentages({
      baixa: severityQuery.data.baixa,
      media: severityQuery.data.media,
      alta: severityQuery.data.alta,
      critica: severityQuery.data.critica,
    });

    // Calcular risk levels baseado em anomalias (também em porcentagens)
    const totalRisk = severityQuery.data.baixa + severityQuery.data.media + severityQuery.data.alta + severityQuery.data.critica;
    const riskPercentages = totalRisk === 0
      ? { low: 0, medium: 0, high: 0 }
      : {
          low: Math.round((severityQuery.data.baixa / totalRisk) * 100),
          medium: Math.round((severityQuery.data.media / totalRisk) * 100),
          high: Math.round(((severityQuery.data.alta + severityQuery.data.critica) / totalRisk) * 100),
        };

    return {
      overview: {
        totalAssets: overviewQuery.data.total_equipamentos,
        assetsFaults: overviewQuery.data.equipamentos_com_falhas,
        assetsDown: overviewQuery.data.equipamentos_parados,
        openWorker: overviewQuery.data.os_abertas,
        workInProgress: overviewQuery.data.os_em_execucao,
        completed: overviewQuery.data.os_finalizadas,
      },
      taskPriorities: tasks,
      serviceSeverity: severityPercentages,
      riskLevels: riskPercentages,
      plannedVsCompleted: plannedVsCompletedQuery.data.meses.map((m) => ({
        month: m.mes,
        planejadas: m.planejadas,
        concluidas: m.concluidas,
      })),
      systemStatus: {
        scheduledDowntime: systemStatusQuery.data.paradas_programadas,
        assetStatus: systemStatusQuery.data.equipamentos_status_critico,
        assetClass: systemStatusQuery.data.equipamentos_classe_critica,
        unscheduledDowntime: systemStatusQuery.data.paradas_nao_programadas,
        faultsCausingDamage: systemStatusQuery.data.falhas_causando_danos,
        sensorsDamaged: systemStatusQuery.data.sensores_danificados,
      },
      workOrders: {
        openWorkOrders: workOrdersQuery.data.os_abertas,
        workGrade: workOrdersQuery.data.nota_qualidade,
        overdueWorkOrders: workOrdersQuery.data.os_atrasadas,
        completedWorkOrders: workOrdersQuery.data.os_finalizadas,
        workloadIndicator: workOrdersQuery.data.indicador_carga_trabalho,
      },
    };
  }, [
    overviewQuery.data,
    workOrdersQuery.data,
    taskPrioritiesQuery.data,
    severityQuery.data,
    plannedVsCompletedQuery.data,
    systemStatusQuery.data,
  ]);

  const isLoading =
    overviewQuery.isLoading ||
    workOrdersQuery.isLoading ||
    taskPrioritiesQuery.isLoading ||
    severityQuery.isLoading ||
    plannedVsCompletedQuery.isLoading ||
    systemStatusQuery.isLoading;

  const error =
    overviewQuery.error ||
    workOrdersQuery.error ||
    taskPrioritiesQuery.error ||
    severityQuery.error ||
    plannedVsCompletedQuery.error ||
    systemStatusQuery.error;

  const refetch = () => {
    overviewQuery.refetch();
    workOrdersQuery.refetch();
    taskPrioritiesQuery.refetch();
    severityQuery.refetch();
    plannedVsCompletedQuery.refetch();
    systemStatusQuery.refetch();
  };

  return {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  };
}
