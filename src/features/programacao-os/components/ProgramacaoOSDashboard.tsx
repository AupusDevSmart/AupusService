// src/features/programacao-os/components/ProgramacaoOSDashboard.tsx

import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';

interface ProgramacaoOSDashboardProps {
  stats: {
    rascunho: number;
    pendentes: number;
    em_analise: number;
    aprovadas: number;
    rejeitadas: number;
    canceladas: number;
  };
  total: number;
}

/**
 * Dashboard de estatísticas de Programação de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 * Mostra apenas 4 métricas principais (pendentes, em análise, aprovadas, total)
 */
export function ProgramacaoOSDashboard({ stats, total }: ProgramacaoOSDashboardProps) {
  const dashboardStats = [
    {
      icon: Clock,
      value: stats.pendentes,
      label: 'Pendentes',
      iconColor: 'text-amber-600 dark:text-amber-500',
    },
    {
      icon: AlertTriangle,
      value: stats.em_analise,
      label: 'Em Análise',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
    {
      icon: CheckCircle,
      value: stats.aprovadas,
      label: 'Aprovadas',
      iconColor: 'text-emerald-600 dark:text-emerald-500',
    },
    {
      icon: FileText,
      value: total,
      label: 'Total',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      {dashboardStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${stat.iconColor} flex-shrink-0`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
