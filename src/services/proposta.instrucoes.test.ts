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

/** A instrução como o findOne devolve, só no que a montagem lê. */
interface InstrucaoDoTeste {
  id: string;
  codigo: string | null;
  nome: string;
  // O custo de cada linha vem pronto do servidor (subtotal, a conta do AupusProject, SN-85)
  recursos: { quantidade: number; recurso: { nome: string; preco_base: number }; subtotal: number | null }[];
  maquinarios?: { quantidade: number; maquinario: { nome: string }; subtotal: number | null }[];
}

const instrucoes: Record<string, InstrucaoDoTeste> = {
  A: {
    id: 'A',
    codigo: 'INST-001',
    nome: 'Troca de rolamento',
    recursos: [
      { quantidade: 2, recurso: { nome: 'Rolamento', preco_base: 150 }, subtotal: 300 },
      { quantidade: 1, recurso: { nome: 'Graxa', preco_base: 40 }, subtotal: 40 },
    ],
    // O maquinário entra na soma (SN-85)
    maquinarios: [{ quantidade: 1, maquinario: { nome: 'Munck' }, subtotal: 60 }],
  },
  B: {
    id: 'B',
    codigo: null,
    nome: 'Inspeção visual',
    recursos: [{ quantidade: 1, recurso: { nome: 'Técnico', preco_base: 200 }, subtotal: 200 }],
  },
  SEM: { id: 'SEM', codigo: 'INST-009', nome: 'Sem recursos', recursos: [] },
  FURO: {
    id: 'FURO',
    codigo: 'INST-010',
    nome: 'Com linha sem preço',
    recursos: [
      { quantidade: 10, recurso: { nome: 'Cabo', preco_base: 5 }, subtotal: 50 },
      { quantidade: 4, recurso: { nome: 'Conector', preco_base: 0 }, subtotal: null },
    ],
  },
};

vi.mock('@/services/instrucoes.services', () => ({
  instrucoesApi: {
    findOne: vi.fn(async (id: string) => {
      const achada = instrucoes[id];
      // FANTASMA: a que não existe mais (404); qualquer outra ausente: falha de rede
      if (id === 'FANTASMA') throw Object.assign(new Error('não encontrada'), { isAxiosError: true, response: { status: 404 } });
      if (!achada) throw new Error('rede');
      return achada;
    }),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('montarDeInstrucoes', () => {
  it('dá uma linha por instrução, valendo a soma do catálogo (recursos e maquinário)', async () => {
    const itens = await montarDeInstrucoes(['A', 'B']);

    expect(itens).toHaveLength(2);
    expect(itens[0]).toMatchObject({
      instrucao_id: 'A',
      descricao: 'INST-001 - Troca de rolamento',
      quantidade: 1,
      preco_unitario: 400, // 2 x 150 + 1 x 40 + o munck (60)
      preco_unitario_original: 400,
    });
    // Sem código, o rótulo é só o nome.
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
    expect(itens[0].preco_unitario).toBe(400);
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

  it('a linha sem preço entra como zero, e o item leva a marca para a tela avisar (SN-86)', async () => {
    const [furo, completa] = await montarDeInstrucoes(['FURO', 'B']);

    expect(furo).toMatchObject({ preco_unitario: 50, sem_preco_no_cadastro: true });
    expect(completa.sem_preco_no_cadastro).toBeUndefined();
  });

  it('instrução sem recursos entra valendo zero, e não some', async () => {
    const itens = await montarDeInstrucoes(['SEM']);

    expect(itens).toHaveLength(1);
    expect(itens[0].preco_unitario).toBe(0);
  });

  it('omite a instrução que não existe mais (404), sem derrubar as outras', async () => {
    const itens = await montarDeInstrucoes(['A', 'FANTASMA']);

    expect(itens).toHaveLength(1);
    expect(itens[0].instrucao_id).toBe('A');
  });

  // Antes o catch virava "sem linha": a falha de rede tirava da proposta gravada a linha negociada
  it('a falha de leitura de uma nova é erro; a já conhecida nem é lida', async () => {
    const { instrucoesApi } = await import('@/services/instrucoes.services');
    const ajustada: ItemProposta = { instrucao_id: 'A', descricao: 'A', quantidade: 1, preco_unitario: 5000, preco_unitario_original: 3200 };

    await expect(montarDeInstrucoes(['A', 'SEM-REDE'], [ajustada])).rejects.toThrow('rede');
    vi.mocked(instrucoesApi.findOne).mockClear();
    expect(await montarDeInstrucoes(['A'], [ajustada])).toEqual([ajustada]);
    expect(instrucoesApi.findOne).not.toHaveBeenCalled();
  });

  it('não chama a API quando não há instrução vinculada', async () => {
    const { instrucoesApi } = await import('@/services/instrucoes.services');

    expect(await montarDeInstrucoes([])).toEqual([]);
    expect(instrucoesApi.findOne).not.toHaveBeenCalled();
  });
});
