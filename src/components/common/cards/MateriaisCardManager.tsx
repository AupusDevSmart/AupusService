// src/components/common/cards/MateriaisCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, Trash2 } from 'lucide-react';

export interface MaterialItem {
  id?: string;
  descricao: string;
  quantidade_planejada: number;
  quantidade_consumida?: number;
  unidade: string;
  custo_unitario?: number;
  custo_total?: number;
}

interface MateriaisCardManagerProps {
  value: MaterialItem[];
  onChange: (materiais: MaterialItem[]) => void;
  disabled?: boolean;
  mode?: 'planejamento' | 'execucao' | 'view';
  showCustos?: boolean;
  title?: string;
}

const MateriaisCardManager: React.FC<MateriaisCardManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
  mode = 'planejamento',
  showCustos = false,
  title = "Materiais"
}) => {
  const [materiais, setMateriais] = useState<MaterialItem[]>(value);

  useEffect(() => {
    setMateriais(value);
  }, [value]);

  const updateMateriais = (newMateriais: MaterialItem[]) => {
    setMateriais(newMateriais);
    onChange(newMateriais);
  };

  const adicionarMaterial = () => {
    const novoMaterial: MaterialItem = {
      id: `temp_${Date.now()}`,
      descricao: '',
      quantidade_planejada: 1,
      unidade: 'UN',
      custo_unitario: 0,
      custo_total: 0
    };
    updateMateriais([...materiais, novoMaterial]);
  };

  const removerMaterial = (index: number) => {
    updateMateriais(materiais.filter((_, i) => i !== index));
  };

  const atualizarMaterial = (index: number, campo: keyof MaterialItem, valor: any) => {
    const novosMateriais = [...materiais];
    novosMateriais[index] = { ...novosMateriais[index], [campo]: valor };

    if (campo === 'quantidade_planejada' || campo === 'custo_unitario') {
      const material = novosMateriais[index];
      if (material.quantidade_planejada && material.custo_unitario) {
        material.custo_total = material.quantidade_planejada * material.custo_unitario;
      }
    }

    updateMateriais(novosMateriais);
  };

  const calcularCustoTotal = () => {
    return materiais.reduce((total, material) => total + (material.custo_total || 0), 0);
  };

  if (disabled && materiais.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Package className="h-5 w-5 mx-auto mb-1 opacity-40" />
        <p className="text-sm">Nenhum material cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          {materiais.length > 0 && (
            <span className="text-xs text-muted-foreground">({materiais.length})</span>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarMaterial}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Lista */}
      {materiais.length > 0 && (
        <div className="border border-border rounded-md divide-y divide-border dark:bg-[hsl(0,0%,0%)]">
          {materiais.map((material, index) => (
            <div
              key={material.id || index}
              className="flex flex-wrap items-center gap-2 px-3 py-2"
            >
              <Input
                value={material.descricao}
                onChange={(e) => atualizarMaterial(index, 'descricao', e.target.value)}
                placeholder="Descrição do material..."
                disabled={disabled}
                className="h-8 text-sm flex-1 min-w-[150px] bg-transparent border-0 shadow-none px-2 focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />
              <Input
                type="number"
                min="0"
                step="0.001"
                value={material.quantidade_planejada}
                onChange={(e) => atualizarMaterial(index, 'quantidade_planejada', parseFloat(e.target.value) || 0)}
                placeholder="Qtd"
                disabled={disabled}
                className="h-8 text-sm w-16 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
              />
              <Input
                value={material.unidade}
                onChange={(e) => atualizarMaterial(index, 'unidade', e.target.value)}
                placeholder="UN"
                disabled={disabled}
                className="h-8 text-sm w-14 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
              />
              {mode === 'execucao' && (
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={material.quantidade_consumida || ''}
                  onChange={(e) => atualizarMaterial(index, 'quantidade_consumida', parseFloat(e.target.value) || 0)}
                  placeholder="Consumido"
                  disabled={disabled}
                  className="h-8 text-sm w-20 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
                />
              )}
              {showCustos && (
                <>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={material.custo_unitario || ''}
                    onChange={(e) => atualizarMaterial(index, 'custo_unitario', parseFloat(e.target.value) || 0)}
                    placeholder="R$/un"
                    disabled={disabled}
                    className="h-8 text-sm w-20 text-center bg-transparent border-0 shadow-none px-2 focus-visible:ring-0"
                  />
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    R$ {(material.custo_total || 0).toFixed(2)}
                  </span>
                </>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerMaterial(index)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resumo */}
      {showCustos && materiais.length > 0 && (
        <div className="text-xs text-muted-foreground text-right pr-1">
          Custo total: R$ {calcularCustoTotal().toFixed(2)}
        </div>
      )}

      {/* Empty state */}
      {materiais.length === 0 && !disabled && (
        <div className="text-center py-4 border border-dashed border-border rounded-md">
          <p className="text-sm text-muted-foreground">Nenhum material adicionado</p>
        </div>
      )}
    </div>
  );
};

export { MateriaisCardManager };
