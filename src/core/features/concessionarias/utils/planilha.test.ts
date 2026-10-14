// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroPlano } from '@/lib/planilha/plana';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDeConcessionarias, lerConcessionarias } from './planilha';

const equatorial = {
  id: 'c1',
  nome: 'Equatorial Goiás',
  estado: 'GO',
  numero_reh: 'REH 3.000/2026',
  data_inicio: '2026-10-22T00:00:00.000Z',
  data_validade: '2027-10-21T00:00:00.000Z',
  a4_verde: { tusd_d: '12.5', tusd_p: '1.234567', tusd_fp: '0.123456', te_d: null, te_p: '0.5', te_fp: '0.3' },
  a3a_verde: { tusd_d: null, tusd_p: null, tusd_fp: null, te_d: null, te_p: null, te_fp: null },
  b: { tusd_valor: '0.45', te_valor: '0.31' },
  hora_inicio_ponta: '18',
  hora_fim_ponta: '21',
  hora_inicio_reservado: '21.5',
  hora_fim_reservado: '6',
  anexos: [],
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-02T00:00:00.000Z',
} as never;

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de concessionárias', { timeout: 120_000 }, () => {
  it('ida e volta: tarifas voltam aninhadas por subgrupo; horários ficam de fora', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeConcessionarias, [equatorial]));
    const { registros, erros } = lerConcessionarias(livro);

    expect(erros).toEqual([]);
    expect(registros[0].dados).toEqual({
      nome: 'Equatorial Goiás',
      estado: 'GO',
      numero_reh: 'REH 3.000/2026',
      data_inicio: '2026-10-22',
      data_validade: '2027-10-21',
      a4_verde: { tusd_d: 12.5, tusd_p: 1.234567, tusd_fp: 0.123456, te_d: null, te_p: 0.5, te_fp: 0.3 },
      a3a_verde: { tusd_d: null, tusd_p: null, tusd_fp: null, te_d: null, te_p: null, te_fp: null },
      b: { tusd_valor: 0.45, te_valor: 0.31 },
    });
  });

  it('o horário aparece como na tela, e a UF vai em maiúsculas', async () => {
    const livro = await gravarEReabrir(await montarLivroPlano(definicaoDeConcessionarias, [equatorial]));
    const ws = livro.getWorksheet('RESUMO')!;
    const titulos = ws.getRow(1).values as unknown[];
    expect(ws.getRow(2).getCell(titulos.indexOf('RESERVADO (INÍCIO–FIM)')).value).toBe('21:30–06:00');

    ws.getRow(2).getCell(titulos.indexOf('UF')).value = 'go';
    expect(lerConcessionarias(livro).registros[0].dados.estado).toBe('GO');
  });
});
