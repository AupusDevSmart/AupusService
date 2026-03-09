// src/features/anomalias/components/table-cells/PrioridadeCell.tsx
import { Badge } from '@/components/ui/badge';
import { PrioridadeAnomalia } from '../../types';

interface PrioridadeCellProps {
  prioridade: PrioridadeAnomalia;
}

const PRIORIDADE_CONFIG = {
  BAIXA: {
    label: 'Baixa',
    color: 'bg-muted text-muted-foreground border border-border'
  },
  MEDIA: {
    label: 'Média',
    color: 'bg-muted text-muted-foreground border border-border'
  },
  ALTA: {
    label: 'Alta',
    color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50'
  },
  CRITICA: {
    label: 'Crítica',
    color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
  }
};

export function PrioridadeCell({ prioridade }: PrioridadeCellProps) {
  const config = PRIORIDADE_CONFIG[prioridade] || {
    label: prioridade,
    color: 'bg-muted text-muted-foreground border border-border'
  };

  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}
