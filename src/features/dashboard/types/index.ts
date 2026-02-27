// src/features/dashboard/types/index.ts

export interface Task {
  id: number;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface OverviewData {
  totalAssets: number;
  assetsFaults: number;
  assetsDown: number;
  openWorker: number;
  workInProgress: number;
  completed: number;
}

export interface ServiceSeverityData {
  baixa: number;
  media: number;
  alta: number;
  critica: number;
}

export interface RiskLevelsData {
  low: number;
  medium: number;
  high: number;
}

export interface SystemStatusData {
  scheduledDowntime: number;
  assetStatus: number;
  assetClass: number;
  unscheduledDowntime: number;
  faultsCausingDamage: number;
  sensorsDamaged: number;
}

export interface WorkOrdersData {
  openWorkOrders: number;
  workGrade: number;
  overdueWorkOrders: number;
  completedWorkOrders: number;
  workloadIndicator: number;
}

export interface ChartData {
  month: string;
  planejadas: number;
  concluidas: number;
}

export interface DashboardData {
  overview: OverviewData;
  taskPriorities: Task[];
  serviceSeverity: ServiceSeverityData;
  riskLevels: RiskLevelsData;
  plannedVsCompleted: ChartData[];
  systemStatus: SystemStatusData;
  workOrders: WorkOrdersData;
}

// Types para componentes internos
export interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

export type StatusVariant = 'default' | 'warning' | 'danger' | 'success';

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    dataKey: string;
    value: number;
  }>;
  label?: string;
}

export interface LegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

// ========================================
// API Response Types
// ========================================

export interface OverviewApiResponse {
  total_equipamentos: number;
  equipamentos_com_falhas: number;
  equipamentos_parados: number;
  os_abertas: number;
  os_em_execucao: number;
  os_finalizadas: number;
}

export interface WorkOrdersApiResponse {
  os_abertas: number;
  nota_qualidade: number;
  os_atrasadas: number;
  os_finalizadas: number;
  indicador_carga_trabalho: number;
}

export interface TaskPriorityApiResponse {
  tarefas: Array<{
    id: number;
    nome: string;
    criticidade: number;
    status: string;
    equipamento_nome: string;
    criado_em: string;
  }>;
  total_tarefas_ativas: number;
  tarefas_criticidade_muito_alta: number;
  tarefas_criticidade_alta: number;
}

export interface SeverityDistributionApiResponse {
  baixa: number;
  media: number;
  alta: number;
  critica: number;
  total_anomalias: number;
}

export interface PlannedVsCompletedApiResponse {
  meses: Array<{
    mes: string;
    mes_numero: number;
    planejadas: number;
    concluidas: number;
    taxa_conclusao: number;
  }>;
  total_planejadas: number;
  total_concluidas: number;
  taxa_conclusao_media: number;
}

export interface SystemStatusApiResponse {
  paradas_programadas: number;
  equipamentos_status_critico: number;
  equipamentos_classe_critica: number;
  paradas_nao_programadas: number;
  falhas_causando_danos: number;
  sensores_danificados: number;
}