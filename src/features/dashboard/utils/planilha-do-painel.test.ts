import { describe, expect, it } from 'vitest';
import type { Worksheet } from 'exceljs';
import type { OrdemDaContaApi } from '@/services/dashboard-manutencao.services';
import { DADOS_DEMO } from '@/features/dashboard/components/dadosDemo';
import { gravarEReabrir } from '@/test-utils/planilha';
import { COLUNAS_DAS_OS, planilhaDoPainel } from './planilha-do-painel';

/**
 * A exportação do painel (SN-82): os números da planilha são os da resposta
 * que a tela mostra — o teste de ida grava, reabre e compara com ela.
 */
const painel = {
  ...DADOS_DEMO,
  atualizadoEm: '2026-10-20T14:58:00.000Z',
  periodo: { desde: '2026-10-01T03:00:00.000Z', ate: '2026-11-01T03:00:00.000Z' },
  kpis: DADOS_DEMO.kpis.map((k, i) => ({ ...k, formula: `Fórmula ${i}`, base: `Base ${i}`, simulado: i === 0 })),
};
const graficos = [
  { id: 'custo', rotulo: 'Custo de manutenção', formula: 'Mão de obra + material + adicionais.', base: '2 OS concluídas no período, 2 com custo.' },
  { id: 'hh', rotulo: 'HH planejado vs. apontado', formula: 'Planejado: a duração estimada.', base: '4 OS programadas no período.' },
];

const os = (dados: Partial<OrdemDaContaApi>): OrdemDaContaApi => ({
  id: 'x', numero: 'OS-1', tipo: 'PREVENTIVA', origem: 'TAREFA', status: 'FINALIZADA', planta: 'Usina Norte', equipamentos: ['Inversor 1'],
  criada_em: '2026-10-05T15:30:00.000Z', programada_para: '2026-10-06T12:00:00.000Z', iniciada_em: '2026-10-06T13:00:00.000Z', terminou_em: '2026-10-06T18:00:00.000Z',
  aberta: false, concluida_no_periodo: true, criada_no_periodo: true, programada_no_periodo: true, parada_no_periodo: false, corretiva_do_periodo: false,
  horas_estimadas: 2.5, sem_estimativa: false, custo: { mao_de_obra: 2000, material: 1000, adicionais: 150.5, total: 3150.5 },
  equipamento_parou: null, parada_inicio: null, parada_fim: null, ...dados,
});
const ordens = [
  os({}),
  os({ id: 'y', numero: 'OS-2', status: 'PENDENTE', aberta: true, concluida_no_periodo: false, terminou_em: null, custo: null, sem_estimativa: true, horas_estimadas: 3, equipamentos: [] }),
];

const linhas = (ws: Worksheet) => {
  const todas: unknown[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => todas.push((row.values as unknown[]).slice(1)));
  return todas;
};

describe('planilhaDoPainel', { timeout: 60_000 }, () => {
  const montar = async () =>
    gravarEReabrir(await planilhaDoPainel(painel, ordens, { filtros: [['Período', 'Mês atual'], ['Planta', 'Usina Norte']], graficos, exportadoEm: new Date('2026-10-20T15:00:00Z') }));

  it('INDICADORES: cada cartão como a tela mostra, com a fórmula e a base; depois a legenda dos gráficos', async () => {
    const aba = (await montar()).getWorksheet('INDICADORES')!;
    painel.kpis.forEach((k, i) => {
      const linha = aba.getRow(i + 2);
      expect([linha.getCell(1).value, linha.getCell(2).value, linha.getCell(5).value, linha.getCell(6).value]).toEqual([k.rotulo, k.valor, k.formula, k.base]);
      // O simulado leva o selo na tela; na planilha, a coluna
      expect(linha.getCell(8).value).toBe(k.simulado ? 'sim' : null);
    });
    const inicio = painel.kpis.length + 3;
    expect(aba.getRow(inicio).getCell(1).value).toBe('Gráfico');
    expect([aba.getRow(inicio + 1).getCell(1).value, aba.getRow(inicio + 1).getCell(5).value, aba.getRow(inicio + 1).getCell(6).value]).toEqual([
      'Custo de manutenção', graficos[0].formula, graficos[0].base,
    ]);
  });

  it('MENSAL: as séries da resposta, mês a mês', async () => {
    const aba = (await montar()).getWorksheet('MENSAL')!;
    painel.meses.forEach((mes, i) => {
      const [m, mo, mat, adic, total, orcado, , , hhPlanejado, hhApontado, resolvidas] = linhas(aba)[i + 1];
      expect([m, mo, mat, adic, total, orcado, hhPlanejado, hhApontado, resolvidas]).toEqual([
        mes, painel.custo.maoObra[i], painel.custo.material[i], painel.custo.adicionais[i], painel.custo.total[i], painel.custo.orcado[i],
        painel.hh.planejado[i], painel.hh.apontado[i], painel.anomalias.resolvida[i],
      ]);
    });
  });

  it('COMPOSIÇÃO e BACKLOG: os gráficos de proporção, o funil e as faixas de idade', async () => {
    const livro = await montar();
    const composicao = linhas(livro.getWorksheet('COMPOSIÇÃO')!);
    expect(composicao).toContainEqual(['Execução do plano', 'OS do plano programadas', painel.execucaoPlano.programadas]);
    expect(composicao).toContainEqual(['Origem da OS', 'Anomalia (%)', painel.origemOS.anomalia]);
    expect(composicao).toContainEqual(['Anomalias', 'Viraram OS', painel.anomalias.viraramOS]);
    expect(linhas(livro.getWorksheet('BACKLOG')!).slice(1)).toEqual(painel.backlogIdade.map((f) => [f.faixa, f.qtd]));
  });

  it('OS: as que entraram na conta, com o custo por natureza; o total bate com a soma das linhas', async () => {
    const aba = (await montar()).getWorksheet('OS')!;
    const coluna = (titulo: string) => COLUNAS_DAS_OS.findIndex((c) => c.titulo === titulo) + 1;
    expect(aba.rowCount).toBe(ordens.length + 1);
    expect(aba.getRow(2).getCell(coluna('Custo total')).value).toBe(3150.5);
    expect(aba.getRow(2).getCell(coluna('Adicionais')).value).toBe(150.5);
    expect(aba.getRow(3).getCell(coluna('Custo total')).value).toBeNull();
    expect([aba.getRow(3).getCell(coluna('Aberta agora')).value, aba.getRow(3).getCell(coluna('Sem estimativa')).value]).toEqual(['sim', 'sim']);
    // A data no horário de Brasília: o Excel não tem fuso (15:30 UTC = 12:30)
    expect((aba.getRow(2).getCell(coluna('Criada em')).value as Date).getUTCHours()).toBe(12);
  });

  it('FILTRO: o período, os filtros como a tela mostra e de onde saem os números', async () => {
    const filtro = linhas((await montar()).getWorksheet('FILTRO')!);
    expect(filtro).toContainEqual(['Período', 'Mês atual']);
    expect(filtro).toContainEqual(['Planta', 'Usina Norte']);
    expect(filtro).toContainEqual(['OS na aba OS', 2]);
    expect(filtro.map((l) => l[0])).toEqual(expect.arrayContaining(['Período de', 'Período até (exclusive)', 'Painel calculado em', 'De onde saem os números']));
  });
});
