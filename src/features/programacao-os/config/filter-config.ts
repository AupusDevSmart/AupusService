// src/features/programacao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

/**
 * Filtros principais de Programação de OS
 * Segue o padrão do FEATURE_REFACTORING_GUIDE.md
 *
 * - 1 filtro de busca (texto)
 * - 3 filtros principais (combobox)
 */

export const programacaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por código, descrição, local...',
    className: 'lg:min-w-80'
  },
  {
    key: 'status',
    type: 'combobox',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'APROVADA', label: 'Aprovada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'tipo',
    type: 'combobox',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'prioridade',
    type: 'combobox',
    label: 'Prioridade',
    placeholder: 'Todas as prioridades',
    options: [
      { value: 'all', label: 'Todas as prioridades' },
      { value: 'CRITICA', label: 'Crítica' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'BAIXA', label: 'Baixa' }
    ],
    className: 'min-w-36'
  }
];