// src/features/tarefas/components/form/RecursosController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface Recurso {
  id?: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: string | number;
  unidade?: string;
  obrigatorio: boolean;
}

const selectClassName =
  'h-8 w-28 flex-shrink-0 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function RecursosController({ value, onChange, disabled }: FormFieldProps) {
  const [recursos, setRecursos] = React.useState<Recurso[]>(
    Array.isArray(value) ? value : []
  );

  // Atualizar quando o value muda (importante para modos view/edit)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(value);
    }
  }, [value]);

  const adicionarRecurso = () => {
    const novosRecursos = [
      ...recursos,
      { tipo: 'MATERIAL', descricao: '', quantidade: '1', unidade: '', obrigatorio: false } as Recurso
    ];
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  const removerRecurso = (index: number) => {
    const novosRecursos = recursos.filter((_, i) => i !== index);
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  const atualizarRecurso = (index: number, campo: keyof Recurso, valor: any) => {
    const novosRecursos = [...recursos];
    (novosRecursos[index] as any)[campo] = valor;
    setRecursos(novosRecursos);
    onChange(novosRecursos);
  };

  return (
    <div className="space-y-2">
      {recursos.length === 0 && disabled && (
        <div className="text-xs text-muted-foreground">Nenhum recurso adicionado</div>
      )}

      {recursos.length > 0 && (
        <div className="space-y-1.5">
          {recursos.map((recurso, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={recurso.tipo}
                onChange={(e) => atualizarRecurso(index, 'tipo', e.target.value)}
                disabled={disabled}
                className={selectClassName}
              >
                <option value="PECA">Peça</option>
                <option value="MATERIAL">Material</option>
                <option value="FERRAMENTA">Ferramenta</option>
                <option value="TECNICO">Técnico</option>
                <option value="VIATURA">Viatura</option>
              </select>
              <Input
                placeholder="Descrição do recurso..."
                value={recurso.descricao}
                onChange={(e) => atualizarRecurso(index, 'descricao', e.target.value)}
                disabled={disabled}
                className="flex-1 h-8"
              />
              <Input
                placeholder="Qtd"
                value={recurso.quantidade || ''}
                onChange={(e) => atualizarRecurso(index, 'quantidade', e.target.value)}
                disabled={disabled}
                className="w-16 h-8"
                title="Quantidade"
              />
              <Input
                placeholder="Un"
                value={recurso.unidade || ''}
                onChange={(e) => atualizarRecurso(index, 'unidade', e.target.value)}
                disabled={disabled}
                className="w-16 h-8"
                title="Unidade"
              />
              <label className="flex w-16 items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurso.obrigatorio}
                  onChange={(e) => atualizarRecurso(index, 'obrigatorio', e.target.checked)}
                  disabled={disabled}
                />
                Obrig.
              </label>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerRecurso(index)}
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
          onClick={adicionarRecurso}
          className="w-full h-8 border-dashed text-muted-foreground"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar recurso
        </Button>
      )}
    </div>
  );
}
