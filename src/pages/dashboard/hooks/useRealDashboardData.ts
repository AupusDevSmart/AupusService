// src/pages/dashboard/hooks/useRealDashboardData.ts
// Hook que usa as APIs REAIS existentes no backend

import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';

// DTOs baseados no backend real
interface DashboardOverview {
  total_equipamentos: number;
  equipamentos_com_falhas: number;
  equipamentos_parados: number;
  os_abertas: number;
  os_em_execucao: number;
  os_finalizadas: number;
}

interface DashboardWorkOrders {
  os_abertas: number;
  nota_qualidade: number;
  os_atrasadas: number;
  os_finalizadas: number;
  indicador_carga_trabalho: number;
}

interface DashboardTaskPriorities {
  tarefas: Array<{
    id: string;
    nome: string;
    criticidade: number;
    status: string;
    equipamento_nome: string;
    criado_em: string;
  }>;
  total_tarefas_ativas: number;
  tarefas_criticidade_muito_alta: number;
  tarefas_criticidade_alta: number;
}

interface DashboardSeverityDistribution {
  baixa: number;
  media: number;
  alta: number;
  critica: number;
  total_anomalias: number;
}

interface DashboardPlannedVsCompleted {
  meses: Array<{
    mes: string;
    mes_numero: number;
    planejadas: number;
    concluidas: number;
    taxa_conclusao: number;
  }>;
  total_planejadas: number;
  total_concluidas: number;
  taxa_conclusao_media: number;
}

interface DashboardSystemStatus {
  paradas_programadas: number;
  equipamentos_status_critico: number;
  equipamentos_classe_critica: number;
  paradas_nao_programadas: number;
  falhas_causando_danos: number;
  sensores_danificados: number;
}

/**
 * Hook que busca dados reais do dashboard das APIs existentes
 */
export function useRealDashboardData() {
  // Query 1: Overview
  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>('/dashboard/overview');
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 25000,
  });

  // Query 2: Work Orders
  const workOrdersQuery = useQuery({
    queryKey: ['dashboard', 'work-orders'],
    queryFn: async () => {
      const { data } = await api.get<DashboardWorkOrders>('/dashboard/work-orders');
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Query 3: Task Priorities
  const taskPrioritiesQuery = useQuery({
    queryKey: ['dashboard', 'task-priorities'],
    queryFn: async () => {
      const { data } = await api.get<DashboardTaskPriorities>('/dashboard/task-priorities');
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Query 4: Severity Distribution
  const severityDistributionQuery = useQuery({
    queryKey: ['dashboard', 'severity-distribution'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSeverityDistribution>('/dashboard/severity-distribution');
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Query 5: Planned vs Completed
  const plannedVsCompletedQuery = useQuery({
    queryKey: ['dashboard', 'planned-vs-completed'],
    queryFn: async () => {
      const { data } = await api.get<DashboardPlannedVsCompleted>('/dashboard/planned-vs-completed');
      return data;
    },
    refetchInterval: 60000, // Atualiza a cada minuto (dados históricos mudam menos)
    staleTime: 55000,
  });

  // Query 6: System Status
  const systemStatusQuery = useQuery({
    queryKey: ['dashboard', 'system-status'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSystemStatus>('/dashboard/system-status');
      return data;
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Função para refetch all
  const refetch = () => {
    overviewQuery.refetch();
    workOrdersQuery.refetch();
    taskPrioritiesQuery.refetch();
    severityDistributionQuery.refetch();
    plannedVsCompletedQuery.refetch();
    systemStatusQuery.refetch();
  };

  // Status de loading e erro consolidados
  const isLoading =
    overviewQuery.isLoading ||
    workOrdersQuery.isLoading ||
    taskPrioritiesQuery.isLoading ||
    severityDistributionQuery.isLoading;

  const error =
    overviewQuery.error ||
    workOrdersQuery.error ||
    taskPrioritiesQuery.error ||
    severityDistributionQuery.error;

  return {
    overview: overviewQuery.data,
    workOrders: workOrdersQuery.data,
    taskPriorities: taskPrioritiesQuery.data,
    severityDistribution: severityDistributionQuery.data,
    plannedVsCompleted: plannedVsCompletedQuery.data,
    systemStatus: systemStatusQuery.data,
    isLoading,
    error,
    refetch
  };
}