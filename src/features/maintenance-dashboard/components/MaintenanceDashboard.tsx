/**
 * Maintenance Dashboard - Dashboard Principal de Manutenção
 *
 * Dashboard responsivo que cabe em 100vh em telas médias/grandes
 * Com scroll apenas em mobile
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardGrid } from './layout/DashboardGrid';
import { DashboardHeader } from './layout/DashboardHeader';
import { DashboardSection } from './layout/DashboardSection';
import { DashboardSkeleton } from './layout/DashboardSkeleton';
import { DashboardError } from './layout/DashboardError';
import { WorkOrdersCard } from './metrics/WorkOrdersCard';
import { AnomaliesCard } from './metrics/AnomaliesCard';
import { MaintenancePlansCard } from './metrics/MaintenancePlansCard';
import { SystemUptimeCard } from './metrics/SystemUptimeCard';
import { useMaintenanceDashboard } from '../hooks/useMaintenanceDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MaintenanceDashboardProps {
  refreshInterval?: number;
}

/**
 * Dashboard Principal de Manutenção
 *
 * Features:
 * - KPIs principais em cards
 * - Gráficos de análise (planejado vs executado, severidade)
 * - Painéis detalhados (OS recentes, status do sistema)
 * - Layout 100vh em desktop/tablet
 * - Totalmente responsivo
 */
export function MaintenanceDashboard({
  refreshInterval = 30,
}: MaintenanceDashboardProps) {
  const navigate = useNavigate();
  const {
    metrics,
    overview,
    workOrders,
    anomalies,
    maintenancePlans,
    systemStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useMaintenanceDashboard({ refreshInterval });

  // Loading state
  if (isLoading && !metrics) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (isError && !metrics) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  // Dados do gráfico planejado vs executado
  const plannedVsCompletedData = workOrders?.historical?.length > 0
    ? workOrders.historical
    : [];

  // Dados de severidade de anomalias
  const severityData = anomalies?.byPriority
    ? [
        { name: 'Crítica', value: anomalies.byPriority.critical, color: '#ef4444' },
        { name: 'Alta', value: anomalies.byPriority.high, color: '#f97316' },
        { name: 'Média', value: anomalies.byPriority.medium, color: '#eab308' },
        { name: 'Baixa', value: anomalies.byPriority.low, color: '#84cc16' },
      ]
    : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 pb-2 lg:pb-3">
        <DashboardHeader
          title="Dashboard de Manutenção"
          subtitle="Visão geral de ordens de serviço e manutenção"
          lastUpdate={new Date()}
          onRefresh={refetch}
          isRefreshing={isLoading}
        />
      </div>

      {/* Main Content - Scrollable apenas em mobile */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden px-4 lg:px-6 pb-4 lg:pb-6">
        <div className="h-full md:overflow-y-auto">
          <DashboardGrid>
            {/* === SEÇÃO 1: KPIs PRINCIPAIS === */}
            <DashboardSection gridCols={4} className="mb-3 lg:mb-4">
            <WorkOrdersCard
              totalOpen={workOrders?.totalOpen}
              overdueCount={workOrders?.overdueCount}
              completionRate={metrics?.completionRate}
              trend={metrics?.trend.workOrders}
              onClick={() => navigate('/execucao-os')}
            />

            <AnomaliesCard
              total={anomalies?.total}
              criticalCount={anomalies?.byPriority.critical}
              resolutionRate={metrics?.resolutionRate}
              trend={metrics?.trend.anomalies}
              onClick={() => navigate('/anomalias')}
            />

            <MaintenancePlansCard
              totalActive={maintenancePlans?.totalActive}
              upcomingCount={maintenancePlans?.upcomingCount}
              complianceRate={maintenancePlans?.complianceRate}
              onClick={() => navigate('/planos-manutencao')}
            />

            <SystemUptimeCard
              uptime={overview?.systemUptime}
              plannedDowntime={overview?.plannedDowntime}
              unplannedDowntime={overview?.unplannedDowntime}
              trend={metrics?.trend.uptime}
            />
          </DashboardSection>

          {/* === SEÇÃO 2: GRÁFICOS === */}
          <DashboardSection gridCols={4} className="mb-3 lg:mb-4">
            {/* Gráfico: Planejado vs Executado */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm lg:text-base">
                  Planejado vs Executado (Últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plannedVsCompletedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={plannedVsCompletedData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="month"
                        fontSize={11}
                        className="fill-muted-foreground"
                      />
                      <YAxis fontSize={11} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        dataKey="planned"
                        fill="#3b82f6"
                        name="Planejado"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="completed"
                        fill="#10b981"
                        name="Executado"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico: Severidade de Anomalias */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm lg:text-base">
                  Distribuição por Severidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {severityData.filter(d => d.value > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={severityData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {severityData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    Sem anomalias ativas
                  </div>
                )}
              </CardContent>
            </Card>
          </DashboardSection>

          {/* === SEÇÃO 3: PAINÉIS DETALHADOS === */}
          <DashboardSection gridCols={4}>
            {/* Painel: Ordens de Serviço Recentes */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm lg:text-base flex items-center justify-between">
                  <span>Ordens de Serviço Recentes</span>
                  <Badge variant="outline">
                    {workOrders?.recent?.length || 0} abertas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workOrders?.recent?.slice(0, 3).map((wo: any) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/execucao-os/${wo.id}`)}
                    >
                      <div>
                        <p className="text-xs font-medium">{wo.number}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {wo.title || wo.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          wo.status === 'OVERDUE'
                            ? 'destructive'
                            : wo.status === 'IN_PROGRESS'
                            ? 'default'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {wo.status}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhuma OS recente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Painel: Status do Sistema */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm lg:text-base">Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xl font-bold text-green-600">
                      {systemStatus?.assetsByStatus.operational || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Operacionais
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xl font-bold text-yellow-600">
                      {systemStatus?.assetsByStatus.underMaintenance || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Em Manutenção
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-600">
                      {systemStatus?.assetsByStatus.stopped || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Parados
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xl font-bold text-red-600">
                      {systemStatus?.assetsByStatus.failed || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Com Falha
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Paradas Programadas
                    </span>
                    <span className="font-medium">
                      {systemStatus?.plannedDowntimeCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Paradas Não Programadas
                    </span>
                    <span className="font-medium text-red-600">
                      {systemStatus?.unplannedDowntimeCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Sensores Danificados
                    </span>
                    <span className="font-medium">
                      {systemStatus?.damagedSensors || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
          </DashboardGrid>
        </div>
      </div>
    </div>
  );
}
