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

  /**
   * A descrição, no lugar onde ficavam as observações.
   *
   * Grava em `descricao` — a mesma coluna do campo curto que existia no topo.
   * Havia dois textos livres pedindo quase a mesma coisa, e o de cima aparecia
   * antes de a pessoa ter escolhido o equipamento, quando ainda não dava para
   * descrever direito o que foi visto.
   *
   * A coluna `observacoes` continua no banco com o que já foi escrito; ela só
   * deixou de ter campo na tela.
   */
  {
    key: 'descricao',
    label: '', // duplicava o titulo do grupo
    type: 'textarea',
    required: true,
    placeholder: 'O que foi identificado, em que condição, e o que se observou...',
    group: 'descricao',
    colSpan: 2,
  },

  // Anexos - ✅ CORRIGIDO: Usar função estável
  {
    key: 'anexos',
    label: '', // duplicava o titulo do grupo
    type: 'custom',
    required: false,
    render: AnexosRender, // ✅ Referência estável
    group: 'anexos',
    colSpan: 2, // ✅ Ocupa 100% da largura (S maiúsculo!)
  }
];