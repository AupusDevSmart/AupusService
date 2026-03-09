// src/features/execucao-os/components/table-cells/StatusCell.tsx
import { Calendar, Play, Pause, CheckCircle, X, Clock } from 'lucide-react';

type StatusExecucao = 'PLANEJADA' | 'PROGRAMADA' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA';

interface StatusCellProps {
  status: StatusExecucao | string | undefined;
}

export function StatusCell({ status }: StatusCellProps) {
  const statusKey = (status?.toUpperCase() || 'PLANEJADA') as StatusExecucao;

  // Mapear status para label e ícone minimalista
  const getStatusConfig = (status: StatusExecucao) => {
    const configs = {
      PLANEJADA: { label: 'Planejada', icon: Clock },
      PROGRAMADA: { label: 'Programada', icon: Calendar },
      EM_EXECUCAO: { label: 'Em Execução', icon: Play },
      PAUSADA: { label: 'Pausada', icon: Pause },
      FINALIZADA: { label: 'Finalizada', icon: CheckCircle },
      CANCELADA: { label: 'Cancelada', icon: X },
    };
    return configs[status] || configs.PLANEJADA;
  };

  const config = getStatusConfig(statusKey);
  const Icon = config.icon;

  // Design minimalista - apenas texto e ícone em cinza
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
      <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
    </div>
  );
}