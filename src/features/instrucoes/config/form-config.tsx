// src/features/instrucoes/config/form-config.tsx
import { FormField } from '@/types/base';
import { SubInstrucoesController } from '../components/form/SubInstrucoesController';
import { RecursosInstrucaoController } from '../components/form/RecursosInstrucaoController';

export const instrucoesFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'tag',
    label: 'TAG da Instrução',
    type: 'text',
    required: false,
    placeholder: 'Ex: INST-001 (auto-gerado se vazio)',
    colSpan: 1
  } as any,
  {
    key: 'nome',
    label: 'Nome da Instrução',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lubrificação Completa do Compressor',
    colSpan: 1
  } as any,
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a instrução...',
    colSpan: 2
  } as any,

  // Sub-instruções
  {
    key: 'sub_instrucoes',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    render: ({ value, onChange, disabled }) => (
      <SubInstrucoesController
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    )
  },

  // Recursos
  {
    key: 'recursos',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    render: ({ value, onChange, disabled }) => (
      <RecursosInstrucaoController
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    )
  },

  // Observações e Status
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    placeholder: 'Observações adicionais sobre a instrução...',
    colSpan: 2
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'ATIVA', label: 'Ativa' },
      { value: 'INATIVA', label: 'Inativa' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'ARQUIVADA', label: 'Arquivada' }
    ],
    colSpan: 2
  }
];
