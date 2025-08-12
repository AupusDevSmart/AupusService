// src/features/dashboard/index.ts

// Componentes
export { OverviewCards } from './components/overview-cards';
export { TaskPriorities } from './components/task-priorities';
export { ServiceSeverityCharts } from './components/service-severity-charts';
export { PlannedVsCompletedChart } from './components/planned-vs-completed-chart';
export { SystemStatusCards } from './components/system-status-cards';
export { WorkOrdersPanel } from './components/work-orders-panel';

// Tipos
export type {
  Task,
  OverviewData,
  ServiceSeverityData,
  RiskLevelsData,
  SystemStatusData,
  WorkOrdersData,
  ChartData,
  DashboardData,
  ChartEntry,
  StatusVariant,
  TooltipProps,
  LegendProps
} from './types';