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
  RASCUNHO: { label: 'Rascunho', variant: 'outline' },
  AGUARDANDO: { label: 'Aguardando', variant: 'secondary' },
  EM_ANALISE: { label: 'Em Análise', variant: 'default' },
  APROVADA: { label: 'Aprovada', variant: 'default' },
  REJEITADA: { label: 'Rejeitada', variant: 'destructive' },
  EM_EXECUCAO: { label: 'Em Execução', variant: 'default' },
  CONCLUIDA: { label: 'Concluída', variant: 'default' },
  CANCELADA: { label: 'Cancelada', variant: 'destructive' },
};

export function StatusCell({ status }: StatusCellProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
