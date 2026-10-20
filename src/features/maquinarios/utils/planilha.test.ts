// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import type { MaquinarioApiResponse } from '@/services/maquinarios.services';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeMaquinarios, lerMaquinarios } from './planilha';

/** A lista dos maquinários daqui, para casar a planilha do Smart Project pelo nome */
const api = vi.hoisted(() => ({ listar: vi.fn() }));
vi.mock('@/services/maquinarios.services', async (original) => {
  const real = await original<typeof import('@/services/maquinarios.services')>();
  return { ...real, maquinariosApi: { ...real.maquinariosApi, listar: api.listar } };
});

const maquinario = (extra: Partial<MaquinarioApiResponse>): MaquinarioApiResponse => ({
  id: 'm1',
  nome: 'Betoneira 400 L',
  tipo: 'proprio',
  descricao: null,
  base_calculo: 'diaria',
  rubrica: 'instrucoes',
  horas_por_diaria: 8,
  preco_unitario: '300.00',
  valor_aquisicao: '45000.00',
  prazo_retorno_meses: 24,
  custos_anuais: '3000.00',
  meta_utilizacao_horas: '600.00',
  custo_hora: 42.5,
  preco_base: 340,
  custo_origem: 'amortizacao',
  ativo: true,
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-10-02T11:22:33.000Z',
  ...extra,
});

// 120 s: o primeiro teste carrega o exceljs, e na suíte inteira passava dos 30 s
describe('planilha de maquinários', { timeout: 120_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it('as colunas e o nome do cadastro são os da planilha do AupusProject', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeMaquinarios, [maquinario({})]));
    const titulos: string[] = [];
    livro.getWorksheet('RESUMO')!.getRow(1).eachCell((c) => titulos.push(String(c.value)));
    expect(titulos).toEqual([
      'ID', 'NOME', 'TIPO', 'CUSTO APURADO', 'POR', 'COBRANÇA', 'RUBRICA', 'PREÇO UNITÁRIO', 'HORAS POR DIÁRIA',
      'VALOR DE AQUISIÇÃO', 'PRAZO DE RETORNO (MESES)', 'CUSTOS ANUAIS', 'META DE UTILIZAÇÃO (H/ANO)', 'DESCRIÇÃO',
      'ATIVO', 'CUSTO POR HORA', 'ORIGEM DO CUSTO', 'ATUALIZADO EM',
    ]);
    expect(definicaoDeMaquinarios.cadastro).toBe('Maquinário');
  });

  it('ida e volta: o que sai é o que volta; o calculado não volta', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeMaquinarios, [maquinario({}), maquinario({ id: 'm2', nome: 'Munck 12 t', tipo: 'locacao', rubrica: 'terceirizados' })]));
    const { registros, erros } = await lerMaquinarios(livro);

    expect(erros).toEqual([]);
    expect(api.listar).not.toHaveBeenCalled();
    expect(registros.map((r) => [r.id, r.atualizado_em])).toEqual([
      ['m1', '2026-10-02T11:22:33.000Z'],
      ['m2', '2026-10-02T11:22:33.000Z'],
    ]);
    expect(registros[0].dados).toEqual({
      nome: 'Betoneira 400 L', tipo: 'proprio', base_calculo: 'diaria', rubrica: 'instrucoes', preco_unitario: 300,
      horas_por_diaria: 8, valor_aquisicao: 45000, prazo_retorno_meses: 24, custos_anuais: 3000, meta_utilizacao_horas: 600,
      descricao: null, ativo: true,
    });
    expect(registros[1].dados).toMatchObject({ tipo: 'locacao', rubrica: 'terceirizados' });
  });

  it('a planilha do Smart Project: os IDs de lá são ignorados e cada máquina casa pelo nome', async () => {
    const livro = await montarLivroPlano(definicaoDeMaquinarios, [maquinario({ id: '7' }), maquinario({ id: '8', nome: 'Gerador 80 kVA' })]);
    livro.creator = 'Smart Project';
    api.listar.mockResolvedValue({ data: [maquinario({ id: 'aqui-betoneira', nome: 'BETONEIRA 400 L' })], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } });

    const leitura = await lerMaquinarios(await gravarEReabrir(livro));

    expect(leitura.registros.map((r) => [r.id, r.atualizado_em])).toEqual([
      ['aqui-betoneira', null],
      [null, null],
    ]);
    expect(leitura.avisos?.[0].mensagem).toContain('1 maquinário casado(s) pelo nome com os daqui (edita), 1 novo(s) (cria)');
  });
});
