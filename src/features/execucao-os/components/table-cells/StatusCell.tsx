// src/features/execucao-os/components/table-cells/StatusCell.tsx
import { Play, Pause, CheckCircle, CheckCircle2, X, Clock, Shield } from 'lucide-react';

type StatusExecucao = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'EXECUTADA' | 'AUDITADA' | 'FINALIZADA' | 'CANCELADA';

interface StatusCellProps {
  status: StatusExecucao | string | undefined;
}

export function StatusCell({ status }: StatusCellProps) {
  const statusKey = (status?.toUpperCase() || 'PENDENTE') as StatusExecucao;

  const getStatusConfig = (status: StatusExecucao) => {
    const configs: Record<StatusExecucao, { label: string; icon: typeof Clock; colorClass: string }> = {
      PENDENTE: { label: 'Pendente', icon: Clock, colorClass: 'text-amber-500 dark:text-amber-400' },
      EM_EXECUCAO: { label: 'Em Execução', icon: Play, colorClass: 'text-blue-500 dark:text-blue-400' },
      PAUSADA: { label: 'Pausada', icon: Pause, colorClass: 'text-orange-500 dark:text-orange-400' },
      EXECUTADA: { label: 'Executada', icon: CheckCircle, colorClass: 'text-teal-500 dark:text-teal-400' },
      AUDITADA: { label: 'Auditada', icon: Shield, colorClass: 'text-purple-500 dark:text-purple-400' },
      FINALIZADA: { label: 'Finalizada', icon: CheckCircle2, colorClass: 'text-emerald-500 dark:text-emerald-400' },
      CANCELADA: { label: 'Cancelada', icon: X, colorClass: 'text-gray-400 dark:text-gray-500' },
    };
    return configs[status] || configs.PENDENTE;
  };

  const config = getStatusConfig(statusKey);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon className={`h-3.5 w-3.5 ${config.colorClass}`} />
      <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
    </div>
  );
}