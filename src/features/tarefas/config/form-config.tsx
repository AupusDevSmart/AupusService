// src/features/tarefas/config/form-config.tsx
import { FormField } from '@/types/base';
import { SubTarefasController } from '../components/form/SubTarefasController';
import { RecursosController } from '../components/form/RecursosController';
import { InstrucaoOrigemField } from '../components/form/InstrucaoOrigemField';

export const tarefasFormFields: FormField[] = [
  // Plano de Manutenção (obrigatório)
  {
    key: 'plano_manutencao_id',
    label: 'Plano de Manutenção',
    type: 'combobox',
    required: true,
    placeholder: 'Selecione ou busque um plano de manutenção',
    options: [], // Será carregado dinamicamente
    colSpan: 2,
  } as any,

  // Instrução de Origem (preenche campos automaticamente)
  {
    key: 'instrucao_id',
    label: '',
    type: 'custom',
    colSpan: 2,
    render: (props: any) => (
      <InstrucaoOrigemField
        value={props.value}
        onChange={props.onChange}
        onMultipleChange={props.onMultipleChange}
        disabled={props.disabled}
        options={props.field?.options || []}
        onAnexosCopied={props.field?.onAnexosCopied}
      />
    ),
  } as any,
  {
    key: 'tag',
    label: 'TAG da Tarefa',
    type: 'text',
    required: false, // Auto-gerado se não fornecido
    placeholder: 'Ex: COM-LUB-001 (auto-gerado se vazio)',
    colSpan: 1 // ✅ Ocupa 1 coluna (50%)
  } as any,
  {
    key: 'nome',
    label: 'Nome da Tarefa',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lubrificação Completa do Compressor',
    colSpan: 1 // ✅ Ocupa 1 coluna (50%)
  } as any,
  {
    key: 'descricao',
    label: 'Descrição da Tarefa',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a tarefa a ser executada...',
    colSpan: 2,
  } as any,

  // Localização (campos read-only - apenas informativos)
  {
    key: 'planta_id',
    label: 'Planta',
    type: 'custom',
    required: false,
    excludeFromSubmit: true,
    width: 'half',
    render: ({ entity, mode }) => {
      if (!entity?.planta) {
        return (
          <div className="p-3 border border-dashed border-muted-foreground/25 rounded-md bg-muted/10">
            <p className="text-sm text-muted-foreground">Sem planta vinculada</p>
          </div>
        );
      }

      return (
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="text-sm font-medium">{entity.planta.nome}</div>
          {entity.planta.localizacao && (
            <div className="text-xs text-muted-foreground mt-1">
              {entity.planta.localizacao}
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'equipamento_id',
    label: 'Equipamento',
    type: 'custom',
    required: false,
    excludeFromSubmit: true,
    width: 'half',
    render: ({ entity, mode }) => {
      if (!entity?.equipamento) {
        return (
          <div className="p-3 border border-dashed border-muted-foreground/25 rounded-md bg-muted/10">
            <p className="text-sm text-muted-foreground">Sem equipamento vinculado</p>
          </div>
        );
      }

      return (
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="text-sm font-medium">{entity.equipamento.nome}</div>
          {entity.equipamento.tipo_equipamento && (
            <div className="text-xs text-muted-foreground mt-1">
              Tipo: {entity.equipamento.tipo_equipamento}
            </div>
          )}
          {entity.equipamento.tag && (
            <div className="text-xs text-muted-foreground">
              TAG: {entity.equipamento.tag}
            </div>
          )}
        </div>
      );
    }
  },

  // Classificação
  {
    key: 'categoria',
    label: 'Categoria',
    type: 'select',
    required: true,
    options: [
      { value: 'MECANICA', label: 'Mecânica' },
      { value: 'ELETRICA', label: 'Elétrica' },
      { value: 'INSTRUMENTACAO', label: 'Instrumentação' },
      { value: 'LUBRIFICACAO', label: 'Lubrificação' },
      { value: 'LIMPEZA', label: 'Limpeza' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'CALIBRACAO', label: 'Calibração' },
      { value: 'OUTROS', label: 'Outros' }
    ],
    width: 'half', // 50% em desktop
  },
  {
    key: 'tipo_manutencao',
    label: 'Tipo de Manutenção',
    type: 'select',
    required: true,
    options: [
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
    ],
    width: 'half', // 50% em desktop
  },
  {
    key: 'criticidade',
    label: 'Criticidade',
    type: 'select',
    required: true,
    options: [
      { value: '1', label: 'Muito Baixa' },
      { value: '2', label: 'Baixa' },
      { value: '3', label: 'Média' },
      { value: '4', label: 'Alta' },
      { value: '5', label: 'Muito Alta' }
    ],
    width: 'half', // 50% em desktop
  },
  {
    key: 'condicao_ativo',
    label: 'Condição do Ativo',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' },
      { value: 'QUALQUER', label: 'Qualquer' }
    ],
    width: 'half', // 50% em desktop
  },

  // Planejamento
  {
    key: 'frequencia',
    label: 'Frequência',
    type: 'select',
    required: false,
    options: [
      { value: 'DIARIA', label: 'Diária' },
      { value: 'SEMANAL', label: 'Semanal' },
      { value: 'QUINZENAL', label: 'Quinzenal' },
      { value: 'MENSAL', label: 'Mensal' },
      { value: 'BIMESTRAL', label: 'Bimestral' },
      { value: 'TRIMESTRAL', label: 'Trimestral' },
      { value: 'SEMESTRAL', label: 'Semestral' },
      { value: 'ANUAL', label: 'Anual' },
      { value: 'PERSONALIZADA', label: 'Personalizada' }
    ],
    width: 'half', // 50% em desktop
  },
  {
    key: 'frequencia_personalizada',
    label: 'Frequência Personalizada (dias)',
    type: 'number',
    required: false,
    placeholder: 'Ex: 45',
    min: 1,
    max: 9999,
    defaultValue: 30, // ✅ NOVO: Valor padrão para evitar erro de validação
    width: 'half', // 50% em desktop
    showOnlyWhen: {
      field: 'frequencia',
      value: 'PERSONALIZADA'
    }
  },
  {
    key: 'duracao_estimada',
    label: 'Duração Estimada (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 2.5',
    colSpan: 2,
  },
  {
    key: 'planejador',
    label: 'Planejador',
    type: 'text',
    required: false,
    placeholder: 'Nome do planejador responsável',
    width: 'half', // 50% em desktop
  },
  {
    key: 'responsavel',
    label: 'Responsável pela Execução',
    type: 'text',
    required: false,
    placeholder: 'Nome do responsável pela execução',
    width: 'half', // 50% em desktop
  },

  // Controle de execuções
  {
    key: 'data_ultima_execucao',
    label: 'Data da Última Execução',
    type: 'datetime-local',
    required: true,
    placeholder: 'Data e hora da última execução',
    width: 'half', // 50% em desktop
  },
  {
    key: 'numero_execucoes',
    label: 'Número de Execuções',
    type: 'number',
    required: false,
    placeholder: 'Ex: 5',
    min: 0,
    defaultValue: 0,
    width: 'half', // 50% em desktop
  },

  // Sub-tarefas
  {
    key: 'sub_tarefas',
    label: '',
    type: 'custom',
    required: false,
    render: ({ value, onChange, disabled }) => (
      <SubTarefasController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
  },

  // Recursos
  {
    key: 'recursos',
    label: '',
    type: 'custom',
    required: false,
    render: ({ value, onChange, disabled }) => (
      <RecursosController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
  },

  // Observações e Status
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    placeholder: 'Observações adicionais sobre a tarefa...',
    colSpan: 2,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'ATIVA', label: 'Ativa' },
      { value: 'INATIVA', label: 'Inativa' },
      { value: 'EM_REVISAO', label: 'Em Revisão' },
      { value: 'ARQUIVADA', label: 'Arquivada' }
    ],
    colSpan: 2,
  }
];