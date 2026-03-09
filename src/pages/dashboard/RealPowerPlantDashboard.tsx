// src/pages/dashboard/RealPowerPlantDashboard.tsx
// Dashboard REAL baseado nas tabelas e APIs existentes do sistema

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Package,
  ListChecks
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useRealDashboardData } from './hooks/useRealDashboardData';
import { cn } from '@/lib/utils';

/**
 * Dashboard Operacional REAL para Usinas Elétricas
 * Usando dados existentes do banco PostgreSQL
 */
export function RealPowerPlantDashboard() {
  const {
    overview,
    workOrders,
    taskPriorities,
    severityDistribution,
    plannedVsCompleted,
    systemStatus,
    isLoading,
    error,
    refetch
  } = useRealDashboardData();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dashboard.
            <Button variant="link" onClick={refetch} className="p-0 h-auto ml-2">
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calcular métricas derivadas
  const taxaFalha = overview && overview.total_equipamentos > 0
    ? ((overview.equipamentos_com_falhas / overview.total_equipamentos) * 100).toFixed(1)
    : '0';

  const eficienciaOS = workOrders && workOrders.os_finalizadas > 0
    ? workOrders.nota_qualidade
    : 0;

  // Cores para severidade
  const severityColors = {
    critica: '#ef4444',
    alta: '#f97316',
    media: '#eab308',
    baixa: '#84cc16'
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* HEADER - 5vh */}
      <header className="h-[5vh] min-h-[40px] border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Dashboard Operacional - Gestão de Manutenção</h1>
          <Badge variant="outline" className="text-xs">
            Tempo Real
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={refetch}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {/* KPIs PRINCIPAIS - 20vh */}
      <section className="h-[20vh] min-h-[160px] border-b px-6 py-4">
        <div className="grid grid-cols-6 gap-4 h-full">
          {/* Total Equipamentos */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-blue-500" />
                <Badge variant="outline">Total</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {overview?.total_equipamentos || 0}
                </p>
                <p className="text-xs text-muted-foreground">Equipamentos</p>
              </div>
            </CardContent>
          </Card>

          {/* Equipamentos com Falha */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">{taxaFalha}%</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {overview?.equipamentos_com_falhas || 0}
                </p>
                <p className="text-xs text-muted-foreground">Com Anomalias</p>
              </div>
            </CardContent>
          </Card>

          {/* OS Abertas */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Wrench className="h-5 w-5 text-orange-500" />
                <Badge variant="outline">Abertas</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {overview?.os_abertas || 0}
                </p>
                <p className="text-xs text-muted-foreground">OS Abertas</p>
              </div>
              <div className="text-xs text-yellow-600">
                {workOrders?.os_atrasadas || 0} atrasadas
              </div>
            </CardContent>
          </Card>

          {/* OS em Execução */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-blue-500" />
                <Badge className="bg-blue-500">Ativo</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {overview?.os_em_execucao || 0}
                </p>
                <p className="text-xs text-muted-foreground">Em Execução</p>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Conclusão */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge className="bg-green-500">{eficienciaOS}%</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {overview?.os_finalizadas || 0}
                </p>
                <p className="text-xs text-muted-foreground">Finalizadas</p>
              </div>
            </CardContent>
          </Card>

          {/* Carga de Trabalho */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <ListChecks className="h-5 w-5 text-purple-500" />
                <Badge variant="outline">
                  {workOrders?.indicador_carga_trabalho || 0}%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Carga de Trabalho</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      workOrders?.indicador_carga_trabalho > 80 ? "bg-red-500" :
                      workOrders?.indicador_carga_trabalho > 60 ? "bg-yellow-500" :
                      "bg-green-500"
                    )}
                    style={{ width: `${workOrders?.indicador_carga_trabalho || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* VISUALIZAÇÃO PRINCIPAL - 45vh */}
      <section className="h-[45vh] min-h-[360px] border-b px-6 py-4">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Distribuição de Anomalias */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Anomalias por Severidade
                <Badge variant="outline" className="text-xs">
                  {severityDistribution?.total_anomalias || 0} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Crítica', value: severityDistribution?.critica || 0, color: severityColors.critica },
                      { name: 'Alta', value: severityDistribution?.alta || 0, color: severityColors.alta },
                      { name: 'Média', value: severityDistribution?.media || 0, color: severityColors.media },
                      { name: 'Baixa', value: severityDistribution?.baixa || 0, color: severityColors.baixa }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      severityColors.critica,
                      severityColors.alta,
                      severityColors.media,
                      severityColors.baixa
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.critica }} />
                  <span>Crítica: {severityDistribution?.critica || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.alta }} />
                  <span>Alta: {severityDistribution?.alta || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.media }} />
                  <span>Média: {severityDistribution?.media || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.baixa }} />
                  <span>Baixa: {severityDistribution?.baixa || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OS Planejadas vs Concluídas */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                OS Planejadas vs Concluídas (6 meses)
                <Badge className="bg-green-500 text-xs">
                  {plannedVsCompleted?.taxa_conclusao_media || 0}% taxa
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={plannedVsCompleted?.meses || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="planejadas" fill="#3b82f6" name="Planejadas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="concluidas" fill="#10b981" name="Concluídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tarefas Prioritárias */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Tarefas Críticas
                <Badge variant="destructive" className="text-xs">
                  {taskPriorities?.tarefas_criticidade_muito_alta || 0} urgentes
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 overflow-y-auto">
              <div className="space-y-2">
                {taskPriorities?.tarefas?.slice(0, 5).map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg border text-xs",
                      tarefa.criticidade === 5 && "border-red-500 bg-red-50 dark:bg-red-950",
                      tarefa.criticidade === 4 && "border-orange-500 bg-orange-50 dark:bg-orange-950",
                      tarefa.criticidade === 3 && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
                      tarefa.criticidade <= 2 && "border-green-500 bg-green-50 dark:bg-green-950"
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{tarefa.nome}</p>
                      <p className="text-muted-foreground">{tarefa.equipamento_nome}</p>
                    </div>
                    <Badge
                      variant={tarefa.criticidade >= 4 ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      Crit. {tarefa.criticidade}
                    </Badge>
                  </div>
                ))}
              </div>
              {taskPriorities?.total_tarefas_ativas > 5 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  +{taskPriorities.total_tarefas_ativas - 5} tarefas ativas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* INDICADORES SECUNDÁRIOS - 25vh */}
      <section className="h-[25vh] min-h-[200px] px-6 py-4">
        <div className="grid grid-cols-4 gap-4 h-full">
          {/* Status do Sistema */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Equipamentos Parados</span>
                  <Badge variant="destructive">{overview?.equipamentos_parados || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status Crítico</span>
                  <Badge variant="destructive">{systemStatus?.equipamentos_status_critico || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Classe Crítica</span>
                  <Badge variant="outline">{systemStatus?.equipamentos_classe_critica || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Falhas com Danos</span>
                  <Badge variant="warning">{systemStatus?.falhas_causando_danos || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de OS */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Performance de OS</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Qualidade</span>
                    <span>{workOrders?.nota_qualidade || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${workOrders?.nota_qualidade || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Carga de Trabalho</span>
                    <span>{workOrders?.indicador_carga_trabalho || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        workOrders?.indicador_carga_trabalho > 80 ? "bg-red-500" :
                        workOrders?.indicador_carga_trabalho > 60 ? "bg-yellow-500" :
                        "bg-green-500"
                      )}
                      style={{ width: `${workOrders?.indicador_carga_trabalho || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Tarefas */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tarefas Ativas</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Ativas</span>
                  <Badge variant="outline">{taskPriorities?.total_tarefas_ativas || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Criticidade Muito Alta</span>
                  <Badge variant="destructive">{taskPriorities?.tarefas_criticidade_muito_alta || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Criticidade Alta</span>
                  <Badge variant="warning">{taskPriorities?.tarefas_criticidade_alta || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Conclusão Mensal */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Eficiência Operacional</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-3xl font-bold text-green-600">
                  {plannedVsCompleted?.taxa_conclusao_media || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Taxa de Conclusão (6 meses)</p>
                <div className="mt-2 text-xs text-center">
                  <span className="text-muted-foreground">
                    {plannedVsCompleted?.total_concluidas || 0} de {plannedVsCompleted?.total_planejadas || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RODAPÉ - 5vh */}
      <footer className="h-[5vh] min-h-[40px] border-t flex items-center justify-between px-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Sistema Online</span>
          </div>
          <span>|</span>
          <span>Dashboard Operacional v2.0</span>
        </div>
        <div>
          Baseado em dados reais do PostgreSQL
        </div>
      </footer>
    </div>
  );
}