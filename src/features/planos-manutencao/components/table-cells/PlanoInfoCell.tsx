// src/features/planos-manutencao/components/table-cells/PlanoInfoCell.tsx
import { Layers } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface PlanoInfoCellProps {
  plano: PlanoManutencaoApiResponse;
}

export function PlanoInfoCell({ plano }: PlanoInfoCellProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <Layers className="h-4 w-4 text-gray-600" />
        <span>{plano.nome}</span>
      </div>
      {plano.descricao && (
        <div className="text-sm text-muted-foreground truncate max-w-64" title={plano.descricao}>
          {plano.descricao}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>v{plano.versao}</span>
      </div>
    </div>
  );
}
