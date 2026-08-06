// src/components/common/cards/FerramentasCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Wrench, Trash2 } from 'lucide-react';
import { CardLista, CardLinha, campoCard, type ColunaCard } from './card-lista';

export interface FerramentaItem {
  id?: string;
  descricao: string;
  quantidade: number;
  utilizada?: boolean;
  condicao_antes?: string;
  condicao_depois?: string;
  codigo_patrimonial?: string;
  necessita_calibracao?: boolean;
  proxima_data_calibracao?: string;
}

interface FerramentasCardManagerProps {
  value: FerramentaItem[];
  onChange: (ferramentas: FerramentaItem[]) => void;
  disabled?: boolean;
  mode?: 'planejamento' | 'execucao' | 'view';
  showCondicao?: boolean;
  showCalibracao?: boolean;
  title?: string;
}

const FerramentasCardManager: React.FC<FerramentasCardManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
  mode = 'planejamento',
  title = "Ferramentas"
}) => {
  const [ferramentas, setFerramentas] = useState<FerramentaItem[]>(value);

  useEffect(() => {
    setFerramentas(value);
  }, [value]);

  const updateFerramentas = (newFerramentas: FerramentaItem[]) => {
    setFerramentas(newFerramentas);
    onChange(newFerramentas);
  };

  const adicionarFerramenta = () => {
    const novaFerramenta: FerramentaItem = {
      id: `temp_${Date.now()}`,
      descricao: '',
      quantidade: 1,
      utilizada: false
    };
    updateFerramentas([...ferramentas, novaFerramenta]);
  };

  const removerFerramenta = (index: number) => {
    updateFerramentas(ferramentas.filter((_, i) => i !== index));
  };

  const atualizarFerramenta = (index: number, campo: keyof FerramentaItem, valor: any) => {
    const novasFerramentas = [...ferramentas];
    novasFerramentas[index] = { ...novasFerramentas[index], [campo]: valor };
    updateFerramentas(novasFerramentas);
  };

  if (disabled && ferramentas.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Wrench className="h-5 w-5 mx-auto mb-1 opacity-40" />
        <p className="text-sm">Nenhuma ferramenta cadastrada</p>
      </div>
    );
  }

  const colunas: ColunaCard[] = [
    { label: 'Ferramenta', largura: 'minmax(12rem, 1fr)' },
    { label: 'Qtd', largura: '4rem', alinhamento: 'center' },
    ...(mode === 'execucao'
      ? [{ label: 'Utilizada', largura: '4.5rem', alinhamento: 'center' as const }]
      : []),
    ...(!disabled ? [{ label: '', largura: '2rem' }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          {ferramentas.length > 0 && (
            <span className="text-xs text-muted-foreground">({ferramentas.length})</span>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarFerramenta}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Lista */}
      {ferramentas.length > 0 && (
        <CardLista colunas={colunas} larguraMinima="30rem">
          {ferramentas.map((ferramenta, index) => (
            <CardLinha key={ferramenta.id || index} colunas={colunas}>
              <Input
                value={ferramenta.descricao}
                onChange={(e) => atualizarFerramenta(index, 'descricao', e.target.value)}
                placeholder="Descrição da ferramenta..."
                disabled={disabled}
                className={campoCard}
              />
              <Input
                type="number"
                min="1"
                value={ferramenta.quantidade}
                onChange={(e) => atualizarFerramenta(index, 'quantidade', parseInt(e.target.value) || 1)}
                placeholder="Qtd"
                disabled={disabled}
                className={`${campoCard} text-center`}
              />
              {mode === 'execucao' && (
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={ferramenta.utilizada}
                    onChange={(e) => atualizarFerramenta(index, 'utilizada', e.target.checked)}
                    disabled={disabled}
                    className="rounded border-border"
                    aria-label="Utilizada"
                  />
                </div>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerFerramenta(index)}
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

      {/* Empty state */}
      {ferramentas.length === 0 && !disabled && (
        <div className="text-center py-4 border border-dashed border-border rounded-md">
          <p className="text-sm text-muted-foreground">Nenhuma ferramenta adicionada</p>
        </div>
      )}
    </div>
  );
};

export { FerramentasCardManager };
