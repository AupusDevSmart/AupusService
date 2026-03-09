// src/features/anomalias/components/table-cells/StatusCell.tsx
import { Badge } from '@/components/ui/badge';
import { StatusAnomalia } from '../../types';

interface StatusCellProps {
  status: StatusAnomalia;
}

const STATUS_CONFIG = {
  AGUARDANDO: {
    label: 'Aguardando',
    color: 'bg-muted text-muted-foreground border border-border'
  },
  EM_ANALISE: {
    label: 'Em Análise',
    color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
  },
  OS_GERADA: {
    label: 'OS Gerada',
    color: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50'
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'bg-muted text-muted-foreground border border-border'
  },
  RESOLVIDA: {
    label: 'Resolvida',
    color: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50'
  }
};

export function StatusCell({ status }: StatusCellProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-muted text-muted-foreground border border-border'
  };

  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}
