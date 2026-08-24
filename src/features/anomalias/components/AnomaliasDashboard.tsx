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
      iconColor: 'text-primary',
    },
    {
      icon: ClipboardList,
      value: data.registradas,
      label: 'Registradas',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
    },
    {
      icon: Calendar,
      value: data.programadas,
      label: 'Programadas',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
    {
      icon: CheckCircle2,
      value: data.finalizadas,
      label: 'Finalizadas',
      iconColor: 'text-green-600 dark:text-green-500',
    },
  ];

  return (
    /* Uma faixa, e nao quatro caixas.
     *
     * Os cards gastavam quase um terco da altura util para mostrar quatro
     * numeros — e o numero e a unica coisa que se le ali. Sem moldura, sem
     * sombra e sem circulo atras do icone, a mesma informacao cabe numa linha.
     */
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 mb-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-2 min-w-0">
            <Icon className={`h-4 w-4 shrink-0 ${stat.iconColor}`} />
            <span className="text-lg font-semibold tabular-nums">{stat.value}</span>
            <span className="truncate text-xs text-muted-foreground">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
