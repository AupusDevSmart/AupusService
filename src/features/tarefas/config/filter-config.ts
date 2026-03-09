// src/features/tarefas/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Configuração base dos filtros - as opções dinâmicas serão carregadas via API
export const tarefasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por TAG, descrição ou equipamento...',
    className: 'w-full'
  },
  {
    key: 'planta_id',
    type: 'combobox',
    label: 'Planta',
    placeholder: 'Todas as plantas',
    options: [
      { value: 'all', label: 'Todas as plantas' }
      // As opções serão carregadas dinamicamente
    ],
    className: 'w-full'
  },
  {
    key: 'unidade_id',
    type: 'combobox',
    label: 'Instalação',
    placeholder: 'Todas as instalações',
    options: [
      { value: 'all', label: 'Todas as instalações' }
      // As opções serão carregadas dinamicamente
    ],
    className: 'w-full'
  },
  {
    key: 'plano_id',
    type: 'combobox',
    label: 'Plano',
    placeholder: 'Todos os planos',
    options: [
      { value: 'all', label: 'Todos os planos' }
      // As opções serão carregadas dinamicamente
    ],
    className: 'w-full'
  }
];