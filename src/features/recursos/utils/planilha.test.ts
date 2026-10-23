// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import type { RecursoApiResponse } from '@/services/recursos.services';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeRecursos, lerRecursos } from './planilha';

/** A lista dos recursos daqui, para casar a planilha do Smart Project pelo nome */
const api = vi.hoisted(() => ({ listar: vi.fn() }));
vi.mock('@/services/recursos.services', async (original) => {
  const real = await original<typeof import('@/services/recursos.services')>();
  return { ...real, recursosApi: { ...real.recursosApi, listar: api.listar } };
});

const recurso = (extra: Partial<RecursoApiResponse>): RecursoApiResponse => ({
  id: 'r1                        ',
  categoria: 'MAO_DE_OBRA',
  nome: 'Eletricista',
  funcao: 'Eletricista',
  descricao: null,
  unidade: null,
  base_calculo: 'hora',
  rubrica: 'instrucoes',
  horas_por_diaria: 8,
  preco_unitario: '85.50',
  valor_aquisicao: null,
  prazo_retorno_meses: null,
  custos_anuais: '0',
  meta_utilizacao_horas: null,
  custo_hora: null,
  preco_base: 85.5,
  custo_origem: 'preco_fixo',
  ativo: true,
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-10-02T11:22:33.000Z',
  ...extra,
});

const instrumento = recurso({
  id: 'r2',
  categoria: 'INSTRUMENTO',
  nome: 'Megôhmetro',
  funcao: null,
  base_calculo: 'diaria',
  preco_unitario: null,
  valor_aquisicao: '38700.00',
  prazo_retorno_meses: 12,
  custos_anuais: '2500.00',
  meta_utilizacao_horas: '150.00',
  custo_hora: 274.67,
  preco_base: 2197.36,
  custo_origem: 'amortizacao',
});

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de recursos', { timeout: 120_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it('as colunas são as da planilha de recursos do AupusProject, na mesma ordem', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [recurso({})]));
    const titulos: string[] = [];
    livro.getWorksheet('RESUMO')!.getRow(1).eachCell((c) => titulos.push(String(c.value)));
    expect(titulos).toEqual([
      'ID', 'NOME', 'CATEGORIA', 'FUNÇÃO', 'CUSTO APURADO', 'POR', 'COBRANÇA', 'RUBRICA', 'PREÇO UNITÁRIO', 'UNIDADE',
      'HORAS POR DIÁRIA', 'VALOR DE AQUISIÇÃO', 'PRAZO DE RETORNO (MESES)', 'CUSTOS ANUAIS', 'META DE UTILIZAÇÃO (H/ANO)',
      'DESCRIÇÃO', 'ATIVO', 'CUSTO POR HORA', 'ORIGEM DO CUSTO', 'ATUALIZADO EM',
    ]);
  });

  it('ida e volta: o que sai é o que volta, com o ID sem espaço e o ATUALIZADO EM exato; o calculado não volta', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [recurso({}), instrumento]));
    const { registros: lidos, erros } = await lerRecursos(livro);

    expect(erros).toEqual([]);
    expect(api.listar).not.toHaveBeenCalled();
    expect(lidos.map((r) => [r.id, r.atualizado_em])).toEqual([
      ['r1', '2026-10-02T11:22:33.000Z'],
      ['r2', '2026-10-02T11:22:33.000Z'],
    ]);
    expect(lidos[0].dados).toEqual({
      nome: 'Eletricista', categoria: 'MAO_DE_OBRA', funcao: 'Eletricista', base_calculo: 'hora', rubrica: 'instrucoes',
      preco_unitario: 85.5, unidade: null, horas_por_diaria: 8, valor_aquisicao: null, prazo_retorno_meses: null,
      custos_anuais: null, meta_utilizacao_horas: null, descricao: null, ativo: true,
    });
    expect(lidos[1].dados).toMatchObject({ categoria: 'INSTRUMENTO', base_calculo: 'diaria', valor_aquisicao: 38700, prazo_retorno_meses: 12, custos_anuais: 2500, meta_utilizacao_horas: 150 });
  });

  it('o custo apurado e a origem saem na planilha, sem voltar na importação', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [instrumento]));
    const ws = livro.getWorksheet('RESUMO')!;
    expect([ws.getCell('E2').value, ws.getCell('F2').value, ws.getCell('R2').value, ws.getCell('S2').value]).toEqual([
      2197.36, 'diária', 274.67, 'Amortização do investimento',
    ]);
  });

  it('linha nova (sem ID) entra como registro novo; cobrança e ATIVO vazios ficam de fora (o padrão)', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, []));
    const ws = livro.getWorksheet('RESUMO')!;
    ws.getCell('B2').value = 'Soldador';
    ws.getCell('C2').value = 'Mão de obra';
    ws.getCell('I2').value = '1.234,5';

    const { registros, erros } = await lerRecursos(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    expect(registros).toEqual([
      expect.objectContaining({ id: null, dados: expect.objectContaining({ nome: 'Soldador', categoria: 'MAO_DE_OBRA', preco_unitario: 1234.5 }) }),
    ]);
    expect(registros[0].dados).not.toHaveProperty('base_calculo');
    expect(registros[0].dados).not.toHaveProperty('ativo');
  });

  // SN-83: decisão do usuário, a planilha de lá importa aqui
  it('a planilha do Smart Project: os IDs de lá são ignorados e cada recurso casa pelo nome e pela categoria', async () => {
    const livro = await montarLivroPlano(definicaoDeRecursos, [recurso({ id: '17' }), instrumento, recurso({ id: '19', nome: 'Pintor' })]);
    livro.creator = 'Smart Project';
    api.listar.mockResolvedValue({
      data: [recurso({ id: 'aqui-eletricista', nome: 'ELETRICISTA' }), recurso({ id: 'aqui-mego', categoria: 'INSTRUMENTO', nome: 'Megohmetro' })],
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });

    const leitura = await lerRecursos(await gravarEReabrir(livro));

    // O nome casa sem caixa e sem acento; o que não existe aqui cria
    expect(leitura.registros.map((r) => [r.id, r.atualizado_em])).toEqual([
      ['aqui-eletricista', null],
      ['aqui-mego', null],
      [null, null],
    ]);
    expect(leitura.avisos?.[0].mensagem).toContain('2 recursos casado(s) pelo nome com os daqui (edita), 1 novo(s) (cria)');
  });

  it('o ID só de dígitos denuncia a planilha de outro sistema mesmo sem o autor do livro', async () => {
    const livro = await montarLivroPlano(definicaoDeRecursos, [recurso({ id: '17' })]);
    livro.creator = '';
    api.listar.mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } });

    const leitura = await lerRecursos(await gravarEReabrir(livro));

    expect(leitura.registros[0].id).toBeNull();
  });

  // O arquivo montado por script traz a fórmula sem o resultado: lida como vazia, limpava o preço calada
  it('célula com fórmula sem o valor calculado é erro na linha', async () => {
    const livro = await montarLivroPlano(definicaoDeRecursos, [recurso({})]);
    livro.getWorksheet('RESUMO')!.getCell('I2').value = { formula: '100*3' } as never;

    const { registros, erros } = await lerRecursos(await gravarEReabrir(livro));

    expect(registros).toEqual([]);
    expect(erros).toEqual([expect.objectContaining({ linha: 2, mensagem: expect.stringContaining('fórmula sem o valor calculado') })]);
  });

  it('valor fora da lista é erro da planilha, com a linha e o que se esperava', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [recurso({})]));
    livro.getWorksheet('RESUMO')!.getCell('C2').value = 'Encanador';

    const { registros, erros } = await lerRecursos(livro);

    expect(registros).toEqual([]);
    expect(erros).toEqual([
      expect.objectContaining({ aba: 'RESUMO', linha: 2, mensagem: expect.stringContaining('"Encanador" não é um valor aceito') }),
    ]);
  });

  it('planilha de outro cadastro é recusada antes de ir ao servidor', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano({ ...definicaoDeRecursos, cadastro: 'Veículos' }, []));

    const { erros } = await lerRecursos(livro);

    expect(erros[0].mensagem).toContain('Esta planilha é de veículos');
  });
});
