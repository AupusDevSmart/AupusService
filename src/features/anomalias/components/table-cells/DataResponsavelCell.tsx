// src/features/anomalias/components/table-cells/DataResponsavelCell.tsx
import { Calendar, User } from 'lucide-react';
import { Anomalia } from '../../types';

interface DataResponsavelCellProps {
  anomalia: Anomalia;
}

export function DataResponsavelCell({ anomalia }: DataResponsavelCellProps) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center gap-1.5 md:gap-2">
        <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs md:text-sm">
          {anomalia.data ? new Date(anomalia.data).toLocaleDateString('pt-BR') : 'N/A'}
        </span>
      </div>
      {anomalia.criadoPor && (
        <div className="flex items-center gap-1.5 md:gap-2">
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] md:text-xs text-muted-foreground truncate max-w-20 sm:max-w-24" title={anomalia.criadoPor}>
            {anomalia.criadoPor}
          </span>
        </div>
      )}
    </div>
  );
}
