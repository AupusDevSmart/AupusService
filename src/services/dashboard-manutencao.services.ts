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
  /** Como o número sai (SN-80: a fórmula visível na tela) */
  formula?: string;
  /** Em quantos registros o número se baseia, e o que ficou de fora */
  base?: string;
}

/** Como um gráfico sai: a legenda das fórmulas (SN-80/81), no ícone dele e em "Como se calcula" */
export interface ExplicacaoApi {
  /** O bloco do painel (execucaoPlano, custo, hh...) */
  id: string;
  rotulo: string;
  formula: string;
  base?: string;
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
  /** Os limites do período escolhido, [desde, ate) — os meses acompanham (SN-79) */
  periodo?: { desde: string; ate: string };
  opcoes: OpcoesFiltro;
  kpis: IndicadorApi[];
  alertas: IndicadorApi[];

  execucaoPlano: { executadas: number; programadas: number; meta: number };
  planejadaVsNao: { planejada: number; naoPlanejada: number };
  origemOS: { plano: number; anomalia: number; solicitacao: number };
  mixTipo: { preventiva: number; preditiva: number; corretiva: number; melhoria: number };

  /** Por natureza, em R$ mil: mão de obra e material pelas linhas da OS, adicionais da OS (SN-81) */
  custo: {
    maoObra: number[];
    material: number[];
    adicionais: number[];
    orcado: number[];
    total: number[];
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
  /** A fórmula e a base de cada gráfico (o demo não tem) */
  graficos?: ExplicacaoApi[];
}

/** Uma OS que entrou em alguma conta do painel: a aba OS da exportação (SN-82) */
export interface OrdemDaContaApi {
  id: string;
  numero: string;
  tipo: string;
  origem: string;
  status: string;
  planta: string | null;
  equipamentos: string[];
  criada_em: string;
  programada_para: string | null;
  iniciada_em: string | null;
  terminou_em: string | null;
  aberta: boolean;
  concluida_no_periodo: boolean;
  criada_no_periodo: boolean;
  programada_no_periodo: boolean;
  parada_no_periodo: boolean;
  corretiva_do_periodo: boolean;
  horas_estimadas: number;
  sem_estimativa: boolean;
  custo: { mao_de_obra: number; material: number; adicionais: number; total: number } | null;
  equipamento_parou: boolean | null;
  parada_inicio: string | null;
  parada_fim: string | null;
}

export interface OrdensDaContaApi {
  periodo: { desde: string; ate: string };
  ordens: OrdemDaContaApi[];
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

  // 'all' é como os comboboxes representam "sem filtro"; mandar isso adiante
  // viraria um id inexistente e o painel voltaria vazio.
  private params(filtros: FiltrosDashboard) {
    return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v && v !== 'all'));
  }

  async carregar(filtros: FiltrosDashboard = {}): Promise<DashboardManutencaoApi> {
    // O interceptor pode desembrulhar { success, data }; às vezes sobra uma
    // camada. O painel aceita as duas formas em vez de apostar numa delas.
    const response = await api.get<DashboardManutencaoApi | { data: DashboardManutencaoApi }>(
      this.endpoint,
      { params: this.params(filtros) },
    );

    const corpo = response.data;
    return corpo && 'data' in corpo ? corpo.data : corpo;
  }

  /** As OS que entraram nas contas do painel, com os mesmos filtros (SN-82) */
  async ordensDaConta(filtros: FiltrosDashboard = {}): Promise<OrdensDaContaApi> {
    const response = await api.get<OrdensDaContaApi | { data: OrdensDaContaApi }>(`${this.endpoint}/ordens`, {
      params: this.params(filtros),
    });
    const corpo = response.data;
    const resposta = corpo && 'data' in corpo ? corpo.data : corpo;
    // Sem a lista, a planilha sairia sem a aba de conferência dizendo que não há OS
    if (!Array.isArray(resposta?.ordens)) throw new Error('A lista das OS do painel veio num formato inesperado.');
    return resposta;
  }
}

export const dashboardManutencaoApi = new DashboardManutencaoApiService();
