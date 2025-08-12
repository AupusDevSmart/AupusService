// src/features/dashboard/components/work-orders-panel.tsx
import { Card } from '@/components/ui/card';
import { WorkOrdersData } from '../types';

interface WorkOrdersPanelProps {
  data: WorkOrdersData;
}

interface MetricItemProps {
  label: string;
  value: number | string;
  isPercentage?: boolean;
  className?: string;
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  title?: string;
}

function MetricItem({ label, value, isPercentage = false, className = "" }: MetricItemProps) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-border/50 last:border-0 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">
        {value}{isPercentage ? '%' : ''}
      </span>
    </div>
  );
}

function CircularProgress({ percentage, size = 100, title = "Indicador de Carga" }: CircularProgressProps) {
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determinar cor baseada na porcentagem
  const getStrokeColor = (percent: number) => {
    if (percent >= 80) return 'text-red-500';
    if (percent >= 60) return 'text-amber-500';
    return 'text-blue-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-muted"
            opacity="0.2"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`${getStrokeColor(percentage)} transition-all duration-500`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2 text-center">{title}</span>
    </div>
  );
}

export function WorkOrdersPanel({ data }: WorkOrdersPanelProps) {
  const metrics = [
    { label: "Ordens Abertas", value: data.openWorkOrders },
    { label: "Qualidade do Trabalho", value: data.workGrade, isPercentage: true },
    { label: "Ordens Atrasadas", value: data.overdueWorkOrders },
    { label: "Ordens Concluídas", value: data.completedWorkOrders }
  ];

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground">
        Ordens de Trabalho
      </h3>
      
      <div className="space-y-1 mb-6">
        {metrics.map((metric, index) => (
          <MetricItem 
            key={index}
            label={metric.label} 
            value={metric.value}
            isPercentage={metric.isPercentage}
          />
        ))}
      </div>
      
      {/* Indicador Circular de Progresso */}
      <div className="flex justify-center">
        <CircularProgress 
          percentage={data.workloadIndicator}
          title="Indicador de Carga"
        />
      </div>
    </Card>
  );
}