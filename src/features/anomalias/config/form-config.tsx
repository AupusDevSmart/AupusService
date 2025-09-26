// src/features/anomalias/config/form-config.tsx - VERSÃO CORRIGIDA
import { FormField } from '@/types/base';
import { LocalizacaoController } from '../components/LocalizacaoController';
import { AnexosUpload } from '../components/AnexosUpload';

// ✅ SOLUÇÃO: Extrair renders como funções estáveis FORA do array
const LocalizacaoRender = ({ value, onChange, disabled, mode }: any) => (
  <LocalizacaoController 
    value={value} 
    onChange={onChange} 
    disabled={disabled}
    mode={mode}
  />
);

const AnexosRender = ({ value, onChange, disabled, mode, entity }: any) => (
  <AnexosUpload 
    value={value} 
    onChange={onChange} 
    disabled={disabled}
    mode={mode}
    anomaliaId={entity?.id}
  />
);

export const anomaliasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'descricao',
    label: 'Descrição da Anomalia',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a anomalia identificada...',
    group: 'informacoes_basicas',
  },

  // Localização - ✅ CORRIGIDO: Usar função estável
  {
    key: 'localizacao',
    label: '',
    type: 'custom',
    required: false,
    render: LocalizacaoRender, // ✅ Referência estável
    group: 'localizacao',
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
    group: 'classificacao',
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
    group: 'classificacao',
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    defaultValue: 'MEDIA',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },      // Valor em maiúscula
      { value: 'MEDIA', label: 'Média' },      // Valor em maiúscula
      { value: 'ALTA', label: 'Alta' },        // Valor em maiúscula
      { value: 'CRITICA', label: 'Crítica' }   // Valor em maiúscula
    ],
    group: 'classificacao',
  },

  // Observações
  {
    key: 'observacoes',
    label: 'Observações Adicionais',
    type: 'textarea',
    required: false,
    placeholder: 'Informações adicionais, contexto, detalhes técnicos...',
    group: 'observacoes',
  },

  // Anexos - ✅ CORRIGIDO: Usar função estável
  {
    key: 'anexos',
    label: 'Anexos',
    type: 'custom',
    required: false,
    render: AnexosRender, // ✅ Referência estável
    group: 'anexos',
  }
];