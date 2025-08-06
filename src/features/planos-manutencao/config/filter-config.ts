// src/features/planos-manutencao/config/filter-config.ts
import { FilterConfig } from '@/types/base';
import { CATEGORIAS_PLANO_LABELS } from '../types';

export const planosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar planos por nome ou descrição...',
    className: 'lg:min-w-80'
  },
  {
    key: 'categoria',
    type: 'select',
    label: 'Categoria',
    placeholder: 'Todas as categorias',
    options: [
      { value: 'all', label: 'Todas as categorias' },
      ...Object.entries(CATEGORIAS_PLANO_LABELS).map(([value, label]) => ({
        value,
        label
      }))
    ],
    className: 'min-w-48'
  },
  {
    key: 'ativo',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'true', label: 'Ativos' },
      { value: 'false', label: 'Inativos' }
    ],
    className: 'min-w-36'
  },
  {
    key: 'publico',
    type: 'select',
    label: 'Visibilidade',
    placeholder: 'Todas',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'true', label: 'Públicos' },
      { value: 'false', label: 'Privados' }
    ],
    className: 'min-w-36'
  }
];