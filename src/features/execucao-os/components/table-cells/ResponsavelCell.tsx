// src/features/execucao-os/components/table-cells/ResponsavelCell.tsx
import { User } from 'lucide-react';
import type { ExecucaoOS } from '../../types';

interface ResponsavelCellProps {
  item: ExecucaoOS;
}

export function ResponsavelCell({ item }: ResponsavelCellProps) {
  const responsavel = item.responsavelExecucao || item.responsavel || 'Não atribuído';
  const funcao = item.time_equipe || '-';
  const qtdTecnicos = item.tecnicos?.length || 0;

  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {responsavel}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
          {funcao}
        </span>
        {qtdTecnicos > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
            +{qtdTecnicos} técnico{qtdTecnicos > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
