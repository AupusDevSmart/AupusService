// src/features/planos-manutencao/config/form-config.tsx
import { FormField } from '@/types/base';
import type { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { CategoriaSelector } from '../components/CategoriaSelector';
import { TarefasEValoresDoPlano } from '../components/TarefasEValoresDoPlano';

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
  },

  // Só leitura, e só onde o plano já existe: o PlanosModal tira este campo do create
  {
    key: 'tarefas_e_valores',
    label: '',
    type: 'custom',
    required: false,
    group: 'tarefas_e_valores',
    colSpan: 2,
    render: (props) => (
      <TarefasEValoresDoPlano plano={props.entity as PlanoManutencaoApiResponse | null | undefined} />
    )
  }
];