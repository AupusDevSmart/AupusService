// src/features/planos-manutencao/components/PlanosAlerts.tsx
import { AlertTriangle } from 'lucide-react';

interface PlanosAlertsProps {
  planosInativos: number;
}

export function PlanosAlerts({ planosInativos }: PlanosAlertsProps) {
  if (planosInativos === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-950/20 dark:border-amber-500">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Planos Inativos
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {planosInativos} {planosInativos === 1 ? 'plano inativo não está' : 'planos inativos não estão'} gerando tarefas para equipamentos
          </p>
        </div>
      </div>
    </div>
  );
}
