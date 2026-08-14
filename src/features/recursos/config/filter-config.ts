// src/features/recursos/config/filter-config.ts
import { FilterConfig } from '@/types/base';
import { CATEGORIAS_RECURSO } from '@/services/recursos.services';

export const recursosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome...',
    className: 'flex-1 min-w-0',
  },
  {
    key: 'categoria',
    type: 'select',
    label: 'Categoria',
    placeholder: 'Todas as categorias',
    className: 'w-full sm:w-56',
    options: [
      { value: 'all', label: 'Todas as categorias' },
      ...CATEGORIAS_RECURSO.map((c) => ({ value: c.value, label: c.label })),
    ],
  },
];
