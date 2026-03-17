// src/features/programacao-os/components/origem-selector/TarefasSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Clock } from 'lucide-react';
import { TarefaDisponivel } from './types';

interface TarefasSelectorProps {
  tarefas: TarefaDisponivel[];
  selectedIds: string[];
  onToggle: (tarefaId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Componente para seleção de tarefas de um plano de manutenção
 * Permite seleção múltipla de tarefas com checkboxes
 */
export const TarefasSelector: React.FC<TarefasSelectorProps> = ({
  tarefas,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  loading = false,
  disabled = false
}) => {
  // Se está carregando
  if (loading) {
    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Carregando Tarefas...</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Se não há tarefas
  if (tarefas.length === 0) {
    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Tarefas do Plano</Label>
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma tarefa encontrada para este plano</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botões de ação */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Tarefas do Plano ({tarefas.length})
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={disabled}
          >
            Selecionar Todas
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            disabled={disabled}
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Lista de tarefas */}
      <div className="grid gap-2 max-h-96 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30">
        {tarefas.map((tarefa) => {
          const isChecked = selectedIds.includes(tarefa.id);

          return (
            <Card
              key={tarefa.id}
              className={`border-border transition-colors ${
                isChecked
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card hover:bg-accent/50'
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      onToggle(tarefa.id, checked as boolean);
                    }}
                    disabled={disabled}
                    className="mt-0.5"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-primary" />
                      <Badge variant="outline" className="text-xs">
                        {tarefa.categoria}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {tarefa.tipo_manutencao}
                      </Badge>
                    </div>

                    <h4 className="font-medium text-sm text-foreground">{tarefa.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tarefa.descricao}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tarefa.tempo_estimado}min
                      </div>
                      <div>
                        Duração: {tarefa.duracao_estimada}h
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo das tarefas selecionadas */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary">
            <strong>{selectedIds.length}</strong> tarefa(s) selecionada(s)
          </p>
        </div>
      )}
    </div>
  );
};
