// @vitest-environment node
import type { Workbook, Worksheet } from 'exceljs';
import { describe, expect, it } from 'vitest';

import { montarLivroDeFichas } from '@/lib/planilha/fichas';
import { abaDeReferencias } from '@/lib/planilha/referencias';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeInstrucoes } from './planilha';
import { recursosDaPlanilha } from './recursos-da-planilha';

/** SN-98: a planilha de instruções diz a cobrança e o preço de cada recurso, e a importação acerta o cadastro */

const recurso = (extra: Record<string, unknown>) => ({
  id: 'r1                        ',
  categoria: 'MAO_DE_OBRA',
  nome: 'Eletricista',
  base_calculo: 'hora',
  rubrica: 'instrucoes',
  horas_por_diaria: 8,
  preco_base: 80,
  ativo: true,
  ...extra,
});

const linha = (extra: Record<string, unknown>) => ({
  id: 'l1',
  recurso_id: 'r1                        ',
  recurso: recurso({}),
  quantidade: 1,
  duracao_horas: 2,
  fator_perda: 0,
  fornecido_pelo_cliente: false,
  distancia_km: null,
  preco_proprio: null,
  preco_cadastro: 80,
  subtotal: 160,
  ...extra,
});

const instrucao = (id: string, recursos: unknown[]) => ({
  id: `${id}                        `,
  codigo: `INST-${id}`,
  nome: `Instrução ${id}`,
  status: 'ATIVA',
  ativo: true,
  updated_at: '2026-10-23T12:00:00.000Z',
  sub_instrucoes: [],
  recursos,
  maquinarios: [],
});

const cabo = linha({
  id: 'l2',
  recurso_id: 'r2',
  recurso: recurso({ id: 'r2', categoria: 'MATERIAL', nome: 'Cabo', base_calculo: 'unidade', unidade: 'm', preco_base: 12.5 }),
  quantidade: 40,
  preco_cadastro: 12.5,
  subtotal: 500,
});

async function livroCom(instrucoes: unknown[]): Promise<Workbook> {
  return gravarEReabrir(await montarLivroDeFichas(definicaoDeInstrucoes, instrucoes as never));
}

/** A linha do título de uma seção e a coluna de cada título dela */
function secao(ws: Worksheet, titulo: string) {
  let n = 0;
  ws.eachRow((l, i) => {
    if (!n && l.getCell(1).value === titulo) n = i;
  });
  const colunas = new Map<string, number>();
  ws.getRow(n).eachCell((c, i) => colunas.set(String(c.value), i));
  return { linha: n, coluna: (t: string) => colunas.get(t)! };
}

/** Escreve uma linha nova na seção (na folga logo abaixo dos itens) */
function escrever(ws: Worksheet, titulo: string, deslocamento: number, valores: Record<string, string | number>) {
  const s = secao(ws, titulo);
  const r = ws.getRow(s.linha + deslocamento);
  for (const [t, v] of Object.entries(valores)) r.getCell(s.coluna(t)).value = v;
  return s.linha + deslocamento;
}

// 120 s: o primeiro teste carrega o exceljs (na suíte inteira, com 12 workers, passava dos 30 s)
describe('recursos citados pela planilha de instruções', { timeout: 120_000 }, () => {
  it('ida e volta: cada recurso uma vez, com a cobrança, o preço do cadastro e o ID; o material é material', async () => {
    const livro = await livroCom([instrucao('1', [linha({}), cabo]), instrucao('2', [linha({ id: 'l3' })])]);

    const { recursos, erros } = recursosDaPlanilha(livro);

    expect(erros).toEqual([]);
    expect(recursos).toEqual([
      { nome: 'Eletricista', id: 'r1', grupo: 'recursos', categoria: null, base_calculo: 'hora', preco: 80, unidade: null, aba: '01', linha: expect.any(Number), problemas: [] },
      { nome: 'Cabo', id: 'r2', grupo: 'materiais', categoria: 'MATERIAL', base_calculo: null, preco: 12.5, unidade: null, aba: '01', linha: expect.any(Number), problemas: [] },
    ]);
  });

  it('o recurso novo leva a categoria da aba REFERÊNCIAS, e o material a unidade', async () => {
    const livro = await livroCom([instrucao('1', [linha({}), cabo])]);
    await abaDeReferencias(livro, [
      { chave: 'recursos', titulo: 'RECURSOS', colunas: ['NOME', 'CATEGORIA', 'COBRANÇA', 'CUSTO', 'ATIVO', 'ID'], linhas: [['Ajudante', 'Mão de obra', 'Por diária', 200, 'SIM', null]] },
      { chave: 'materiais', titulo: 'MATERIAIS', colunas: ['NOME', 'UNIDADE', 'CUSTO', 'ATIVO', 'ID'], linhas: [['Fita isolante', 'rolo', 9.9, 'SIM', null]] },
    ]);
    const ws = livro.getWorksheet('01')!;
    const ajudante = escrever(ws, 'RECURSOS', 2, { ITEM: 'Ajudante', COBRANÇA: 'Por hora', 'VALOR DO CADASTRO': 30.77 });
    escrever(ws, 'MATERIAIS', 2, { ITEM: 'Fita isolante' });

    const { recursos, erros } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    // A linha diz a cobrança e o preço; a REFERÊNCIAS completa o que ela não diz
    expect(recursos).toEqual(
      expect.arrayContaining([
        { nome: 'Ajudante', id: null, grupo: 'recursos', categoria: 'MAO_DE_OBRA', base_calculo: 'hora', preco: 30.77, unidade: null, aba: '01', linha: ajudante, problemas: [] },
        expect.objectContaining({ nome: 'Fita isolante', grupo: 'materiais', categoria: 'MATERIAL', preco: 9.9, unidade: 'rolo' }),
      ]),
    );
  });

  it('o mesmo recurso com preços diferentes em duas linhas é erro na segunda', async () => {
    const livro = await livroCom([instrucao('1', [linha({})])]);
    const ws = livro.getWorksheet('01')!;
    const segunda = escrever(ws, 'RECURSOS', 2, { ITEM: 'eletricista', COBRANÇA: 'Por hora', 'VALOR DO CADASTRO': 95 });

    const { erros } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(erros).toEqual([
      expect.objectContaining({ aba: '01', linha: segunda, mensagem: expect.stringContaining('deixe a COBRANÇA e o VALOR DO CADASTRO iguais') }),
    ]);
  });

  it('o mesmo nome com IDs diferentes são dois recursos (o cadastro repete nome entre categorias)', async () => {
    const livro = await livroCom([instrucao('1', [linha({})])]);
    const ws = livro.getWorksheet('01')!;
    escrever(ws, 'RECURSOS', 2, { ITEM: 'Eletricista', COBRANÇA: 'Por hora', 'VALOR DO CADASTRO': 95, 'ID DO ITEM': 'r9' });

    const { recursos, erros } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    expect(recursos.map((r) => [r.id, r.preco])).toEqual([
      ['r1', 80],
      ['r9', 95],
    ]);
  });

  it('o que a REFERÊNCIAS diz e não é da lista vai em problemas (o servidor só cobra do recurso novo); o que a linha diz não depende dela', async () => {
    const livro = await livroCom([instrucao('1', [linha({})])]);
    await abaDeReferencias(livro, [
      {
        chave: 'recursos',
        titulo: 'RECURSOS',
        colunas: ['NOME', 'CATEGORIA', 'COBRANÇA', 'CUSTO', 'ATIVO', 'ID'],
        linhas: [
          ['Ajudante', 'MO', 'Por mês', 'barato', 'SIM', null],
          ['Soldador', 'Mão-de-obra', 'Por mês', 'caro', 'SIM', null],
        ],
      },
    ]);
    const ws = livro.getWorksheet('01')!;
    escrever(ws, 'RECURSOS', 2, { ITEM: 'Ajudante' });
    escrever(ws, 'RECURSOS', 3, { ITEM: 'Soldador', COBRANÇA: 'Por hora', 'VALOR DO CADASTRO': 40 });

    const { recursos, erros } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    const ajudante = recursos.find((r) => r.nome === 'Ajudante')!;
    expect(ajudante).toMatchObject({ categoria: null, base_calculo: null, preco: null });
    expect(ajudante.problemas).toEqual([
      expect.stringContaining('CATEGORIA "MO" na aba REFERÊNCIAS, linha 3'),
      expect.stringContaining('COBRANÇA "Por mês"'),
      expect.stringContaining('CUSTO na aba REFERÊNCIAS, linha 3 não é um número'),
    ]);
    // A linha disse a cobrança e o preço: da REFERÊNCIAS só falta a categoria
    expect(recursos.find((r) => r.nome === 'Soldador')!.problemas).toEqual([expect.stringContaining('CATEGORIA "Mão-de-obra"')]);
  });

  it('na REFERÊNCIAS, o mesmo nome em duas categorias: a linha com ID pega a do ID', async () => {
    const livro = await livroCom([instrucao('1', [linha({})])]);
    await abaDeReferencias(livro, [
      {
        chave: 'recursos',
        titulo: 'RECURSOS',
        colunas: ['NOME', 'CATEGORIA', 'COBRANÇA', 'CUSTO', 'ATIVO', 'ID'],
        linhas: [
          ['Ajudante', 'Mão de obra', 'Por hora', 30, 'SIM', 'a1'],
          ['Ajudante', 'Despesa de campo', 'Por diária', 200, 'SIM', 'a2'],
        ],
      },
    ]);
    const ws = livro.getWorksheet('01')!;
    escrever(ws, 'RECURSOS', 2, { ITEM: 'Ajudante', 'ID DO ITEM': 'a2' });

    const { recursos } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(recursos.find((r) => r.id === 'a2')).toMatchObject({ categoria: 'DESPESA_CAMPO', base_calculo: 'diaria', preco: 200 });
  });

  it('cobrança fora da lista é erro na linha', async () => {
    const livro = await livroCom([instrucao('1', [linha({})])]);
    const ws = livro.getWorksheet('01')!;
    const errada = escrever(ws, 'RECURSOS', 2, { ITEM: 'Ajudante', COBRANÇA: 'Por semana' });

    const { erros } = recursosDaPlanilha(await gravarEReabrir(livro));

    expect(erros).toEqual([expect.objectContaining({ aba: '01', linha: errada, mensagem: expect.stringContaining('COBRANÇA "Por semana"') })]);
  });
});
