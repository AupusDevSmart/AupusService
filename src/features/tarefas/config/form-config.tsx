// src/features/tarefas/config/form-config.tsx
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Plus,
  Wrench,
  CheckSquare,
  Package,
  Trash2,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';
import { SubTarefa, RecursoTarefa } from '../types';

// ✅ COMPONENTE: Seleção hierárquica Planta → Equipamento
const LocalizacaoController = ({ value, onChange, disabled, entity, mode }: FormFieldProps & { entity?: any; mode?: string }) => {
  const { plantas, getEquipamentosUCByPlanta, getEquipamentoById } = useEquipamentos();
  
  const [plantaId, setPlantaId] = React.useState(((entity as any)?.plantaId || (value as any)?.plantaId)?.toString() || '');
  const [equipamentoId, setEquipamentoId] = React.useState(((entity as any)?.equipamentoId || (value as any)?.equipamentoId)?.toString() || '');

  // Equipamentos UC filtrados pela planta selecionada
  const equipamentosDisponiveis = plantaId ? 
    getEquipamentosUCByPlanta(Number(plantaId)) : [];

  const handlePlantaChange = (newPlantaId: string) => {
    setPlantaId(newPlantaId);
    setEquipamentoId('');
    
    onChange({
      plantaId: Number(newPlantaId),
      equipamentoId: null
    });
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    setEquipamentoId(newEquipamentoId);
    
    onChange({
      plantaId: Number(plantaId),
      equipamentoId: Number(newEquipamentoId)
    });
  };

  // Mostrar alerta se a tarefa veio de um plano (não deve alterar localização)
  const tarefaDeAnanoPlano = entity?.origemPlano;

  return (
    <div className="space-y-4">
      {/* Alerta para tarefas de planos */}
      {tarefaDeAnanoPlano && mode === 'edit' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Esta tarefa foi gerada de um plano. Alterar a localização pode dessincronizá-la.
            </p>
          </div>
        </div>
      )}

      {/* Planta */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        <select
          value={plantaId}
          onChange={(e) => handlePlantaChange(e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">Selecione a planta...</option>
          {plantas.map(planta => (
            <option key={planta.id} value={planta.id.toString()}>
              {planta.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Equipamento */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>
        <select
          value={equipamentoId}
          onChange={(e) => handleEquipamentoChange(e.target.value)}
          disabled={disabled || !plantaId}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">
            {plantaId ? "Selecione o equipamento..." : "Primeiro selecione uma planta"}
          </option>
          {equipamentosDisponiveis.map(equipamento => (
            <option key={equipamento.id} value={equipamento.id.toString()}>
              {equipamento.nome} - {equipamento.tipo}
            </option>
          ))}
        </select>
      </div>

      {/* Preview do equipamento selecionado */}
      {equipamentoId && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Equipamento Selecionado:
          </h4>
          {(() => {
            const item = getEquipamentoById(Number(equipamentoId));
            
            if (!item) return null;
            
            return (
              <div className="space-y-2">
                <p className="font-medium">{item.nome}</p>
                <p className="text-sm text-muted-foreground">{item.tipo}</p>
                <p className="text-sm text-muted-foreground">Localização: {item.localizacao}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE: Frequência personalizada
const FrequenciaController = ({ value, onChange, disabled }: FormFieldProps) => {
  const [frequencia, setFrequencia] = React.useState((value as any)?.frequencia || 'MENSAL');
  const [frequenciaPersonalizada, setFrequenciaPersonalizada] = React.useState((value as any)?.frequenciaPersonalizada || 30);

  const handleFrequenciaChange = (newFrequencia: string) => {
    setFrequencia(newFrequencia);
    onChange({
      frequencia: newFrequencia,
      frequenciaPersonalizada: newFrequencia === 'PERSONALIZADA' ? frequenciaPersonalizada : undefined
    });
  };

  const handleFrequenciaPersonalizadaChange = (dias: number) => {
    setFrequenciaPersonalizada(dias);
    onChange({
      frequencia,
      frequenciaPersonalizada: dias
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <select
          value={frequencia}
          onChange={(e) => handleFrequenciaChange(e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="DIARIA">Diária</option>
          <option value="SEMANAL">Semanal</option>
          <option value="QUINZENAL">Quinzenal</option>
          <option value="MENSAL">Mensal</option>
          <option value="BIMESTRAL">Bimestral</option>
          <option value="TRIMESTRAL">Trimestral</option>
          <option value="SEMESTRAL">Semestral</option>
          <option value="ANUAL">Anual</option>
          <option value="PERSONALIZADA">Personalizada</option>
        </select>
      </div>

      {frequencia === 'PERSONALIZADA' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Periodicidade (dias) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={frequenciaPersonalizada}
            onChange={(e) => handleFrequenciaPersonalizadaChange(Number(e.target.value))}
            disabled={disabled}
            min={1}
            max={9999}
            placeholder="Ex: 45"
          />
          <p className="text-xs text-muted-foreground">
            A tarefa será executada a cada {frequenciaPersonalizada} dias
          </p>
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE: Sub-tarefas (Checklist)
const SubTarefasController = ({ value, onChange, disabled }: FormFieldProps) => {
  const [subTarefas, setSubTarefas] = React.useState<Omit<SubTarefa, 'id'>[]>(Array.isArray(value) ? value : []);

  const adicionarSubTarefa = () => {
    const novaSubTarefa = {
      descricao: '',
      obrigatoria: false,
      tempoEstimado: 0,
      ordem: subTarefas.length + 1
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
                      value={subTarefa.tempoEstimado || ''}
                      onChange={(e) => atualizarSubTarefa(index, 'tempoEstimado', Number(e.target.value))}
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
  const [recursos, setRecursos] = React.useState<Omit<RecursoTarefa, 'id'>[]>(Array.isArray(value) ? value : []);

  const adicionarRecurso = () => {
    const novoRecurso = {
      tipo: 'MATERIAL' as const,
      descricao: '',
      quantidade: 1,
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
                      type="number"
                      value={recurso.quantidade || ''}
                      onChange={(e) => atualizarRecurso(index, 'quantidade', Number(e.target.value))}
                      disabled={disabled}
                      className="w-20 text-sm"
                      min={0}
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

// ✅ COMPONENTE: Upload de Anexos
const AnexosUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  const [arquivos, setArquivos] = React.useState<File[]>(Array.isArray(value) ? value : []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const novosArquivos = [...arquivos, ...files];
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const removerArquivo = (index: number) => {
    const novosArquivos = arquivos.filter((_, i) => i !== index);
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Manuais, procedimentos, modelos de relatório
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="anexos-upload-tarefa"
        />
        <label
          htmlFor="anexos-upload-tarefa"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar Arquivos
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, DOC, XLS, TXT até 10MB cada
        </p>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Arquivos Selecionados ({arquivos.length})</label>
          <div className="space-y-2">
            {arquivos.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerArquivo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
    showOnlyOnMode: ['view', 'edit'], // Só aparece quando visualizando/editando
    condition: (entity) => !!entity?.origemPlano // Só aparece se veio de plano
  },

  // Informações Básicas
  {
    key: 'tag',
    label: 'TAG da Tarefa',
    type: 'text',
    required: true,
    placeholder: 'Ex: MNT-001, LUB-002, INSP-003',
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
    key: 'localizacao',
    label: 'Localização',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <LocalizacaoController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        entity={entity}
        mode={mode}
      />
    ),
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
    key: 'tipoManutencao',
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
    key: 'condicaoAtivo',
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
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled }) => (
      <FrequenciaController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
  },
  {
    key: 'duracaoEstimada',
    label: 'Duração Estimada (horas)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 2.5',
    validation: (value) => {
      if (!value) return null;
      const duracao = parseFloat(String(value));
      if (duracao <= 0) {
        return 'Duração deve ser maior que zero';
      }
      return null;
    },
  },
  {
    key: 'tempoEstimado',
    label: 'Tempo Estimado (minutos)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 150',
    validation: (value) => {
      if (!value) return null;
      const tempo = parseInt(String(value));
      if (tempo <= 0) {
        return 'Tempo deve ser maior que zero';
      }
      return null;
    },
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

  // Sub-tarefas
  {
    key: 'subTarefas',
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
  },

  // Anexos
  {
    key: 'anexos',
    label: 'Anexos',
    type: 'custom',
    required: false,
    render: AnexosUpload,
    showOnlyOnMode: ['create'] // Só aparece no modo de criação
  }
];