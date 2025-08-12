// src/features/dashboard/components/system-status-cards.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Wrench, Zap } from 'lucide-react';
import { SystemStatusData, StatusVariant } from '../types';

interface SystemStatusCardsProps {
  data: SystemStatusData;
}

interface StatusCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: StatusVariant;
}

interface StatusCardConfig {
  key: keyof SystemStatusData;
  title: string;
  icon: React.ReactNode;
  variant: StatusVariant;
}

function StatusCard({ title, value, icon, variant = 'default' }: StatusCardProps) {
  const variantClasses: Record<StatusVariant, string> = {
    default: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    success: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
  };

  return (
    <Card className={`p-4 border ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold">
            {value}
          </p>
        </div>
        <div className="text-2xl opacity-75">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function SystemStatusCards({ data }: SystemStatusCardsProps) {
  const statusCards: StatusCardConfig[] = [
    {
      key: 'scheduledDowntime',
      title: 'Paradas Programadas',
      icon: <Activity />,
      variant: 'default'
    },
    {
      key: 'assetStatus',
      title: 'Status de Ativos',
      icon: <TrendingUp />,
      variant: 'warning'
    },
    {
      key: 'assetClass',
      title: 'Classe de Ativos',
      icon: <Wrench />,
      variant: 'default'
    },
    {
      key: 'unscheduledDowntime',
      title: 'Paradas Não Programadas',
      icon: <TrendingDown />,
      variant: 'danger'
    },
    {
      key: 'faultsCausingDamage',
      title: 'Falhas Causando Danos',
      icon: <AlertTriangle />,
      variant: 'danger'
    },
    {
      key: 'sensorsDamaged',
      title: 'Sensores Danificados',
      icon: <Zap />,
      variant: 'warning'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statusCards.map((card) => (
        <StatusCard
          key={card.key}
          title={card.title}
          value={data[card.key]}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </div>
  );
}