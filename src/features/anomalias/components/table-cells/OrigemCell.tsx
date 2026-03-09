// src/features/anomalias/components/table-cells/OrigemCell.tsx
import { OrigemAnomalia } from '../../types';

interface OrigemCellProps {
  origem: OrigemAnomalia;
}

const ORIGEM_LABELS: Record<OrigemAnomalia, string> = {
  SCADA: 'SCADA',
  OPERADOR: 'Operador',
  FALHA: 'Falha'
};

export function OrigemCell({ origem }: OrigemCellProps) {
  return (
    <div className="text-sm text-muted-foreground">
      {ORIGEM_LABELS[origem] || origem}
    </div>
  );
}
