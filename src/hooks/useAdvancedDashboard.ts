import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/config/api';
import { useUserStore } from '../store/useUserStore';
import { toast } from 'sonner';

// Interface matching the backend service
export interface DashboardFilters {
  usuarioId?: string;
  proprietarioId?: string;
  plantaId?: string;
  unidadeId?: string;
  periodo?: 'hoje' | '7dias' | '30dias' | '6meses' | 'ano' | 'custom';
  dataInicio?: string;
  dataFim?: string;
}

export interface DashboardMetrics {
  mtbf: number; // Mean Time Between Failures (hours)
  mttr: number; // Mean Time To Repair (hours)
  disponibilidade: number; // Availability percentage
  taxaResolucao: number; // Resolution rate percentage
  eficienciaManutencao: number; // Maintenance efficiency
  custoMedioManutencao: number; // Average maintenance cost
  tempoMedioResolucao: number; // Average resolution time (hours)
  saudeOperacional: number; // Operational health score (0-100)
}

export interface AnomaliasPorTipo {
  tipo: string;
  total: number;
  percentual: number;
}

export interface OrdensServicoPorStatus {
  status: string;
  total: number;
  percentual: number;
}

export interface ManutencoesPorMes {
  mes: string;
  preventivas: number;
  corretivas: number;
  emergenciais: number;
  total: number;
}

export interface EquipamentoCritico {
  id: string;
  nome: string;
  codigo?: string;
  numeroAnomalias: number;
  numeroManutencoes: number;
  tempoInativo: number; // hours
  criticidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  ultimaManutencao?: string;
  proximaManutencao?: string;
}

export interface PlanoManutencaoProximo {
  id: string;
  nome: string;
  equipamento: string;
  dataProximaExecucao: string;
  diasRestantes: number;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
}

export interface TendenciaManutencao {
  periodo: string;
  anomalias: number;
  ordensServico: number;
  custoTotal: number;
}

export interface EstatisticasReservas {
  total: number;
  emAndamento: number;
  finalizadas: number;
  canceladas: number;
  taxaUtilizacao: number; // percentage
}

export interface EstatisticasTarefas {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  taxaConclusao: number; // percentage
}

export interface DashboardAdvancedData {
  metrics: DashboardMetrics;
  anomalias: {
    total: number;
    abertas: number;
    emAndamento: number;
    resolvidas: number;
    porTipo: AnomaliasPorTipo[];
    tendenciaUltimos30Dias: number[]; // daily counts
  };
  ordensServico: {
    total: number;
    abertas: number;
    emExecucao: number;
    concluidas: number;
    canceladas: number;
    porStatus: OrdensServicoPorStatus[];
    porPrioridade: { [key: string]: number };
  };
  manutencoes: {
    totalRealizadas: number;
    preventivas: number;
    corretivas: number;
    emergenciais: number;
    porMes: ManutencoesPorMes[];
    custoTotal: number;
  };
  equipamentosCriticos: EquipamentoCritico[];
  proximasManutencoes: PlanoManutencaoProximo[];
  tendencias: TendenciaManutencao[];
  reservas: EstatisticasReservas;
  tarefas: EstatisticasTarefas;
  ultimaAtualizacao: string;
}

export const useAdvancedDashboard = (
  filters?: DashboardFilters,
  options?: UseQueryOptions<DashboardAdvancedData>
) => {
  return useQuery<DashboardAdvancedData>({
    queryKey: ['dashboard-advanced', filters],
    queryFn: async () => {
      try {
        // Usa instance `api` (interceptor injeta JWT + desempacota response.data.data).
        // Backend filtra por escopo a partir do usuario do JWT - nao precisamos mandar usuarioId.
        const response = await api.get<DashboardAdvancedData>('/dashboard/advanced', {
          params: filters,
        });
        console.log('[DASHBOARD HOOK] response:', response);
        console.log('[DASHBOARD HOOK] response.data:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erro ao carregar dados do dashboard');
        throw error;
      }
    },
    refetchInterval: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
    ...options,
  });
};

// Hook for fetching available plants for filtering
export const useAvailablePlants = () => {
  const { user } = useUserStore();

  return useQuery({
    queryKey: ['available-plants', user?.id],
    queryFn: async () => {
      const response = await api.get('/plantas');
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });
};

// Hook for fetching available units for a specific plant
export const useAvailableUnits = (plantaId?: string) => {
  const { user } = useUserStore();

  return useQuery({
    queryKey: ['available-units', plantaId],
    queryFn: async () => {
      const response = await api.get('/unidades', { params: { plantaId } });
      return response.data;
    },
    enabled: !!plantaId && !!user?.id,
    staleTime: 300000,
  });
};