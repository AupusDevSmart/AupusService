/**
 * Maintenance Plans Card - Card de Planos de Manutenção
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { TrendIndicator } from './MetricCard';

export interface MaintenancePlansCardProps {
  totalActive?: number;
  upcomingCount?: number;
  complianceRate?: number;
  trend?: number;
  onClick?: () => void;
}

/**
 * Card de Planos de Manutenção
 *
 * Exibe:
 * - Total de planos ativos
 * - Manutenções próximas (em subtitle)
 * - Taxa de cumprimento
 * - Tendência de mudança
 */
export function MaintenancePlansCard({
  totalActive = 0,
  upcomingCount = 0,
  complianceRate,
  trend,
  onClick,
}: MaintenancePlansCardProps) {
  // Determinar status baseado na taxa de cumprimento
  const status = complianceRate !== undefined
    ? complianceRate < 70 ? 'critical' : complianceRate < 85 ? 'warning' : 'normal'
    : 'normal';

  // Construir subtitle
  const subtitleParts: string[] = [];
  if (upcomingCount > 0) {
    subtitleParts.push(`${upcomingCount} próxima${upcomingCount > 1 ? 's' : ''}`);
  }
  if (complianceRate !== undefined) {
    subtitleParts.push(`${complianceRate.toFixed(0)}% cumprimento`);
  }
  const subtitle = subtitleParts.length > 0
    ? subtitleParts.join(' • ')
    : 'Sem manutenções pendentes';

  // Construir trend
  const trendIndicator: TrendIndicator | undefined = trend !== undefined
    ? {
        value: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      }
    : undefined;

  return (
    <MetricCard
      title="Planos de Manutenção"
      value={totalActive}
      subtitle={subtitle}
      icon={Calendar}
      iconColor="text-purple-600 dark:text-purple-400"
      status={status}
      trend={trendIndicator}
      onClick={onClick}
    />
  );
}
