import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { env } from '@/config/env';
import axios from 'axios';
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

const API_BASE_URL = env.VITE_API_URL;

export const useAdvancedDashboard = (
  filters?: DashboardFilters,
  options?: UseQueryOptions<DashboardAdvancedData>
) => {
  const { user } = useUserStore();

  return useQuery<DashboardAdvancedData>({
    queryKey: ['dashboard-advanced', filters],
    queryFn: async () => {
      try {
        const enhancedFilters: DashboardFilters = {
          ...filters,
          usuarioId: user?.id || undefined,
          proprietarioId: user?.proprietarioId || filters?.proprietarioId,
        };

        const { data } = await axios.get<{ success: boolean; data: DashboardAdvancedData }>(
          `${API_BASE_URL}/dashboard/advanced`,
          {
            params: enhancedFilters,
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        console.log('🔍 [HOOK] Raw axios response:', data);

        // Backend retorna { success: true, data: {...} }, então precisamos acessar data.data
        return data.data;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erro ao carregar dados do dashboard');
        throw error;
      }
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000, // Consider data stale after 30 seconds
    ...options,
  });
};

// Hook for fetching available plants for filtering
export const useAvailablePlants = () => {
  const { user } = useUserStore();

  return useQuery({
    queryKey: ['available-plants', user?.id],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_BASE_URL}/plantas`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          params: {
            usuarioId: user?.id,
            proprietarioId: user?.proprietarioId,
          },
        }
      );
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // Cache for 5 minutes
  });
};

// Hook for fetching available units for a specific plant
export const useAvailableUnits = (plantaId?: string) => {
  const { user } = useUserStore();

  return useQuery({
    queryKey: ['available-units', plantaId],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_BASE_URL}/unidades`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          params: {
            plantaId,
            usuarioId: user?.id,
          },
        }
      );
      return data;
    },
    enabled: !!plantaId && !!user?.id,
    staleTime: 300000, // Cache for 5 minutes
  });
};