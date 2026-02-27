// src/features/reservas/config/form-config.tsx
import React from 'react';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date' | 'time' | 'number' | 'custom';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  validation?: (value: any) => string | null;
  render?: (props: any) => React.ReactNode;
  colSpan?: number;
}

export const reservasFormFields: FormField[] = [
  {
    key: 'tipoSolicitante',
    label: 'Tipo de Solicitante',
    type: 'select',
    required: true,
    colSpan: 1,
    options: [
      { label: 'Manual', value: 'manual' },
      { label: 'Ordem de Serviço', value: 'ordem_servico' },
      { label: 'Viagem', value: 'viagem' },
      { label: 'Manutenção', value: 'manutencao' }
    ]
  },
  {
    key: 'solicitanteId',
    label: 'ID do Solicitante',
    type: 'text',
    placeholder: 'Ex: OS-2025-001, MANUAL-123',
    colSpan: 1
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    required: true,
    colSpan: 1,
    validation: (value) => {
      if (!value || value.trim().length < 2) {
        return 'Nome do responsável deve ter pelo menos 2 caracteres';
      }
      return null;
    }
  },
  {
    key: 'finalidade',
    label: 'Finalidade',
    type: 'text',
    required: true,
    colSpan: 1,
    validation: (value) => {
      if (!value || value.trim().length < 5) {
        return 'Finalidade deve ter pelo menos 5 caracteres';
      }
      return null;
    }
  },
  {
    key: 'veiculoId',
    label: 'Veículo',
    type: 'custom',
    required: true,
    colSpan: 2,
    render: () => {
      // Este será renderizado pelo componente VeiculoSelector
      // O BaseModal vai precisar ser ajustado para suportar este campo custom
      return null;
    }
  },
  {
    key: 'dataInicio',
    label: 'Data Início',
    type: 'date',
    required: true,
    colSpan: 1,
    validation: (value) => {
      if (!value) return 'Data de início é obrigatória';
      const data = new Date(value);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (data < hoje) {
        return 'Data de início não pode ser no passado';
      }
      return null;
    }
  },
  {
    key: 'horaInicio',
    label: 'Hora Início',
    type: 'time',
    required: true,
    colSpan: 1
  },
  {
    key: 'dataFim',
    label: 'Data Fim',
    type: 'date',
    required: true,
    colSpan: 1
  },
  {
    key: 'horaFim',
    label: 'Hora Fim',
    type: 'time',
    required: true,
    colSpan: 1
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações adicionais sobre a reserva...',
    colSpan: 2
  }
];