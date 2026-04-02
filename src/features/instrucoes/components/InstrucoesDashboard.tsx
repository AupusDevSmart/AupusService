// src/features/instrucoes/components/InstrucoesDashboard.tsx
import { FileText, CheckCircle, FileStack } from 'lucide-react';
import { DashboardInstrucoesDto } from '@/services/instrucoes.services';

interface InstrucoesDashboardProps {
  data: DashboardInstrucoesDto;
}

export function InstrucoesDashboard({ data }: InstrucoesDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.total_instrucoes}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Instrucoes</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.instrucoes_ativas}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileStack className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.total_tarefas_derivadas}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tarefas Derivadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
