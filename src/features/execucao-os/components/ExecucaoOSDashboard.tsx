// src/features/execucao-os/components/ExecucaoOSDashboard.tsx
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Play,
  Clock,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface ExecucaoOSDashboardProps {
  total: number;
  apiStats: Record<string, number>;
  loading: boolean;
  onFilterAtrasadas?: () => void;
  onFilterCriticas?: () => void;
}

export function ExecucaoOSDashboard({ total, apiStats, loading, onFilterAtrasadas, onFilterCriticas }: ExecucaoOSDashboardProps) {
  const stats = useMemo(() => ({
    total,
    emExecucao: (apiStats.em_execucao || 0) + (apiStats.pausadas || 0),
    atrasadas: apiStats.atrasadas || 0,
    criticas: apiStats.criticas || 0,
  }), [total, apiStats]);

  // Apenas os 4 cards mais importantes e acionáveis (seguindo guia 5.6)
  const cards = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileText,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Em Execução',
      value: stats.emExecucao,
      icon: Play,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
    {
      label: 'Atrasadas',
      value: stats.atrasadas,
      icon: Clock,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
    },
    {
      label: 'Críticas',
      value: stats.criticas,
      icon: AlertTriangle,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-500',
    },
  ];

  return (
    <>
      {/* Cards de estatísticas - 4 cards essenciais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${card.bgColor} rounded-full flex-shrink-0`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-foreground truncate">
                    {loading ? '-' : card.value}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alertas - Design minimalista */}
      {!loading && (stats.atrasadas > 0 || stats.criticas > 0) && (
        <div className="space-y-2 sm:space-y-3">
          {stats.atrasadas > 0 && (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {stats.atrasadas} {stats.atrasadas === 1 ? 'ordem em atraso' : 'ordens em atraso'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Verificar ordens que ultrapassaram o prazo programado
                      </p>
                    </div>
                    {onFilterAtrasadas && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onFilterAtrasadas}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Filtrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats.criticas > 0 && (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {stats.criticas} {stats.criticas === 1 ? 'ordem crítica' : 'ordens críticas'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Prioridade alta requer atenção imediata
                      </p>
                    </div>
                    {onFilterCriticas && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onFilterCriticas}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Filtrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
