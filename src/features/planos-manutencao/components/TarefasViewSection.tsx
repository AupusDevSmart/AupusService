// src/features/planos-manutencao/components/TarefasViewSection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Pencil, Trash2, Plus } from 'lucide-react';

interface TarefaFlexivel {
  id: string | number;
  nome: string;
  tag?: string;
  ordem: number;
  ativo: boolean;
  categoria: string;
  tipo_manutencao?: string;
  tempo_estimado: number;
  criticidade: number;
  status?: string;
}

interface TarefasViewSectionProps {
  tarefas?: TarefaFlexivel[] | any[];
  isVisible?: boolean;
  mode?: 'view' | 'edit';
  onEditTarefa?: (tarefa: any) => void;
  onDeleteTarefa?: (tarefa: any) => void;
  onAddTarefa?: () => void;
}

const getCriticidadeLabel = (criticidade: number) => {
  switch (criticidade) {
    case 1: return 'Muito Baixa';
    case 2: return 'Baixa';
    case 3: return 'Média';
    case 4: return 'Alta';
    case 5: return 'Muito Alta';
    default: return 'N/A';
  }
};

const formatTempo = (minutos: number): string => {
  if (!minutos || isNaN(minutos)) return '0min';

  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
};

// 🔧 Função para normalizar dados da tarefa
const normalizarTarefa = (tarefa: any): TarefaFlexivel => {
  return {
    id: tarefa.id || tarefa.tarefa_id || 'N/A',
    nome: tarefa.nome || tarefa.titulo || 'Tarefa sem nome',
    tag: tarefa.tag || `T-${tarefa.id || '000'}`,
    ordem: tarefa.ordem || tarefa.posicao || 0,
    ativo: tarefa.ativo ?? tarefa.ativa ?? true,
    categoria: tarefa.categoria || 'GERAL',
    tipo_manutencao: tarefa.tipo_manutencao || tarefa.tipo || 'PREVENTIVA',
    tempo_estimado: tarefa.tempo_estimado || tarefa.tempo || 0,
    criticidade: tarefa.criticidade || tarefa.prioridade || 3,
    status: tarefa.status || 'ATIVA'
  };
};

export const TarefasViewSection: React.FC<TarefasViewSectionProps> = ({
  tarefas,
  isVisible = true,
  mode = 'view',
  onEditTarefa,
  onDeleteTarefa,
  onAddTarefa,
}) => {
  const isEditMode = mode === 'edit';

  if (!isVisible) {
    return null;
  }

  if (!tarefas || !Array.isArray(tarefas) || tarefas.length === 0) {
    return (
      <div className="p-6 text-center">
        <Settings className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada neste plano de manutenção.</p>
        {isEditMode && onAddTarefa && (
          <Button type="button" variant="outline" size="sm" onClick={onAddTarefa} className="mt-3">
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Tarefa
          </Button>
        )}
      </div>
    );
  }

  const tarefasNormalizadas = tarefas.map(normalizarTarefa);
  const tarefasOrdenadas = [...tarefasNormalizadas].sort((a, b) => a.ordem - b.ordem);

  // Estatísticas
  const tarefasAtivas = tarefasNormalizadas.filter(t => t.ativo).length;
  const tempoTotal = tarefasNormalizadas.reduce((acc, t) => acc + (t.tempo_estimado || 0), 0);
  const criticidadeMedia = tarefasNormalizadas.length > 0
    ? Math.round(tarefasNormalizadas.reduce((acc, t) => acc + (t.criticidade || 3), 0) / tarefasNormalizadas.length)
    : 0;

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Tarefas do Plano ({tarefasNormalizadas.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            {tarefasAtivas} ativa{tarefasAtivas !== 1 ? 's' : ''} · {formatTempo(tempoTotal)} · Crit. média {getCriticidadeLabel(criticidadeMedia)}
          </p>
        </div>

        {isEditMode && onAddTarefa && (
          <Button type="button" variant="outline" size="sm" onClick={onAddTarefa} className="flex-shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Tarefa
          </Button>
        )}
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-2">
        {tarefasOrdenadas.map((tarefa, index) => (
          <div
            key={`tarefa-${tarefa.id}-${index}`}
            className="border border-border rounded p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                  <span className="font-mono">{tarefa.tag}</span>
                  <span>#{tarefa.ordem}</span>
                  <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${tarefa.ativo ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    {tarefa.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <h4 className="text-sm font-medium text-foreground truncate">
                  {tarefa.nome}
                </h4>

                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {tarefa.categoria} · {(tarefa.tipo_manutencao || '').replace('_', ' ')} · {formatTempo(tarefa.tempo_estimado)} · Crit. {getCriticidadeLabel(tarefa.criticidade)}
                </div>
              </div>

              {isEditMode && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {onEditTarefa && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditTarefa(tarefas![index])}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDeleteTarefa && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteTarefa(tarefas![index])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
