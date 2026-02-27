/**
 * Anomalies Card - Card de Anomalias
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { TrendIndicator } from './MetricCard';

export interface AnomaliesCardProps {
  total?: number;
  criticalCount?: number;
  resolutionRate?: number;
  trend?: number;
  onClick?: () => void;
}

/**
 * Card de Anomalias
 *
 * Exibe:
 * - Total de anomalias abertas
 * - Anomalias críticas (em subtitle)
 * - Taxa de resolução
 * - Tendência de mudança
 *
 * Status é determinado automaticamente baseado em anomalias críticas
 */
export function AnomaliesCard({
  total = 0,
  criticalCount = 0,
  resolutionRate,
  trend,
  onClick,
}: AnomaliesCardProps) {
  // Determinar status baseado em anomalias críticas
  const status = criticalCount > 3 ? 'critical' : criticalCount > 0 ? 'warning' : 'normal';

  // Construir subtitle
  const subtitleParts: string[] = [];
  if (criticalCount > 0) {
    subtitleParts.push(`${criticalCount} crítica${criticalCount > 1 ? 's' : ''}`);
  }
  if (resolutionRate !== undefined) {
    subtitleParts.push(`${resolutionRate.toFixed(0)}% resolvidas`);
  }
  const subtitle = subtitleParts.length > 0
    ? subtitleParts.join(' • ')
    : 'Nenhuma anomalia crítica';

  // Construir trend (invertido: menos anomalias é melhor, então down é bom)
  const trendIndicator: TrendIndicator | undefined = trend !== undefined
    ? {
        value: Math.abs(trend),
        direction: trend < 0 ? 'down' : trend > 0 ? 'up' : 'stable',
      }
    : undefined;

  return (
    <MetricCard
      title="Anomalias"
      value={total}
      subtitle={subtitle}
      icon={AlertTriangle}
      iconColor="text-yellow-600 dark:text-yellow-400"
      status={status}
      trend={trendIndicator}
      onClick={onClick}
    />
  );
}
