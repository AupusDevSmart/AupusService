// src/features/reservas/config/filter-config.ts
import { type FilterConfig } from '@/types/base';
import { VeiculosService, type VeiculoResponse } from '@/services/veiculos.services';
import { useState, useEffect } from 'react';

// ============================================================================
// HOOK: useVeiculos - For filter dropdown
// ============================================================================

interface UseVeiculosReturn {
  veiculos: VeiculoResponse[];
  loading: boolean;
  error: string | null;
}

export const useVeiculos = (): UseVeiculosReturn => {
  const [veiculos, setVeiculos] = useState<VeiculoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVeiculos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await VeiculosService.getAllVeiculos({
          limit: 100, // Get more vehicles for filter
          orderBy: 'nome',
          orderDirection: 'asc'
        });

        setVeiculos(response.data);
      } catch (err) {
        console.error('Erro ao carregar veículos para filtro:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar veículos');
        setVeiculos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVeiculos();
  }, []);

  return { veiculos, loading, error };
};

// ============================================================================
// FILTER CONFIGURATIONS
// ============================================================================

export const createReservasFilterConfig = (veiculos: VeiculoResponse[]): FilterConfig[] => [
  // Search
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por responsável, finalidade...',
    className: 'lg:min-w-80'
  },

  // Veículo
  {
    key: 'veiculoId',
    type: 'select',
    label: 'Veículo',
    placeholder: 'Todos os veículos',
    options: [
      { value: 'all', label: 'Todos os veículos' },
      ...veiculos.map(veiculo => ({
        value: String(veiculo.id),
        label: `${veiculo.nome} (${veiculo.placa})`
      }))
    ]
  },

  // Status
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'ativa', label: 'Ativa' },
      { value: 'finalizada', label: 'Finalizada' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' }
    ]
  },

  // Tipo Solicitante
  {
    key: 'tipoSolicitante',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'ordem_servico', label: 'Ordem de Serviço' },
      { value: 'viagem', label: 'Viagem' },
      { value: 'manutencao', label: 'Manutenção' },
      { value: 'manual', label: 'Manual' }
    ]
  },

  // Responsável
  {
    key: 'responsavel',
    type: 'search',
    label: 'Responsável',
    placeholder: 'Nome do responsável'
  },

  // Data Início (From)
  {
    key: 'dataInicioFrom',
    type: 'date',
    label: 'Data Início De',
    placeholder: 'Data início mínima'
  },

  // Data Início (To)
  {
    key: 'dataInicioTo',
    type: 'date',
    label: 'Data Início Até',
    placeholder: 'Data início máxima'
  }
];
