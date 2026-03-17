// src/features/solicitacoes-servico/config/form-config.tsx
import { FormFieldConfig } from '@/types/base';

export const solicitacoesFormFields: FormFieldConfig[] = [
  {
    key: 'titulo',
    label: 'Título',
    type: 'text',
    required: true,
    placeholder: 'Digite o título da solicitação',
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a solicitação',
    rows: 4,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'INSTALACAO', label: 'Instalação' },
      { value: 'MANUTENCAO_CORRETIVA', label: 'Manutenção Corretiva' },
      { value: 'MANUTENCAO_PREVENTIVA', label: 'Manutenção Preventiva' },
      { value: 'MELHORIA', label: 'Melhoria' },
      { value: 'OUTRO', label: 'Outro' },
    ],
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'URGENTE', label: 'Urgente' },
    ],
  },
  {
    key: 'local',
    label: 'Local',
    type: 'text',
    required: true,
    placeholder: 'Informe o local',
  },
  {
    key: 'solicitante_nome',
    label: 'Solicitante',
    type: 'text',
    required: true,
    placeholder: 'Nome do solicitante',
  },
  {
    key: 'solicitante_email',
    label: 'Email do Solicitante',
    type: 'email',
    placeholder: 'email@exemplo.com',
  },
  {
    key: 'justificativa',
    label: 'Justificativa',
    type: 'textarea',
    required: true,
    placeholder: 'Justifique a necessidade desta solicitação',
    rows: 3,
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Observações adicionais (opcional)',
    rows: 3,
  },
];
