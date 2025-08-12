// src/features/dashboard/components/overview-cards.tsx
import { Card } from '@/components/ui/card';
import { OverviewData } from '../types';

interface OverviewCardsProps {
  data: OverviewData;
}

interface MetricCardProps {
  title: string;
  value: number;
  className?: string;
}

function MetricCard({ title, value, className = "" }: MetricCardProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl font-bold text-foreground mb-1">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {title}
      </div>
    </div>
  );
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const metrics = [
    { title: "Total de Ativos", value: data.totalAssets },
    { title: "Ativos com Falhas", value: data.assetsFaults },
    { title: "Ativos Parados", value: data.assetsDown },
    { title: "Ordens Abertas", value: data.openWorker },
    { title: "Em Execução", value: data.workInProgress },
    { title: "Concluídas", value: data.completed }
  ];

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground">
        Visão Geral
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard 
            key={index}
            title={metric.title} 
            value={metric.value}
          />
        ))}
      </div>
    </Card>
  );
}