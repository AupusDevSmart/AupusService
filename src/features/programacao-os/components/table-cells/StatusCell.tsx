// src/features/programacao-os/components/table-cells/StatusCell.tsx

interface StatusCellProps {
  status: string;
}

const statusConfig = {
  PENDENTE: {
    label: 'Pendente',
    className: 'text-gray-600 dark:text-gray-400',
  },
  APROVADA: {
    label: 'Aprovada',
    className: 'text-gray-700 dark:text-gray-300',
  },
  FINALIZADA: {
    label: 'Finalizada',
    className: 'text-gray-500 dark:text-gray-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    className: 'text-gray-400 dark:text-gray-600',
  },
};

export function StatusCell({ status }: StatusCellProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <span className={`text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
