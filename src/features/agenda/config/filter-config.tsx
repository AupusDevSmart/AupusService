// src/features/agenda/config/filter-config.tsx
import { useState, useEffect } from 'react';
import { FilterConfig } from '@/types/base';
import { PlantasService, PlantaResponse } from '@/services/plantas.services';
import { TIPOS_FERIADO, MESES } from '../types';

// ============================================================================
// HOOK PARA CARREGAR PLANTAS
// ============================================================================

export function usePlantas() {
  const [plantas, setPlantas] = useState<PlantaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlantas = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        setPlantas(response.data);
        console.log('✅ [AGENDA FILTERS] Plantas carregadas:', response.data.length);
      } catch (err: any) {
        console.error('❌ [AGENDA FILTERS] Erro ao carregar plantas:', err);
        setError(err.message || 'Erro ao carregar plantas');
        setPlantas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlantas();
  }, []);

  return { plantas, loading, error };
}

// ============================================================================
// FERIADOS FILTER CONFIG
// ============================================================================

export function createFeriadosFilterConfig(plantas: PlantaResponse[]): FilterConfig[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por nome ou descrição...',
      className: 'lg:min-w-80'
    },
    {
      key: 'tipo',
      type: 'select',
      label: 'Tipo',
      className: 'min-w-40',
      options: [
        { value: 'all', label: 'Todos os tipos' },
        ...TIPOS_FERIADO.map(tipo => ({
          value: tipo.value,
          label: tipo.label
        }))
      ]
    },
    {
      key: 'plantaId',
      type: 'select',
      label: 'Planta',
      className: 'min-w-48',
      options: [
        { value: 'all', label: 'Todas as plantas' },
        ...plantas.map(planta => ({
          value: planta.id,
          label: planta.nome
        }))
      ]
    },
    {
      key: 'ano',
      type: 'select',
      label: 'Ano',
      className: 'min-w-32',
      options: [
        { value: 'all', label: 'Todos' },
        ...years.map(year => ({
          value: year.toString(),
          label: year.toString()
        }))
      ]
    },
    {
      key: 'mes',
      type: 'select',
      label: 'Mês',
      className: 'min-w-36',
      options: [
        { value: 'all', label: 'Todos os meses' },
        ...MESES
      ]
    },
    {
      key: 'geral',
      type: 'select',
      label: 'Abrangência',
      className: 'min-w-36',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'true', label: 'Geral' },
        { value: 'false', label: 'Específica' }
      ]
    },
    {
      key: 'recorrente',
      type: 'select',
      label: 'Recorrência',
      className: 'min-w-36',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'true', label: 'Recorrente' },
        { value: 'false', label: 'Única' }
      ]
    }
  ];
}

// ============================================================================
// CONFIGURAÇÕES DIAS ÚTEIS FILTER CONFIG
// ============================================================================

export function createConfiguracoesDiasUteisFilterConfig(plantas: PlantaResponse[]): FilterConfig[] {
  return [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por nome ou descrição...',
      className: 'lg:min-w-80'
    },
    {
      key: 'plantaId',
      type: 'select',
      label: 'Planta',
      className: 'min-w-48',
      options: [
        { value: 'all', label: 'Todas as plantas' },
        ...plantas.map(planta => ({
          value: planta.id,
          label: planta.nome
        }))
      ]
    },
    {
      key: 'geral',
      type: 'select',
      label: 'Abrangência',
      className: 'min-w-36',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'true', label: 'Geral' },
        { value: 'false', label: 'Específica' }
      ]
    },
    {
      key: 'sabado',
      type: 'select',
      label: 'Sábado',
      className: 'min-w-32',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'true', label: 'Inclui' },
        { value: 'false', label: 'Exclui' }
      ]
    },
    {
      key: 'domingo',
      type: 'select',
      label: 'Domingo',
      className: 'min-w-32',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'true', label: 'Inclui' },
        { value: 'false', label: 'Exclui' }
      ]
    }
  ];
}

// ============================================================================
// FILTER PRESETS
// ============================================================================

export const feriadosFilterPresets = {
  nacionais: {
    label: 'Feriados Nacionais',
    filters: {
      tipo: 'NACIONAL',
      geral: 'true'
    }
  },
  recorrentes: {
    label: 'Feriados Recorrentes',
    filters: {
      recorrente: 'true'
    }
  },
  anoAtual: {
    label: 'Ano Atual',
    filters: {
      ano: new Date().getFullYear().toString()
    }
  },
  proximosMeses: {
    label: 'Próximos 3 Meses',
    filters: {
      ano: new Date().getFullYear().toString(),
      // Aqui poderia implementar lógica mais complexa
    }
  }
};

export const configuracoesDiasUteisFilterPresets = {
  gerais: {
    label: 'Configurações Gerais',
    filters: {
      geral: 'true'
    }
  },
  comFimDeSemana: {
    label: 'Com Fim de Semana',
    filters: {
      sabado: 'true',
      domingo: 'true'
    }
  },
  somenteUteis: {
    label: 'Somente Dias Úteis',
    filters: {
      sabado: 'false',
      domingo: 'false'
    }
  }
};

// ============================================================================
// FILTER HELPERS
// ============================================================================

export function getActiveFiltersCount(filters: Record<string, any>): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    if (value === 'all' || value === '' || value === null || value === undefined) return false;
    return true;
  }).length;
}

export function formatFilterValue(key: string, value: string, plantas: PlantaResponse[]): string {
  switch (key) {
    case 'tipo':
      const tipo = TIPOS_FERIADO.find(t => t.value === value);
      return tipo?.label || value;

    case 'plantaId':
      const planta = plantas.find(p => p.id === value);
      return planta?.nome || value;

    case 'mes':
      const mes = MESES.find(m => m.value === value);
      return mes?.label || value;

    case 'geral':
      return value === 'true' ? 'Geral' : 'Específica';

    case 'recorrente':
      return value === 'true' ? 'Recorrente' : 'Única';

    case 'sabado':
    case 'domingo':
      return value === 'true' ? 'Inclui' : 'Exclui';

    default:
      return value;
  }
}

export function buildApiFilters(filters: Record<string, any>) {
  const apiFilters: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== '') {
      switch (key) {
        case 'geral':
        case 'recorrente':
        case 'sabado':
        case 'domingo':
          apiFilters[key] = value === 'true';
          break;

        case 'ano':
        case 'mes':
          apiFilters[key] = parseInt(value);
          break;

        default:
          apiFilters[key] = value;
      }
    }
  });

  return apiFilters;
}