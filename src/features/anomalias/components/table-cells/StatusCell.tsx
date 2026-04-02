// src/features/anomalias/components/table-cells/StatusCell.tsx
import { Badge } from '@/components/ui/badge';
import { StatusAnomalia } from '../../types';

interface StatusCellProps {
  status: StatusAnomalia;
}

const STATUS_CONFIG: Record<StatusAnomalia, { label: string; variant: 'outline' | 'default' | 'secondary' }> = {
  REGISTRADA: { label: 'Registrada', variant: 'outline' },
  PROGRAMADA: { label: 'Programada', variant: 'default' },
  FINALIZADA: { label: 'Finalizada', variant: 'secondary' },
};

export function StatusCell({ status }: StatusCellProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    variant: 'outline' as const,
  };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
