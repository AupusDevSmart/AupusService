// src/features/instrucoes/components/form/SubInstrucoesController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CheckSquare, Trash2 } from 'lucide-react';

interface SubInstrucao {
  id?: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
}

export function SubInstrucoesController({ value, onChange, disabled }: FormFieldProps) {
  const [subInstrucoes, setSubInstrucoes] = React.useState<SubInstrucao[]>(
    Array.isArray(value) ? value : []
  );

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setSubInstrucoes(value);
    }
  }, [value]);

  const adicionar = () => {
    const nova: SubInstrucao = { descricao: '', obrigatoria: false, tempo_estimado: 0 };
    const lista = [...subInstrucoes, nova];
    setSubInstrucoes(lista);
    onChange(lista);
  };

  const remover = (index: number) => {
    const lista = subInstrucoes.filter((_, i) => i !== index);
    setSubInstrucoes(lista);
    onChange(lista);
  };

  const atualizar = (index: number, campo: keyof SubInstrucao, valor: any) => {
    const lista = [...subInstrucoes];
    (lista[index] as any)[campo] = valor;
    setSubInstrucoes(lista);
    onChange(lista);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Sub-instruções (Checklist)</label>
        <Button type="button" variant="outline" size="sm" onClick={adicionar} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {subInstrucoes.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma sub-instrução adicionada</p>
        </div>
      )}

      <div className="space-y-3">
        {subInstrucoes.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="flex-1 w-full space-y-3">
                <Input
                  placeholder="Descrição da sub-instrução..."
                  value={item.descricao}
                  onChange={(e) => atualizar(index, 'descricao', e.target.value)}
                  disabled={disabled}
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.obrigatoria}
                      onChange={(e) => atualizar(index, 'obrigatoria', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm whitespace-nowrap">Obrigatória</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap">Tempo (min):</span>
                    <Input
                      type="number"
                      value={item.tempo_estimado || ''}
                      onChange={(e) => atualizar(index, 'tempo_estimado', Number(e.target.value))}
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
                onClick={() => remover(index)}
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
