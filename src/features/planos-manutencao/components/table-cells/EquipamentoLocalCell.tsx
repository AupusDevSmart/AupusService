// src/features/planos-manutencao/components/table-cells/EquipamentoLocalCell.tsx
import { Wrench } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface EquipamentoLocalCellProps {
  plano: PlanoManutencaoApiResponse;
}

export function EquipamentoLocalCell({ plano }: EquipamentoLocalCellProps) {
  const equipamentoNome = plano.equipamento?.nome || 'Sem equipamento';
  const plantaNome = plano.equipamento?.unidade?.planta?.nome || plano.equipamento?.planta?.nome || 'Sem planta';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Wrench className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-sm truncate" title={`${equipamentoNome} · ${plantaNome}`}>
        {equipamentoNome}
      </span>
      <span className="text-xs text-muted-foreground truncate flex-shrink-0" title={plantaNome}>
        · {plantaNome}
      </span>
    </div>
  );
}
