// src/features/planos-manutencao/components/table-cells/EquipamentoLocalCell.tsx
import { Wrench, Factory } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface EquipamentoLocalCellProps {
  plano: PlanoManutencaoApiResponse;
}

export function EquipamentoLocalCell({ plano }: EquipamentoLocalCellProps) {
  const equipamentoNome = plano.equipamento?.nome || 'Sem equipamento';
  const plantaNome = plano.equipamento?.unidade?.planta?.nome || plano.equipamento?.planta?.nome || 'Sem planta';
  const unidadeNome = plano.equipamento?.unidade?.nome;

  return (
    <div className="space-y-1">
      {/* Equipamento */}
      <div className="flex items-center gap-2">
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm truncate max-w-32" title={equipamentoNome}>
          {equipamentoNome}
        </span>
      </div>

      {/* Planta */}
      <div className="flex items-center gap-2">
        <Factory className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-32" title={plantaNome}>
          {plantaNome}
        </span>
      </div>

      {/* Unidade (se existir) */}
      {unidadeNome && (
        <div className="text-xs text-muted-foreground">
          → {unidadeNome}
        </div>
      )}
    </div>
  );
}
