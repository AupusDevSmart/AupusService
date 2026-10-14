// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { montarLivroDeFichas } from '@/lib/planilha/fichas';
import { gravarEReabrir } from '@/test-utils/planilha';
import { definicaoDePlanos, lerPlanos } from './planilha';

const plano = {
  id: 'p1                        ',
  categoria_id: 'c1                        ',
  categoria: { id: 'c1', nome: 'Transformador' },
  nome: 'Plano do transformador',
  versao: '1.0',
  descricao: null,
  updated_at: '2026-08-12T18:52:28.000Z',
  total_equipamentos_vinculados: 2,
  tarefasDoPlano: [
    {
      id: 't1',
      tag: 'TRF-001',
      nome: 'Coleta de óleo',
      instrucao_id: 'i1',
      nomeDaInstrucao: 'Coleta de óleo isolante',
      frequencia: 'PERSONALIZADA',
      frequencia_personalizada: 45,
      criticidade: 4,
      ordem: 1,
    },
    {
      id: 't2',
      tag: 'TRF-002',
      nome: 'Tarefa antiga',
      instrucao_id: null,
      nomeDaInstrucao: null,
      frequencia: 'MENSAL',
      frequencia_personalizada: null,
      criticidade: 3,
      ordem: 2,
    },
  ],
} as never;

// 120 s: o primeiro teste carrega o exceljs; sozinho leva ~3 s, mas na suíte inteira
// (12 workers carregando ao mesmo tempo) passava dos 30 s e falhava sem defeito nenhum.
describe('planilha de planos de manutenção', { timeout: 120_000 }, () => {
  it('ida e volta: versão continua texto, criticidade e periodicidade voltam como código', async () => {
    const livro = await gravarEReabrir(await montarLivroDeFichas(definicaoDePlanos, [plano]));
    const { registros, erros } = lerPlanos(livro);

    expect(erros).toEqual([]);
    const { tarefas, ...cabecalho } = registros[0].dados as { tarefas: Array<Record<string, unknown>> };
    expect(cabecalho).toEqual({
      categoria: 'Transformador',
      categoria_ref: 'c1',
      nome: 'Plano do transformador',
      versao: '1.0',
      descricao: null,
    });
    expect(tarefas.map(({ _linha, ...t }) => t)).toEqual([
      {
        instrucao: 'Coleta de óleo isolante',
        nome: 'Coleta de óleo',
        frequencia: 'PERSONALIZADA',
        frequencia_personalizada: 45,
        criticidade: '4',
        id: 't1',
        instrucao_ref: 'i1',
      },
      {
        instrucao: null,
        nome: 'Tarefa antiga',
        frequencia: 'MENSAL',
        frequencia_personalizada: null,
        criticidade: '3',
        id: 't2',
        instrucao_ref: null,
      },
    ]);
  });
});
