// src/features/planos-manutencao/components/PlanosDashboard.tsx
import { Layers, CheckCircle, XCircle, Users } from 'lucide-react';
import { DashboardPlanosDto } from '@/services/planos-manutencao.services';

interface PlanosDashboardProps {
  data: DashboardPlanosDto;
}

export function PlanosDashboard({ data }: PlanosDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.total_planos}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Planos</p>
          </div>
        </div>
      </div>

      {/* Ativos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.planos_ativos}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
          </div>
        </div>
      </div>

      {/* Inativos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.planos_inativos}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Inativos</p>
          </div>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.equipamentos_com_plano}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipamentos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
