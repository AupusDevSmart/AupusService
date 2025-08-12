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
  minor: number;
  major: number;
  critical: number;
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