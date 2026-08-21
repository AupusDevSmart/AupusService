// src/components/common/cards/OrcamentoCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { CardLista, CardLinha, campoCard, type ColunaCard } from './card-lista';

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

  const colunas: ColunaCard[] = [
    { label: 'Descrição', largura: 'minmax(12rem, 1fr)' },
    { label: 'Valor (R$)', largura: '7rem', alinhamento: 'right' },
    ...(!disabled ? [{ label: '', largura: '2rem' }] : []),
  ];

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
            variant="ghost"
            size="icon"
            title="Adicionar custo"
            onClick={adicionarItem}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Lista de itens */}
      {itens.length > 0 && (
        <CardLista colunas={colunas} larguraMinima="28rem">
          {itens.map((item, index) => (
            <CardLinha key={item.id || index} colunas={colunas}>
              <Input
                value={item.descricao}
                onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                placeholder="Descrição do custo..."
                disabled={disabled}
                className={campoCard}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.valor || ''}
                onChange={(e) => atualizarItem(index, 'valor', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={disabled}
                className={`${campoCard} text-center`}
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerItem(index)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardLinha>
          ))}
        </CardLista>
      )}

      {/* Resumo do orcamento. Sem moldura e sem divisoria — o alinhamento a
          direita e o peso da ultima linha ja separam o total das parcelas. */}
      <div className="space-y-1">
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
        <div className="flex justify-between text-sm font-medium text-foreground">
          <span>Orçamento previsto</span>
          <span>R$ {custoTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export { OrcamentoCardManager };
