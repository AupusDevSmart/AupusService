// src/features/planos-manutencao/components/table-cells/StatusCell.tsx
import { CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface StatusCellProps {
  plano: PlanoManutencaoApiResponse;
}

function formatarStatus(ativo: boolean) {
  return ativo
    ? { label: 'Ativo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
    : { label: 'Inativo', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
}

export function StatusCell({ plano }: StatusCellProps) {
  const statusConfig = formatarStatus(plano.ativo);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge className={`text-xs ${statusConfig.color}`}>
          {plano.ativo ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {statusConfig.label}
        </Badge>
      </div>
      {plano.status && plano.status !== 'ATIVO' && (
        <div>
          <Badge variant="outline" className="text-xs">
            {plano.status}
          </Badge>
        </div>
      )}
    </div>
  );
}
