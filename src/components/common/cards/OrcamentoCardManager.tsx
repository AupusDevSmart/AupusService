// src/components/common/cards/OrcamentoCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Receipt, Trash2 } from 'lucide-react';

export interface ItemOrcamento {
  id?: string;
  descricao: string;
  valor: number;
}

interface OrcamentoCardManagerProps {
  value: ItemOrcamento[];
  onChange: (itens: ItemOrcamento[]) => void;
  disabled?: boolean;
  title?: string;
  custoMateriais?: number;
  custoEquipe?: number;
}

const OrcamentoCardManager: React.FC<OrcamentoCardManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
  title = "Orçamento",
  custoMateriais = 0,
  custoEquipe = 0
}) => {
  const [itens, setItens] = useState<ItemOrcamento[]>(value);

  useEffect(() => {
    setItens(value);
  }, [value]);

  const updateItens = (newItens: ItemOrcamento[]) => {
    setItens(newItens);
    onChange(newItens);
  };

  const adicionarItem = () => {
    const novoItem: ItemOrcamento = {
      id: `temp_${Date.now()}`,
      descricao: '',
      valor: 0
    };
    updateItens([...itens, novoItem]);
  };

  const removerItem = (index: number) => {
    updateItens(itens.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, campo: keyof ItemOrcamento, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    updateItens(novosItens);
  };

  const custoOutros = itens.reduce((total, item) => total + (item.valor || 0), 0);
  const custoTotal = custoMateriais + custoEquipe + custoOutros;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          {itens.length > 0 && (
            <span className="text-xs text-muted-foreground">({itens.length})</span>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarItem}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Lista de itens */}
      {itens.length > 0 && (
        <div className="border border-border rounded-md divide-y divide-border dark:bg-[hsl(0,0%,0%)]">
          {itens.map((item, index) => (
            <div
              key={item.id || index}
              className="flex flex-wrap items-center gap-2 px-3 py-2"
            >
              <Input
                value={item.descricao}
                onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                placeholder="Descrição do custo..."
                disabled={disabled}
                className="h-8 text-sm flex-1 min-w-[180px] bg-transparent border-0 shadow-none px-2 focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valor || ''}
                  onChange={(e) => atualizarItem(index, 'valor', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={disabled}
                  className="h-8 text-sm w-24 bg-transparent border-0 shadow-none px-2 focus-visible:ring-0 text-right"
                />
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerItem(index)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {itens.length === 0 && !disabled && (
        <div className="text-center py-4 border border-dashed border-border rounded-md">
          <p className="text-sm text-muted-foreground">Nenhum custo adicional</p>
        </div>
      )}

      {/* Resumo do orcamento */}
      <div className="border border-border rounded-md px-3 py-2 space-y-1">
        {custoMateriais > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Materiais</span>
            <span>R$ {custoMateriais.toFixed(2)}</span>
          </div>
        )}
        {custoEquipe > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Equipe</span>
            <span>R$ {custoEquipe.toFixed(2)}</span>
          </div>
        )}
        {custoOutros > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Outros custos</span>
            <span>R$ {custoOutros.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-medium text-foreground border-t border-border pt-1">
          <span>Orçamento previsto</span>
          <span>R$ {custoTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export { OrcamentoCardManager };
