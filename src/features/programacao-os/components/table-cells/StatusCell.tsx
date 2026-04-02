// src/features/programacao-os/components/table-cells/StatusCell.tsx

import React from 'react';

interface StatusCellProps {
  status: string;
}

const statusConfig = {
  PENDENTE: {
    label: 'Pendente',
    className: 'text-amber-600 dark:text-amber-500',
  },
  APROVADA: {
    label: 'Aprovada',
    className: 'text-emerald-600 dark:text-emerald-500',
  },
  FINALIZADA: {
    label: 'Finalizada',
    className: 'text-blue-600 dark:text-blue-400',
  },
  CANCELADA: {
    label: 'Cancelada',
    className: 'text-gray-500 dark:text-gray-500',
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
