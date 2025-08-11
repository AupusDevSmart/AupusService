// src/features/anomalias/config/form-config.tsx
import { FormField } from '@/types/base';
import { LocalizacaoController } from '../components/LocalizacaoController';
import { AnexosUpload } from '../components/AnexosUpload';

export const anomaliasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'descricao',
    label: 'Descrição da Anomalia',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a anomalia identificada...',
  },

  // Localização
  {
    key: 'localizacao',
    label: 'Localização',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled }) => (
      <LocalizacaoController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
  },

  // Classificação
  {
    key: 'condicao',
    label: 'Condição',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' },
      { value: 'RISCO_ACIDENTE', label: 'Risco de Acidente' }
    ],
  },
  {
    key: 'origem',
    label: 'Origem',
    type: 'select',
    required: true,
    options: [
      { value: 'SCADA', label: 'SCADA' },
      { value: 'OPERADOR', label: 'Operador' },
      { value: 'FALHA', label: 'Falha' }
    ],
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
  },

  // Observações
  {
    key: 'observacoes',
    label: 'Observações Adicionais',
    type: 'textarea',
    required: false,
    placeholder: 'Informações adicionais, contexto, detalhes técnicos...',
  },

  // Anexos (apenas para criação)
  {
    key: 'anexos',
    label: 'Anexos',
    type: 'custom',
    required: false,
    render: AnexosUpload,
    showOnlyOnMode: ['create'] // Só aparece no modo de criação
  }
];