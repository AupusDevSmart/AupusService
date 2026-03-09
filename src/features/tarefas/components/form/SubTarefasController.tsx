// src/features/tarefas/components/form/SubTarefasController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckSquare, Trash2 } from 'lucide-react';

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
    const novaSubTarefa: SubTarefa = {
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

  const atualizarSubTarefa = (index: number, campo: keyof SubTarefa, valor: any) => {
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
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="flex-1 w-full space-y-3">
                {/* Descrição sempre ocupa linha inteira */}
                <Input
                  placeholder="Descrição da sub-tarefa..."
                  value={subTarefa.descricao}
                  onChange={(e) => atualizarSubTarefa(index, 'descricao', e.target.value)}
                  disabled={disabled}
                />

                {/* Checkbox e tempo empilhados em mobile, lado a lado em desktop */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subTarefa.obrigatoria}
                      onChange={(e) => atualizarSubTarefa(index, 'obrigatoria', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm whitespace-nowrap">Obrigatória</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap">Tempo (min):</span>
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
                className="text-red-600 hover:text-red-700 self-end sm:self-start"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
