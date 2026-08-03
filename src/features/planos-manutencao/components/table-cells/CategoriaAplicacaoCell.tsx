// src/features/planos-manutencao/components/table-cells/CategoriaAplicacaoCell.tsx
import { Layers, Wrench } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface CategoriaAplicacaoCellProps {
  plano: PlanoManutencaoApiResponse;
}

/**
 * O plano deixou de ser 1:1 com equipamento: agora e um template de categoria.
 * A coluna mostra a categoria e quantos equipamentos ja usam esse template.
 */
export function CategoriaAplicacaoCell({ plano }: CategoriaAplicacaoCellProps) {
  const categoriaNome = plano.categoria?.nome || 'Sem categoria';
  const vinculados = plano.total_equipamentos_vinculados ?? 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Layers className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-sm truncate" title={categoriaNome}>
        {categoriaNome}
      </span>
      <span
        className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0"
        title={`${vinculados} equipamento${vinculados === 1 ? '' : 's'} usando este plano`}
      >
        <Wrench className="h-3 w-3" />
        {vinculados}
      </span>
    </div>
  );
}
