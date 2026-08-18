// src/services/dashboard-manutencao.services.ts
import { api } from '@/config/api';

/**
 * Um indicador do painel.
 *
 * `simulado` e `pendencia` existem porque nem tudo que o painel mostra tem
 * origem no banco hoje. Em vez de esconder isso, o indicador diz que é
 * simulado e o que falta registrar para virar real.
 */
export interface IndicadorApi {
  id: string;
  icone: string;
  rotulo: string;
  valor: string;
  unidade?: string;
  nota: string;
  status: null | 'ok' | 'warn' | 'bad';
  simulado?: boolean;
  pendencia?: string;
}

/**
 * O que preencher nos combos. Vem na mesma resposta do painel porque são as
 * plantas que o escopo do usuário autoriza — buscar de outro endpoint abriria
 * espaço para o filtro oferecer uma planta que os dados nunca vão conter.
 */
export interface OpcoesFiltro {
  plantas: { id: string; nome: string }[];
  unidades: { id: string; nome: string; plantaId: string | null }[];
  equipes: string[];
}

export interface DashboardManutencaoApi {
  atualizadoEm: string;
  meses: string[];
  opcoes: OpcoesFiltro;
  kpis: IndicadorApi[];
  alertas: IndicadorApi[];

  execucaoPlano: { executadas: number; programadas: number; meta: number };
  planejadaVsNao: { planejada: number; naoPlanejada: number };
  origemOS: { plano: number; anomalia: number; solicitacao: number };
  mixTipo: { preventiva: number; preditiva: number; corretiva: number; melhoria: number };

  custo: {
    maoObra: number[];
    material: number[];
    terceiros: number[];
    orcado: number[];
    total: number[];
    simulado?: boolean;
    pendencia?: string;
  };
  custoPorOS: {
    corretiva: number[];
    preventiva: number[];
    base: number;
    pendencia?: string;
  };
  finalidade: {
    manutencao: number[];
    servicos: number[];
    simulado?: boolean;
    pendencia?: string;
  };

  anomalias: {
    identificadas: number;
    viraramOS: number;
    concluidas: number;
    cicloAteOS: number;
    cicloExecucao: number;
    cicloTotal: number;
    metaCiclo: number;
    resolvida: number[];
    emExecucao: number[];
    semOS: number[];
  };

  backlogIdade: { faixa: string; qtd: number }[];
  ofensores: { ativo: string; custoMil: number }[];
  prazoPorEquipe: { equipe: string; pct: number }[];
  metaPrazo: number;
  prazoPendencia?: string;
  hh: { planejado: number[]; apontado: number[] };
}

export interface FiltrosDashboard {
  periodo?: '12meses' | 'mes' | 'trimestre' | 'ano';
  plantaId?: string;
  unidadeId?: string;
  equipe?: string;
  criticidade?: string;
}

class DashboardManutencaoApiService {
  private readonly endpoint = '/dashboard/manutencao';

  async carregar(filtros: FiltrosDashboard = {}): Promise<DashboardManutencaoApi> {
    // 'all' é como os comboboxes representam "sem filtro"; mandar isso adiante
    // viraria um id inexistente e o painel voltaria vazio.
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v && v !== 'all'),
    );

    // O interceptor pode desembrulhar { success, data }; às vezes sobra uma
    // camada. O painel aceita as duas formas em vez de apostar numa delas.
    const response = await api.get<DashboardManutencaoApi | { data: DashboardManutencaoApi }>(
      this.endpoint,
      { params },
    );

    const corpo = response.data;
    return corpo && 'data' in corpo ? corpo.data : corpo;
  }
}

export const dashboardManutencaoApi = new DashboardManutencaoApiService();
