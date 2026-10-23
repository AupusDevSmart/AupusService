// src/features/execucao-os/components/table-cells/StatusCell.tsx
import { statusLabels as rotulos } from '@/features/execucao-os/config/labels';
type StatusExecucao = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'EXECUTADA' | 'AUDITADA' | 'FINALIZADA' | 'CANCELADA';

interface StatusCellProps {
  status: StatusExecucao | string | undefined;
}

// O rótulo vem de labels.ts (a exportação da lista usa o mesmo); aqui só a cor
const statusLabels: Record<StatusExecucao, { label: string; className: string }> = {
  PENDENTE: { label: rotulos.PENDENTE, className: 'text-gray-600 dark:text-gray-400' },
  EM_EXECUCAO: { label: rotulos.EM_EXECUCAO, className: 'text-gray-700 dark:text-gray-300' },
  PAUSADA: { label: rotulos.PAUSADA, className: 'text-gray-600 dark:text-gray-400' },
  EXECUTADA: { label: rotulos.EXECUTADA, className: 'text-gray-700 dark:text-gray-300' },
  AUDITADA: { label: rotulos.AUDITADA, className: 'text-gray-600 dark:text-gray-400' },
  FINALIZADA: { label: rotulos.FINALIZADA, className: 'text-gray-500 dark:text-gray-500' },
  CANCELADA: { label: rotulos.CANCELADA, className: 'text-gray-400 dark:text-gray-600' },
};

export function StatusCell({ status }: StatusCellProps) {
  const statusKey = (status?.toUpperCase() || 'PENDENTE') as StatusExecucao;
  const config = statusLabels[statusKey] || statusLabels.PENDENTE;

  return (
    <span className={`text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}