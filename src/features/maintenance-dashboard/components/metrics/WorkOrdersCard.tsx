/**
 * Work Orders Card - Card de Ordens de Serviço
 */

import React from 'react';
import { Wrench } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { TrendIndicator } from './MetricCard';

export interface WorkOrdersCardProps {
  totalOpen?: number;
  overdueCount?: number;
  completionRate?: number;
  trend?: number;
  onClick?: () => void;
}

/**
 * Card de Ordens de Serviço
 *
 * Exibe:
 * - Total de OS abertas
 * - OS atrasadas (em subtitle)
 * - Taxa de conclusão (em subtitle secundário)
 * - Tendência de mudança
 *
 * Status é determinado automaticamente baseado em OS atrasadas
 */
export function WorkOrdersCard({
  totalOpen = 0,
  overdueCount = 0,
  completionRate,
  trend,
  onClick,
}: WorkOrdersCardProps) {
  // Determinar status baseado em OS atrasadas
  const status = overdueCount > 5 ? 'critical' : overdueCount > 0 ? 'warning' : 'normal';

  // Construir subtitle
  const subtitleParts: string[] = [];
  if (overdueCount > 0) {
    subtitleParts.push(`${overdueCount} atrasada${overdueCount > 1 ? 's' : ''}`);
  }
  if (completionRate !== undefined) {
    subtitleParts.push(`${completionRate.toFixed(0)}% concluídas`);
  }
  const subtitle = subtitleParts.length > 0
    ? subtitleParts.join(' • ')
    : 'Nenhuma OS atrasada';

  // Construir trend
  const trendIndicator: TrendIndicator | undefined = trend !== undefined
    ? {
        value: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      }
    : undefined;

  return (
    <MetricCard
      title="Ordens de Serviço"
      value={totalOpen}
      subtitle={subtitle}
      icon={Wrench}
      iconColor="text-blue-600 dark:text-blue-400"
      status={status}
      trend={trendIndicator}
      onClick={onClick}
    />
  );
}
