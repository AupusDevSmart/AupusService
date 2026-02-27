/**
 * SystemUptimeCard - Card de Disponibilidade do Sistema
 *
 * Exibe:
 * - Uptime do sistema (%)
 * - Tempo de parada programada/não programada
 * - Trend
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { MetricStatus, TrendData } from '../../types';

export interface SystemUptimeCardProps {
  uptime?: number; // Percentual
  plannedDowntime?: number; // Horas
  unplannedDowntime?: number; // Horas
  trend?: number;
  onClick?: () => void;
}

export function SystemUptimeCard({
  uptime = 0,
  plannedDowntime = 0,
  unplannedDowntime = 0,
  trend,
  onClick,
}: SystemUptimeCardProps) {
  // Determinar status baseado no uptime
  const status: MetricStatus =
    uptime >= 98 ? 'normal' : uptime >= 95 ? 'warning' : 'critical';

  // Calcular subtitle dinâmico
  const subtitle = unplannedDowntime > 0
    ? `${unplannedDowntime.toFixed(1)}h parada não programada`
    : plannedDowntime > 0
    ? `${plannedDowntime.toFixed(1)}h parada programada`
    : 'Sistema totalmente operacional';

  // Trend data
  const trendData: TrendData | undefined = trend
    ? {
        value: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
        label: `${Math.abs(trend).toFixed(1)}% vs mês anterior`,
      }
    : undefined;

  return (
    <MetricCard
      title="Disponibilidade do Sistema"
      value={uptime.toFixed(1)}
      unit="%"
      subtitle={subtitle}
      icon={Activity}
      iconColor={
        status === 'normal'
          ? 'text-green-600'
          : status === 'warning'
          ? 'text-yellow-600'
          : 'text-red-600'
      }
      status={status}
      trend={trendData}
      onClick={onClick}
    />
  );
}
