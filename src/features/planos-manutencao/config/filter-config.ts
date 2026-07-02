// src/features/planos-manutencao/config/filter-config.ts
import { FilterConfig } from '@/types/base';

export const planosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, descrição ou equipamento...',
    className: 'w-full'
  }
];