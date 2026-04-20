// src/features/execucao-os/components/table-cells/StatusCell.tsx
type StatusExecucao = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'EXECUTADA' | 'AUDITADA' | 'FINALIZADA' | 'CANCELADA';

interface StatusCellProps {
  status: StatusExecucao | string | undefined;
}

const statusLabels: Record<StatusExecucao, { label: string; className: string }> = {
  PENDENTE: { label: 'Pendente', className: 'text-gray-600 dark:text-gray-400' },
  EM_EXECUCAO: { label: 'Em Execução', className: 'text-gray-700 dark:text-gray-300' },
  PAUSADA: { label: 'Pausada', className: 'text-gray-600 dark:text-gray-400' },
  EXECUTADA: { label: 'Executada', className: 'text-gray-700 dark:text-gray-300' },
  AUDITADA: { label: 'Auditada', className: 'text-gray-600 dark:text-gray-400' },
  FINALIZADA: { label: 'Finalizada', className: 'text-gray-500 dark:text-gray-500' },
  CANCELADA: { label: 'Cancelada', className: 'text-gray-400 dark:text-gray-600' },
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