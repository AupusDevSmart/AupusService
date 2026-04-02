// src/features/execucao-os/components/table-cells/ProgressoCell.tsx
import { Clock, Timer } from 'lucide-react';
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
  const tempoTotal = item.tempoTotalExecucao || item.tempo_execucao_minutos;
  const dataInicio = item.data_hora_inicio_real || item.dataHoraInicioReal || item.dataInicioReal;

  // Calcular progresso baseado no status - visual minimalista
  let progressPercent = 0;
  let progressLabel = '';

  switch (status) {
    case 'PENDENTE':
      progressPercent = 0;
      progressLabel = 'Pendente';
      break;
    case 'EM_EXECUCAO':
      progressPercent = 40;
      progressLabel = 'Em andamento';
      break;
    case 'PAUSADA':
      progressPercent = 40;
      progressLabel = 'Pausada';
      break;
    case 'EXECUTADA':
      progressPercent = 70;
      progressLabel = 'Executada';
      break;
    case 'AUDITADA':
      progressPercent = 90;
      progressLabel = 'Auditada';
      break;
    case 'FINALIZADA':
      progressPercent = 100;
      progressLabel = 'Finalizada';
      break;
    case 'CANCELADA':
      progressPercent = 0;
      progressLabel = 'Cancelada';
      break;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Barra de progresso minimalista */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>{progressLabel}</span>
          <span className="text-gray-500 dark:text-gray-500">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-500 dark:bg-gray-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tempo de execução - simplificado */}
      {(status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'EXECUTADA' || status === 'AUDITADA' || status === 'FINALIZADA') && (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {dataInicio && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(dataInicio).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
          )}
          {tempoTotal && (
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              <span>{formatarTempo(tempoTotal)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}