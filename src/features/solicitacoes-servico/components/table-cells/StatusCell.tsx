// src/features/solicitacoes-servico/components/table-cells/StatusCell.tsx
import { Badge } from '@/components/ui/badge';
import { StatusSolicitacaoServico } from '../../types';

interface StatusCellProps {
  status: StatusSolicitacaoServico;
}

const statusConfig: Record<
  StatusSolicitacaoServico,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  REGISTRADA: { label: 'Registrada', variant: 'outline' },
  PROGRAMADA: { label: 'Programada', variant: 'default' },
  FINALIZADA: { label: 'Finalizada', variant: 'secondary' },
};

export function StatusCell({ status }: StatusCellProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
