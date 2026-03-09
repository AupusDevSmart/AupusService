// src/features/tarefas/components/EquipamentoPlantaCell.tsx
import { Wrench, Factory } from 'lucide-react';

interface EquipamentoPlantaCellProps {
  equipamentoNome?: string;
  plantaNome?: string;
}

export function EquipamentoPlantaCell({ equipamentoNome, plantaNome }: EquipamentoPlantaCellProps) {
  const equipamentoDisplay = equipamentoNome || 'Sem equipamento';
  const plantaDisplay = plantaNome || 'Sem planta';

  return (
    <div className="space-y-1">
      {/* Equipamento */}
      <div className="flex items-center gap-2">
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm truncate max-w-32" title={equipamentoDisplay}>
          {equipamentoDisplay}
        </span>
      </div>

      {/* Planta */}
      <div className="flex items-center gap-2">
        <Factory className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate max-w-32" title={plantaDisplay}>
          {plantaDisplay}
        </span>
      </div>
    </div>
  );
}