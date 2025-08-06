// src/features/programacao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros (normalmente viria da API)
const mockPlantas = [
  { value: '1', label: 'Planta Industrial São Paulo' },
  { value: '2', label: 'Planta Subestação Central' },
  { value: '3', label: 'Estação de Bombeamento Sul' },
  { value: '4', label: 'Oficina João Silva' }
];

const mockResponsaveis = [
  { value: 'João Silva', label: 'João Silva' },
  { value: 'Maria Santos', label: 'Maria Santos' },
  { value: 'Carlos Oliveira', label: 'Carlos Oliveira' },
  { value: 'Pedro Costa', label: 'Pedro Costa' },
  { value: 'Ana Lima', label: 'Ana Lima' }
];

const mockPeriodos = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'amanha', label: 'Amanhã' },
  { value: 'esta_semana', label: 'Esta Semana' },
  { value: 'proxima_semana', label: 'Próxima Semana' },
  { value: 'este_mes', label: 'Este Mês' },
  { value: 'proximo_mes', label: 'Próximo Mês' }
];

export const programacaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por Nº OS, descrição, local ou ativo...',
    className: 'lg:min-w-80'
  },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'PLANEJADA', label: 'Planejada' },
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    className: 'min-w-40'
  },
  {
    key: 'tipo',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
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
      { value: 'CRITICA', label: 'Crítica' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'BAIXA', label: 'Baixa' }
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
      { value: 'ANOMALIA', label: 'Anomalia' },
      { value: 'TAREFA', label: 'Tarefa' },
      { value: 'MANUAL', label: 'Manual' }
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
  },
  {
    key: 'responsavel',
    type: 'select',
    label: 'Responsável',
    placeholder: 'Todos os responsáveis',
    options: [
      { value: 'all', label: 'Todos os responsáveis' },
      ...mockResponsaveis
    ],
    className: 'min-w-48'
  },
  {
    key: 'periodo',
    type: 'select',
    label: 'Período',
    placeholder: 'Todos os períodos',
    options: [
      { value: 'all', label: 'Todos os períodos' },
      ...mockPeriodos
    ],
    className: 'min-w-44'
  }
];