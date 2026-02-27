/**
 * Backend Adapters - Transforma dados do backend para formato do frontend
 *
 * O backend retorna dados em snake_case com estrutura diferente.
 * Estes adapters normalizam para o formato esperado pelo frontend.
 */

import type {
  DashboardOverview,
  WorkOrdersMetrics,
  AnomalyStats,
  MaintenancePlansStats,
  SystemStatus,
} from '../types';

// ========== TIPOS DO BACKEND ==========

interface BackendOverviewDto {
  total_equipamentos: number;
  equipamentos_com_falhas: number;
  equipamentos_parados: number;
  os_abertas: number;
  os_em_execucao: number;
  os_finalizadas: number;
}

interface BackendWorkOrdersDto {
  os_abertas: number;
  nota_qualidade: number;
  os_atrasadas: number;
  os_finalizadas: number;
  indicador_carga_trabalho: number;
}

interface BackendAnomaliaStatsDto {
  total: number;
  aguardando: number;
  emAnalise: number;
  osGerada: number;
  resolvida: number;
  cancelada: number;
  criticas: number;
}

interface BackendSeverityDistributionDto {
  baixa: number;
  media: number;
  alta: number;
  critica: number;
  total_anomalias: number;
}

interface BackendDashboardPlanosDto {
  total_planos: number;
  planos_ativos: number;
  planos_inativos: number;
  planos_em_revisao: number;
  planos_arquivados: number;
  equipamentos_com_plano: number;
  total_tarefas_todos_planos: number;
  media_tarefas_por_plano: number;
  tempo_total_estimado_geral: number;
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
}

interface BackendSystemStatusDto {
  paradas_programadas: number;
  equipamentos_status_critico: number;
  equipamentos_classe_critica: number;
  paradas_nao_programadas: number;
  falhas_causando_danos: number;
  sensores_danificados: number;
}

// ========== ADAPTERS ==========

/**
 * Converte dados de overview do backend para frontend
 */
export function adaptOverview(
  backendData: BackendOverviewDto
): DashboardOverview {
  const totalAssets =
    backendData.total_equipamentos -
    backendData.equipamentos_parados -
    backendData.equipamentos_com_falhas;

  const operationalAssets = Math.max(0, totalAssets);

  return {
    timestamp: new Date(),
    operationalAssets,
    maintenanceAssets: backendData.equipamentos_com_falhas,
    stoppedAssets: backendData.equipamentos_parados,
    failedAssets: backendData.equipamentos_com_falhas,
    systemUptime: 95.5, // TODO: calcular baseado em dados reais
    plannedDowntime: 2.5, // TODO: calcular baseado em dados reais
    unplannedDowntime: 2.0, // TODO: calcular baseado em dados reais
    workOrdersTrend: 0, // TODO: calcular comparando com período anterior
    anomaliesTrend: 0, // TODO: calcular comparando com período anterior
    uptimeTrend: 0, // TODO: calcular comparando com período anterior
  };
}

/**
 * Converte dados de work orders do backend para frontend
 */
export function adaptWorkOrders(
  backendData: BackendWorkOrdersDto,
  plannedVsCompletedData?: any,
  recentOSData?: any
): WorkOrdersMetrics {
  const totalPlanned = backendData.os_abertas + backendData.os_finalizadas;
  const completionRate =
    totalPlanned > 0
      ? (backendData.os_finalizadas / totalPlanned) * 100
      : 0;

  // Processar dados históricos do gráfico
  const historical = plannedVsCompletedData?.meses?.map((mes: any) => ({
    month: mes.mes,
    planned: mes.planejadas,
    completed: mes.concluidas,
  })) || [];

  // Processar OS recentes
  const recent = Array.isArray(recentOSData)
    ? recentOSData.slice(0, 5).map((os: any) => ({
        id: os.id,
        number: os.numero_os || `OS-${os.id}`,
        title: os.titulo || '',
        description: os.descricao || '',
        status: os.status || 'PENDING',
        priority: os.prioridade || 'MEDIUM',
        createdAt: new Date(os.criado_em),
      }))
    : [];

  return {
    totalOpen: backendData.os_abertas,
    totalPlanned,
    completed: backendData.os_finalizadas,
    inProgress: backendData.os_abertas - backendData.os_atrasadas,
    overdueCount: backendData.os_atrasadas,
    qualityScore: backendData.nota_qualidade,
    avgCompletionTime: 0, // TODO: backend precisa calcular
    completionRate,
    historical,
    recent,
  };
}

/**
 * Converte dados de anomalias do backend para frontend
 */
export function adaptAnomalies(
  statsData: BackendAnomaliaStatsDto,
  severityData?: BackendSeverityDistributionDto
): AnomalyStats {
  const byPriority = severityData
    ? {
        low: severityData.baixa,
        medium: severityData.media,
        high: severityData.alta,
        critical: severityData.critica,
      }
    : {
        low: 0,
        medium: 0,
        high: 0,
        critical: statsData.criticas,
      };

  const resolved = statsData.resolvida || 0;
  const total = statsData.total;
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

  return {
    total,
    open: statsData.aguardando,
    inProgress: statsData.emAnalise,
    resolved,
    cancelled: statsData.cancelada,
    byPriority,
    resolutionRate,
    avgResolutionTimeHours: 0, // TODO: backend precisa calcular
    recentAnomalies: [], // TODO: buscar anomalias recentes de outro endpoint
  };
}

/**
 * Converte dados de planos de manutenção do backend para frontend
 */
export function adaptMaintenancePlans(
  backendData: BackendDashboardPlanosDto
): MaintenancePlansStats {
  const totalActive = backendData.planos_ativos;
  const upcomingCount = 0; // TODO: backend precisa fornecer planos próximos (7 dias)
  const overdueCount = 0; // TODO: backend precisa fornecer planos atrasados
  const complianceRate = 92; // TODO: backend precisa calcular taxa de cumprimento

  return {
    totalActive,
    totalInactive: backendData.planos_inativos,
    upcomingCount,
    overdueCount,
    complianceRate,
    equipmentsWithoutPlan:
      backendData.total_planos - backendData.equipamentos_com_plano,
    recentPlans: [], // TODO: buscar planos recentes de outro endpoint
  };
}

/**
 * Converte dados de status do sistema do backend para frontend
 */
export function adaptSystemStatus(
  backendData: BackendSystemStatusDto,
  overviewData?: BackendOverviewDto
): SystemStatus {
  // Se temos overview data, usar para calcular operational
  const operational = overviewData
    ? overviewData.total_equipamentos - overviewData.equipamentos_parados - overviewData.equipamentos_com_falhas
    : 0;

  return {
    plannedDowntimeCount: backendData.paradas_programadas,
    unplannedDowntimeCount: backendData.paradas_nao_programadas,
    assetsByStatus: {
      operational: Math.max(0, operational),
      underMaintenance: overviewData?.equipamentos_com_falhas || 0,
      stopped: overviewData?.equipamentos_parados || 0,
      failed: backendData.equipamentos_status_critico,
    },
    assetsByClass: {
      critical: backendData.equipamentos_classe_critica,
      essential: 0, // TODO: backend precisa fornecer
      support: 0, // TODO: backend precisa fornecer
      nonCritical: 0, // TODO: backend precisa fornecer
    },
    failuresCausingDamage: backendData.falhas_causando_danos,
    damagedSensors: backendData.sensores_danificados,
  };
}
