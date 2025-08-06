// src/features/reservas/config/filter-config.ts

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export const reservasFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    label: 'Busca',
    type: 'text',
    placeholder: 'Buscar por responsável, finalidade, solicitante...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Todos os Status', value: 'all' },
      { label: 'Ativa', value: 'ativa' },
      { label: 'Finalizada', value: 'finalizada' },
      { label: 'Cancelada', value: 'cancelada' },
      { label: 'Vencida', value: 'vencida' }
    ]
  },
  {
    key: 'tipoSolicitante',
    label: 'Tipo de Solicitante',
    type: 'select',
    options: [
      { label: 'Todos os Tipos', value: 'all' },
      { label: 'Manual', value: 'manual' },
      { label: 'Ordem de Serviço', value: 'ordem_servico' },
      { label: 'Viagem', value: 'viagem' },
      { label: 'Manutenção', value: 'manutencao' }
    ]
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    placeholder: 'Nome do responsável...'
  },
  {
    key: 'dataInicio',
    label: 'Data Início',
    type: 'date'
  },
  {
    key: 'dataFim',
    label: 'Data Fim',
    type: 'date'
  }
];