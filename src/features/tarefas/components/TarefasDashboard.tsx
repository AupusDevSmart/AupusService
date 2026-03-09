// src/features/tarefas/components/TarefasDashboard.tsx
import { Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import { DashboardTarefasDto } from '@/services/tarefas.services';

interface TarefasDashboardProps {
  data: DashboardTarefasDto;
}

export function TarefasDashboard({ data }: TarefasDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.total_tarefas}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</p>
          </div>
        </div>
      </div>

      {/* Ativas */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.tarefas_ativas}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
          </div>
        </div>
      </div>

      {/* Atrasadas */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.tarefas_atrasadas}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
