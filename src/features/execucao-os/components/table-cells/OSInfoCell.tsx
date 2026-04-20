// src/features/execucao-os/components/table-cells/OSInfoCell.tsx
import type { ExecucaoOS } from '../../types';

interface OSInfoCellProps {
  item: ExecucaoOS;
}

export function OSInfoCell({ item }: OSInfoCellProps) {
  const numeroOS = item.numeroOS || item.numero_os || '-';
  const descricao = item.descricao || item.os?.descricao || 'Sem descrição';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
        {numeroOS}
      </span>
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
        {descricao}
      </p>
    </div>
  );
}
