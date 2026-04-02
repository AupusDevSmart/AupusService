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

  // Classificacao
  {
    key: 'categoria',
    label: 'Categoria',
    type: 'select',
    required: true,
    options: [
      { value: 'MECANICA', label: 'Mecanica' },
      { value: 'ELETRICA', label: 'Eletrica' },
      { value: 'INSTRUMENTACAO', label: 'Instrumentacao' },
      { value: 'LUBRIFICACAO', label: 'Lubrificacao' },
      { value: 'LIMPEZA', label: 'Limpeza' },
      { value: 'INSPECAO', label: 'Inspecao' },
      { value: 'CALIBRACAO', label: 'Calibracao' },
      { value: 'OUTROS', label: 'Outros' }
    ],
    width: 'half'
  },
  {
    key: 'tipo_manutencao',
    label: 'Tipo de Manutencao',
    type: 'select',
    required: true,
    options: [
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspecao' },
      { value: 'VISITA_TECNICA', label: 'Visita Tecnica' }
    ],
    width: 'half'
  },
  {
    key: 'criticidade',
    label: 'Criticidade',
    type: 'select',
    required: true,
    options: [
      { value: '1', label: 'Muito Baixa' },
      { value: '2', label: 'Baixa' },
      { value: '3', label: 'Media' },
      { value: '4', label: 'Alta' },
      { value: '5', label: 'Muito Alta' }
    ],
    width: 'half'
  },
  {
    key: 'condicao_ativo',
    label: 'Condicao do Ativo',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' },
      { value: 'QUALQUER', label: 'Qualquer' }
    ],
    width: 'half'
  },

  // Planejamento
  {
    key: 'duracao_estimada',
    label: 'Duracao Estimada (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 3',
    width: 'half'
  },
  {
    key: 'tempo_estimado',
    label: 'Tempo Estimado (minutos)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 180',
    width: 'half'
  },

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
