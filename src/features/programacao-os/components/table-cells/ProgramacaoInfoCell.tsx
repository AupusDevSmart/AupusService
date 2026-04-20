// src/features/programacao-os/components/table-cells/ProgramacaoInfoCell.tsx

import type { ProgramacaoResponse } from '@/services/programacao-os.service';

interface ProgramacaoInfoCellProps {
  item: ProgramacaoResponse;
}

export function ProgramacaoInfoCell({ item }: ProgramacaoInfoCellProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
        {item.codigo}
      </span>
      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
        {item.descricao}
      </div>
    </div>
  );
}
