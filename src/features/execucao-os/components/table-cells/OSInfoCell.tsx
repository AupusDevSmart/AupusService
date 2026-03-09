// src/features/execucao-os/components/table-cells/OSInfoCell.tsx
import type { ExecucaoOS } from '../../types';
import { Badge } from '@/components/ui/badge';

interface OSInfoCellProps {
  item: ExecucaoOS;
}

export function OSInfoCell({ item }: OSInfoCellProps) {
  const numeroOS = item.numeroOS || item.numero_os || '-';
  const descricao = item.descricao || item.os?.descricao || 'Sem descrição';
  const equipamento = item.ativo || item.os?.ativo || 'Não especificado';
  const local = item.local || item.os?.local || '';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          {numeroOS}
        </Badge>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {equipamento}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
        {descricao}
      </p>
      {local && (
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {local}
        </p>
      )}
    </div>
  );
}
