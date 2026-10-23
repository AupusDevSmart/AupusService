// src/features/instrucoes/config/form-config.tsx
import { FormField } from '@/types/base';
import { SubInstrucoesController } from '../components/form/SubInstrucoesController';
import { RecursosInstrucaoController } from '../components/form/RecursosInstrucaoController';
import { CampoDaFrente } from '../components/form/CampoDaFrente';
import { temIlegivel } from '../components/form/LinhasDeCusto';

const ILEGIVEL = 'Há número que não dá para ler (o campo diz "inválido"): corrija ou apague antes de salvar.';

/**
 * Os campos da instrução do AupusProject (SN-85): código, nome, descrição, o
 * D+X do cronograma, os passos e as linhas de recurso, maquinário e material.
 */
export const instrucoesFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    required: false,
    // Vazio no cadastro, o servidor dá o próximo INST-NNN; na edição, vazio mantém
    placeholder: 'Gerado ao salvar (INST-…)',
    colSpan: 1
  },
  {
    key: 'nome',
    label: 'Nome da Instrução',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lubrificação Completa do Compressor',
    colSpan: 1
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    placeholder: 'Descreva detalhadamente a instrução...',
    colSpan: 2
  },

  // Cronograma (D+X), como no AupusProject
  {
    key: 'frente',
    label: 'Frente',
    type: 'custom',
    required: false,
    colSpan: 1,
    render: (props) => <CampoDaFrente {...props} />
  },
  {
    key: 'prazo_inicio_relativo',
    label: 'Início (D+X, dias)',
    type: 'number',
    required: false,
    min: 0,
    placeholder: '0',
    colSpan: 1
  },
  {
    key: 'duracao_dias',
    label: 'Duração (dias)',
    type: 'number',
    required: false,
    min: 1,
    placeholder: '1',
    colSpan: 1
  },

  // Passos
  {
    key: 'sub_instrucoes',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    // O CampoDeNumero não grava o texto que não lê: salvar mandaria o valor anterior calado
    validation: (value) => (temIlegivel(value) ? `Passos: ${ILEGIVEL}` : null),
    render: ({ value, onChange, disabled }) => (
      <SubInstrucoesController
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    )
  },

  // Recursos, maquinário e materiais: um campo só, que edita `recursos` e
  // `maquinarios` (o render recebe o formulário inteiro e o onMultipleChange)
  {
    key: 'recursos',
    label: '',
    type: 'custom',
    required: false,
    colSpan: 2,
    validation: (value, formData) =>
      temIlegivel(value) || temIlegivel((formData as Record<string, unknown> | undefined)?.maquinarios) ? `Recursos: ${ILEGIVEL}` : null,
    render: ({ value, onChange, onMultipleChange, formData, disabled }) => (
      <RecursosInstrucaoController
        value={value}
        onChange={onChange}
        maquinarios={formData?.maquinarios}
        onMaquinarios={(maquinarios) => onMultipleChange?.({ maquinarios })}
        passos={formData?.sub_instrucoes}
        disabled={disabled}
      />
    )
  },
];
