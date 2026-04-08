// src/features/instrucoes/config/filter-config.ts
import { FilterConfig } from '@/types/base';

export const instrucoesFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por TAG, nome ou descrição...',
    className: 'w-full'
  }
];
