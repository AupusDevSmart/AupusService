/**
 * Dashboard Header - Cabeçalho com ações
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdate?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Cabeçalho do Dashboard
 *
 * - Título e subtítulo
 * - Última atualização
 * - Botão de refresh
 * - Indicador de status
 */
export function DashboardHeader({
  title,
  subtitle,
  lastUpdate,
  onRefresh,
  isRefreshing = false,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {lastUpdate && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Atualizado {formatDistanceToNow(lastUpdate, {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lastUpdate && (
          <Badge variant="outline" className="hidden md:flex">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Em tempo real
          </Badge>
        )}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 mr-2',
                isRefreshing && 'animate-spin'
              )}
            />
            Atualizar
          </Button>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
