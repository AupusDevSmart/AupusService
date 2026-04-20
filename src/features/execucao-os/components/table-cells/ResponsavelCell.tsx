// src/features/execucao-os/components/table-cells/ResponsavelCell.tsx
import type { ExecucaoOS } from '../../types';

interface ResponsavelCellProps {
  item: ExecucaoOS;
}

export function ResponsavelCell({ item }: ResponsavelCellProps) {
  const responsavel = item.responsavelExecucao || item.responsavel || 'Não atribuído';

  return (
    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
      {responsavel}
    </span>
  );
}
