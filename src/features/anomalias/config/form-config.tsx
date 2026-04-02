// src/features/anomalias/config/form-config.tsx
import { FormField } from '@/types/base';
import { LocalizacaoController } from '../components/LocalizacaoController';
import { AnexosUpload } from '../components/AnexosUpload';

// ✅ SOLUÇÃO: Extrair renders como funções estáveis FORA do array
const LocalizacaoRender = ({ value, onChange, disabled, mode, entity }: any) => (
  <LocalizacaoController
    value={value}
    onChange={onChange}
    disabled={disabled}
    mode={mode}
    entity={entity}
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
    colSpan: 2, // ✅ Ocupa 100% da largura (S maiúsculo!)
  },

  // Localização - ✅ CORRIGIDO: Usar função estável
  {
    key: 'localizacao',
    label: '',
    type: 'custom',
    required: false,
    render: LocalizacaoRender, // ✅ Referência estável
    group: 'localizacao',
    colSpan: 2, // ✅ Ocupa 100% da largura (S maiúsculo!)
  },

  // Classificação
  {
    key: 'condicao',
    label: 'Condição',
    type: 'select', // Select com busca (combobox não implementado ainda no BaseForm)
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' },
      { value: 'RISCO_ACIDENTE', label: 'Risco de Acidente' }
    ],
    group: 'classificacao',
    width: 'half', // Layout 2x2 em telas maiores
  },
  {
    key: 'origem',
    label: 'Origem',
    type: 'select', // Select com busca (combobox não implementado ainda no BaseForm)
    required: true,
    options: [
      { value: 'SCADA', label: 'SCADA' },
      { value: 'OPERADOR', label: 'Operador' },
      { value: 'FALHA', label: 'Falha' }
    ],
    group: 'classificacao',
    width: 'half', // Layout 2x2 em telas maiores
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    defaultValue: 'MEDIA',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
    group: 'classificacao',
    width: 'half',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    disabled: true,
    defaultValue: 'REGISTRADA',
    options: [
      { value: 'REGISTRADA', label: 'Registrada' },
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
    ],
    group: 'classificacao',
    width: 'half',
  },

  // Observações
  {
    key: 'observacoes',
    label: 'Observações Adicionais',
    type: 'textarea',
    required: false,
    placeholder: 'Informações adicionais, contexto, detalhes técnicos...',
    group: 'observacoes',
    colSpan: 2, // ✅ Ocupa 100% da largura (S maiúsculo!)
  },

  // Instrucoes vinculadas (editável)
  {
    key: 'instrucoes_ids',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    group: 'instrucoes_vinculadas',
  } as any,

  // Anexos - ✅ CORRIGIDO: Usar função estável
  {
    key: 'anexos',
    label: 'Anexos',
    type: 'custom',
    required: false,
    render: AnexosRender, // ✅ Referência estável
    group: 'anexos',
    colSpan: 2, // ✅ Ocupa 100% da largura (S maiúsculo!)
  }
];