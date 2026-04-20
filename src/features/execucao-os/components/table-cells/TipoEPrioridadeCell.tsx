// src/features/execucao-os/components/table-cells/TipoEPrioridadeCell.tsx
import type { ExecucaoOS } from '../../types';

interface TipoEPrioridadeCellProps {
  item: ExecucaoOS;
}

const tipoLabels: Record<string, string> = {
  PREVENTIVA: 'Preventiva',
  PREDITIVA: 'Preditiva',
  CORRETIVA: 'Corretiva',
  INSPECAO: 'Inspeção',
  VISITA_TECNICA: 'Visita Técnica',
};

const prioridadeLabels: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export function TipoEPrioridadeCell({ item }: TipoEPrioridadeCellProps) {
  const tipo = item.tipo || item.os?.tipo || 'PREVENTIVA';
  const prioridade = item.prioridade || item.os?.prioridade || 'MEDIA';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {tipoLabels[tipo] || tipo}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {prioridadeLabels[prioridade] || prioridade}
      </span>
    </div>
  );
}