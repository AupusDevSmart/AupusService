// src/features/execucao-os/components/table-cells/TipoEPrioridadeCell.tsx
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Eye, Wrench, Car, X } from 'lucide-react';
import type { ExecucaoOS } from '../../types';

interface TipoEPrioridadeCellProps {
  item: ExecucaoOS;
}

export function TipoEPrioridadeCell({ item }: TipoEPrioridadeCellProps) {
  const tipo = item.tipo || item.os?.tipo || 'PREVENTIVA';
  const prioridade = item.prioridade || item.os?.prioridade || 'MEDIA';

  // Mapear tipos para labels simples
  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      PREVENTIVA: 'Preventiva',
      PREDITIVA: 'Preditiva',
      CORRETIVA: 'Corretiva',
      INSPECAO: 'Inspeção',
      VISITA_TECNICA: 'Visita Técnica',
    };
    return labels[tipo] || tipo;
  };

  // Mapear ícone apenas para tipo
  const getTipoIcon = (tipo: string) => {
    if (tipo === 'PREVENTIVA' || tipo === 'PREDITIVA') return Activity;
    if (tipo === 'CORRETIVA') return Wrench;
    if (tipo === 'INSPECAO') return Eye;
    if (tipo === 'VISITA_TECNICA') return Car;
    return Activity;
  };

  const TipoIcon = getTipoIcon(tipo);

  // Status (se cancelado)
  const isCancelada = item.status === 'CANCELADA' || item.statusExecucao === 'CANCELADA';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Tipo - Design minimalista sem cores */}
      <div className="flex items-center gap-1.5 text-sm">
        <TipoIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300">{getTipoLabel(tipo)}</span>
      </div>

      {/* Status cancelada - só mostra se estiver cancelada */}
      {isCancelada && (
        <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 w-fit text-xs">
          <X className="h-3 w-3 mr-1" />
          Cancelada
        </Badge>
      )}
    </div>
  );
}