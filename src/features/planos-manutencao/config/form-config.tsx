// src/features/planos-manutencao/config/form-config.tsx
import React from 'react';
import { FormField } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, FileText } from 'lucide-react';
import { CATEGORIAS_PLANO_LABELS, TarefaTemplate } from '../types';

// Componente para gerenciar templates de tarefa
const TarefasTemplateController = ({ value, onChange, disabled }: any) => {
  const [templates, setTemplates] = React.useState<Omit<TarefaTemplate, 'id'>[]>(value || []);

  const adicionarTemplate = () => {
    const novoTemplate = {
      tagBase: '',
      descricao: '',
      categoria: 'MECANICA' as const,
      tipoManutencao: 'PREVENTIVA' as const,
      frequencia: 'MENSAL' as const,
      condicaoAtivo: 'PARADO' as const,
      criticidade: '3' as const,
      duracaoEstimada: 1,
      tempoEstimado: 60,
      ordem: templates.length + 1,
      ativa: true,
      subTarefas: [],
      recursos: []
    };
    const novosTemplates = [...templates, novoTemplate];
    setTemplates(novosTemplates);
    onChange(novosTemplates);
  };

  const removerTemplate = (index: number) => {
    const novosTemplates = templates.filter((_, i) => i !== index);
    setTemplates(novosTemplates);
    onChange(novosTemplates);
  };

  const atualizarTemplate = (index: number, campo: string, valor: any) => {
    const novosTemplates = [...templates];
    (novosTemplates[index] as any)[campo] = valor;
    setTemplates(novosTemplates);
    onChange(novosTemplates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Templates de Tarefas</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarTemplate}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Template
        </Button>
      </div>

      {templates.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum template de tarefa adicionado
          </p>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((template, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-4">
                {/* Linha 1: TAG Base e Descrição */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">TAG Base</label>
                    <Input
                      placeholder="Ex: LUB, INSP, CAL"
                      value={template.tagBase}
                      onChange={(e) => atualizarTemplate(index, 'tagBase', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium mb-1 block">Descrição</label>
                    <Input
                      placeholder="Descrição da tarefa template..."
                      value={template.descricao}
                      onChange={(e) => atualizarTemplate(index, 'descricao', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {/* Linha 2: Categoria, Tipo e Frequência */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Categoria</label>
                    <select
                      value={template.categoria}
                      onChange={(e) => atualizarTemplate(index, 'categoria', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="MECANICA">Mecânica</option>
                      <option value="ELETRICA">Elétrica</option>
                      <option value="INSTRUMENTACAO">Instrumentação</option>
                      <option value="LUBRIFICACAO">Lubrificação</option>
                      <option value="LIMPEZA">Limpeza</option>
                      <option value="INSPECAO">Inspeção</option>
                      <option value="CALIBRACAO">Calibração</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Tipo</label>
                    <select
                      value={template.tipoManutencao}
                      onChange={(e) => atualizarTemplate(index, 'tipoManutencao', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="PREVENTIVA">Preventiva</option>
                      <option value="PREDITIVA">Preditiva</option>
                      <option value="CORRETIVA">Corretiva</option>
                      <option value="INSPECAO">Inspeção</option>
                      <option value="VISITA_TECNICA">Visita Técnica</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Frequência</label>
                    <select
                      value={template.frequencia}
                      onChange={(e) => atualizarTemplate(index, 'frequencia', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
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
                </div>
                
                {/* Linha 3: Condição, Criticidade e Tempos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Condição</label>
                    <select
                      value={template.condicaoAtivo}
                      onChange={(e) => atualizarTemplate(index, 'condicaoAtivo', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="PARADO">Parado</option>
                      <option value="FUNCIONANDO">Funcionando</option>
                      <option value="QUALQUER">Qualquer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Criticidade</label>
                    <select
                      value={template.criticidade}
                      onChange={(e) => atualizarTemplate(index, 'criticidade', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="1">Muito Baixa</option>
                      <option value="2">Baixa</option>
                      <option value="3">Média</option>
                      <option value="4">Alta</option>
                      <option value="5">Muito Alta</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Duração (h)</label>
                    <Input
                      type="number"
                      value={template.duracaoEstimada || ''}
                      onChange={(e) => atualizarTemplate(index, 'duracaoEstimada', Number(e.target.value))}
                      disabled={disabled}
                      className="text-sm"
                      min={0}
                      step={0.5}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Tempo (min)</label>
                    <Input
                      type="number"
                      value={template.tempoEstimado || ''}
                      onChange={(e) => atualizarTemplate(index, 'tempoEstimado', Number(e.target.value))}
                      disabled={disabled}
                      className="text-sm"
                      min={0}
                    />
                  </div>
                </div>
                
                {/* Linha 4: Responsável e Observações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Responsável Sugerido</label>
                    <Input
                      placeholder="Ex: Técnico Mecânico"
                      value={template.responsavelSugerido || ''}
                      onChange={(e) => atualizarTemplate(index, 'responsavelSugerido', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Observações Template</label>
                    <Input
                      placeholder="Observações para esta tarefa..."
                      value={template.observacoesTemplate || ''}
                      onChange={(e) => atualizarTemplate(index, 'observacoesTemplate', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {/* Controles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.ativa}
                      onChange={(e) => atualizarTemplate(index, 'ativa', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm">Template ativo</span>
                  </label>
                  
                  <div className="text-xs text-muted-foreground">
                    Ordem: {template.ordem}
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removerTemplate(index)}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 shrink-0"
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

export const planosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome do Plano',
    type: 'text',
    required: true,
    placeholder: 'Ex: Motores Elétricos Trifásicos'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: false,
    placeholder: 'Descrição detalhada do plano de manutenção...'
  },
  {
    key: 'categoria',
    label: 'Categoria',
    type: 'select',
    required: true,
    options: Object.entries(CATEGORIAS_PLANO_LABELS).map(([value, label]) => ({
      value,
      label
    }))
  },
  {
    key: 'versao',
    label: 'Versão',
    type: 'text',
    required: true,
    placeholder: 'Ex: 1.0, 2.1'
  },
  
  // Configurações
  {
    key: 'ativo',
    label: 'Plano Ativo',
    type: 'checkbox',
    required: false
  },
  {
    key: 'publico',
    label: 'Plano Público',
    type: 'checkbox',
    required: false,
  },
  
  // Templates de Tarefas
  {
    key: 'tarefasTemplate',
    label: 'Templates de Tarefas',
    type: 'custom',
    required: true,
    render: TarefasTemplateController
  }
];