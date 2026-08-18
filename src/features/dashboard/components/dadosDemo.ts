// src/features/dashboard/components/dadosDemo.ts
import type { DashboardManutencaoApi } from '@/services/dashboard-manutencao.services';

/**
 * Dados de exemplo do painel, para avaliar o desenho da tela sem depender do
 * que existe no banco.
 *
 * Serve a uma pergunta específica: como o painel fica quando a operação já tem
 * volume e histórico? Hoje o banco de desenvolvimento tem poucas dezenas de OS,
 * então metade dos gráficos aparece quase vazia e não dá para julgar densidade,
 * legibilidade nem se tudo cabe na tela.
 *
 * Ligado por `?demo=1` na URL, nunca por padrão, e a tela avisa em cima que os
 * números são fictícios. Nada aqui chega ao backend.
 *
 * Os números são gerados por um gerador com semente fixa, e não por
 * `Math.random()`: assim a tela não muda a cada render, dá para comparar duas
 * versões do layout lado a lado e um print continua valendo depois.
 */

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** Congruente linear — previsível de propósito. */
function geradorComSemente(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}

/** Série de doze meses em torno de uma base, com leve tendência de alta. */
function serie(base: number, variacao: number, aleatorio: () => number, casas = 0): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const tendencia = 1 + i * 0.012;
    const valor = (base + (aleatorio() - 0.5) * 2 * variacao) * tendencia;
    const fator = 10 ** casas;
    return Math.max(0, Math.round(valor * fator) / fator);
  });
}

function ultimosDozeMeses(): string[] {
  const agora = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (11 - i), 1);
    return MESES_CURTOS[d.getMonth()];
  });
}

function montar(): DashboardManutencaoApi {
  const r = geradorComSemente(20260813);

  const maoObra = serie(62, 14, r);
  const material = serie(41, 16, r);
  const terceiros = serie(23, 11, r);
  const total = maoObra.map((v, i) => v + material[i] + terceiros[i]);
  // O orçado é uma reta com degrau no meio do ano, como costuma ser um
  // orçamento revisado — não o próprio realizado com ruído.
  const orcado = total.map((_, i) => (i < 6 ? 132 : 145));

  const planejado = serie(760, 90, r);
  const apontado = planejado.map((v, i) => Math.round(v * (0.88 + (i % 4) * 0.035)));

  return {
    atualizadoEm: new Date().toISOString(),
    meses: ultimosDozeMeses(),

    opcoes: {
      plantas: [
        { id: 'demo-p1', nome: 'Usina Solar Jataí' },
        { id: 'demo-p2', nome: 'Complexo Industrial Anápolis' },
        { id: 'demo-p3', nome: 'Subestação Rio Verde' },
      ],
      unidades: [
        { id: 'demo-u1', nome: 'Bloco A — Inversores', plantaId: 'demo-p1' },
        { id: 'demo-u2', nome: 'Bloco B — Inversores', plantaId: 'demo-p1' },
        { id: 'demo-u3', nome: 'Casa de Bombas', plantaId: 'demo-p2' },
        { id: 'demo-u4', nome: 'Sala Elétrica 1', plantaId: 'demo-p3' },
      ],
      equipes: ['Elétrica', 'Mecânica', 'Instrumentação', 'Terceirizada'],
    },

    kpis: [
      {
        id: 'os_planejada',
        icone: 'calendar-check',
        rotulo: 'OS planejada',
        valor: '248',
        nota: '196 executadas',
        status: 'ok',
      },
      {
        id: 'os_aberto',
        icone: 'folder-open',
        rotulo: 'OS em aberto',
        valor: '63',
        nota: '12 atrasadas',
        status: 'warn',
      },
      {
        id: 'no_prazo',
        icone: 'circle-check',
        rotulo: 'Concluídas no prazo',
        valor: '87',
        unidade: '%',
        nota: 'meta 90%',
        status: 'warn',
      },
      {
        id: 'backlog',
        icone: 'stack',
        rotulo: 'Backlog',
        valor: '412',
        unidade: 'h',
        nota: '≈ 2,3 semanas',
        status: null,
      },
      {
        id: 'anomalias',
        icone: 'alert-triangle',
        rotulo: 'Anomalias abertas',
        valor: '34',
        nota: '9 sem OS aberta',
        status: 'warn',
      },
      {
        id: 'mttr',
        icone: 'clock',
        rotulo: 'MTTR corretiva',
        valor: '6,4',
        unidade: 'h',
        nota: '52 fechadas no período',
        status: 'ok',
      },
      {
        id: 'custo_mes',
        icone: 'activity',
        rotulo: 'Custo do mês',
        valor: 'R$ 148k',
        nota: 'orçado R$ 160k',
        status: 'ok',
      },
      {
        id: 'disponibilidade',
        icone: 'plug',
        rotulo: 'Disponibilidade',
        valor: '96,8',
        unidade: '%',
        nota: 'meta 97%',
        status: 'warn',
      },
    ],

    alertas: [
      {
        id: 'retrabalho',
        icone: 'rotate',
        rotulo: 'Retrabalho',
        valor: '4,1',
        unidade: '%',
        nota: 'meta abaixo de 3%',
        status: 'warn',
      },
      {
        id: 'sem_material',
        icone: 'package-off',
        rotulo: 'Parada por material',
        valor: '7',
        nota: 'OS aguardando peça',
        status: 'bad',
      },
      {
        id: 'pausadas',
        icone: 'pause',
        rotulo: 'OS pausadas',
        valor: '5',
        nota: 'há mais de 3 dias',
        status: 'warn',
      },
      {
        id: 'checklist',
        icone: 'checklist',
        rotulo: 'Checklist incompleto',
        valor: '12',
        nota: 'de 196 concluídas',
        status: 'warn',
      },
      {
        id: 'reincidencia',
        icone: 'repeat',
        rotulo: 'Reincidência',
        valor: '8',
        nota: 'mesmo ativo em 90 dias',
        status: 'bad',
      },
    ],

    execucaoPlano: { executadas: 196, programadas: 248, meta: 85 },
    planejadaVsNao: { planejada: 74, naoPlanejada: 26 },
    origemOS: { plano: 61, anomalia: 27, solicitacao: 12 },
    mixTipo: { preventiva: 52, preditiva: 19, corretiva: 21, melhoria: 8 },

    custo: { maoObra, material, terceiros, orcado, total },
    custoPorOS: {
      corretiva: serie(2450, 520, r),
      preventiva: serie(890, 180, r),
      base: 196,
    },
    finalidade: {
      manutencao: serie(28, 7, r),
      servicos: serie(11, 5, r),
    },

    anomalias: {
      identificadas: 214,
      viraramOS: 168,
      concluidas: 141,
      cicloAteOS: 2.8,
      cicloExecucao: 5.1,
      cicloTotal: 7.9,
      metaCiclo: 7,
      resolvida: serie(11, 4, r),
      emExecucao: serie(4, 2, r),
      semOS: serie(3, 2, r),
    },

    backlogIdade: [
      { faixa: '0-7 d', qtd: 24 },
      { faixa: '8-15 d', qtd: 16 },
      { faixa: '16-30 d', qtd: 11 },
      { faixa: '31-60 d', qtd: 7 },
      { faixa: '+60 d', qtd: 5 },
    ],

    ofensores: [
      { ativo: 'Inversor INV-04', custoMil: 68 },
      { ativo: 'Bomba BC-102', custoMil: 54 },
      { ativo: 'Trafo TR-01', custoMil: 41 },
      { ativo: 'Compressor CP-2', custoMil: 33 },
      { ativo: 'Esteira TR-07', custoMil: 27 },
    ],

    prazoPorEquipe: [
      { equipe: 'Elétrica', pct: 93 },
      { equipe: 'Instrumentação', pct: 88 },
      { equipe: 'Mecânica', pct: 79 },
      { equipe: 'Terceirizada', pct: 64 },
    ],
    metaPrazo: 90,

    hh: { planejado, apontado },
  };
}

/**
 * Gerado uma vez, no carregamento do módulo. Recalcular a cada render faria a
 * tela tremer, mesmo com semente fixa, por causa da ordem das chamadas.
 */
export const DADOS_DEMO: DashboardManutencaoApi = montar();
