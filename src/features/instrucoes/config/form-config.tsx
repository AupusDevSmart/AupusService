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
    disabled: true,
    // Sempre gerada pelo backend (gerarTagUnica). No cadastro nao ha o que
    // mostrar, entao o campo so aparece depois que a instrucao existe.
    showOnlyOnMode: ['view', 'edit'],
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

];
