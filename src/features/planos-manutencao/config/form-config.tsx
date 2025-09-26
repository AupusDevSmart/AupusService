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
    render: (props) => {
      console.log('🎯 RENDER: Props do controlador:', props);
      return (
        <PlantaEquipamentoController
          value={props.value}
          onChange={(newValue) => {
            console.log('🎯 CONTROLLER: Mudança detectada:', newValue);
            props.onChange(newValue);
            // Também atualizar o campo equipamento_id diretamente
            if (props.onMultipleChange && newValue.equipamento_id) {
              props.onMultipleChange({
                equipamento_id: newValue.equipamento_id
              });
            }
          }}
          onMultipleChange={props.onMultipleChange}
          disabled={props.disabled}
          mode={props.mode}
        />
      );
    }
  },
  // Campos ocultos para manter compatibilidade com a API
  {
    key: 'equipamento_id',
    label: 'Equipamento ID',
    type: 'text',
    required: true,
    group: 'informacoes_basicas',
    render: () => <div></div> // Campo oculto, será populado pelo controlador
  },
  {
    key: 'nome',
    label: 'Nome do Plano',
    type: 'text',
    required: true,
    group: 'informacoes_basicas',
    placeholder: 'Ex: Motores Elétricos Trifásicos'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    group: 'informacoes_basicas',
    placeholder: 'Descrição detalhada do plano de manutenção...'
  },
  {
    key: 'versao',
    label: 'Versão',
    type: 'text',
    required: true,
    group: 'informacoes_basicas',
    placeholder: 'Ex: 1.0, 2.1'
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
    key: 'ativo',
    label: 'Plano Ativo',
    type: 'checkbox',
    required: false,
    group: 'configuracoes'
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
    placeholder: 'Observações gerais sobre o plano...'
  },
  {
    key: 'criado_por',
    label: 'Criado Por',
    type: 'text',
    required: true,
    group: 'configuracoes',
    placeholder: 'ID do usuário criador'
  }
];