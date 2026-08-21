// src/services/proposta.instrucoes.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarDeInstrucoes, type ItemProposta } from './proposta.services';

/**
 * A montagem da lista de instruções.
 *
 * O que está preso aqui é o comportamento diante de dado que já existe: uma
 * proposta salva no formato antigo trazia uma linha por RECURSO, e a tela nova
 * mostra uma linha por INSTRUÇÃO. Confundir as duas colocaria o preço de um
 * parafuso no lugar do valor da instrução inteira — e o erro seria silencioso,
 * porque a linha existe e tem um número plausível.
 */

const instrucoes: Record<string, any> = {
  A: {
    id: 'A',
    tag: 'INST-001',
    nome: 'Troca de rolamento',
    recursos: [
      { descricao: 'Rolamento', quantidade: 2, recurso: { preco_medio: 150 } },
      { descricao: 'Graxa', quantidade: 1, recurso: { preco_medio: 40 } },
    ],
  },
  B: {
    id: 'B',
    tag: null,
    nome: 'Inspeção visual',
    recursos: [{ descricao: 'Técnico', quantidade: 1, recurso: { preco_medio: 200 } }],
  },
  SEM: { id: 'SEM', tag: 'INST-009', nome: 'Sem recursos', recursos: [] },
};

vi.mock('@/services/instrucoes.services', () => ({
  instrucoesApi: {
    findOne: vi.fn(async (id: string) => {
      const achada = instrucoes[id];
      if (!achada) throw new Error('não encontrada');
      return achada;
    }),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('montarDeInstrucoes', () => {
  it('dá uma linha por instrução, valendo a soma do catálogo', async () => {
    const itens = await montarDeInstrucoes(['A', 'B']);

    expect(itens).toHaveLength(2);
    expect(itens[0]).toMatchObject({
      instrucao_id: 'A',
      descricao: 'INST-001 - Troca de rolamento',
      quantidade: 1,
      preco_unitario: 340, // 2 x 150 + 1 x 40
      preco_unitario_original: 340,
    });
    // Sem tag, o rótulo é só o nome.
    expect(itens[1].descricao).toBe('Inspeção visual');
    expect(itens[1].preco_unitario).toBe(200);
  });

  it('preserva o valor já ajustado ao vincular outra instrução', async () => {
    const jaAjustada: ItemProposta[] = [
      {
        id: 'linha-1',
        instrucao_id: 'A',
        descricao: 'INST-001 - Troca de rolamento',
        quantidade: 1,
        preco_unitario: 999, // a pessoa mexeu
        preco_unitario_original: 340,
      },
    ];

    const itens = await montarDeInstrucoes(['A', 'B'], jaAjustada);

    expect(itens[0].preco_unitario).toBe(999);
    expect(itens[1].preco_unitario).toBe(200);
  });

  it('descarta as linhas por recurso do formato antigo', async () => {
    // Duas linhas para a MESMA instrução: é o formato antigo, uma por recurso.
    const legado: ItemProposta[] = [
      { instrucao_id: 'A', recurso_id: 'r1', descricao: 'Rolamento', quantidade: 2, preco_unitario: 150 },
      { instrucao_id: 'A', recurso_id: 'r2', descricao: 'Graxa', quantidade: 1, preco_unitario: 40 },
    ];

    const itens = await montarDeInstrucoes(['A'], legado);

    expect(itens).toHaveLength(1);
    expect(itens[0].descricao).toBe('INST-001 - Troca de rolamento');
    expect(itens[0].preco_unitario).toBe(340);
  });

  it('descarta a linha por recurso mesmo quando a instrução tinha um só', async () => {
    // O caso estreito: uma linha, contagem 1, conjuntos casariam. É o
    // `recurso_id` que denuncia — sem ele, a proposta mostraria "Técnico".
    const legado: ItemProposta[] = [
      { instrucao_id: 'B', recurso_id: 'r3', descricao: 'Técnico', quantidade: 1, preco_unitario: 200 },
    ];

    const itens = await montarDeInstrucoes(['B'], legado);

    expect(itens[0].descricao).toBe('Inspeção visual');
    expect(itens[0].recurso_id).toBeUndefined();
  });

  it('instrução sem recursos entra valendo zero, e não some', async () => {
    const itens = await montarDeInstrucoes(['SEM']);

    expect(itens).toHaveLength(1);
    expect(itens[0].preco_unitario).toBe(0);
  });

  it('omite a instrução que não carrega, sem derrubar as outras', async () => {
    const itens = await montarDeInstrucoes(['A', 'FANTASMA']);

    expect(itens).toHaveLength(1);
    expect(itens[0].instrucao_id).toBe('A');
  });

  it('não chama a API quando não há instrução vinculada', async () => {
    const { instrucoesApi } = await import('@/services/instrucoes.services');

    expect(await montarDeInstrucoes([])).toEqual([]);
    expect(instrucoesApi.findOne).not.toHaveBeenCalled();
  });
});
