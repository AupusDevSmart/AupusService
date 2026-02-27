// src/pages/dashboard/index.tsx
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { OverviewCards } from '@/features/dashboard/components/overview-cards';
import { TaskPriorities } from '@/features/dashboard/components/task-priorities';
import { ServiceSeverityCharts } from '@/features/dashboard/components/service-severity-charts';
import { PlannedVsCompletedChart } from '@/features/dashboard/components/planned-vs-completed-chart';
import { SystemStatusCards } from '@/features/dashboard/components/system-status-cards';
import { WorkOrdersPanel } from '@/features/dashboard/components/work-orders-panel';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const { data: dashboardData, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <Layout className='w-full'>
        <Layout.Main className='w-full'>
          <TitleCard
            title="Dashboard"
            description="Visão geral completa do sistema e operações"
          />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </div>
        </Layout.Main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout className='w-full'>
        <Layout.Main className='w-full'>
          <TitleCard
            title="Dashboard"
            description="Visão geral completa do sistema e operações"
          />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive font-medium">Erro ao carregar dashboard</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar os dados. Tente novamente.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </Layout.Main>
      </Layout>
    );
  }

  if (!dashboardData) {
    return null;
  }
  return (
    <Layout className='w-full'>
      <Layout.Main className='w-full'>
        <TitleCard
          title="Dashboard"
          description="Visão geral completa do sistema e operações"
        />
        
        <div className="space-y-6 w-full">
          {/* Cards de Status do Sistema - Primeira seção */}
          <section aria-labelledby="system-status-title">
            <SystemStatusCards data={dashboardData.systemStatus} />
          </section>
          
          {/* Seção principal com métricas e gráficos */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-labelledby="main-metrics-title">
            {/* Visão Geral */}
            <div className="lg:col-span-4">
              <OverviewCards data={dashboardData.overview} />
            </div>
            
            {/* Severidade dos Serviços */}
            <div className="lg:col-span-4">
              <ServiceSeverityCharts 
                serviceSeverity={dashboardData.serviceSeverity}
                riskLevels={dashboardData.riskLevels}
              />
            </div>
            
            {/* Ordens de Trabalho */}
            <div className="lg:col-span-4">
              <WorkOrdersPanel data={dashboardData.workOrders} />
            </div>
          </section>

          {/* Seção de análise temporal */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-labelledby="temporal-analysis-title">
            {/* Prioridades de Tarefas */}
            <div className="lg:col-span-4">
              <TaskPriorities tasks={dashboardData.taskPriorities} />
            </div>
            
            {/* Gráfico Planejadas vs Concluídas */}
            <div className="lg:col-span-8">
              <PlannedVsCompletedChart data={dashboardData.plannedVsCompleted} />
            </div>
          </section>
        </div>
      </Layout.Main>
    </Layout>
  );
}