// src/features/planos-manutencao/config/form-config.tsx
import { FormField } from '@/types/base';
import { CategoriaSelector } from '../components/CategoriaSelector';

export const planosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'categoria_id',
    label: 'Categoria de Equipamento',
    type: 'custom',
    required: true,
    group: 'informacoes_basicas',
    colSpan: 2,
    render: (props) => (
      <CategoriaSelector
        value={props.value as string}
        onChange={props.onChange}
        disabled={props.disabled}
        mode={props.mode as 'view' | 'create' | 'edit' | undefined}
        categoriaNome={(props.entity as { categoria?: { nome?: string } })?.categoria?.nome}
      />
    )
  },
  {
    key: 'nome',
    label: 'Nome do Plano',
    type: 'text',
    required: true,
    group: 'informacoes_basicas',
    colSpan: 2,
    placeholder: 'Ex: Motores Elétricos Trifásicos'
  },
  {
    key: 'versao',
    label: 'Versão',
    type: 'text',
    required: true,
    group: 'informacoes_basicas',
    colSpan: 2,
    placeholder: 'Ex: 1.0, 2.1'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    group: 'informacoes_basicas',
    colSpan: 2,
    placeholder: 'Descrição detalhada do plano de manutenção...'
  }
];