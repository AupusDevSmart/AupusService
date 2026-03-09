// src/pages/dashboard/MinimalistDashboard.tsx
// Dashboard minimalista com design clean e performance otimizada

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Package,
  Users,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import { useAdvancedDashboard } from '@/hooks/useAdvancedDashboard';
import { useUserStore } from '@/store/useUserStore';

// Paleta de cores minimalista (adaptada para suportar dark mode nos gráficos)
const colors = {
  primary: '#1a1a1a',
  secondary: '#666666',
  accent: '#4a5568',
  success: '#48bb78',
  warning: '#ed8936',
  danger: '#f56565',
  muted: '#a0aec0',
  background: '#ffffff',
  surface: '#f7fafc',
  border: '#e2e8f0',
  // Cores para dark mode nos gráficos
  darkBorder: '#374151',
  darkText: '#9ca3af'
};

// Componente de métrica minimalista
const MetricCard = ({
  title,
  value,
  trend,
  subtitle,
  icon: Icon,
  loading = false,
  onClick
}: {
  title: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down' | 'stable' };
  subtitle?: string;
  icon?: React.ElementType;
  loading?: boolean;
  onClick?: () => void;
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={cn(
        "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg dark:hover:shadow-gray-900/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      </div>

      <div className="flex items-end gap-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </h3>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === 'up' && trend.value >= 0 ? "text-green-600" :
            trend.direction === 'down' && trend.value < 0 ? "text-red-600" :
            "text-gray-500"
          )}>
            {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> :
             trend.direction === 'down' ? <TrendingDown className="h-3 w-3" /> :
             <Minus className="h-3 w-3" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
      )}
    </motion.div>
  );
};

// Componente de gráfico minimalista
const ChartCard = ({
  title,
  children,
  loading = false,
  action
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  action?: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Dashboard Minimalista Avançado
 * Design clean, cores sutis, animações suaves
 */
export function MinimalistDashboard() {
  const { user } = useUserStore();
  const [filters, setFilters] = useState({
    periodo: '30dias' as any,
    plantaId: '',
    criticidade: 'todas' as any
  });

  const {
    data,
    isLoading,
    error,
    refetch
  } = useAdvancedDashboard({
    ...filters,
    usuarioId: user?.id,
    proprietarioId: user?.proprietarioId
  });

  // Score visual com gradiente
  const scoreGradient = useMemo(() => {
    if (!data || !data.metrics) return 'from-gray-500 to-gray-600';
    const score = data.metrics.saudeOperacional;
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  }, [data]);

  // Dados para gráficos
  const anomaliasTrendData = useMemo(() => {
    if (!data || !data.anomalias) return [];
    // Usar últimos 7 dias da tendência
    return data.anomalias.tendenciaUltimos30Dias.slice(-7).map((quantidade, i) => ({
      dia: `Dia ${i + 1}`,
      quantidade
    }));
  }, [data]);

  const osEvolutionData = useMemo(() => {
    if (!data || !data.manutencoes) return [];
    return data.manutencoes.porMes.map(d => ({
      mes: d.mes,
      planejadas: d.total,
      executadas: d.preventivas + d.corretivas,
      eficiencia: d.total > 0 ? Math.round(((d.preventivas + d.corretivas) / d.total) * 100) : 0
    }));
  }, [data]);

  const equipamentosRadialData = useMemo(() => {
    if (!data || !data.metrics) return [];
    return [{
      name: 'Disponibilidade',
      value: data.metrics.disponibilidade,
      fill: colors.success
    }];
  }, [data]);

  const distribuicaoCriticidadeData = useMemo(() => {
    if (!data || !data.equipamentosCriticos) return [];
    const criticidadeMap = new Map<string, number>();
    data.equipamentosCriticos.forEach(eq => {
      const count = criticidadeMap.get(eq.criticidade) || 0;
      criticidadeMap.set(eq.criticidade, count + 1);
    });
    return Array.from(criticidadeMap.entries()).map(([nivel, quantidade], i) => ({
      name: nivel,
      value: quantidade,
      fill: [colors.danger, colors.warning, colors.accent, colors.muted][i] || colors.secondary
    }));
  }, [data]);

  // Taxa de Resolução Radial
  const taxaResolucaoRadialData = useMemo(() => {
    if (!data || !data.metrics) return [];
    return [{
      name: 'Taxa Resolução',
      value: data.metrics.taxaResolucao,
      fill: data.metrics.taxaResolucao >= 80 ? colors.success :
            data.metrics.taxaResolucao >= 60 ? colors.warning : colors.danger
    }];
  }, [data]);

  // Eficiência Manutenção Radial
  const eficienciaManutencaoRadialData = useMemo(() => {
    if (!data || !data.metrics) return [];
    return [{
      name: 'Eficiência',
      value: data.metrics.eficienciaManutencao,
      fill: data.metrics.eficienciaManutencao >= 80 ? colors.success :
            data.metrics.eficienciaManutencao >= 60 ? colors.warning : colors.danger
    }];
  }, [data]);

  // Status OS em Donut
  const statusOSDonutData = useMemo(() => {
    if (!data || !data.ordensServico) return [];
    return [
      { name: 'Abertas', value: data.ordensServico.abertas, fill: colors.warning },
      { name: 'Em Execução', value: data.ordensServico.emExecucao, fill: colors.accent },
      { name: 'Concluídas', value: data.ordensServico.concluidas, fill: colors.success }
    ].filter(item => item.value > 0);
  }, [data]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">Erro ao carregar dashboard</p>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Minimalista */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Dashboard Operacional
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Visão consolidada de manutenção e operações
              </p>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3">
              <Select
                value={filters.periodo}
                onValueChange={(v) => setFilters({ ...filters, periodo: v as any })}
              >
                <SelectTrigger className="w-32 h-9 text-xs border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  <Calendar className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7dias">7 dias</SelectItem>
                  <SelectItem value="30dias">30 dias</SelectItem>
                  <SelectItem value="6meses">6 meses</SelectItem>
                  <SelectItem value="ano">1 ano</SelectItem>
                </SelectContent>
              </Select>


              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="h-9"
                disabled={isLoading}
              >
                <RefreshCw className={cn(
                  "h-3 w-3",
                  isLoading && "animate-spin"
                )} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Score Executivo */}
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-6"
          >
            <div className={cn(
              "bg-gradient-to-r p-6 rounded-2xl text-white shadow-lg",
              scoreGradient
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-2">Score Operacional</p>
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-5xl font-bold">{Math.round(data?.metrics?.saudeOperacional || 0)}</h2>
                    <div className="flex items-center gap-2">
                      {(data?.metrics?.saudeOperacional || 0) > 70 ? (
                        <>
                          <TrendingUp className="h-5 w-5" />
                          <span className="text-sm">Melhorando</span>
                        </>
                      ) : (data?.metrics?.saudeOperacional || 0) < 50 ? (
                        <>
                          <TrendingDown className="h-5 w-5" />
                          <span className="text-sm">Atenção</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-5 w-5" />
                          <span className="text-sm">Estável</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-right">
                    <p className="text-white/80 text-xs">Anomalias Abertas</p>
                    <p className="text-2xl font-bold">{data?.anomalias?.abertas || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-xs">OS Pendentes</p>
                    <p className="text-2xl font-bold">{data?.ordensServico?.abertas || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Métricas Principais */}
      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <MetricCard
            title="Anomalias Ativas"
            value={data?.anomalias?.total || 0}
            trend={{
              value: data?.anomalias?.abertas || 0,
              direction: (data?.anomalias?.abertas || 0) > 0 ? 'up' : 'stable'
            }}
            subtitle={`${data?.anomalias?.abertas || 0} abertas`}
            icon={AlertCircle}
            loading={isLoading}
          />

          <MetricCard
            title="OS em Execução"
            value={data?.ordensServico?.emExecucao || 0}
            subtitle={`${data?.ordensServico?.abertas || 0} pendentes`}
            icon={Wrench}
            loading={isLoading}
          />

          <MetricCard
            title="Taxa Resolução"
            value={`${Math.round(data?.metrics?.taxaResolucao || 0)}%`}
            trend={{
              value: 5,
              direction: 'up'
            }}
            icon={CheckCircle}
            loading={isLoading}
          />

          <MetricCard
            title="Disponibilidade"
            value={`${Math.round(data?.metrics?.disponibilidade || 0)}%`}
            subtitle="Equipamentos"
            icon={Activity}
            loading={isLoading}
          />

          <MetricCard
            title="MTBF"
            value={`${Math.round(data?.metrics?.mtbf || 0)}h`}
            subtitle="Entre falhas"
            icon={Clock}
            loading={isLoading}
          />

          <MetricCard
            title="Eficiência"
            value={`${Math.round(data?.metrics?.eficienciaManutencao || 0)}%`}
            subtitle="Manutenção"
            icon={Zap}
            loading={isLoading}
          />
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Taxa de Resolução Radial */}
          <ChartCard title="Taxa de Resolução" loading={isLoading}>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={taxaResolucaoRadialData}
                startAngle={180}
                endAngle={0}
              >
                <PolarGrid stroke={colors.darkBorder} className="dark:opacity-30" />
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-gray-900 dark:fill-gray-100"
                >
                  {Math.round(data?.metrics?.taxaResolucao || 0)}%
                </text>
                <text
                  x="50%"
                  y="50%"
                  dy={20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  Anomalias
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Eficiência de Manutenção Radial */}
          <ChartCard title="Eficiência Manutenção" loading={isLoading}>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={eficienciaManutencaoRadialData}
                startAngle={180}
                endAngle={0}
              >
                <PolarGrid stroke={colors.darkBorder} className="dark:opacity-30" />
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-gray-900 dark:fill-gray-100"
                >
                  {Math.round(data?.metrics?.eficienciaManutencao || 0)}%
                </text>
                <text
                  x="50%"
                  y="50%"
                  dy={20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  Eficiente
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status OS - Donut Chart */}
          <ChartCard title="Status Ordens de Serviço" loading={isLoading}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusOSDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusOSDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {statusOSDonutData.map((item, i) => (
                <div key={i} className="flex flex-col items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mb-1"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Disponibilidade Radial */}
          <ChartCard title="Disponibilidade de Equipamentos" loading={isLoading}>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={equipamentosRadialData}
                startAngle={180}
                endAngle={0}
              >
                <PolarGrid stroke={colors.darkBorder} className="dark:opacity-30" />
                <RadialBar
                  dataKey="value"
                  fill={colors.success}
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-gray-900 dark:fill-gray-100"
                >
                  {Math.round(data?.metrics?.disponibilidade || 0)}%
                </text>
                <text
                  x="50%"
                  y="50%"
                  dy={20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  Disponível
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Seção de Detalhes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Distribuição por Criticidade */}
          <ChartCard title="Equipamentos por Criticidade" loading={isLoading}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={distribuicaoCriticidadeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distribuicaoCriticidadeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {distribuicaoCriticidadeData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Top Equipamentos Problemáticos */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Equipamentos Críticos
            </h3>
            <div className="space-y-3">
              {data?.equipamentosCriticos?.slice(0, 4).map((eq, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate mr-2">
                    {eq.nome}
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {eq.numeroAnomalias} anomalias
                  </span>
                </div>
              )) || (
                <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum equipamento crítico</p>
              )}
            </div>
          </div>

          {/* Próximas Manutenções */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Próximas Manutenções
            </h3>
            <div className="space-y-3">
              {data?.proximasManutencoes?.slice(0, 4).map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {m.equipamento}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.nome}</p>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(m.dataProximaExecucao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
              )) || (
                <p className="text-xs text-gray-500 dark:text-gray-400">Sem manutenções programadas</p>
              )}
            </div>
          </div>

          {/* Top Técnicos */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Status Tarefas
            </h3>
            <div className="space-y-3">
              {(data?.tarefas?.concluidas || 0) > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Concluídas</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {data?.tarefas?.concluidas || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Em Andamento</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {data?.tarefas?.emAndamento || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Pendentes</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {data?.tarefas?.pendentes || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Taxa Conclusão</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {Math.round(data?.tarefas?.taxaConclusao || 0)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Sem dados de tarefas</p>
              )}
            </div>
          </div>
        </div>

        {/* Análise de Tendências */}
        {data?.equipamentosCriticos && data.equipamentosCriticos.length > 0 && data.equipamentosCriticos.filter(eq => eq.criticidade === 'CRITICA').length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 p-6 rounded-xl border border-orange-100 dark:border-orange-900/50 mb-6">
            <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-4">
              ⚠️ Equipamentos com Criticidade Alta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.equipamentosCriticos
                .filter(eq => eq.criticidade === 'CRITICA' || eq.criticidade === 'ALTA')
                .slice(0, 6)
                .map((eq, i) => (
                  <div key={i} className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {eq.nome}
                      </p>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        eq.criticidade === 'CRITICA' ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                        eq.criticidade === 'ALTA' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                      )}>
                        {eq.criticidade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {eq.numeroAnomalias} anomalias • {eq.numeroManutencoes} manutenções
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-orange-100 dark:border-orange-900/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700 dark:text-orange-300">
                  Total de equipamentos críticos: <strong>{data.equipamentosCriticos.filter(eq => eq.criticidade === 'CRITICA' || eq.criticidade === 'ALTA').length}</strong>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Próximas manutenções: <strong>{data.proximasManutencoes.length}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}