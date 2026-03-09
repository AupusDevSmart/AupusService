// src/features/anomalias/components/table-cells/LocalAtivoCell.tsx
import { MapPin, Wrench } from 'lucide-react';
import { Anomalia } from '../../types';

interface LocalAtivoCellProps {
  anomalia: Anomalia;
}

export function LocalAtivoCell({ anomalia }: LocalAtivoCellProps) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center gap-1.5 md:gap-2">
        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs md:text-sm truncate max-w-24 sm:max-w-32" title={anomalia.local}>
          {anomalia.local}
        </span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <Wrench className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="text-[10px] md:text-xs text-muted-foreground truncate max-w-28 sm:max-w-40" title={anomalia.ativo}>
          {anomalia.ativo}
        </span>
      </div>
    </div>
  );
}
