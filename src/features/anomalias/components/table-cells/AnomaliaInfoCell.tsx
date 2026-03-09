// src/features/anomalias/components/table-cells/AnomaliaInfoCell.tsx
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Anomalia } from '../../types';

interface AnomaliaInfoCellProps {
  anomalia: Anomalia;
}

const getCondicaoIcon = (condicao: string) => {
  switch (condicao) {
    case 'PARADO':
      return <XCircle className="h-3 w-3 text-red-500" />;
    case 'FUNCIONANDO':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'RISCO_ACIDENTE':
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    default:
      return <AlertTriangle className="h-3 w-3 text-gray-400" />;
  }
};

const getCondicaoLabel = (condicao: string) => {
  switch (condicao) {
    case 'PARADO':
      return 'Parado';
    case 'FUNCIONANDO':
      return 'Funcionando';
    case 'RISCO_ACIDENTE':
      return 'Risco Acidente';
    default:
      return condicao;
  }
};

export function AnomaliaInfoCell({ anomalia }: AnomaliaInfoCellProps) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center gap-1.5 md:gap-2 font-medium text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600 flex-shrink-0" />
        <span className="truncate max-w-32 sm:max-w-48 text-sm md:text-base" title={anomalia.descricao}>
          {anomalia.descricao}
        </span>
      </div>
      <div className="text-[10px] md:text-xs font-mono text-muted-foreground">
        ID: {String(anomalia.id || '').slice(-8) || anomalia.id}
      </div>
      <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
        {getCondicaoIcon(anomalia.condicao)}
        <span>{getCondicaoLabel(anomalia.condicao)}</span>
      </div>
    </div>
  );
}
