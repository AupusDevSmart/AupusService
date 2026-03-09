// src/features/planos-manutencao/config/form-config.tsx
import { FormField } from '@/types/base';
import { PlantaEquipamentoController } from '../components/PlantaEquipamentoController';

export const planosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'planta_equipamento',
    label: 'Localização',
    type: 'custom',
    required: true,
    group: 'informacoes_basicas',
    colSpan: 2,
    render: (props) => {
      return (
        <PlantaEquipamentoController
          value={props.value}
          onChange={(newValue) => {
            props.onChange(newValue);
            // Também atualizar o campo equipamento_id diretamente
            if (props.onMultipleChange && newValue.equipamento_id) {
              props.onMultipleChange({
                equipamento_id: newValue.equipamento_id
              });
            }
          }}
          disabled={props.disabled}
          mode={props.mode}
        />
      );
    }
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
  
  // Configurações
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    group: 'configuracoes',
    options: [
      { value: 'ATIVO', label: 'Ativo' },
      { value: 'INATIVO', label: 'Inativo' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'SUSPENSO', label: 'Suspenso' }
    ]
  },
  {
    key: 'data_vigencia_inicio',
    label: 'Data de Início da Vigência',
    type: 'date',
    required: false,
    group: 'configuracoes'
  },
  {
    key: 'data_vigencia_fim',
    label: 'Data de Fim da Vigência',
    type: 'date',
    required: false,
    group: 'configuracoes'
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    group: 'configuracoes',
    colSpan: 2,
    placeholder: 'Observações gerais sobre o plano...'
  }
];