// src/features/agenda/config/filter-config.tsx
import { FilterConfig } from '@/types/base';
import type { PlantaResponse } from '@/services/plantas.services';
import { TIPOS_FERIADO, MESES } from '../types';

// ============================================================================
// PLANTA (as do escopo, num combobox: o cadastro cresce)
// ============================================================================

type OpcaoDePlanta = { value: string; label: string };

function plantaDoFiltro(plantas: OpcaoDePlanta[], carregando: boolean): FilterConfig {
  return {
    key: 'plantaId',
    type: 'combobox',
    label: 'Planta',
    placeholder: carregando ? 'Carregando plantas...' : 'Todas as plantas',
    searchPlaceholder: 'Buscar planta...',
    className: 'w-full sm:w-auto sm:min-w-[200px]',
    options: plantas,
  };
}

// ============================================================================
// FERIADOS FILTER CONFIG
// ============================================================================

/** `plantas`: as opções de `usePlantasDoFiltro` (com "Todas as plantas"). */
export function createFeriadosFilterConfig(plantas: OpcaoDePlanta[], carregandoPlantas = false, comAno = false): FilterConfig[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por nome ou descrição...',
      className: 'w-full lg:w-auto lg:min-w-[320px]'
    },
    {
      key: 'tipo',
      type: 'select',
      placeholder: 'Tipo',
      className: 'w-full sm:w-auto sm:min-w-[160px]',
      options: [
        { value: 'all', label: 'Todos os tipos' },
        ...TIPOS_FERIADO.map(tipo => ({
          value: tipo.value,
          label: tipo.label
        }))
      ]
    },
    plantaDoFiltro(plantas, carregandoPlantas),
    {
      key: 'ano',
      type: 'select',
      placeholder: 'Ano',
      className: 'w-full sm:w-auto sm:min-w-[120px]',
      options: [
        { value: 'all', label: 'Todos os anos' },
        ...years.map(year => ({
          value: year.toString(),
          label: year.toString()
        }))
      ]
    },
    {
      key: 'mes',
      type: 'select',
      // O mês é de um ano: sem ele, a API recusa
      disabled: !comAno,
      placeholder: 'Mês',
      className: 'w-full sm:w-auto sm:min-w-[150px]',
      options: [
        { value: 'all', label: 'Todos os meses' },
        ...MESES
      ]
    },
    {
      key: 'geral',
      type: 'select',
      placeholder: 'Abrangência',
      className: 'w-full sm:w-auto sm:min-w-[150px]',
      options: [
        { value: 'all', label: 'Todas as abrangências' },
        { value: 'true', label: 'Geral' },
        { value: 'false', label: 'Específica' }
      ]
    },
    {
      key: 'recorrente',
      type: 'select',
      placeholder: 'Recorrência',
      className: 'w-full sm:w-auto sm:min-w-[150px]',
      options: [
        { value: 'all', label: 'Todas as recorrências' },
        { value: 'true', label: 'Recorrente' },
        { value: 'false', label: 'Única' }
      ]
    }
  ];
}

// ============================================================================
// CONFIGURAÇÕES DIAS ÚTEIS FILTER CONFIG
// ============================================================================

export function createConfiguracoesDiasUteisFilterConfig(plantas: OpcaoDePlanta[], carregandoPlantas = false): FilterConfig[] {
  return [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Buscar por nome ou descrição...',
      className: 'w-full lg:w-auto lg:min-w-[320px]'
    },
    plantaDoFiltro(plantas, carregandoPlantas),
    {
      key: 'geral',
      type: 'select',
      placeholder: 'Abrangência',
      className: 'w-full sm:w-auto sm:min-w-[150px]',
      options: [
        { value: 'all', label: 'Todas as abrangências' },
        { value: 'true', label: 'Geral' },
        { value: 'false', label: 'Específica' }
      ]
    },
    {
      key: 'sabado',
      type: 'select',
      placeholder: 'Sábado',
      className: 'w-full sm:w-auto sm:min-w-[130px]',
      options: [
        { value: 'all', label: 'Sábado: Todos' },
        { value: 'true', label: 'Inclui sábado' },
        { value: 'false', label: 'Exclui sábado' }
      ]
    },
    {
      key: 'domingo',
      type: 'select',
      placeholder: 'Domingo',
      className: 'w-full sm:w-auto sm:min-w-[130px]',
      options: [
        { value: 'all', label: 'Domingo: Todos' },
        { value: 'true', label: 'Inclui domingo' },
        { value: 'false', label: 'Exclui domingo' }
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

export function getActiveFiltersCount(filters: Record<string, unknown>): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    if (value === 'all' || value === '' || value === null || value === undefined) return false;
    return true;
  }).length;
}

export function formatFilterValue(key: string, value: string, plantas: PlantaResponse[]): string {
  switch (key) {
    case 'tipo': {
      const tipo = TIPOS_FERIADO.find(t => t.value === value);
      return tipo?.label || value;
    }

    case 'plantaId': {
      const planta = plantas.find(p => p.id === value);
      return planta?.nome || value;
    }

    case 'mes': {
      const mes = MESES.find(m => m.value === value);
      return mes?.label || value;
    }

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

/** Valor de um filtro da tela: texto ('all', 'true', o ano...) ou numero (pagina). */
type ValorDoFiltro = string | number | null | undefined;

export function buildApiFilters(filters: Record<string, ValorDoFiltro>) {
  const apiFilters: Record<string, string | number | boolean> = {};

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
          apiFilters[key] = parseInt(String(value));
          break;

        default:
          apiFilters[key] = value;
      }
    }
  });

  return apiFilters;
}