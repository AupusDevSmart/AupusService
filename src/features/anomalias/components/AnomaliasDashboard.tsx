// src/features/anomalias/components/AnomaliasDashboard.tsx
import {
  BarChart3,
  ClipboardList,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { AnomaliasStats } from '@/services/anomalias.service';

interface AnomaliasDashboardProps {
  data: AnomaliasStats;
}

export function AnomaliasDashboard({ data }: AnomaliasDashboardProps) {
  const stats = [
    {
      icon: BarChart3,
      value: data.total,
      label: 'Total',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: ClipboardList,
      value: data.registradas,
      label: 'Registradas',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
    },
    {
      icon: Calendar,
      value: data.programadas,
      label: 'Programadas',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
    {
      icon: CheckCircle2,
      value: data.finalizadas,
      label: 'Finalizadas',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${stat.bgColor} rounded-full flex-shrink-0`}
              >
                <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-foreground truncate">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
