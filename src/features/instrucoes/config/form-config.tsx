// src/features/instrucoes/config/form-config.tsx
import { FormField } from '@/types/base';
import { SubInstrucoesController } from '../components/form/SubInstrucoesController';
import { RecursosInstrucaoController } from '../components/form/RecursosInstrucaoController';

export const instrucoesFormFields: FormField[] = [
  // Informacoes Basicas
  {
    key: 'tag',
    label: 'TAG da Instrucao',
    type: 'text',
    required: false,
    placeholder: 'Ex: INST-001 (auto-gerado se vazio)',
    colSpan: 1
  } as any,
  {
    key: 'nome',
    label: 'Nome da Instrucao',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lubrificacao Completa do Compressor',
    colSpan: 1
  } as any,
  {
    key: 'descricao',
    label: 'Descricao',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a instrucao...',
    colSpan: 2
  } as any,

  // Sub-instrucoes
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

  // Observacoes e Status
  {
    key: 'observacoes',
    label: 'Observacoes',
    type: 'textarea',
    required: false,
    placeholder: 'Observacoes adicionais sobre a instrucao...',
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
      { value: 'EM_REVISAO', label: 'Em Revisao' },
      { value: 'ARQUIVADA', label: 'Arquivada' }
    ],
    colSpan: 2
  }
];
