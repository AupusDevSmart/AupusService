/**
 * Tipos do Dashboard de Manutenção
 *
 * Tipagens completas e profissionais para o dashboard de manutenção industrial
 */

// ============= ENUMS =============

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum WorkOrderType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
  EMERGENCY = 'EMERGENCY',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AnomalyPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AnomalyStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  ARCHIVED = 'ARCHIVED',
}

export enum AssetStatus {
  OPERATIONAL = 'OPERATIONAL',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
}

export enum AssetClass {
  CRITICAL = 'CRITICAL',
  ESSENTIAL = 'ESSENTIAL',
  SUPPORT = 'SUPPORT',
  NON_CRITICAL = 'NON_CRITICAL',
}

export enum TaskPriority {
  ROUTINE = 'ROUTINE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ============= OVERVIEW =============

export interface DashboardOverview {
  timestamp: Date;
  // Status de Ativos
  operationalAssets: number;
  maintenanceAssets: number;
  stoppedAssets: number;
  failedAssets: number;
  // Performance
  systemUptime: number; // Percentual
  plannedDowntime: number; // Horas
  unplannedDowntime: number; // Horas
  // Tendências
  workOrdersTrend?: number; // Percentual de mudança
  anomaliesTrend?: number; // Percentual de mudança
  uptimeTrend?: number; // Percentual de mudança
}

// ============= WORK ORDERS =============

export interface WorkOrder {
  id: string;
  number: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description: string;
  equipmentId?: string;
  equipmentName?: string;
  assignedTo?: string;
  assignedToName?: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // Minutos
  actualDuration?: number; // Minutos
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrdersMetrics {
  totalOpen: number;
  totalPlanned: number;
  completed: number;
  inProgress: number;
  overdueCount: number;
  qualityScore: number; // 0-100
  avgCompletionTime: number; // Horas
  completionRate: number; // Percentual
  historical: HistoricalWorkOrder[];
  recent: WorkOrder[];
}

export interface HistoricalWorkOrder {
  month: string; // "2025-01"
  planned: number;
  completed: number;
  overdueCount: number;
}

// ============= ANOMALIES =============

export interface Anomaly {
  id: string;
  title: string;
  description: string;
  priority: AnomalyPriority;
  status: AnomalyStatus;
  equipmentId?: string;
  equipmentName?: string;
  unitId?: string;
  unitName?: string;
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  hasWorkOrder: boolean;
  workOrderId?: string;
}

export interface AnomalyStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  resolutionRate: number; // Percentual
  avgResolutionTimeHours: number;
  recentAnomalies: Anomaly[];
}

// ============= MAINTENANCE PLANS =============

export interface MaintenancePlan {
  id: string;
  name: string;
  description: string;
  status: MaintenancePlanStatus;
  equipmentId: string;
  equipmentName: string;
  frequency: number; // Dias
  nextMaintenanceDate: Date;
  lastMaintenanceDate?: Date;
  tasksCount: number;
  completedTasksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenancePlansStats {
  totalActive: number;
  totalInactive: number;
  upcomingCount: number; // Próximos 7 dias
  overdueCount: number;
  complianceRate: number; // Percentual
  equipmentsWithoutPlan: number;
  recentPlans: MaintenancePlan[];
}

// ============= SYSTEM STATUS =============

export interface SystemStatus {
  plannedDowntimeCount: number;
  unplannedDowntimeCount: number;
  assetsByStatus: {
    operational: number;
    underMaintenance: number;
    stopped: number;
    failed: number;
  };
  assetsByClass: {
    critical: number;
    essential: number;
    support: number;
    nonCritical: number;
  };
  failuresCausingDamage: number;
  damagedSensors: number;
}

// ============= TASK PRIORITIES =============

export interface TaskPrioritiesDistribution {
  routine: number;
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

// ============= AGGREGATED METRICS =============

export interface AggregatedMetrics {
  // Ordens de Serviço
  totalWorkOrders: number;
  overdueWorkOrders: number;
  completionRate: number;
  workQuality: number;

  // Anomalias
  totalAnomalies: number;
  criticalAnomalies: number;
  resolutionRate: number;
  avgResolutionTime: number;

  // Performance
  systemUptime: number;
  plannedDowntime: number;
  unplannedDowntime: number;

  // Tendências
  trend: {
    workOrders: number;
    anomalies: number;
    uptime: number;
  };
}

// ============= FILTERS =============

export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  plantId?: string;
  unitId?: string;
  equipmentId?: string;
  workOrderStatus?: WorkOrderStatus[];
  anomalyPriority?: AnomalyPriority[];
  maintenancePlanStatus?: MaintenancePlanStatus[];
}

// ============= CHART DATA =============

export interface PlannedVsCompletedChartData {
  month: string;
  planned: number;
  completed: number;
}

export interface SeverityDistributionData {
  name: string;
  value: number;
  color: string;
}
