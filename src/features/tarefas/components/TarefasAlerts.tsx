// src/features/tarefas/components/TarefasAlerts.tsx
import { AlertCircle, Filter } from 'lucide-react';

interface TarefasAlertsProps {
  tarefasAtrasadas: number;
  onFilterAtrasadas?: () => void;
}

export function TarefasAlerts({ tarefasAtrasadas, onFilterAtrasadas }: TarefasAlertsProps) {
  if (tarefasAtrasadas === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-950/20 dark:border-amber-500">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-medium">{tarefasAtrasadas}</span> {tarefasAtrasadas === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'} {tarefasAtrasadas === 1 ? 'requer' : 'requerem'} atenção
          </p>
        </div>
        {onFilterAtrasadas && (
          <button
            onClick={onFilterAtrasadas}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-sm transition-colors"
          >
            <Filter className="h-3 w-3" />
            Visualizar tarefas atrasadas
          </button>
        )}
      </div>
    </div>
  );
}
