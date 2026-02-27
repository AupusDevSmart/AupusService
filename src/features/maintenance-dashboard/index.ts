/**
 * Maintenance Dashboard - Public API
 *
 * Exporta componentes e hooks públicos do feature
 */

// Componente Principal
export { MaintenanceDashboard } from './components/MaintenanceDashboard';

// Hooks
export { useMaintenanceDashboard } from './hooks/useMaintenanceDashboard';

// Componentes Reutilizáveis
export { MetricCard } from './components/metrics/MetricCard';
export { WorkOrdersCard } from './components/metrics/WorkOrdersCard';
export { AnomaliesCard } from './components/metrics/AnomaliesCard';
export { MaintenancePlansCard } from './components/metrics/MaintenancePlansCard';
export { EnergyConsumptionCard } from './components/metrics/EnergyConsumptionCard';

// Layout Components
export { DashboardGrid } from './components/layout/DashboardGrid';
export { DashboardHeader } from './components/layout/DashboardHeader';
export { DashboardSection } from './components/layout/DashboardSection';
export { DashboardSkeleton } from './components/layout/DashboardSkeleton';
export { DashboardError } from './components/layout/DashboardError';

// Types
export type * from './types';
