/**
 * Energy Consumption Card - Card de Consumo de Energia
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { TrendIndicator } from './MetricCard';

export interface EnergyConsumptionCardProps {
  totalConsumed?: number;
  unit?: 'kWh' | 'MWh';
  comparedToPrevious?: number;
  trend?: number;
  onClick?: () => void;
}

/**
 * Card de Consumo de Energia
 *
 * Exibe:
 * - Total de energia consumida
 * - Comparação com período anterior
 * - Tendência de mudança
 */
export function EnergyConsumptionCard({
  totalConsumed = 0,
  unit = 'kWh',
  comparedToPrevious,
  trend,
  onClick,
}: EnergyConsumptionCardProps) {
  // Construir subtitle
  const subtitle = comparedToPrevious !== undefined
    ? `${comparedToPrevious > 0 ? '+' : ''}${comparedToPrevious.toFixed(1)}% vs anterior`
    : 'Total acumulado';

  // Construir trend
  const trendIndicator: TrendIndicator | undefined = trend !== undefined
    ? {
        value: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      }
    : undefined;

  return (
    <MetricCard
      title="Consumo de Energia"
      value={totalConsumed}
      unit={unit}
      subtitle={subtitle}
      icon={Zap}
      iconColor="text-orange-600 dark:text-orange-400"
      status="normal"
      trend={trendIndicator}
      onClick={onClick}
    />
  );
}
