// src/features/dashboard/utils/planilha-do-painel.ts
import type { Workbook, Worksheet } from 'exceljs';
import type { DashboardManutencaoApi, ExplicacaoApi, OrdemDaContaApi } from '@/services/dashboard-manutencao.services';
import { statusLabels, tipoLabels } from '@/features/execucao-os/config/labels';
import { origemLabels } from '@/features/programacao-os/config/labels';
import { dataNaCelula } from '@/features/execucao-os/utils/planilha-das-os';
import { bordaFina, cabecalho, moeda, novoLivro } from '@/lib/planilha/estilo';

/**
 * O painel exportado (SN-82). Os números saem da MESMA resposta da tela, como
 * ela os mostra (o valor do cartão é o texto do cartão); a aba OS traz as
 * ordens que entraram na conta, para quem quiser conferir. Só exportação: o
 * painel não se importa.
 */

type Valor = string | number | Date | null;

const DATA = 'dd/mm/yyyy hh:mm';
const sim = (v: boolean | null | undefined) => (v ? 'sim' : '');

interface Coluna {
  titulo: string;
  largura: number;
  valor: (o: OrdemDaContaApi) => Valor;
  formato?: 'data' | 'horas' | 'moeda';
}

export const COLUNAS_DAS_OS: Coluna[] = [
  { titulo: 'Nº da OS', largura: 16, valor: (o) => o.numero },
  { titulo: 'Tipo', largura: 13, valor: (o) => tipoLabels[o.tipo] ?? o.tipo },
  { titulo: 'Origem', largura: 14, valor: (o) => origemLabels[o.origem] ?? o.origem },
  { titulo: 'Status', largura: 13, valor: (o) => statusLabels[o.status] ?? o.status },
  { titulo: 'Planta', largura: 24, valor: (o) => o.planta },
  { titulo: 'Equipamentos', largura: 28, valor: (o) => o.equipamentos.join(' · ') || null },
  { titulo: 'Criada em', largura: 16, valor: (o) => dataNaCelula(o.criada_em), formato: 'data' },
  { titulo: 'Programada para', largura: 16, valor: (o) => dataNaCelula(o.programada_para), formato: 'data' },
  { titulo: 'Iniciada em', largura: 16, valor: (o) => dataNaCelula(o.iniciada_em), formato: 'data' },
  { titulo: 'Terminou em', largura: 16, valor: (o) => dataNaCelula(o.terminou_em), formato: 'data' },
  // Em que conta a OS entra: a mesma regra de cada bloco da tela
  { titulo: 'Aberta agora', largura: 10, valor: (o) => sim(o.aberta) },
  { titulo: 'Concluída no período', largura: 12, valor: (o) => sim(o.concluida_no_periodo) },
  { titulo: 'Criada no período', largura: 11, valor: (o) => sim(o.criada_no_periodo) },
  { titulo: 'Programada no período', largura: 12, valor: (o) => sim(o.programada_no_periodo) },
  { titulo: 'Parada no período', largura: 11, valor: (o) => sim(o.parada_no_periodo) },
  { titulo: 'Corretiva do período', largura: 12, valor: (o) => sim(o.corretiva_do_periodo) },
  { titulo: 'Duração estimada (h)', largura: 12, valor: (o) => o.horas_estimadas, formato: 'horas' },
  { titulo: 'Sem estimativa', largura: 11, valor: (o) => sim(o.sem_estimativa) },
  // ?? e não ||: custo 0 é R$ 0,00; vazio é a OS que não foi concluída no período (o gráfico não a soma)
  { titulo: 'Mão de obra', largura: 13, valor: (o) => o.custo?.mao_de_obra ?? null, formato: 'moeda' },
  { titulo: 'Material', largura: 13, valor: (o) => o.custo?.material ?? null, formato: 'moeda' },
  { titulo: 'Outros custos', largura: 13, valor: (o) => o.custo?.adicionais ?? null, formato: 'moeda' },
  { titulo: 'Custo total', largura: 13, valor: (o) => o.custo?.total ?? null, formato: 'moeda' },
  { titulo: 'Equipamento parou', largura: 11, valor: (o) => (o.equipamento_parou === null ? null : o.equipamento_parou ? 'sim' : 'não') },
  { titulo: 'Parou em', largura: 16, valor: (o) => dataNaCelula(o.parada_inicio), formato: 'data' },
  { titulo: 'Voltou em', largura: 16, valor: (o) => dataNaCelula(o.parada_fim), formato: 'data' },
];

function tabela(ws: Worksheet, colunas: { header: string; width: number }[], linhas: Valor[][]) {
  ws.columns = colunas;
  cabecalho(ws.getRow(1));
  for (const l of linhas) ws.addRow(l);
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  bordaFina(ws, colunas.length);
}

export interface FiltroDoPainel {
  /** Rótulo e valor de cada filtro, como a tela os mostra */
  filtros: [string, string][];
  /** Os gráficos que a tela mostra: a legenda deles vai junto */
  graficos: ExplicacaoApi[];
  exportadoEm?: Date;
}

export async function planilhaDoPainel(
  painel: DashboardManutencaoApi,
  ordens: OrdemDaContaApi[],
  { filtros, graficos, exportadoEm = new Date() }: FiltroDoPainel,
): Promise<Workbook> {
  const livro = await novoLivro();

  // INDICADORES: o cartão como a tela mostra, com a fórmula e a base; depois a legenda dos gráficos
  const indicadores = livro.addWorksheet('INDICADORES');
  tabela(
    indicadores,
    [
      { header: 'Indicador', width: 24 },
      { header: 'Valor', width: 12 },
      { header: 'Unidade', width: 9 },
      { header: 'Nota', width: 32 },
      { header: 'Como se calcula', width: 70 },
      { header: 'Base', width: 60 },
      { header: 'Pendência', width: 40 },
      { header: 'Simulado', width: 10 },
    ],
    [
      // O cartão simulado leva o selo na tela: fora dela, sem a coluna, passaria por real
      ...painel.kpis.map((k) => [k.rotulo, k.valor, k.unidade ?? null, k.nota, k.formula ?? null, k.base ?? null, k.pendencia ?? null, k.simulado ? 'sim' : null]),
      [],
      ['Gráfico', null, null, null, 'Como se calcula', 'Base', null],
      ...graficos.map((g) => [g.rotulo, null, null, null, g.formula, g.base ?? null, null]),
    ],
  );
  cabecalho(indicadores.getRow(painel.kpis.length + 3));
  indicadores.getColumn(5).alignment = { wrapText: true, vertical: 'top' };
  indicadores.getColumn(6).alignment = { wrapText: true, vertical: 'top' };

  // SERV-10: o cliente não vê dinheiro (a API manda o custo nulo): sem as colunas de custo
  const { custo, custoPorOS } = painel;
  const colunasDasOS = custo ? COLUNAS_DAS_OS : COLUNAS_DAS_OS.filter((c) => c.formato !== 'moeda');

  // MENSAL: as séries dos gráficos, um mês por linha
  const mensal = livro.addWorksheet('MENSAL');
  tabela(
    mensal,
    [
      'Mês',
      ...(custo && custoPorOS
        ? ['Mão de obra (R$ mil)', 'Material (R$ mil)', 'Outros custos (R$ mil)', 'Custo total (R$ mil)', 'Orçado (R$ mil)', 'Custo médio corretiva (R$)', 'Custo médio demais (R$)']
        : []),
      'HH planejado', 'HH apontado',
      'Anomalias resolvidas', 'Anomalias com OS em andamento', 'Anomalias sem OS',
    ].map((header) => ({ header, width: header.length > 14 ? 16 : 12 })),
    painel.meses.map((mes, i) => [
      mes,
      ...(custo && custoPorOS
        ? [
            custo.maoObra[i] ?? 0,
            custo.material[i] ?? 0,
            custo.adicionais[i] ?? 0,
            custo.total[i] ?? 0,
            custo.orcado[i] ?? 0,
            custoPorOS.corretiva[i] ?? 0,
            custoPorOS.preventiva[i] ?? 0,
          ]
        : []),
      painel.hh.planejado[i] ?? 0,
      painel.hh.apontado[i] ?? 0,
      painel.anomalias.resolvida[i] ?? 0,
      painel.anomalias.emExecucao[i] ?? 0,
      painel.anomalias.semOS[i] ?? 0,
    ]),
  );

  // COMPOSIÇÃO: os gráficos de proporção e o funil das anomalias
  const ep = painel.execucaoPlano;
  const a = painel.anomalias;
  const composicao = livro.addWorksheet('COMPOSIÇÃO');
  tabela(
    composicao,
    [{ header: 'Gráfico', width: 26 }, { header: 'Item', width: 30 }, { header: 'Valor', width: 12 }],
    [
      ['Execução do plano', 'OS do plano programadas', ep.programadas],
      ['Execução do plano', 'Concluídas', ep.executadas],
      ['Execução do plano', 'Executado (%)', ep.programadas > 0 ? Math.round((ep.executadas / ep.programadas) * 100) : 0],
      ['Execução do plano', 'Meta (%)', ep.meta],
      ['Planejada vs. não planejada', 'Planejada (%)', painel.planejadaVsNao.planejada],
      ['Planejada vs. não planejada', 'Não planejada (%)', painel.planejadaVsNao.naoPlanejada],
      ['Origem da OS', 'Plano (%)', painel.origemOS.plano],
      ['Origem da OS', 'Anomalia (%)', painel.origemOS.anomalia],
      ['Origem da OS', 'Solicitação (%)', painel.origemOS.solicitacao],
      ['Anomalias', 'Registradas', a.identificadas],
      ['Anomalias', 'Viraram OS', a.viraramOS],
      ['Anomalias', 'Resolvidas', a.concluidas],
      ['Anomalias', 'Ciclo até a OS (dias)', a.cicloAteOS],
      ['Anomalias', 'Ciclo de execução (dias)', a.cicloExecucao],
      ['Anomalias', 'Ciclo total (dias)', a.cicloTotal],
      ['Anomalias', 'Meta do ciclo (dias)', a.metaCiclo],
    ],
  );

  // BACKLOG: as OS abertas agora, pela idade
  const backlog = livro.addWorksheet('BACKLOG');
  tabela(
    backlog,
    [{ header: 'Idade (desde a criação)', width: 24 }, { header: 'OS abertas', width: 12 }],
    painel.backlogIdade.map((f) => [f.faixa, f.qtd]),
  );

  // OS: as que entraram na conta, para conferir
  const aba = livro.addWorksheet('OS');
  tabela(
    aba,
    colunasDasOS.map((c) => ({ header: c.titulo, width: c.largura })),
    ordens.map((o) => colunasDasOS.map((c) => c.valor(o))),
  );
  colunasDasOS.forEach((c, i) => {
    if (!c.formato) return;
    for (let r = 2; r <= ordens.length + 1; r++) {
      const celula = aba.getRow(r).getCell(i + 1);
      if (c.formato === 'moeda') moeda(celula);
      else celula.numFmt = c.formato === 'data' ? DATA : '0.00';
    }
  });
  aba.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunasDasOS.length } };

  // FILTRO: o que foi exportado
  const sobre = livro.addWorksheet('FILTRO');
  sobre.columns = [{ width: 26 }, { width: 70 }];
  const linhas: [string, Valor][] = [
    ['Exportado em', dataNaCelula(exportadoEm.toISOString())],
    ['Painel calculado em', dataNaCelula(painel.atualizadoEm)],
    ['Horários', 'de Brasília'],
    ...(painel.periodo
      ? ([
          ['Período de', dataNaCelula(painel.periodo.desde)],
          ['Período até (exclusive)', dataNaCelula(painel.periodo.ate)],
        ] as [string, Valor][])
      : []),
    ...filtros,
    ['OS na aba OS', ordens.length],
    ['De onde saem os números', 'Do painel e da lista das OS, lidos juntos com estes filtros no momento da exportação; a aba OS traz as ordens que entraram em alguma conta. O custo só aparece na OS concluída no período (é o que o gráfico soma).'],
  ];
  for (const [rotulo, valor] of linhas) {
    const linha = sobre.addRow([rotulo, valor]);
    linha.getCell(1).font = { bold: true };
    if (valor instanceof Date) linha.getCell(2).numFmt = DATA;
  }
  return livro;
}
