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
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    disabled: true, // Status é readonly, alterado automaticamente pelo sistema
    options: [
      { value: 'AGUARDANDO', label: 'Aguardando' },
      { value: 'EM_ANALISE', label: 'Em Análise' },
      { value: 'OS_GERADA', label: 'OS Gerada' },
      { value: 'RESOLVIDA', label: 'Resolvida' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'classificacao',
    visibleInModes: ['view', 'edit'], // Mostrar em view e edit, ocultar em create
    width: 'half', // Layout 2x2 em telas maiores
  },
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
    width: 'half', // Layout 2x2 em telas maiores
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
    width: 'half', // Layout 2x2 em telas maiores
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
    width: 'half', // Layout 2x2 em telas maiores
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

  // ✅ NOVO: Observações da análise (só visível em modo view quando analisada)
  {
    key: 'observacoes_analise',
    label: 'Observações da Análise',
    type: 'textarea',
    required: false,
    disabled: true, // Sempre disabled pois é apenas para visualização
    placeholder: 'Nenhuma observação registrada na análise',
    group: 'analise',
    visibleInModes: ['view'], // Só aparece no modo visualização
    condition: (entity: any) => {
      // Só mostrar se tiver observações de análise
      return entity?.observacoes_analise && entity.observacoes_analise.trim() !== '';
    }
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