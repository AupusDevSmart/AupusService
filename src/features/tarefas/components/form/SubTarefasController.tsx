// src/features/tarefas/components/form/SubTarefasController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface SubTarefa {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
}

export function SubTarefasController({ value, onChange, disabled }: FormFieldProps) {
  const [subTarefas, setSubTarefas] = React.useState<SubTarefa[]>(
    Array.isArray(value) ? value : []
  );

  // Atualizar quando o value muda (importante para modos view/edit)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubTarefas(value);
    }
  }, [value]);

  const adicionarSubTarefa = () => {
    const novasSubTarefas = [...subTarefas, { descricao: '', obrigatoria: false, tempo_estimado: 0 }];
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  const removerSubTarefa = (index: number) => {
    const novasSubTarefas = subTarefas.filter((_, i) => i !== index);
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  const atualizarSubTarefa = (index: number, campo: keyof SubTarefa, valor: any) => {
    const novasSubTarefas = [...subTarefas];
    (novasSubTarefas[index] as any)[campo] = valor;
    setSubTarefas(novasSubTarefas);
    onChange(novasSubTarefas);
  };

  return (
    <div className="space-y-2">
      {subTarefas.length === 0 && disabled && (
        <div className="text-xs text-muted-foreground">Nenhuma sub-tarefa adicionada</div>
      )}

      {subTarefas.length > 0 && (
        <div className="space-y-1.5">
          {subTarefas.map((subTarefa, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Descrição da sub-tarefa..."
                value={subTarefa.descricao}
                onChange={(e) => atualizarSubTarefa(index, 'descricao', e.target.value)}
                disabled={disabled}
                className="flex-1 h-8"
              />
              <Input
                type="number"
                value={subTarefa.tempo_estimado || ''}
                onChange={(e) => atualizarSubTarefa(index, 'tempo_estimado', Number(e.target.value))}
                disabled={disabled}
                className="w-16 h-8"
                min={0}
                placeholder="min"
                title="Tempo estimado (min)"
              />
              <label className="flex w-16 items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={subTarefa.obrigatoria}
                  onChange={(e) => atualizarSubTarefa(index, 'obrigatoria', e.target.checked)}
                  disabled={disabled}
                />
                Obrig.
              </label>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerSubTarefa(index)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarSubTarefa}
          className="w-full h-8 border-dashed text-muted-foreground"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar sub-tarefa
        </Button>
      )}
    </div>
  );
}
