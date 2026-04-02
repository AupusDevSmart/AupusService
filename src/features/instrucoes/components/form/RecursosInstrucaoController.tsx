// src/features/instrucoes/components/form/RecursosInstrucaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Package, Trash2 } from 'lucide-react';

interface Recurso {
  id?: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: string | number;
  unidade?: string;
  obrigatorio: boolean;
}

export function RecursosInstrucaoController({ value, onChange, disabled }: FormFieldProps) {
  const [recursos, setRecursos] = React.useState<Recurso[]>(
    Array.isArray(value) ? value : []
  );

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setRecursos(value);
    }
  }, [value]);

  const adicionar = () => {
    const novo: Recurso = { tipo: 'MATERIAL', descricao: '', quantidade: '1', unidade: '', obrigatorio: false };
    const lista = [...recursos, novo];
    setRecursos(lista);
    onChange(lista);
  };

  const remover = (index: number) => {
    const lista = recursos.filter((_, i) => i !== index);
    setRecursos(lista);
    onChange(lista);
  };

  const atualizar = (index: number, campo: keyof Recurso, valor: any) => {
    const lista = [...recursos];
    (lista[index] as any)[campo] = valor;
    setRecursos(lista);
    onChange(lista);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Recursos Necessarios</label>
        <Button type="button" variant="outline" size="sm" onClick={adicionar} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {recursos.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum recurso adicionado</p>
        </div>
      )}

      <div className="space-y-3">
        {recursos.map((recurso, index) => (
          <div key={index} className="p-4 border rounded-lg bg-muted/20">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Tipo</label>
                    <select
                      value={recurso.tipo}
                      onChange={(e) => atualizar(index, 'tipo', e.target.value)}
                      disabled={disabled}
                      className="w-full p-2 text-sm border rounded bg-background text-foreground"
                    >
                      <option value="PECA">Peca</option>
                      <option value="MATERIAL">Material</option>
                      <option value="FERRAMENTA">Ferramenta</option>
                      <option value="TECNICO">Tecnico</option>
                      <option value="VIATURA">Viatura</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Descricao</label>
                    <Input
                      placeholder="Descricao do recurso..."
                      value={recurso.descricao}
                      onChange={(e) => atualizar(index, 'descricao', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap">Qtd:</span>
                    <Input
                      type="text"
                      value={recurso.quantidade || ''}
                      onChange={(e) => atualizar(index, 'quantidade', e.target.value)}
                      disabled={disabled}
                      className="w-20 text-sm"
                      placeholder="Ex: 25"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap">Unidade:</span>
                    <Input
                      value={recurso.unidade || ''}
                      onChange={(e) => atualizar(index, 'unidade', e.target.value)}
                      disabled={disabled}
                      className="w-24 text-sm"
                      placeholder="Ex: un, kg, L"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurso.obrigatorio}
                      onChange={(e) => atualizar(index, 'obrigatorio', e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="text-sm whitespace-nowrap">Obrigatorio</span>
                  </label>
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
