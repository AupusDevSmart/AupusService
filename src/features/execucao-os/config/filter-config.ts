// src/features/execucao-os/config/filter-config.ts
import { FilterConfig } from '@/types/base';

// Mock data para os filtros
const mockPlantas = [
  { value: '1', label: 'Planta Industrial A' },
  { value: '2', label: 'Planta Industrial B' },
  { value: '3', label: 'Escritório Central' },
  { value: '4', label: 'Subestação Sul' }
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
  { value: 'ontem', label: 'Ontem' },
  { value: 'esta_semana', label: 'Esta Semana' },
  { value: 'semana_passada', label: 'Semana Passada' },
  { value: 'este_mes', label: 'Este Mês' },
  { value: 'mes_passado', label: 'Mês Passado' }
];

export const execucaoOSFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por Nº OS, descrição, responsável ou local...',
    className: 'lg:min-w-80'
  },
  {
    key: 'statusExecucao',
    type: 'select',
    label: 'Status Execução',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
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
    key: 'planta',
    type: 'select',
    label: 'Local',
    placeholder: 'Todos os locais',
    options: [
      { value: 'all', label: 'Todos os locais' },
      ...mockPlantas
    ],
    className: 'min-w-52'
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