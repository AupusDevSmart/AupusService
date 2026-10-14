// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import type { RecursoApiResponse } from '@/services/recursos.services';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeRecursos, lerRecursos } from './planilha';

const recurso = (extra: Partial<RecursoApiResponse>): RecursoApiResponse => ({
  id: 'r1                        ',
  categoria: 'TECNICO',
  nome: 'Eletricista',
  unidade: 'h',
  preco_medio: '85.50',
  ativo: true,
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-10-02T11:22:33.000Z',
  ...extra,
});

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de recursos', { timeout: 120_000 }, () => {
  it('ida e volta: o que sai é o que volta, com o ID sem espaço e o ATUALIZADO EM exato', async () => {
    const registros = [
      recurso({}),
      recurso({ id: 'r2', categoria: 'MATERIAL', nome: 'Cabo 10mm', unidade: 'm', preco_medio: null, ativo: false }),
    ];

    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, registros));
    const { registros: lidos, erros } = lerRecursos(livro);

    expect(erros).toEqual([]);
    expect(lidos).toEqual([
      {
        id: 'r1',
        aba: 'RESUMO',
        linha: 2,
        atualizado_em: '2026-10-02T11:22:33.000Z',
        dados: { categoria: 'TECNICO', nome: 'Eletricista', unidade: 'h', preco_medio: 85.5, ativo: true },
      },
      {
        id: 'r2',
        aba: 'RESUMO',
        linha: 3,
        atualizado_em: '2026-10-02T11:22:33.000Z',
        dados: { categoria: 'MATERIAL', nome: 'Cabo 10mm', unidade: 'm', preco_medio: null, ativo: false },
      },
    ]);
  });

  it('a ordem das abas é COMO PREENCHER, RESUMO e uma por registro, e o nome leva à aba', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [recurso({})]));

    expect(livro.worksheets.map((w) => w.name)).toEqual(['COMO PREENCHER', 'RESUMO', '01']);
    const nome = livro.getWorksheet('RESUMO')!.getCell('C2').value as { text: string; hyperlink: string };
    expect(nome).toMatchObject({ text: 'Eletricista', hyperlink: "#'01'!A1" });
  });

  it('linha nova (sem ID) entra como registro novo; ATIVO vazio fica de fora (mantém o padrão)', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, []));
    const ws = livro.getWorksheet('RESUMO')!;
    ws.getRow(2).getCell(2).value = 'Técnico';
    ws.getRow(2).getCell(3).value = 'Soldador';
    ws.getRow(2).getCell(5).value = '1.234,5';

    const { registros, erros } = lerRecursos(await gravarEReabrir(livro));

    expect(erros).toEqual([]);
    expect(registros).toEqual([
      {
        id: null,
        aba: 'RESUMO',
        linha: 2,
        atualizado_em: null,
        dados: { categoria: 'TECNICO', nome: 'Soldador', unidade: null, preco_medio: 1234.5 },
      },
    ]);
  });

  it('valor fora da lista é erro da planilha, com a linha e o que se esperava', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeRecursos, [recurso({})]));
    livro.getWorksheet('RESUMO')!.getRow(2).getCell(2).value = 'Encanador';

    const { registros, erros } = lerRecursos(livro);

    expect(registros).toEqual([]);
    expect(erros).toEqual([
      expect.objectContaining({ aba: 'RESUMO', linha: 2, mensagem: expect.stringContaining('"Encanador" não é um valor aceito') }),
    ]);
  });

  it('planilha de outro cadastro é recusada antes de ir ao servidor', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano({ ...definicaoDeRecursos, cadastro: 'Veículos' }, []));

    const { erros } = lerRecursos(livro);

    expect(erros[0].mensagem).toContain('Esta planilha é de veículos');
  });
});
