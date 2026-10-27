// src/components/common/cards/MateriaisCardManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, Trash2 } from 'lucide-react';
import { CardLista, CardLinha, campoCard, type ColunaCard } from './card-lista';
import { formatCurrency } from '@/lib/utils';
import { useVeCustos } from '@/hooks/useVeCustos';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { AVISO_DE_DINHEIRO, AVISO_DE_QUANTIDADE, dinheiroNoCampo, lerDinheiroDigitado, lerQuantidadeDigitada } from '@/utils/leitura';

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
  showCustos: pedeCustos = false,
  title = "Materiais"
}) => {
  // SERV-10: o cliente não vê dinheiro (a API já não manda o valor)
  const showCustos = useVeCustos() && pedeCustos;
  const [materiais, setMateriais] = useState<MaterialItem[]>(value);
  // Na execução só se registra o consumo: o backend (PATCH :id/materiais)
  // grava quantidade consumida de itens que já existem. Adicionar, remover ou
  // mudar o planejado aqui não teria para onde ir.
  const somenteRegistro = mode === 'execucao';
  const planejadoTravado = disabled || somenteRegistro;

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

  const atualizarMaterial = <K extends keyof MaterialItem>(index: number, campo: K, valor: MaterialItem[K]) => {
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

  // Na execução, o custo é o do CONSUMIDO: o `custo_total` da linha é o planejado, e o cartão
  // "Materiais Consumidos" mostrava o custo de um consumo que não houve (SN-93)
  const custoDaLinha = (material: MaterialItem) =>
    somenteRegistro ? (material.quantidade_consumida ?? 0) * (material.custo_unitario ?? 0) : material.custo_total || 0;

  const calcularCustoTotal = () => {
    return materiais.reduce((total, material) => total + custoDaLinha(material), 0);
  };

  const colunas: ColunaCard[] = [
    { label: 'Material', largura: 'minmax(10rem, 1fr)' },
    { label: 'Qtd', largura: '4rem', alinhamento: 'center' },
    { label: 'Un.', largura: '3.5rem', alinhamento: 'center' },
    ...(mode === 'execucao'
      ? [{ label: 'Consumido', largura: '5.5rem', alinhamento: 'center' as const }]
      : []),
    ...(showCustos
      ? [
          { label: 'R$/un', largura: '5rem', alinhamento: 'center' as const },
          { label: 'Custo', largura: '5.5rem', alinhamento: 'right' as const },
        ]
      : []),
    ...(!planejadoTravado ? [{ label: '', largura: '2rem' }] : []),
  ];

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
        {!planejadoTravado && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Adicionar material"
            onClick={adicionarMaterial}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Lista */}
      {materiais.length > 0 && (
        <CardLista colunas={colunas}>
          {materiais.map((material, index) => (
            <CardLinha key={material.id || index} colunas={colunas}>
              <Input
                value={material.descricao}
                onChange={(e) => atualizarMaterial(index, 'descricao', e.target.value)}
                placeholder="Descrição do material..."
                disabled={planejadoTravado}
                className={campoCard}
              />
              {/* Texto com vírgula, não type="number" (SN-58): o campo do navegador perdia o "0,375" */}
              <CampoDeNumero
                value={material.quantidade_planejada ?? null}
                onChange={(valor) => atualizarMaterial(index, 'quantidade_planejada', valor ?? 0)}
                ler={lerQuantidadeDigitada}
                aviso={AVISO_DE_QUANTIDADE}
                avisoCurto
                placeholder="Qtd"
                aria-label={`Quantidade planejada de ${material.descricao || 'material'}`}
                disabled={planejadoTravado}
                className={`${campoCard} text-center`}
              />
              <Input
                value={material.unidade}
                onChange={(e) => atualizarMaterial(index, 'unidade', e.target.value)}
                placeholder="UN"
                disabled={planejadoTravado}
                className={`${campoCard} text-center`}
              />
              {mode === 'execucao' && (
                <CampoDeNumero
                  value={material.quantidade_consumida || null}
                  onChange={(valor) => atualizarMaterial(index, 'quantidade_consumida', valor ?? 0)}
                  ler={lerQuantidadeDigitada}
                  aviso={AVISO_DE_QUANTIDADE}
                  avisoCurto
                  placeholder="Consumido"
                  aria-label={`Quantidade consumida de ${material.descricao || 'material'}`}
                  disabled={disabled}
                  className={`${campoCard} text-center`}
                />
              )}
              {showCustos && (
                <>
                  <CampoDeNumero
                    value={material.custo_unitario || null}
                    onChange={(valor) => atualizarMaterial(index, 'custo_unitario', valor ?? 0)}
                    ler={lerDinheiroDigitado}
                    mostrar={dinheiroNoCampo}
                    aviso={AVISO_DE_DINHEIRO}
                    avisoCurto
                    placeholder="R$/un"
                    aria-label={`Custo unitário de ${material.descricao || 'material'}`}
                    disabled={planejadoTravado}
                    className={`${campoCard} text-right`}
                  />
                  <span className="text-sm text-muted-foreground text-right truncate">
                    {formatCurrency(custoDaLinha(material))}
                  </span>
                </>
              )}
              {!planejadoTravado && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerMaterial(index)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardLinha>
          ))}
        </CardLista>
      )}

      {/* Resumo */}
      {showCustos && materiais.length > 0 && (
        <div className="text-xs text-muted-foreground text-right pr-1">
          {somenteRegistro ? 'Custo do consumido' : 'Custo total'}: {formatCurrency(calcularCustoTotal())}
        </div>
      )}

    </div>
  );
};

export { MateriaisCardManager };
