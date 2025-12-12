// src/features/tarefas/config/form-config.tsx
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  CheckSquare,
  Package,
  Trash2,
  Layers
} from 'lucide-react';
// import { SubTarefa, RecursoTarefa } from '../types';



// ✅ COMPONENTE: Sub-tarefas (Checklist)
const SubTarefasController = ({ value, onChange, disabled }: FormFieldProps) => {
  const [subTarefas, setSubTarefas] = React.useState<any[]>(Array.isArray(value) ? value : []);

  // Atualizar quando o value muda (importante para modos view/edit)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubTarefas(value);
    }
  }, [value]);

  const adicionarSubTarefa = () => {
    const novaSubTarefa = {
      descricao: '',
      obrigatoria: false,
      tempo_estimado: 0
    };
    const novasSubTarefas = [...subTarefas, novaSubTarefa];
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  const removerSubTarefa = (index: number) => {
    const novasSubTarefas = subTarefas.filter((_, i) => i !== index);
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  const atualizarSubTarefa = (index: number, campo: string, valor: any) => {
    const novasSubTarefas = [...subTarefas];
    (novasSubTarefas[index] as any)[campo] = valor;
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Sub-tarefas (Checklist)</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarSubTarefa}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {subTarefas.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma sub-tarefa adicionada
          </p>
        </div>
      )}

      <div className="space-y-3">
        {subTarefas.map((subTarefa, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Descrição da sub-tarefa..."
                  value={subTarefa.descricao}
                  onChange={(e) => atualizarSubTarefa(index, 'descricao', e.target.value)}
                  disabled={disabled}
                />
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subTarefa.obrigatoria}
                      onChange={(e) => atualizarSubTarefa(index, 'obrigatoria', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm">Obrigatória</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Tempo (min):</span>
                    <Input
                      type="number"
                      value={subTarefa.tempo_estimado || ''}
                      onChange={(e) => atualizarSubTarefa(index, 'tempo_estimado', Number(e.target.value))}
                      disabled={disabled}
                      className="w-20"
                      min={0}
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removerSubTarefa(index)}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ COMPONENTE: Recursos necessários
const RecursosController = ({ value, onChange, disabled }: FormFieldProps) => {
  const [recursos, setRecursos] = React.useState<any[]>(Array.isArray(value) ? value : []);

  // Atualizar quando o value muda (importante para modos view/edit)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(value);
    }
  }, [value]);

  const adicionarRecurso = () => {
    const novoRecurso = {
      tipo: 'MATERIAL' as const,
      descricao: '',
      quantidade: '1',
      unidade: '',
      obrigatorio: false
    };
    const novosRecursos = [...recursos, novoRecurso];
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  const removerRecurso = (index: number) => {
    const novosRecursos = recursos.filter((_, i) => i !== index);
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  const atualizarRecurso = (index: number, campo: string, valor: any) => {
    const novosRecursos = [...recursos];
    (novosRecursos[index] as any)[campo] = valor;
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Recursos Necessários</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarRecurso}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {recursos.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum recurso adicionado
          </p>
        </div>
      )}

      <div className="space-y-3">
        {recursos.map((recurso, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Tipo</label>
                    <select
                      value={recurso.tipo}
                      onChange={(e) => atualizarRecurso(index, 'tipo', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="PECA">Peça</option>
                      <option value="MATERIAL">Material</option>
                      <option value="FERRAMENTA">Ferramenta</option>
                      <option value="TECNICO">Técnico</option>
                      <option value="VIATURA">Viatura</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Descrição</label>
                    <Input
                      placeholder="Descrição do recurso..."
                      value={recurso.descricao}
                      onChange={(e) => atualizarRecurso(index, 'descricao', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Qtd:</span>
                    <Input
                      type="text"
                      value={recurso.quantidade || ''}
                      onChange={(e) => atualizarRecurso(index, 'quantidade', e.target.value)}
                      disabled={disabled}
                      className="w-20 text-sm"
                      placeholder="Ex: 25"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Unidade:</span>
                    <Input
                      value={recurso.unidade || ''}
                      onChange={(e) => atualizarRecurso(index, 'unidade', e.target.value)}
                      disabled={disabled}
                      className="w-24 text-sm"
                      placeholder="Ex: un, kg, L"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurso.obrigatorio}
                      onChange={(e) => atualizarRecurso(index, 'obrigatorio', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm">Obrigatório</span>
                  </label>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removerRecurso(index)}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ✅ COMPONENTE: Informações de Origem do Plano (apenas visualização)
const OrigemPlanoInfo = ({ entity }: { entity?: any }) => {
  if (!entity?.origemPlano) return null;

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-blue-900 dark:text-blue-100">
          Informações do Plano de Origem
        </h4>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-blue-700 dark:text-blue-300">Plano ID: </span>
          <span className="font-mono">{entity.planoManutencaoId}</span>
        </div>
        
        {entity.versaoTemplate && (
          <div>
            <span className="text-blue-700 dark:text-blue-300">Versão do Template: </span>
            <span>{entity.versaoTemplate}</span>
          </div>
        )}
        
        <div>
          <span className="text-blue-700 dark:text-blue-300">Status: </span>
          <Badge className={entity.sincronizada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {entity.sincronizada ? 'Sincronizada' : 'Dessincronizada'}
          </Badge>
        </div>
        
        {entity.customizada && (
          <div>
            <span className="text-blue-700 dark:text-blue-300">Customizada: </span>
            <Badge className="bg-orange-100 text-orange-800">
              Sim
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export const tarefasFormFields: FormField[] = [
  // NOVO: Informações do Plano (apenas para visualização)
  {
    key: 'origem_plano_info',
    label: '',
    type: 'custom',
    required: false,
    render: ({ entity }) => <OrigemPlanoInfo entity={entity} />,
    condition: (entity) => !!entity?.plano_manutencao, // Só aparece se veio de plano
    excludeFromSubmit: true // ✅ NOVO: Excluir este campo do envio à API
  },

  // Informações Básicas
  {
    key: 'plano_manutencao_id',
    label: 'Plano de Manutenção',
    type: 'select',
    required: true,
    options: [], // Será carregado dinamicamente
  },
  {
    key: 'tag',
    label: 'TAG da Tarefa',
    type: 'text',
    required: false, // Auto-gerado se não fornecido
    placeholder: 'Ex: COM-LUB-001 (auto-gerado se vazio)',
  },
  {
    key: 'nome',
    label: 'Nome da Tarefa',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lubrificação Completa do Compressor',
  },
  {
    key: 'descricao',
    label: 'Descrição da Tarefa',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a tarefa a ser executada...',
  },

  // Localização
  {
    key: 'planta_id',
    label: 'Planta',
    type: 'select',
    required: false,
    options: [], // Será carregado dinamicamente
    excludeFromSubmit: true, // ✅ Campo apenas informativo, não enviar à API
  },
  {
    key: 'equipamento_id',
    label: 'Equipamento',
    type: 'select',
    required: false,
    options: [], // Será carregado dinamicamente
    render: ({ value, entity, mode }) => {
      // Em modo view, mostrar informações completas do equipamento
      if (mode === 'view' && entity?.equipamento) {
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
      // Para outros modos, retornar undefined para usar o componente padrão de select
      return undefined;
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
  },

  // Planejamento
  {
    key: 'frequencia',
    label: 'Frequência',
    type: 'select',
    required: true,
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
    placeholder: 'Ex: 3',
  },
  {
    key: 'tempo_estimado',
    label: 'Tempo Estimado (minutos)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 180',
  },
  {
    key: 'planejador',
    label: 'Planejador',
    type: 'text',
    required: false,
    placeholder: 'Nome do planejador responsável',
  },
  {
    key: 'responsavel',
    label: 'Responsável pela Execução',
    type: 'text',
    required: false,
    placeholder: 'Nome do responsável pela execução',
  },

  // Controle de execuções
  {
    key: 'data_ultima_execucao',
    label: 'Data da Última Execução',
    type: 'datetime-local',
    required: true,
    placeholder: 'Data e hora da última execução',
  },
  {
    key: 'numero_execucoes',
    label: 'Número de Execuções',
    type: 'number',
    required: false,
    placeholder: 'Ex: 5',
    min: 0,
    defaultValue: 0,
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
  }
];