/**
 * Metric Card - Card de métrica profissional
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== TIPOS ==========

export type MetricStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendIndicator {
  value: number;
  direction: TrendDirection;
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  status?: MetricStatus;
  trend?: TrendIndicator;
  onClick?: () => void;
  className?: string;
}

// ========== HELPERS ==========

const statusConfig: Record<MetricStatus, { border: string; bg: string }> = {
  normal: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  warning: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
  },
  offline: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-950/20',
  },
};

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  const icons = {
    up: ArrowUp,
    down: ArrowDown,
    stable: Minus,
  };
  const Icon = icons[direction];

  const colorClass = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400',
  }[direction];

  return <Icon className={cn('h-3 w-3', colorClass)} />;
};

// ========== COMPONENTE ==========

/**
 * Card de Métrica Profissional
 *
 * - Suporta status visual (normal, warning, critical, offline)
 * - Indicador de tendência com direção
 * - Ícone customizável com cor
 * - Totalmente tipado
 * - Responsivo e acessível
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Ordens de Serviço"
 *   value={23}
 *   subtitle="5 atrasadas"
 *   icon={Wrench}
 *   iconColor="text-blue-600"
 *   status="warning"
 *   trend={{ value: 2.5, direction: 'up' }}
 *   onClick={() => navigate('/work-orders')}
 * />
 * ```
 */
export const MetricCard = React.memo<MetricCardProps>(({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  status = 'normal',
  trend,
  onClick,
  className,
}) => {
  const { border, bg } = statusConfig[status];

  return (
    <Card
      className={cn(
        'border-l-4 transition-all hover:shadow-md',
        border,
        onClick && 'cursor-pointer hover:bg-accent',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {/* Valor principal */}
          <p className="text-2xl font-bold text-foreground">
            {typeof value === 'number'
              ? value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
              : value}
            {unit && <span className="text-base font-normal ml-1">{unit}</span>}
          </p>

          {/* Subtítulo e Trend */}
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}

            {trend && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 text-xs',
                  trend.direction === 'up' && 'bg-green-50 dark:bg-green-950/20',
                  trend.direction === 'down' && 'bg-red-50 dark:bg-red-950/20',
                  trend.direction === 'stable' && 'bg-gray-50 dark:bg-gray-950/20'
                )}
              >
                <TrendIcon direction={trend.direction} />
                <span>
                  {trend.value > 0 && '+'}
                  {trend.value.toFixed(1)}%
                </span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
