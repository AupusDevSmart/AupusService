// src/features/anomalias/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockPeriodos = [
  { value: 'Janeiro de 2025', label: 'Janeiro de 2025' },
  { value: 'Fevereiro de 2025', label: 'Fevereiro de 2025' },
  { value: 'Março de 2025', label: 'Março de 2025' },
  { value: 'Abril de 2025', label: 'Abril de 2025' },
  { value: 'Maio de 2025', label: 'Maio de 2025' },
  { value: 'Junho de 2025', label: 'Junho de 2025' }
];

const mockPlantas = [
  { value: '1', label: 'Planta Industrial São Paulo' },
  { value: '2', label: 'Planta Subestação Central' },
  { value: '3', label: 'Estação de Bombeamento Sul' },
  { value: '4', label: 'Oficina João Silva' }
];

export const anomaliasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por descrição, local, ativo ou ID...',
    className: 'lg:min-w-80'
  },
  {
    key: 'periodo',
    type: 'select',
    label: 'Período',
    placeholder: 'Selecionar período',
    options: [
      { value: 'all', label: 'Todos os períodos' },
      ...mockPeriodos
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
      { value: 'AGUARDANDO', label: 'Aguardando' },
      { value: 'EM_ANALISE', label: 'Em Análise' },
      { value: 'OS_GERADA', label: 'OS Gerada' },
      { value: 'RESOLVIDA', label: 'Resolvida' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'prioridade',
    type: 'select',
    label: 'Prioridade',
    placeholder: 'Todas as prioridades',
    options: [
      { value: 'all', label: 'Todas as prioridades' },
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
    className: 'min-w-44'
  },
  {
    key: 'origem',
    type: 'select',
    label: 'Origem',
    placeholder: 'Todas as origens',
    options: [
      { value: 'all', label: 'Todas as origens' },
      { value: 'SCADA', label: 'SCADA' },
      { value: 'OPERADOR', label: 'Operador' },
      { value: 'FALHA', label: 'Falha' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'planta',
    type: 'select',
    label: 'Planta',
    placeholder: 'Todas as plantas',
    options: [
      { value: 'all', label: 'Todas as plantas' },
      ...mockPlantas
    ],
    className: 'min-w-52'
  }
];