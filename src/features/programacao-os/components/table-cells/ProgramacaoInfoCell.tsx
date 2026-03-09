// src/features/programacao-os/components/table-cells/ProgramacaoInfoCell.tsx

import React from 'react';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';

interface ProgramacaoInfoCellProps {
  item: ProgramacaoResponse;
}

export function ProgramacaoInfoCell({ item }: ProgramacaoInfoCellProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Código da OS */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
          {item.codigo}
        </span>
      </div>

      {/* Descrição */}
      <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
        {item.descricao}
      </div>

      {/* Local e Ativo */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          {item.local}
        </span>
        {item.ativo && (
          <span className="flex items-center gap-1">
            • {item.ativo}
          </span>
        )}
      </div>
    </div>
  );
}
