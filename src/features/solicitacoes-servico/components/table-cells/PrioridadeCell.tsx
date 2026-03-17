// src/features/solicitacoes-servico/components/table-cells/PrioridadeCell.tsx
import { Badge } from '@/components/ui/badge';
import { PrioridadeSolicitacao } from '../../types';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

interface PrioridadeCellProps {
  prioridade: PrioridadeSolicitacao;
}

const prioridadeConfig: Record<
  PrioridadeSolicitacao,
  { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: any }
> = {
  URGENTE: { label: 'Urgente', variant: 'destructive', icon: AlertTriangle },
  ALTA: { label: 'Alta', variant: 'destructive', icon: ArrowUp },
  MEDIA: { label: 'Média', variant: 'default', icon: Minus },
  BAIXA: { label: 'Baixa', variant: 'secondary', icon: ArrowDown },
};

export function PrioridadeCell({ prioridade }: PrioridadeCellProps) {
  const config = prioridadeConfig[prioridade] || {
    label: prioridade,
    variant: 'default' as const,
    icon: Minus,
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
