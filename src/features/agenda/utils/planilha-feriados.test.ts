// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import type { FeriadoResponse } from '@/services/agenda.services';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeFeriados, lerFeriados } from './planilha-feriados';

const feriado = (extra: Partial<FeriadoResponse>): FeriadoResponse => ({
  id: 'f1',
  nome: 'Natal',
  data: '2026-12-25T00:00:00.000Z',
  tipo: 'NACIONAL',
  geral: true,
  recorrente: true,
  descricao: undefined,
  ativo: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  plantas: [],
  ...extra,
});

describe('planilha de feriados', { timeout: 30_000 }, () => {
  it('ida e volta: a data volta no mesmo dia; plantas e IDs na mesma ordem', async () => {
    const registros = [
      feriado({}),
      feriado({
        id: 'f2',
        nome: 'Aniversário',
        data: '2026-10-24T00:00:00.000Z',
        tipo: 'MUNICIPAL',
        geral: false,
        recorrente: false,
        plantas: [
          { id: 'p1  ', nome: 'Planta A', cnpj: '', cidade: '' },
          { id: 'p2', nome: 'Planta B', cnpj: '', cidade: '' },
        ],
      }),
    ];

    const { registros: lidos, erros } = lerFeriados(
      await gravarEReabrir(await montarLivroPlano(definicaoDeFeriados, registros)),
    );

    expect(erros).toEqual([]);
    expect(lidos.map((r) => r.dados)).toEqual([
      {
        nome: 'Natal',
        data: '2026-12-25',
        tipo: 'NACIONAL',
        geral: true,
        plantas: null,
        recorrente: true,
        descricao: null,
        plantas_ids: null,
      },
      {
        nome: 'Aniversário',
        data: '2026-10-24',
        tipo: 'MUNICIPAL',
        geral: false,
        plantas: 'Planta A; Planta B',
        recorrente: false,
        descricao: null,
        plantas_ids: 'p1; p2',
      },
    ]);
  });

  it('data que não existe é erro da planilha', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeFeriados, [feriado({})]));
    livro.getWorksheet('RESUMO')!.getRow(2).getCell(3).value = '31/02/2026';

    const { erros } = lerFeriados(livro);

    expect(erros).toEqual([expect.objectContaining({ mensagem: 'DATA: esperava uma data como 25/12/2026.' })]);
  });
});
