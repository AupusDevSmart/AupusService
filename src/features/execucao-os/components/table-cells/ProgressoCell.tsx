// src/features/execucao-os/components/table-cells/ProgressoCell.tsx
import type { ExecucaoOS } from '../../types';

interface ProgressoCellProps {
  item: ExecucaoOS;
}

function formatarTempo(minutos: number | undefined | null): string {
  if (!minutos || minutos === 0) return '-';

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas > 0) {
    return `${horas}h ${mins}min`;
  }

  return `${mins}min`;
}

export function ProgressoCell({ item }: ProgressoCellProps) {
  const status = item.statusExecucao || item.status;
  const tempoTotal = (item as any).tempoTotalExecucao || item.tempo_execucao_minutos;

  let progressPercent = 0;

  switch (status) {
    case 'EM_EXECUCAO':
    case 'PAUSADA':
      progressPercent = 40;
      break;
    case 'EXECUTADA':
      progressPercent = 70;
      break;
    case 'AUDITADA':
      progressPercent = 90;
      break;
    case 'FINALIZADA':
      progressPercent = 100;
      break;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{progressPercent}%</span>
          {tempoTotal ? <span>{formatarTempo(tempoTotal)}</span> : null}
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-500 dark:bg-gray-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}