// src/features/planos-manutencao/components/table-cells/PlanoInfoCell.tsx
import { Layers } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface PlanoInfoCellProps {
  plano: PlanoManutencaoApiResponse;
}

export function PlanoInfoCell({ plano }: PlanoInfoCellProps) {
  return (
    <div className="flex items-center gap-2 font-medium text-foreground">
      <Layers className="h-4 w-4 text-gray-600 flex-shrink-0" />
      <span className="truncate" title={plano.descricao || plano.nome}>{plano.nome}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">v{plano.versao}</span>
    </div>
  );
}
