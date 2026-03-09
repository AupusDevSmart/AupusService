// src/features/planos-manutencao/config/filter-config.ts
import { FilterConfig } from '@/types/base';

export const planosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome, descrição ou equipamento...',
    className: 'w-full'
  },
  {
    key: 'status',
    type: 'combobox',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'ATIVO', label: 'Ativo' },
      { value: 'INATIVO', label: 'Inativo' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'SUSPENSO', label: 'Suspenso' }
    ],
    className: 'w-full'
  },
  {
    key: 'ativo',
    type: 'combobox',
    label: 'Situação',
    placeholder: 'Todos',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'true', label: 'Ativos' },
      { value: 'false', label: 'Inativos' }
    ],
    className: 'w-full'
  }
];