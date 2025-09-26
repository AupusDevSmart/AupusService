// src/features/planos-manutencao/config/filter-config.ts
import { FilterConfig } from '@/types/base';

export const planosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar planos por nome ou descrição...',
    className: 'lg:min-w-80'
  },
  {
    key: 'equipamento_id',
    type: 'select',
    label: 'Equipamento',
    placeholder: 'Todos os equipamentos',
    options: [
      { value: 'all', label: 'Todos os equipamentos' }
    ],
    className: 'min-w-48'
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'ATIVO', label: 'Ativo' },
      { value: 'INATIVO', label: 'Inativo' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'SUSPENSO', label: 'Suspenso' }
    ],
    className: 'min-w-36'
  },
  {
    key: 'ativo',
    type: 'select',
    label: 'Ativo/Inativo',
    placeholder: 'Todos',
    options: [
      { value: 'all', label: 'Todos' },
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